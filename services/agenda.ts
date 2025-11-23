/**
 * SERVICIO DE AGENDA
 * Gestión completa de citas y agenda para Rubio García Dental
 * Autor: MiniMax Agent
 */

import { supabase } from '../lib/supabase';

export interface Cita {
  id: string;
  paciente_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_tratamiento: string;
  estado: 'programada' | 'confirmada' | 'en_proceso' | 'completada' | 'cancelada';
  notas?: string;
  Dentista_asignado: string;
  fecha_creacion: string;
  fecha_actualizacion?: string;
  // Datos del paciente (joined)
  paciente_nombre?: string;
  paciente_apellido?: string;
  paciente_telefono?: string;
}

export interface NuevaCita {
  paciente_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_tratamiento: string;
  Dentista_asignado: string;
  notas?: string;
}

export interface ActualizarCita {
  fecha?: string;
  hora_inicio?: string;
  hora_fin?: string;
  tipo_tratamiento?: string;
  estado?: Cita['estado'];
  notas?: string;
  Dentista_asignado?: string;
}

export interface FiltrosAgenda {
  fecha_inicio?: string;
  fecha_fin?: string;
  Dentista?: string;
  estado?: Cita['estado'];
  tipo_tratamiento?: string;
}

export interface HorarioDisponible {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
  motivo?: string;
}

export class AgendaService {
  private supabaseClient = supabase;

