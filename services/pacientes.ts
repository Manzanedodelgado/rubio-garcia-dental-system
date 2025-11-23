import { supabase } from '@/lib/supabase'
import { Paciente, Cita, Contacto } from '@/types'
import { sqlServerService } from './sql-server'

export interface PacienteFilters {
  search?: string
  estado?: 'activo' | 'inactivo'
  fechaRegistroDesde?: string
  fechaRegistroHasta?: string
  offset?: number
  limit?: number
}

export interface PacienteSearchResult {
  pacientes: Paciente[]
  total: number
  hasMore: boolean
}

export class PacientesService {
  // Buscar pacientes con filtros y paginación
  static async buscarPacientes(filters: PacienteFilters): Promise<PacienteSearchResult> {
    try {
      let query = supabase
        .from('pacientes')
        .select('*', { count: 'exact' })

      // Aplicar filtros de búsqueda
      if (filters.search) {
        const searchTerm = `%${filters.search}%`
        query = query.or(
          `nombre.ilike.${searchTerm},` +
          `apellido.ilike.${searchTerm},` +
          `dni.ilike.${searchTerm},` +
          `telefono_movil.ilike.${searchTerm},` +
          `telefono_fijo.ilike.${searchTerm},` +
          `numero_paciente.ilike.${searchTerm},` +
          `email.ilike.${searchTerm}`
        )
      }

      if (filters.estado) {
        query = query.eq('estado', filters.estado)
      }

      if (filters.fechaRegistroDesde) {
        query = query.gte('fecha_registro', filters.fechaRegistroDesde)
      }

      if (filters.fechaRegistroHasta) {
        query = query.lte('fecha_registro', filters.fechaRegistroHasta)
      }

      // Ordenar por fecha de registro (más recientes primero)
      query = query.order('fecha_registro', { ascending: false })

      // Paginación
      const offset = filters.offset || 0
      const limit = filters.limit || 20
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Error al buscar pacientes: ${error.message}`)
      }

      const hasMore = count ? offset + limit < count : false

      return {
        pacientes: data || [],
        total: count || 0,
        hasMore
      }
    } catch (error) {
      console.error('Error en buscarPacientes:', error)
      throw error
    }
  }

  // Obtener paciente por ID
  static async obtenerPaciente(id: string): Promise<Paciente | null> {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Error al obtener paciente: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error en obtenerPaciente:', error)
      throw error
    }
  }

  // Crear nuevo paciente
  static async crearPaciente(pacienteData: Omit<Paciente, 'id' | 'created_at' | 'updated_at'>): Promise<Paciente> {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .insert([pacienteData])
        .select()
        .single()

      if (error) {
        throw new Error(`Error al crear paciente: ${error.message}`)
      }

      // Sincronizar con SQL Server si es necesario
      try {
        await sqlServerService.syncPacienteToSqlServer(data)
      } catch (syncError) {
        console.warn('Error al sincronizar con SQL Server:', syncError)
        // No fallar la creación por errores de sincronización
      }

      // Crear contacto automáticamente
      await this.crearContactoDesdePaciente(data)

      return data
    } catch (error) {
      console.error('Error en crearPaciente:', error)
      throw error
    }
  }

  // Actualizar paciente
  static async actualizarPaciente(id: string, pacienteData: Partial<Paciente>): Promise<Paciente> {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .update({
          ...pacienteData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Error al actualizar paciente: ${error.message}`)
      }

      // Sincronizar con SQL Server si es necesario
      try {
        await sqlServerService.syncPacienteToSqlServer(data)
      } catch (syncError) {
        console.warn('Error al sincronizar con SQL Server:', syncError)
      }

      // Actualizar contacto si existe
      await this.actualizarContactoDesdePaciente(data)

