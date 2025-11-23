/**
 * SERVICIO SUPABASE - CITAS
 * 
 * Reemplaza completamente SQL Server para gestión de citas médicas
 * 
 * FUNCIONALIDADES:
 * - CRUD completo de citas
 * - Búsqueda por doctor, paciente, fecha, estado
 * - Calendario integrado
 * - Estados de cita completos
 * - Notificaciones automáticas
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface Cita {
  id?: string
  paciente_id: string
  doctor_id: string
  fecha: string // YYYY-MM-DD
  hora_inicio: string // HH:MM:SS
  hora_fin: string // HH:MM:SS
  tratamiento: string
  estado: 'programada' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'no_asistio' | 'emergencia'
  notas?: string | null
  proxima_cita: boolean
  documentos_firmados: string[]
  created_at?: string
  updated_at?: string
}

export interface FiltrosCitas {
  paciente_id?: string
  doctor_id?: string
  estado?: string
  fecha_desde?: string
  fecha_hasta?: string
  offset?: number
  limite?: number
}

export interface CalendarioCitas {
  fecha: string
  citas: (Cita & { paciente_nombre: string; paciente_apellido: string; doctor_nombre: string; doctor_apellido: string })[]
}

class SupabaseCitasService {
  private supabase: SupabaseClient

  constructor() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6dGlhdmNmZnV3ZGhraGh4eXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgzODA2NCwiZXhwIjoyMDc5NDE0MDY0fQ.zpnJxrWcPNJZjjRsgyQ_8lzVxBe-aGmhVQGMCKUC_bw'
    
    this.supabase = createClient(
      'https://yztiavcffuwdhkhhxypb.supabase.co',
      serviceRoleKey
    )
  }

  /**
   * Crear nueva cita
   */
  async crearCita(citaData: Omit<Cita, 'id' | 'created_at' | 'updated_at'>): Promise<Cita> {
    try {
      console.log('📅 Creando nueva cita...')
      
      // Validar que la cita no se solape con otra del mismo doctor
      await this.validarDisponibilidadDoctor(citaData.doctor_id, citaData.fecha, citaData.hora_inicio, citaData.hora_fin)

      // Validar que el paciente no tenga otra cita a la misma hora
      await this.validarDisponibilidadPaciente(citaData.paciente_id, citaData.fecha, citaData.hora_inicio, citaData.hora_fin)

      const cita: Cita = {
        ...citaData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('citas')
        .insert([cita])
        .select(`
          *,
          paciente:pacientes(nombre, apellido),
          doctor:doctors(nombre, apellido)
        `)
        .single()

      if (error) {
        console.error('❌ Error creando cita:', error)
        throw error
      }

      console.log(`✅ Cita creada: ${data.fecha} ${data.hora_inicio} - Dr. ${data.doctor?.nombre} ${data.doctor?.apellido}`)
      return data

    } catch (error) {
      console.error('❌ Error en crearCita:', error)
      throw error
    }
  }

  /**
   * Obtener cita por ID
   */
  async obtenerCita(id: string): Promise<Cita | null> {
    try {
      const { data, error } = await this.supabase
        .from('citas')
        .select(`
          *,
          paciente:pacientes(nombre, apellido, telefono_movil, email),
          doctor:doctors(nombre, apellido)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`ℹ️ Cita no encontrada: ${id}`)
          return null
        }
        throw error
      }

      return data

    } catch (error) {
      console.error('❌ Error obteniendo cita:', error)
      throw error
    }
  }

  /**
   * Buscar citas con filtros
   */
  async buscarCitas(filtros: FiltrosCitas = {}): Promise<{ citas: (Cita & { paciente_nombre: string; paciente_apellido: string; doctor_nombre: string; doctor_apellido: string })[], total: number }> {
    try {
      console.log('🔍 Buscando citas...', filtros)
      
      const {
        paciente_id,
        doctor_id,
        estado = null,
        fecha_desde = null,
        fecha_hasta = null,
        offset = 0,
        limite = 50
      } = filtros

      let query = this.supabase
        .from('citas')
        .select(`
          *,
          paciente:pacientes(nombre, apellido),
          doctor:doctors(nombre, apellido)
        `, { count: 'exact' })

      // Aplicar filtros
      if (paciente_id) {
        query = query.eq('paciente_id', paciente_id)
      }

      if (doctor_id) {
        query = query.eq('doctor_id', doctor_id)
      }

      if (estado) {
        query = query.eq('estado', estado)
      }

      if (fecha_desde) {
        query = query.gte('fecha', fecha_desde)
      }

      if (fecha_hasta) {
        query = query.lte('fecha', fecha_hasta)
      }

      // Ordenar por fecha y hora
      query = query
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true })
        .range(offset, offset + limite - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('❌ Error en búsqueda de citas:', error)
        throw error
      }

      // Transformar datos para facilitar uso
      const citasTransformadas = (data || []).map(cita => ({
        ...cita,
        paciente_nombre: cita.paciente?.nombre || '',
        paciente_apellido: cita.paciente?.apellido || '',
        doctor_nombre: cita.doctor?.nombre || '',
        doctor_apellido: cita.doctor?.apellido || ''
      }))

      console.log(`📊 Encontradas ${citasTransformadas.length} citas`)

      return {
        citas: citasTransformadas,
        total: count || 0
      }

    } catch (error) {
      console.error('❌ Error en buscarCitas:', error)
      throw error
    }
  }

  /**
   * Obtener calendario de citas para una fecha específica
   */
  async obtenerCalendarioFecha(fecha: string): Promise<CalendarioCitas> {
    try {
      console.log(`📅 Obteniendo calendario para ${fecha}`)
      
      const { data, error } = await this.supabase
        .from('citas')
        .select(`
          *,
          paciente:pacientes(nombre, apellido),
          doctor:doctors(nombre, apellido)
        `)
        .eq('fecha', fecha)
        .order('hora_inicio', { ascending: true })

      if (error) {
        console.error('❌ Error obteniendo calendario:', error)
        throw error
      }

      const citasConNombres = (data || []).map(cita => ({
        ...cita,
        paciente_nombre: cita.paciente?.nombre || '',
        paciente_apellido: cita.paciente?.apellido || '',
        doctor_nombre: cita.doctor?.nombre || '',
        doctor_apellido: cita.doctor?.apellido || ''
      }))

      return {
        fecha,
        citas: citasConNombres
      }

    } catch (error) {
      console.error('❌ Error en obtenerCalendarioFecha:', error)
      throw error
    }
  }

  /**
   * Obtener citas de hoy
   */
  async obtenerCitasHoy(): Promise<{ citas: (Cita & { paciente_nombre: string; paciente_apellido: string; doctor_nombre: string; doctor_apellido: string })[], total: number }> {
    try {
      const hoy = new Date().toISOString().split('T')[0]
      return this.buscarCitas({ fecha_desde: hoy, fecha_hasta: hoy })

    } catch (error) {
      console.error('❌ Error obteniendo citas de hoy:', error)
      throw error
    }
  }

  /**
   * Obtener próximas citas (próximos 7 días)
   */
  async obtenerProximasCitas(): Promise<{ citas: (Cita & { paciente_nombre: string; paciente_apellido: string; doctor_nombre: string; doctor_apellido: string })[], total: number }> {
    try {
      const hoy = new Date()
      const proximaSemana = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const fecha_desde = hoy.toISOString().split('T')[0]
      const fecha_hasta = proximaSemana.toISOString().split('T')[0]

      return this.buscarCitas({
        fecha_desde,
        fecha_hasta,
        estado: 'programada'
      })

    } catch (error) {
      console.error('❌ Error obteniendo próximas citas:', error)
      throw error
    }
  }

  /**
   * Actualizar cita
   */
  async actualizarCita(id: string, updates: Partial<Cita>): Promise<Cita> {
    try {
      console.log(`📅 Actualizando cita: ${id}`)
      
      // Si se actualiza fecha u hora, validar disponibilidad
      if (updates.fecha || updates.hora_inicio || updates.hora_fin || updates.doctor_id) {
        const citaActual = await this.obtenerCita(id)
        if (citaActual) {
          const nuevaFecha = updates.fecha || citaActual.fecha
          const nuevaHoraInicio = updates.hora_inicio || citaActual.hora_inicio
          const nuevaHoraFin = updates.hora_fin || citaActual.hora_fin
          const nuevoDoctor = updates.doctor_id || citaActual.doctor_id
          const nuevoPaciente = updates.paciente_id || citaActual.paciente_id

          await this.validarDisponibilidadDoctor(nuevoDoctor, nuevaFecha, nuevaHoraInicio, nuevaHoraFin, id)
          await this.validarDisponibilidadPaciente(nuevoPaciente, nuevaFecha, nuevaHoraInicio, nuevaHoraFin, id)
        }
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('citas')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          paciente:pacientes(nombre, apellido),
          doctor:doctors(nombre, apellido)
        `)
        .single()

      if (error) {
        console.error('❌ Error actualizando cita:', error)
        throw error
      }

      console.log(`✅ Cita actualizada: ${data.fecha} ${data.hora_inicio}`)
      return data

    } catch (error) {
      console.error('❌ Error en actualizarCita:', error)
      throw error
    }
  }

  /**
   * Cambiar estado de cita
   */
  async cambiarEstadoCita(id: string, nuevoEstado: Cita['estado'], notas?: string): Promise<Cita> {
    try {
      console.log(`📅 Cambiando estado de cita ${id} a ${nuevoEstado}`)
      
      const updateData: Partial<Cita> = {
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      }

      if (notas) {
        updateData.notas = notas
      }

      const { data, error } = await this.supabase
        .from('citas')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          paciente:pacientes(nombre, apellido),
          doctor:doctors(nombre, apellido)
        `)
        .single()

      if (error) {
        console.error('❌ Error cambiando estado de cita:', error)
        throw error
      }

      console.log(`✅ Estado de cita cambiado a: ${nuevoEstado}`)
      return data

    } catch (error) {
      console.error('❌ Error en cambiarEstadoCita:', error)
      throw error
    }
  }

  /**
   * Cancelar cita
   */
  async cancelarCita(id: string, motivo?: string): Promise<Cita> {
    const notas = motivo ? `CANCELADA: ${motivo}` : 'CANCELADA'
    return this.cambiarEstadoCita(id, 'cancelada', notas)
  }

  /**
   * Marcar cita como completada
   */
  async completarCita(id: string, notas?: string): Promise<Cita> {
    const notasCompletas = notas ? `COMPLETADA: ${notas}` : 'COMPLETADA'
    return this.cambiarEstadoCita(id, 'completada', notasCompletas)
  }

  /**
   * Marcar cita como no asistida
   */
  async marcarNoAsistio(id: string): Promise<Cita> {
    return this.cambiarEstadoCita(id, 'no_asistio', 'PACIENTE NO ASISTIÓ')
  }

  /**
   * Eliminar cita
   */
  async eliminarCita(id: string): Promise<boolean> {
    try {
      console.log(`📅 Eliminando cita: ${id}`)
      
      const { error } = await this.supabase
        .from('citas')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ Error eliminando cita:', error)
        throw error
      }

      console.log(`✅ Cita eliminada: ${id}`)
      return true

    } catch (error) {
      console.error('❌ Error en eliminarCita:', error)
      throw error
    }
  }

  /**
   * Obtener disponibilidad de doctor en una fecha
   */
  async obtenerDisponibilidadDoctor(doctor_id: string, fecha: string): Promise<{ hora_inicio: string; hora_fin: string; disponible: boolean }[]> {
    try {
      console.log(`📅 Obteniendo disponibilidad del doctor ${doctor_id} para ${fecha}`)
      
      // Obtener horarios del doctor
      const { data: doctor, error: errorDoctor } = await this.supabase
        .from('doctors')
        .select('horarios')
        .eq('id', doctor_id)
        .single()

      if (errorDoctor || !doctor?.horarios) {
        throw new Error('No se pudieron obtener los horarios del doctor')
      }

      // Obtener citas existentes del doctor en esa fecha
      const { data: citasExistentes, error: errorCitas } = await this.supabase
        .from('citas')
        .select('hora_inicio, hora_fin')
        .eq('doctor_id', doctor_id)
        .eq('fecha', fecha)
        .in('estado', ['programada', 'confirmada', 'en_curso'])

      if (errorCitas) {
        throw errorCitas
      }

      // Procesar disponibilidad por día de la semana
      const fechaObj = new Date(fecha)
      const diaSemana = fechaObj.getDay() // 0 = domingo, 1 = lunes, etc.

      const horariosDelDia = doctor.horarios.filter((horario: any) => horario.dia_semana === diaSemana && horario.activo)
      
      const disponibilidad = horariosDelDia.map((horario: any) => {
        const horaInicio = horario.hora_inicio
        const horaFin = horario.hora_fin
        
        // Verificar si hay conflictos con citas existentes
        const hayConflicto = citasExistentes?.some(cita => 
          (horaInicio < cita.hora_fin && horaFin > cita.hora_inicio)
        ) || false

        return {
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          disponible: !hayConflicto
        }
      })

      console.log(`📊 Disponibilidad encontrada: ${disponibilidad.filter(d => d.disponible).length} slots disponibles`)
      return disponibilidad

    } catch (error) {
      console.error('❌ Error obteniendo disponibilidad:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas de citas
   */
  async obtenerEstadisticasCitas(): Promise<any> {
    try {
      console.log('📊 Obteniendo estadísticas de citas...')

      // Citas de hoy
      const hoy = new Date().toISOString().split('T')[0]
      const { data: citasHoy, error: errorHoy } = await this.supabase
        .from('citas')
        .select('id, estado', { count: 'exact' })
        .eq('fecha', hoy)

      // Citas de la semana
      const inicioSemana = new Date()
      inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay())
      const finSemana = new Date()
      finSemana.setDate(finSemana.getDate() - finSemana.getDay() + 6)

      const { data: citasSemana, error: errorSemana } = await this.supabase
        .from('citas')
        .select('id, estado', { count: 'exact' })
        .gte('fecha', inicioSemana.toISOString().split('T')[0])
        .lte('fecha', finSemana.toISOString().split('T')[0])

      // Citas del mes
      const inicioMes = new Date()
      inicioMes.setDate(1)
      const finMes = new Date()
      finMes.setMonth(finMes.getMonth() + 1, 0)

      const { data: citasMes, error: errorMes } = await this.supabase
        .from('citas')
        .select('id, estado', { count: 'exact' })
        .gte('fecha', inicioMes.toISOString().split('T')[0])
        .lte('fecha', finMes.toISOString().split('T')[0])

      if (errorHoy || errorSemana || errorMes) {
        throw new Error('Error obteniendo estadísticas de citas')
      }

      // Procesar datos
      const procesarCitas = (citas: any[]) => {
        const estados: Record<string, number> = {}
        citas?.forEach(cita => {
          estados[cita.estado] = (estados[cita.estado] || 0) + 1
        })
        return estados
      }

      return {
        hoy: {
          total: citasHoy?.length || 0,
          estados: procesarCitas(citasHoy || [])
        },
        semana: {
          total: citasSemana?.length || 0,
          estados: procesarCitas(citasSemana || [])
        },
        mes: {
          total: citasMes?.length || 0,
          estados: procesarCitas(citasMes || [])
        }
      }

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error)
      throw error
    }
  }

  /**
   * Validar disponibilidad de doctor
   */
  private async validarDisponibilidadDoctor(doctor_id: string, fecha: string, hora_inicio: string, hora_fin: string, excludeId?: string): Promise<void> {
    try {
      let query = this.supabase
        .from('citas')
        .select('id')
        .eq('doctor_id', doctor_id)
        .eq('fecha', fecha)
        .in('estado', ['programada', 'confirmada', 'en_curso'])

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data: citas, error } = await query

      if (error) {
        throw error
      }

      // Verificar solapamiento
      const hayConflicto = citas?.some(cita => 
        (hora_inicio < (cita as any).hora_fin && hora_fin > (cita as any).hora_inicio)
      )

      if (hayConflicto) {
        throw new Error('El doctor ya tiene una cita en ese horario')
      }

    } catch (error) {
      console.error('❌ Error validando disponibilidad doctor:', error)
      throw error
    }
  }

  /**
   * Validar disponibilidad de paciente
   */
  private async validarDisponibilidadPaciente(paciente_id: string, fecha: string, hora_inicio: string, hora_fin: string, excludeId?: string): Promise<void> {
    try {
      let query = this.supabase
        .from('citas')
        .select('id')
        .eq('paciente_id', paciente_id)
        .eq('fecha', fecha)
        .in('estado', ['programada', 'confirmada', 'en_curso'])

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data: citas, error } = await query

      if (error) {
        throw error
      }

      // Verificar solapamiento
      const hayConflicto = citas?.some(cita => 
        (hora_inicio < (cita as any).hora_fin && hora_fin > (cita as any).hora_inicio)
      )

      if (hayConflicto) {
        throw new Error('El paciente ya tiene una cita en ese horario')
      }

    } catch (error) {
      console.error('❌ Error validando disponibilidad paciente:', error)
      throw error
    }
  }

  /**
   * Suscripción en tiempo real a cambios de citas
   */
  obtenerSuscripcionCitas(callback: (payload: any) => void) {
    return this.supabase
      .channel('citas_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'citas' }, 
        callback
      )
      .subscribe()
  }
}

// Instancia singleton
export const citasService = new SupabaseCitasService()
export default SupabaseCitasService