  /**
   * Crear nueva cita
   */
  async crearCita(cita: NuevaCita): Promise<{ cita: Cita | null; error: string | null }> {
    try {
      // Verificar que no hay conflictos de horario
      const tieneConflicto = await this.verificarConflictoHorario(
        cita.fecha,
        cita.hora_inicio,
        cita.hora_fin,
        cita.Dentista_asignado
      );

      if (tieneConflicto) {
        return {
          cita: null,
          error: 'Ya existe una cita programada para este horario'
        };
      }

      const { data, error } = await this.supabaseClient
        .from('citas')
        .insert(cita)
        .select(`
          *,
          pacientes(nombre, apellido, telefono)
        `)
        .single();

      if (error) {
        return { cita: null, error: error.message };
      }

      // Formatear datos del paciente
      const citaFormateada = {
        ...data,
        paciente_nombre: data.pacientes?.nombre,
        paciente_apellido: data.pacientes?.apellido,
        paciente_telefono: data.pacientes?.telefono
      };

      return { cita: citaFormateada as Cita, error: null };
    } catch (error) {
      return {
        cita: null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener citas por rango de fechas
   */
  async obtenerCitas(filtros: FiltrosAgenda = {}): Promise<Cita[]> {
    try {
      let query = this.supabaseClient
        .from('citas')
        .select(`
          *,
          pacientes(nombre, apellido, telefono)
        `);

      // Aplicar filtros
      if (filtros.fecha_inicio) {
        query = query.gte('fecha', filtros.fecha_inicio);
      }

      if (filtros.fecha_fin) {
        query = query.lte('fecha', filtros.fecha_fin);
      }

      if (filtros.Dentista) {
        query = query.eq('dentista_asignado', filtros.Dentista);
      }

      if (filtros.estado) {
        query = query.eq('estado', filtros.estado);
      }

      if (filtros.tipo_tratamiento) {
        query = query.eq('tipo_tratamiento', filtros.tipo_tratamiento);
      }

      // Ordenar por fecha y hora
      query = query.order('fecha').order('hora_inicio');

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Formatear datos
      return data.map(cita => ({
        ...cita,
        paciente_nombre: cita.pacientes?.nombre,
        paciente_apellido: cita.pacientes?.apellido,
        paciente_telefono: cita.pacientes?.telefono
      })) as Cita[];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener cita por ID
   */
  async obtenerCitaPorId(id: string): Promise<Cita | null> {
    try {
      const { data, error } = await this.supabaseClient
        .from('citas')
        .select(`
          *,
          pacientes(nombre, apellido, telefono)
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        ...data,
        paciente_nombre: data.pacientes?.nombre,
        paciente_apellido: data.pacientes?.apellido,
        paciente_telefono: data.pacientes?.telefono
      } as Cita;
    } catch (error) {
      return null;
    }
  }

  /**
   * Actualizar cita
   */
  async actualizarCita(id: string, actualizaciones: ActualizarCita): Promise<{ cita: Cita | null; error: string | null }> {
    try {
      // Si se modifica fecha u hora, verificar conflictos
      if (actualizaciones.fecha || actualizaciones.hora_inicio || actualizaciones.hora_fin || actualizaciones.dentista_asignado) {
        const citaActual = await this.obtenerCitaPorId(id);
        if (!citaActual) {
          return { cita: null, error: 'Cita no encontrada' };
        }

        const nuevaFecha = actualizaciones.fecha || citaActual.fecha;
        const nuevaHoraInicio = actualizaciones.hora_inicio || citaActual.hora_inicio;
        const nuevaHoraFin = actualizaciones.hora_fin || citaActual.hora_fin;
        const nuevoDentista = actualizaciones.dentista_asignado || citaActual.dentista_asignado;

        const tieneConflicto = await this.verificarConflictoHorario(
          nuevaFecha,
          nuevaHoraInicio,
          nuevaHoraFin,
          nuevoDentista,
          id // Excluir la cita actual
        );

        if (tieneConflicto) {
          return {
            cita: null,
            error: 'Ya existe una cita programada para este horario'
          };
        }
      }

      const { data, error } = await this.supabaseClient
        .from('citas')
        .update({
          ...actualizaciones,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          pacientes(nombre, apellido, telefono)
        `)
        .single();

      if (error) {
        return { cita: null, error: error.message };
      }

      return {
        cita: {
          ...data,
          paciente_nombre: data.pacientes?.nombre,
          paciente_apellido: data.pacientes?.apellido,
          paciente_telefono: data.pacientes?.telefono
        } as Cita,
        error: null
      };
    } catch (error) {
      return {
        cita: null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Cancelar cita
   */
  async cancelarCita(id: string, motivo?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseClient
        .from('citas')
        .update({
          estado: 'cancelada',
          notas: motivo ? `CANCELADA: ${motivo}` : 'CANCELADA',
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Confirmar cita
   */
  async confirmarCita(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseClient
        .from('citas')
        .update({
          estado: 'confirmada',
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Marcar cita como completada
   */
  async completarCita(id: string, notas?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        estado: 'completada',
        fecha_actualizacion: new Date().toISOString()
      };

      if (notas) {
        updateData.notas = notas;
      }

      const { error } = await this.supabaseClient
        .from('citas')
        .update(updateData)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener disponibilidad de horarios
   */
  async obtenerDisponibilidad(fecha: string, dentista: string): Promise<HorarioDisponible[]> {
    try {
      // Horarios de trabajo (ejemplo: 9:00 - 18:00)
      const horaInicio = '09:00';
      const horaFin = '18:00';
      const intervaloMinutos = 30; // Citas de 30 minutos

      // Obtener citas existentes para esa fecha y dentista
      const { data: citasExistentes } = await this.supabaseClient
        .from('citas')
        .select('hora_inicio, hora_fin')
        .eq('fecha', fecha)
        .eq('dentista_asignado', dentista)
        .in('estado', ['programada', 'confirmada', 'en_proceso']);

      const horariosDisponibles: HorarioDisponible[] = [];
      
      // Generar todos los horarios posibles
      let horaActual = horaInicio;
      while (horaActual < horaFin) {
        const horaInicioSlot = horaActual;
        const horaFinSlot = this.sumarMinutos(horaActual, intervaloMinutos);

        // Verificar si este horario está disponible
        const tieneConflicto = citasExistentes?.some(cita => {
          return this.tieneInterseccionHorarios(
            horaInicioSlot, horaFinSlot,
            cita.hora_inicio, cita.hora_fin
          );
        }) || false;

        horariosDisponibles.push({
          fecha,
          hora_inicio: horaInicioSlot,
          hora_fin: horaFinSlot,
          disponible: !tieneConflicto
        });

        horaActual = horaFinSlot;
      }

      return horariosDisponibles;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener citas del día
   */
  async obtenerCitasDelDia(fecha: string, dentista?: string): Promise<Cita[]> {
    try {
      let query = this.supabaseClient
        .from('citas')
        .select(`
          *,
          pacientes(nombre, apellido, telefono)
        `)
        .eq('fecha', fecha);

      if (dentista) {
        query = query.eq('dentista_asignado', dentista);
      }

      const { data, error } = await query.order('hora_inicio');

      if (error) {
        throw new Error(error.message);
      }

      return data.map(cita => ({
        ...cita,
        paciente_nombre: cita.pacientes?.nombre,
        paciente_apellido: cita.pacientes?.apellido,
        paciente_telefono: cita.pacientes?.telefono
      })) as Cita[];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener estadísticas de agenda
   */
  async obtenerEstadisticas(fechaInicio: string, fechaFin: string): Promise<{
    total_citas: number;
    citas_completadas: number;
    citas_canceladas: number;
    ocupacion_promedio: number;
  }> {
    try {
      // Total de citas en el período
      const { data: totalCitas, error: totalError } = await this.supabaseClient
        .from('citas')
        .select('id, estado')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin);

      if (totalError) {
        throw new Error(totalError.message);
      }

      const citasCompletadas = totalCitas?.filter(c => c.estado === 'completada').length || 0;
      const citasCanceladas = totalCitas?.filter(c => c.estado === 'cancelada').length || 0;
      const total = totalCitas?.length || 0;

      // Calcular ocupación promedio (esto sería más complejo en un sistema real)
      const ocupacionPromedio = total > 0 ? (citasCompletadas / total) * 100 : 0;

      return {
        total_citas: total,
        citas_completadas: citasCompletadas,
        citas_canceladas: citasCanceladas,
        ocupacion_promedio: Math.round(ocupacionPromedio * 100) / 100
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar conflicto de horario
   */
  private async verificarConflictoHorario(
    fecha: string,
    horaInicio: string,
    horaFin: string,
    dentista: string,
    citaIdExcluir?: string
  ): Promise<boolean> {
    try {
      let query = this.supabaseClient
        .from('citas')
        .select('id, hora_inicio, hora_fin')
        .eq('fecha', fecha)
        .eq('dentista_asignado', dentista)
        .in('estado', ['programada', 'confirmada', 'en_proceso']);

      if (citaIdExcluir) {
        query = query.neq('id', citaIdExcluir);
      }

      const { data: citasExistentes, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Verificar si hay intersección de horarios
      return citasExistentes?.some(cita =>
        this.tieneInterseccionHorarios(
          horaInicio, horaFin,
          cita.hora_inicio, cita.hora_fin
        )
      ) || false;
    } catch (error) {
      console.error('Error verificando conflicto de horario:', error);
      return true; // En caso de error, asumir que hay conflicto
    }
  }

  /**
   * Verificar si dos rangos de tiempo se intersectan
   */
  private tieneInterseccionHorarios(
    inicio1: string, fin1: string,
    inicio2: string, fin2: string
  ): boolean {
    const h1Inicio = this.convertirHoraAMinutos(inicio1);
    const h1Fin = this.convertirHoraAMinutos(fin1);
    const h2Inicio = this.convertirHoraAMinutos(inicio2);
    const h2Fin = this.convertirHoraAMinutos(fin2);

    return h1Inicio < h2Fin && h2Inicio < h1Fin;
  }

  /**
   * Convertir hora a minutos desde medianoche
   */
  private convertirHoraAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  /**
   * Sumar minutos a una hora
   */
  private sumarMinutos(hora: string, minutos: string | number): string {
    const totalMinutos = this.convertirHoraAMinutos(hora) + Number(minutos);
    const horas = Math.floor(totalMinutos / 60);
    const mins = totalMinutos % 60;
    return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Eliminar cita (solo en casos extremos)
   */
  async eliminarCita(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseClient
        .from('citas')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * NUEVOS MÉTODOS PARA PROCESADOR DE COMANDOS CLÍNICOS
   * ===============================================
   */

  /**
   * Obtener citas de un paciente específico
   */
  async obtenerCitasPaciente(
    pacienteId: string, 
    filtros: {
      fecha_inicio?: Date
      fecha_fin?: Date
      estado?: string[]
    } = {}
  ): Promise<Cita[]> {
    try {
      let query = this.supabaseClient
        .from('citas')
        .select(`
          *,
          pacientes(nombre, apellido, telefono)
        `)
        .eq('paciente_id', pacienteId);

      // Aplicar filtros
      if (filtros.fecha_inicio) {
        query = query.gte('fecha', filtros.fecha_inicio.toISOString().split('T')[0]);
      }

      if (filtros.fecha_fin) {
        query = query.lte('fecha', filtros.fecha_fin.toISOString().split('T')[0]);
      }

      if (filtros.estado && filtros.estado.length > 0) {
        query = query.in('estado', filtros.estado);
      }

      // Ordenar por fecha
      query = query.order('fecha').order('hora_inicio');

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Formatear datos
      return data.map(cita => ({
        ...cita,
        paciente_nombre: cita.pacientes?.nombre,
        paciente_apellido: cita.pacientes?.apellido,
        paciente_telefono: cita.pacientes?.telefono
      })) as Cita[];
    } catch (error) {
      console.error('Error obteniendo citas del paciente:', error);
      return [];
    }
  }

  /**
   * Crear cita desde comando de voz (formato simplificado)
   */
  async crearCitaComandoVoz(citaData: {
    paciente_id: string
    fecha: string | Date
    tratamiento: string
    duracion_minutos: number
    estado?: string
    notas?: string
  }): Promise<{ success: boolean; cita?: any; error?: string }> {
    try {
      const fecha = typeof citaData.fecha === 'string' 
        ? new Date(citaData.fecha) 
        : citaData.fecha;

      // Configurar horario (por defecto 10:00 AM)
      const hora_inicio = '10:00';
      const hora_fin = this.sumarMinutos(hora_inicio, citaData.duracion_minutos);

      const nuevaCita: NuevaCita = {
        paciente_id: citaData.paciente_id,
        fecha: fecha.toISOString().split('T')[0],
        hora_inicio,
        hora_fin,
        tipo_tratamiento: citaData.tratamiento,
        Dentista_asignado: 'Dr. Principal', // Por defecto
        notas: citaData.notas || `Cita creada por comando de voz IA - ${new Date().toISOString()}`
      };

      const resultado = await this.crearCita(nuevaCita);

      if (resultado.cita && resultado.error === null) {
        return {
          success: true,
          cita: resultado.cita,
          error: null
        };
      } else {
        return {
          success: false,
          error: resultado.error || 'Error creando la cita'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Buscar próximas citas para un paciente
   */
  async obtenerProximasCitasPaciente(
    pacienteId: string,
    limite: number = 5
  ): Promise<Cita[]> {
    try {
      const hoy = new Date();
      
      const { data, error } = await this.supabaseClient
        .from('citas')
        .select(`
          *,
          pacientes(nombre, apellido, telefono)
        `)
        .eq('paciente_id', pacienteId)
        .gte('fecha', hoy.toISOString().split('T')[0])
        .in('estado', ['programada', 'confirmada'])
        .order('fecha')
        .order('hora_inicio')
        .limit(limite);

      if (error) {
        throw new Error(error.message);
      }

      return data.map(cita => ({
        ...cita,
        paciente_nombre: cita.pacientes?.nombre,
        paciente_apellido: cita.pacientes?.apellido,
        paciente_telefono: cita.pacientes?.telefono
      })) as Cita[];
    } catch (error) {
      console.error('Error obteniendo próximas citas:', error);
      return [];
    }
  }
}

// Instancia singleton del servicio
export const agendaService = new AgendaService();
export default agendaService;