      return data
    } catch (error) {
      console.error('Error en actualizarPaciente:', error)
      throw error
    }
  }

  // Eliminar paciente (soft delete)
  static async eliminarPaciente(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('pacientes')
        .update({ 
          estado: 'inactivo',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        throw new Error(`Error al eliminar paciente: ${error.message}`)
      }

      // Sincronizar con SQL Server si es necesario
      try {
        await sqlServerService.syncPacienteToSqlServer({ id, estado: 'inactivo' } as Paciente)
      } catch (syncError) {
        console.warn('Error al sincronizar eliminación con SQL Server:', syncError)
      }
    } catch (error) {
      console.error('Error en eliminarPaciente:', error)
      throw error
    }
  }

  // Obtener últimas 6 citas de un paciente
  static async obtenerUltimasCitas(pacienteId: string): Promise<Cita[]> {
    try {
      const { data, error } = await supabase
        .from('citas')
        .select(`
          *,
          doctor:doctores(*)
        `)
        .eq('paciente_id', pacienteId)
        .neq('estado', 'cancelada')
        .order('fecha', { ascending: false })
        .limit(6)

      if (error) {
        throw new Error(`Error al obtener citas: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error en obtenerUltimasCitas:', error)
      throw error
    }
  }

  // Obtener próxima cita de un paciente
  static async obtenerProximaCita(pacienteId: string): Promise<Cita | null> {
    try {
      const hoy = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('citas')
        .select(`
          *,
          doctor:doctores(*)
        `)
        .eq('paciente_id', pacienteId)
        .eq('estado', 'programada')
        .gte('fecha', hoy)
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Error al obtener próxima cita: ${error.message}`)
      }

      return data || null
    } catch (error) {
      console.error('Error en obtenerProximaCita:', error)
      throw error
    }
  }

  // Crear contacto automáticamente desde paciente
  static async crearContactoDesdePaciente(paciente: Paciente): Promise<Contacto | null> {
    try {
      // Verificar si ya existe un contacto con este teléfono
      const { data: contactoExistente } = await supabase
        .from('contactos')
        .select('*')
        .eq('telefono', paciente.telefono_movil)
        .eq('tipo', 'paciente')
        .single()

      if (contactoExistente) {
        // Actualizar contacto existente
        const { data: contactoActualizado } = await supabase
          .from('contactos')
          .update({
            nombre: paciente.nombre,
            apellido: paciente.apellido,
            email: paciente.email,
            paciente_id: paciente.id,
            ultima_interaccion: paciente.fecha_registro,
            origen: 'citas'
          })
          .eq('id', contactoExistente.id)
          .select()
          .single()

        return contactoActualizado
      }

      // Crear nuevo contacto
      const nuevoContacto: Omit<Contacto, 'id'> = {
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        telefono: paciente.telefono_movil,
        email: paciente.email,
        tipo: 'paciente',
        origen: 'citas',
        paciente_id: paciente.id,
        ultima_interaccion: paciente.fecha_registro
      }

      const { data: contactoCreado } = await supabase
        .from('contactos')
        .insert([nuevoContacto])
        .select()
        .single()

      return contactoCreado || null
    } catch (error) {
      console.error('Error en crearContactoDesdePaciente:', error)
      return null
    }
  }

  // Actualizar contacto desde paciente
  static async actualizarContactoDesdePaciente(paciente: Paciente): Promise<void> {
    try {
      const { data } = await supabase
        .from('contactos')
        .select('*')
        .eq('paciente_id', paciente.id)
        .eq('tipo', 'paciente')
        .single()

      if (data) {
        await supabase
          .from('contactos')
          .update({
            nombre: paciente.nombre,
            apellido: paciente.apellido,
            telefono: paciente.telefono_movil,
            email: paciente.email
          })
          .eq('id', data.id)
      }
    } catch (error) {
      console.error('Error en actualizarContactoDesdePaciente:', error)
    }
  }

  // Crear contacto desde mensaje WhatsApp
  static async crearContactoDesdeWhatsApp(telefono: string, nombre?: string): Promise<Contacto | null> {
    try {
      // Verificar si ya existe
      const { data: contactoExistente } = await supabase
        .from('contactos')
        .select('*')
        .eq('telefono', telefono)
        .eq('tipo', 'prospecto')
        .single()

      if (contactoExistente) {
        return contactoExistente
      }

      const nuevoContacto: Omit<Contacto, 'id'> = {
        nombre: nombre || '',
        apellido: '',
        telefono: telefono,
        email: '',
        tipo: 'prospecto',
        origen: 'whatsapp',
        ultima_interaccion: new Date().toISOString()
      }

      const { data: contactoCreado } = await supabase
        .from('contactos')
        .insert([nuevoContacto])
        .select()
        .single()

      return contactoCreado || null
    } catch (error) {
      console.error('Error en crearContactoDesdeWhatsApp:', error)
      return null
    }
  }

  // Sincronizar con SQL Server
  static async sincronizarConSqlServer(): Promise<void> {
    try {
      await sqlServerService.syncPacientesToSupabase()
      await sqlServerService.syncSupabaseToSqlServer()
    } catch (error) {
      console.error('Error en sincronización:', error)
      throw error
    }
  }

  // Generar número de paciente único
  static async generarNumeroPaciente(): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('generar_numero_paciente')

      if (error) {
        // Fallback: generar número basado en timestamp
        const timestamp = Date.now().toString().slice(-6)
        return `PAC${timestamp}`
      }

      return data
    } catch (error) {
      console.warn('Error al generar número de paciente:', error)
      const timestamp = Date.now().toString().slice(-6)
      return `PAC${timestamp}`
    }
  }
}