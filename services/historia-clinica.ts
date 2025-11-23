import { createClient } from '@supabase/supabase-js'
import type { 
  HistoriaClinica, 
  PlanTratamiento, 
  Odontograma, 
  Diente, 
  FotoTratamiento, 
  AlertaMedica, 
  DocumentoFirmado,
  Paciente
} from '../types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ==================== GESTIÓN DE PLANES DE TRATAMIENTO ====================

export class HistoriaClinicaService {
  
  /**
   * Obtiene la historia clínica completa de un paciente
   */
  static async getHistoriaClinica(pacienteId: string): Promise<HistoriaClinica | null> {
    try {
      const { data, error } = await supabase
        .from('historia_clinica')
        .select(`
          *,
          planes_tratamiento(*),
          odontograma:dientes_odontograma(*),
          fotos_tratamiento(*),
          alertas_medicas(*),
          documentos_firmados(*)
        `)
        .eq('paciente_id', pacienteId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error obteniendo historia clínica:', error)
      return null
    }
  }

  /**
   * Obtiene todos los planes de tratamiento de un paciente
   */
  static async getPlanesTratamiento(pacienteId: string): Promise<PlanTratamiento[]> {
    try {
      const { data, error } = await supabase
        .from('planes_tratamiento')
        .select(`
          *,
          doctor:doctores(*),
          tratamiento_detalle:tratamientos(*)
        `)
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error obteniendo planes de tratamiento:', error)
      return []
    }
  }

  /**
   * Crea un nuevo plan de tratamiento
   */
  static async crearPlanTratamiento(planData: Omit<PlanTratamiento, 'id' | 'created_at'>): Promise<PlanTratamiento | null> {
    try {
      const { data, error } = await supabase
        .from('planes_tratamiento')
        .insert({
          ...planData,
          estado: 'planificacion'
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creando plan de tratamiento:', error)
      return null
    }
  }

  /**
   * Actualiza un plan de tratamiento
   */
  static async actualizarPlanTratamiento(
    planId: string, 
    updates: Partial<PlanTratamiento>
  ): Promise<PlanTratamiento | null> {
    try {
      const { data, error } = await supabase
        .from('planes_tratamiento')
        .update(updates)
        .eq('id', planId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error actualizando plan de tratamiento:', error)
      return null
    }
  }

  /**
   * Elimina un plan de tratamiento
   */
  static async eliminarPlanTratamiento(planId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('planes_tratamiento')
        .delete()
        .eq('id', planId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error eliminando plan de tratamiento:', error)
      return false
    }
  }

  /**
   * Cambia el estado de un plan de tratamiento
   */
  static async cambiarEstadoPlan(
    planId: string, 
    nuevoEstado: PlanTratamiento['estado']
  ): Promise<boolean> {
    try {
      const updates: Partial<PlanTratamiento> = { estado: nuevoEstado }
      
      // Si se marca como completado, establecer fecha real de fin
      if (nuevoEstado === 'completado') {
        updates.fecha_real_fin = new Date().toISOString().split('T')[0]
      }

      const { error } = await supabase
        .from('planes_tratamiento')
        .update(updates)
        .eq('id', planId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error cambiando estado del plan:', error)
      return false
    }
  }

  // ==================== ODONTOGRAMA INTERACTIVO ====================

  /**
   * Obtiene el odontograma de un paciente
   */
  static async getOdontograma(pacienteId: string): Promise<Odontograma | null> {
    try {
      const { data, error } = await supabase
        .from('odontograma')
        .select('*, dientes:dientes_odontograma(*)')
        .eq('paciente_id', pacienteId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (!data) {
        // Crear odontograma inicial si no existe
        return await this.crearOdontogramaInicial(pacienteId)
      }

      return data
    } catch (error) {
      console.error('Error obteniendo odontograma:', error)
      return null
    }
  }

  /**
   * Crea un odontograma inicial con todos los dientes en estado sano
   */
  private static async crearOdontogramaInicial(pacienteId: string): Promise<Odontograma | null> {
    try {
      // Crear odontograma principal
      const { data: odontograma, error: odontogramaError } = await supabase
        .from('odontograma')
        .insert({ paciente_id: pacienteId })
        .select()
        .single()

      if (odontogramaError) throw odontogramaError

      // Crear dientes iniciales
      const dientes: Omit<Diente, 'id'>[] = []
      for (let i = 1; i <= 32; i++) {
        dientes.push({
          numero: i,
          estado: 'sano',
          tratamientos: []
        })
      }

      const { error: dientesError } = await supabase
        .from('dientes_odontograma')
        .insert(
          dientes.map(diente => ({
            ...diente,
            odontograma_id: odontograma.id
          }))
        )

      if (dientesError) throw dientesError

      return {
        paciente_id: pacienteId,
        dientes,
        ultima_actualizacion: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error creando odontograma inicial:', error)
      return null
    }
  }

  /**
   * Actualiza el estado de un diente específico
   */
  static async actualizarDiente(
    pacienteId: string, 
    numeroDiente: number, 
    nuevosDatos: Partial<Diente>
  ): Promise<boolean> {
    try {
      // Primero obtener el odontograma
      const odontograma = await this.getOdontograma(pacienteId)
      if (!odontograma) return false

      const { error } = await supabase
        .from('dientes_odontograma')
        .update({
          ...nuevosDatos,
          fecha_ultimo_tratamiento: nuevosDatos.tratamientos?.length 
            ? new Date().toISOString().split('T')[0]
            : null
        })
        .eq('odontograma_id', odontograma.id)
        .eq('numero', numeroDiente)

      if (error) throw error
      
      // Actualizar fecha de última modificación del odontograma
      await supabase
        .from('odontograma')
        .update({ ultima_actualizacion: new Date().toISOString() })
        .eq('id', odontograma.id)

      return true
    } catch (error) {
      console.error('Error actualizando diente:', error)
      return false
    }
  }

  /**
   * Obtiene el estado de un diente específico
   */
  static async getDiente(pacienteId: string, numeroDiente: number): Promise<Diente | null> {
    try {
      const { data, error } = await supabase
        .from('dientes_odontograma')
        .select('*')
        .eq('numero', numeroDiente)
        .eq('odontograma_id', `(select id from odontograma where paciente_id = '${pacienteId}')`)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error obteniendo diente:', error)
      return null
    }
  }

  // ==================== HISTORIAL FOTOGRÁFICO ====================

  /**
   * Obtiene todas las fotos de tratamientos de un paciente
   */
  static async getFotosTratamiento(pacienteId: string): Promise<FotoTratamiento[]> {
    try {
      const { data, error } = await supabase
        .from('fotos_tratamiento')
        .select(`
          *,
          cita:citas(*),
          tratamiento:tratamientos(*)
        `)
        .eq('paciente_id', pacienteId)
        .order('fecha_toma', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error obteniendo fotos de tratamiento:', error)
      return []
    }
  }

  /**
   * Sube una nueva foto de tratamiento
   */
  static async subirFotoTratamiento(
    fotoData: Omit<FotoTratamiento, 'id'>
  ): Promise<FotoTratamiento | null> {
    try {
      const { data, error } = await supabase
        .from('fotos_tratamiento')
        .insert(fotoData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error subiendo foto de tratamiento:', error)
      return null
    }
  }

  /**
   * Elimina una foto de tratamiento
   */
  static async eliminarFotoTratamiento(fotoId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fotos_tratamiento')
        .delete()
        .eq('id', fotoId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error eliminando foto de tratamiento:', error)
      return false
    }
  }

  /**
   * Obtiene fotos por categoría/etiqueta
   */
  static async getFotosPorEtiqueta(
    pacienteId: string, 
    etiqueta: string
  ): Promise<FotoTratamiento[]> {
    try {
      const { data, error } = await supabase
        .from('fotos_tratamiento')
        .select('*')
        .eq('paciente_id', pacienteId)
        .contains('etiquetas', [etiqueta])
        .order('fecha_toma', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error obteniendo fotos por etiqueta:', error)
      return []
    }
  }

  // ==================== SISTEMA DE ALERTAS ====================

  /**
   * Obtiene todas las alertas de un paciente
   */
  static async getAlertas(pacienteId: string): Promise<AlertaMedica[]> {
    try {
      const { data, error } = await supabase
        .from('alertas_medicas')
        .select('*')
        .eq('paciente_id', pacienteId)
        .eq('activa', true)
        .order('fecha_creacion', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error obteniendo alertas:', error)
      return []
    }
  }

  /**
   * Crea una nueva alerta médica
   */
  static async crearAlerta(alertaData: Omit<AlertaMedica, 'id' | 'fecha_creacion'>): Promise<AlertaMedica | null> {
    try {
      const { data, error } = await supabase
        .from('alertas_medicas')
        .insert({
          ...alertaData,
          fecha_creacion: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creando alerta:', error)
      return null
    }
  }

  /**
   * Desactiva una alerta médica
   */
  static async desactivarAlerta(alertaId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alertas_medicas')
        .update({ activa: false })
        .eq('id', alertaId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error desactivando alerta:', error)
      return false
    }
  }

  /**
   * Obtiene alertas críticas activas
   */
  static async getAlertasCriticas(pacienteId: string): Promise<AlertaMedica[]> {
    try {
      const { data, error } = await supabase
        .from('alertas_medicas')
        .select('*')
        .eq('paciente_id', pacienteId)
        .eq('nivel', 'critico')
        .eq('activa', true)
        .order('fecha_creacion', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error obteniendo alertas críticas:', error)
      return []
    }
  }

  // ==================== DOCUMENTOS FIRMADOS ====================

  /**
   * Obtiene todos los documentos firmados de un paciente
   */
  static async getDocumentosFirmados(pacienteId: string): Promise<DocumentoFirmado[]> {
    try {
      const { data, error } = await supabase
        .from('documentos_firmados')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('fecha_firma', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error obteniendo documentos firmados:', error)
      return []
    }
  }

  /**
   * Registra un nuevo documento firmado
   */
  static async registrarDocumentoFirmado(
    documentoData: Omit<DocumentoFirmado, 'id'>
  ): Promise<DocumentoFirmado | null> {
    try {
      const { data, error } = await supabase
        .from('documentos_firmados')
        .insert(documentoData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error registrando documento firmado:', error)
      return null
    }
  }

  /**
   * Valida la firma de un documento
   */
  static async validarFirmaDocumento(documentoId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('documentos_firmados')
        .update({ 
          firma_validada: true,
          hash_documento: this.generateDocumentHash(documentoId)
        })
        .eq('id', documentoId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error validando firma:', error)
      return false
    }
  }

  /**
   * Obtiene documentos pendientes de firma
   */
  static async getDocumentosPendientesFirma(pacienteId: string): Promise<DocumentoFirmado[]> {
    try {
      const { data, error } = await supabase
        .from('documentos_firmados')
        .select('*')
        .eq('paciente_id', pacienteId)
        .eq('firma_validada', false)
        .order('fecha_firma', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error obteniendo documentos pendientes:', error)
      return []
    }
  }

  /**
   * Genera hash simple para validación de documentos
   */
  private static generateDocumentHash(documentoId: string): string {
    // En un entorno real, aquí se generaría un hash criptográfico real
    return `hash_${documentoId}_${Date.now()}`
  }

  // ==================== UTILIDADES Y BÚSQUEDAS ====================

  /**
   * Busca planes de tratamiento por texto
   */
  static async buscarPlanesTratamiento(
    query: string, 
    pacienteId?: string
  ): Promise<PlanTratamiento[]> {
    try {
      let supabaseQuery = supabase
        .from('planes_tratamiento')
        .select(`
          *,
          doctor:doctores(*),
          paciente:pacientes(*)
        `)
        .or(`titulo.ilike.%${query}%,descripcion.ilike.%${query}%,notas.ilike.%${query}%`)

      if (pacienteId) {
        supabaseQuery = supabaseQuery.eq('paciente_id', pacienteId)
      }

      const { data, error } = await supabaseQuery.order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error buscando planes de tratamiento:', error)
      return []
    }
  }

  /**
   * Obtiene estadísticas de un paciente para el dashboard
   */
  static async getEstadisticasPaciente(pacienteId: string) {
    try {
      const [planes, fotos, alertasCriticas, documentosPendientes] = await Promise.all([
        this.getPlanesTratamiento(pacienteId),
        this.getFotosTratamiento(pacienteId),
        this.getAlertasCriticas(pacienteId),
        this.getDocumentosPendientesFirma(pacienteId)
      ])

      const planesActivos = planes.filter(p => 
        p.estado === 'planificacion' || p.estado === 'en_proceso'
      ).length

      const planesCompletados = planes.filter(p => p.estado === 'completado').length

      return {
        totalPlanes: planes.length,
        planesActivos,
        planesCompletados,
        totalFotos: fotos.length,
        alertasCriticas: alertasCriticas.length,
        documentosPendientes: documentosPendientes.length
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      return null
    }
  }

  /**
   * Busca en todo el historial clínico de un paciente
   */
  static async buscarEnHistoriaClinica(
    pacienteId: string,
    query: string
  ): Promise<{
    planes?: PlanTratamiento[],
    fotos?: FotoTratamiento[],
    alertas?: AlertaMedica[],
    documentos?: DocumentoFirmado[]
  }> {
    try {
      const [planes, fotos, alertas, documentos] = await Promise.all([
        this.buscarPlanesTratamiento(query, pacienteId),
        supabase
          .from('fotos_tratamiento')
          .select('*')
          .eq('paciente_id', pacienteId)
          .or(`descripcion.ilike.%${query}%,etiquetas.cs.{${query}}`)
          .then(({ data }) => data || []),
        supabase
          .from('alertas_medicas')
          .select('*')
          .eq('paciente_id', pacienteId)
          .or(`titulo.ilike.%${query}%,descripcion.ilike.%${query}%`)
          .then(({ data }) => data || []),
        supabase
          .from('documentos_firmados')
          .select('*')
          .eq('paciente_id', pacienteId)
          .or(`titulo.ilike.%${query}%`)
          .then(({ data }) => data || [])
      ])

      return { planes, fotos, alertas, documentos }
    } catch (error) {
      console.error('Error buscando en historia clínica:', error)
      return {}
    }
  }
}