/**
 * SERVICIO SUPABASE - PACIENTES
 * 
 * Reemplaza completamente SQL Server para gestión de pacientes
 * 
 * FUNCIONALIDADES:
 * - CRUD completo de pacientes
 * - Búsqueda avanzada con filtros
 * - Paginación optimizada
 * - Validaciones de datos
 * - Sincronización en tiempo real
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface Paciente {
  id?: string
  numero_paciente: string
  nombre: string
  apellido: string
  dni: string
  fecha_nacimiento: string
  telefono_fijo?: string | null
  telefono_movil: string
  email: string
  direccion: string
  alergias?: string | null
  enfermedades?: string | null
  medicamentos?: string | null
  preferencias_comunicacion?: string
  consentimiento_lopd: 'firmado' | 'sin_firmar'
  estado: 'activo' | 'inactivo'
  fecha_registro: string
  created_at?: string
  updated_at?: string
}

export interface FiltrosPacientes {
  busqueda?: string
  estado?: 'activo' | 'inactivo' | null
  fecha_desde?: string
  fecha_hasta?: string
  offset?: number
  limite?: number
}

export interface ResultadoBusquedaPacientes {
  pacientes: Paciente[]
  total: number
  tiene_mas: boolean
}

class SupabasePacientesService {
  private supabase: SupabaseClient

  constructor() {
    // Cliente con Service Role para operaciones administrativas
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6dGlhdmNmZnV3ZGhraGh4eXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgzODA2NCwiZXhwIjoyMDc5NDE0MDY0fQ.zpnJxrWcPNJZjjRsgyQ_8lzVxBe-aGmhVQGMCKUC_bw'
    
    this.supabase = createClient(
      'https://yztiavcffuwdhkhhxypb.supabase.co',
      serviceRoleKey
    )
  }

  /**
   * Crear nuevo paciente
   */
  async crearPaciente(pacienteData: Omit<Paciente, 'id' | 'created_at' | 'updated_at'>): Promise<Paciente> {
    try {
      console.log('👥 Creando nuevo paciente...')
      
      // Generar número de paciente único
      const numeroPaciente = await this.generarNumeroPaciente()
      
      const paciente: Paciente = {
        ...pacienteData,
        numero_paciente: numeroPaciente,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('pacientes')
        .insert([paciente])
        .select()
        .single()

      if (error) {
        console.error('❌ Error creando paciente:', error)
        throw error
      }

      console.log(`✅ Paciente creado: ${data.nombre} ${data.apellido} (${data.numero_paciente})`)
      return data

    } catch (error) {
      console.error('❌ Error en crearPaciente:', error)
      throw error
    }
  }

  /**
   * Obtener paciente por ID
   */
  async obtenerPaciente(id: string): Promise<Paciente | null> {
    try {
      const { data, error } = await this.supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`ℹ️ Paciente no encontrado: ${id}`)
          return null
        }
        throw error
      }

      return data

    } catch (error) {
      console.error('❌ Error obteniendo paciente:', error)
      throw error
    }
  }

  /**
   * Obtener paciente por DNI
   */
  async obtenerPacientePorDNI(dni: string): Promise<Paciente | null> {
    try {
      const { data, error } = await this.supabase
        .from('pacientes')
        .select('*')
        .eq('dni', dni)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`ℹ️ Paciente no encontrado por DNI: ${dni}`)
          return null
        }
        throw error
      }

      return data

    } catch (error) {
      console.error('❌ Error obteniendo paciente por DNI:', error)
      throw error
    }
  }

  /**
   * Búsqueda avanzada de pacientes
   */
  async buscarPacientes(filtros: FiltrosPacientes = {}): Promise<ResultadoBusquedaPacientes> {
    try {
      console.log('🔍 Buscando pacientes...', filtros)
      
      const {
        busqueda,
        estado = null,
        fecha_desde = null,
        fecha_hasta = null,
        offset = 0,
        limite = 20
      } = filtros

      let query = this.supabase
        .from('pacientes')
        .select('*', { count: 'exact' })

      // Aplicar filtros de búsqueda
      if (busqueda) {
        query = query.or(
          `nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,dni.ilike.%${busqueda}%,telefono_movil.ilike.%${busqueda}%,email.ilike.%${busqueda}%,numero_paciente.ilike.%${busqueda}%`
        )
      }

      if (estado) {
        query = query.eq('estado', estado)
      }

      if (fecha_desde) {
        query = query.gte('fecha_registro', fecha_desde)
      }

      if (fecha_hasta) {
        query = query.lte('fecha_registro', fecha_hasta)
      }

      // Ordenar y paginar
      query = query
        .order('fecha_registro', { ascending: false })
        .range(offset, offset + limite - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('❌ Error en búsqueda:', error)
        throw error
      }

      const total = count || 0
      const tiene_mas = offset + limite < total

      console.log(`📊 Encontrados ${data.length} pacientes de ${total} totales`)

      return {
        pacientes: data || [],
        total,
        tiene_mas
      }

    } catch (error) {
      console.error('❌ Error en buscarPacientes:', error)
      throw error
    }
  }

  /**
   * Actualizar paciente
   */
  async actualizarPaciente(id: string, updates: Partial<Paciente>): Promise<Paciente> {
    try {
      console.log(`👥 Actualizando paciente: ${id}`)
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('pacientes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('❌ Error actualizando paciente:', error)
        throw error
      }

      console.log(`✅ Paciente actualizado: ${data.nombre} ${data.apellido}`)
      return data

    } catch (error) {
      console.error('❌ Error en actualizarPaciente:', error)
      throw error
    }
  }

  /**
   * Eliminar paciente (soft delete)
   */
  async eliminarPaciente(id: string): Promise<boolean> {
    try {
      console.log(`👥 Eliminando paciente (soft): ${id}`)
      
      const { error } = await this.supabase
        .from('pacientes')
        .update({ 
          estado: 'inactivo',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('❌ Error eliminando paciente:', error)
        throw error
      }

      console.log(`✅ Paciente eliminado: ${id}`)
      return true

    } catch (error) {
      console.error('❌ Error en eliminarPaciente:', error)
      throw error
    }
  }

  /**
   * Obtener todos los pacientes (para reportes)
   */
  async obtenerTodosPacientes(estado?: 'activo' | 'inactivo'): Promise<Paciente[]> {
    try {
      let query = this.supabase
        .from('pacientes')
        .select('*')

      if (estado) {
        query = query.eq('estado', estado)
      }

      query = query.order('apellido', { ascending: true })

      const { data, error } = await query

      if (error) {
        console.error('❌ Error obteniendo todos los pacientes:', error)
        throw error
      }

      return data || []

    } catch (error) {
      console.error('❌ Error en obtenerTodosPacientes:', error)
      throw error
    }
  }

  /**
   * Estadísticas de pacientes
   */
  async obtenerEstadisticasPacientes(): Promise<any> {
    try {
      console.log('📊 Obteniendo estadísticas de pacientes...')

      const { data: total, error: errorTotal } = await this.supabase
        .from('pacientes')
        .select('id', { count: 'exact' })

      const { data: activos, error: errorActivos } = await this.supabase
        .from('pacientes')
        .select('id', { count: 'exact' })
        .eq('estado', 'activo')

      const { data: nuevos_este_mes, error: errorNuevos } = await this.supabase
        .from('pacientes')
        .select('id', { count: 'exact' })
        .gte('fecha_registro', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])

      if (errorTotal || errorActivos || errorNuevos) {
        throw new Error('Error obteniendo estadísticas')
      }

      return {
        total_pacientes: total?.length || 0,
        pacientes_activos: activos?.length || 0,
        pacientes_nuevos_mes: nuevos_este_mes?.length || 0,
        porcentaje_activos: total?.length > 0 ? ((activos?.length || 0) / (total?.length || 1)) * 100 : 0
      }

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error)
      throw error
    }
  }

  /**
   * Validar datos de paciente
   */
  validarDatosPaciente(paciente: Partial<Paciente>): { valido: boolean; errores: string[] } {
    const errores: string[] = []

    // Validaciones obligatorias
    if (!paciente.nombre?.trim()) errores.push('Nombre es obligatorio')
    if (!paciente.apellido?.trim()) errores.push('Apellido es obligatorio')
    if (!paciente.dni?.trim()) errores.push('DNI es obligatorio')
    if (!paciente.fecha_nacimiento) errores.push('Fecha de nacimiento es obligatoria')
    if (!paciente.telefono_movil?.trim()) errores.push('Teléfono móvil es obligatorio')
    if (!paciente.email?.trim()) errores.push('Email es obligatorio')
    if (!paciente.direccion?.trim()) errores.push('Dirección es obligatoria')

    // Validaciones de formato
    if (paciente.email && !this.esEmailValido(paciente.email)) {
      errores.push('Email no tiene formato válido')
    }

    if (paciente.dni && !this.esDNIValido(paciente.dni)) {
      errores.push('DNI no tiene formato válido')
    }

    // Validaciones de edad
    if (paciente.fecha_nacimiento) {
      const fecha = new Date(paciente.fecha_nacimiento)
      const hoy = new Date()
      const edad = hoy.getFullYear() - fecha.getFullYear()
      
      if (edad < 0 || edad > 120) {
        errores.push('Fecha de nacimiento no es válida')
      }
    }

    return {
      valido: errores.length === 0,
      errores
    }
  }

  /**
   * Reactivar paciente (cambiar de inactivo a activo)
   */
  async reactivarPaciente(id: string): Promise<Paciente> {
    try {
      console.log(`👥 Reactivando paciente: ${id}`)
      
      const { data, error } = await this.supabase
        .from('pacientes')
        .update({ 
          estado: 'activo',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('❌ Error reactivando paciente:', error)
        throw error
      }

      console.log(`✅ Paciente reactivado: ${data.nombre} ${data.apellido}`)
      return data

    } catch (error) {
      console.error('❌ Error en reactivarPaciente:', error)
      throw error
    }
  }

  /**
   * Verificar si existe paciente con mismo DNI
   */
  async existePacienteConDNI(dni: string, excludeId?: string): Promise<boolean> {
    try {
      let query = this.supabase
        .from('pacientes')
        .select('id')
        .eq('dni', dni)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Error verificando DNI:', error)
        throw error
      }

      return (data?.length || 0) > 0

    } catch (error) {
      console.error('❌ Error en existePacienteConDNI:', error)
      throw error
    }
  }

  /**
   * Generar número de paciente único
   */
  private async generarNumeroPaciente(): Promise<string> {
    try {
      // Usar la función PostgreSQL del esquema
      const { data, error } = await this.supabase
        .rpc('generar_numero_paciente')

      if (error) {
        // Fallback: generar número manual
        const timestamp = Date.now().toString().slice(-6)
        return `PAC${timestamp.padStart(6, '0')}`
      }

      return data || `PAC${Date.now().toString().slice(-6)}`

    } catch (error) {
      console.error('❌ Error generando número de paciente:', error)
      // Fallback
      const timestamp = Date.now().toString().slice(-6)
      return `PAC${timestamp.padStart(6, '0')}`
    }
  }

  /**
   * Métodos auxiliares de validación
   */
  private esEmailValido(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  private esDNIValido(dni: string): boolean {
    const regex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i
    return regex.test(dni)
  }

  /**
   * Obtener suscripciones en tiempo real
   */
  obtenerSuscripcionPacientes(callback: (payload: any) => void) {
    return this.supabase
      .channel('pacientes_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pacientes' }, 
        callback
      )
      .subscribe()
  }

  /**
   * Cerrar suscripciones
   */
  cerrarSuscripciones() {
    return this.supabase.removeAllChannels()
  }
}

// Instancia singleton
export const pacientesService = new SupabasePacientesService()
export default SupabasePacientesService