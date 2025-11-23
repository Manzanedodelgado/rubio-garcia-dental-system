export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'user'
          permissions: string[]
          created_at: string
          last_activity?: string
          is_active: boolean
        }
        Insert: {
          id: string
          email: string
          name: string
          role: 'admin' | 'user'
          permissions?: string[]
          is_active?: boolean
        }
        Update: {
          email?: string
          name?: string
          role?: 'admin' | 'user'
          permissions?: string[]
          is_active?: boolean
          last_activity?: string
        }
      }
      doctors: {
        Row: {
          id: string
          nombre: string
          apellido: string
          numero_colegiado: string
          especialidades: string[]
          horarios: any[] // HorarioDoctor[]
          estado: 'activo' | 'inactivo'
          created_at: string
        }
        Insert: {
          nombre: string
          apellido: string
          numero_colegiado: string
          especialidades: string[]
          horarios: any[]
          estado?: 'activo' | 'inactivo'
        }
        Update: {
          nombre?: string
          apellido?: string
          numero_colegiado?: string
          especialidades?: string[]
          horarios?: any[]
          estado?: 'activo' | 'inactivo'
        }
      }
      pacientes: {
        Row: {
          id: string
          numero_paciente: string
          nombre: string
          apellido: string
          dni: string
          fecha_nacimiento: string
          telefono_fijo?: string
          telefono_movil: string
          email: string
          direccion: string
          alergias?: string
          enfermedades?: string
          medicamentos?: string
          preferencias_comunicacion: string
          consentimiento_lopd: 'firmado' | 'sin_firmar'
          estado: 'activo' | 'inactivo'
          fecha_registro: string
          created_at: string
          updated_at: string
        }
        Insert: {
          numero_paciente: string
          nombre: string
          apellido: string
          dni: string
          fecha_nacimiento: string
          telefono_fijo?: string
          telefono_movil: string
          email: string
          direccion: string
          alergias?: string
          enfermedades?: string
          medicamentos?: string
          preferencias_comunicacion: string
          consentimiento_lopd: 'firmado' | 'sin_firmar'
          estado?: 'activo' | 'inactivo'
        }
        Update: {
          numero_paciente?: string
          nombre?: string
          apellido?: string
          dni?: string
          fecha_nacimiento?: string
          telefono_fijo?: string
          telefono_movil?: string
          email?: string
          direccion?: string
          alergias?: string
          enfermedades?: string
          medicamentos?: string
          preferencias_comunicacion?: string
          consentimiento_lopd?: 'firmado' | 'sin_firmar'
          estado?: 'activo' | 'inactivo'
        }
      }
      citas: {
        Row: {
          id: string
          paciente_id: string
          doctor_id: string
          fecha: string
          hora_inicio: string
          hora_fin: string
          tratamiento: string
          estado: 'programada' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'no_asistio' | 'emergencia'
          notas?: string
          proxima_cita?: boolean
          documentos_firmados: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          paciente_id: string
          doctor_id: string
          fecha: string
          hora_inicio: string
          hora_fin: string
          tratamiento: string
          estado?: 'programada' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'no_asistio' | 'emergencia'
          notas?: string
          proxima_cita?: boolean
          documentos_firmados?: string[]
        }
        Update: {
          paciente_id?: string
          doctor_id?: string
          fecha?: string
          hora_inicio?: string
          hora_fin?: string
          tratamiento?: string
          estado?: 'programada' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'no_asistio' | 'emergencia'
          notas?: string
          proxima_cita?: boolean
          documentos_firmados?: string[]
        }
      }
      facturas: {
        Row: {
          id: string
          numero_factura: string
          paciente_id: string
          citas: string[]
          subtotal: number
          iva: number
          total: number
          estado: 'borrador' | 'emitida' | 'pagada' | 'cancelada'
          fecha_emision: string
          fecha_vencimiento?: string
          metodo_pago?: string
          qr_code?: string
          verifactu_compliance: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          numero_factura: string
          paciente_id: string
          citas: string[]
          subtotal: number
          iva: number
          total: number
          estado?: 'borrador' | 'emitida' | 'pagada' | 'cancelada'
          fecha_emision?: string
          fecha_vencimiento?: string
          metodo_pago?: string
          qr_code?: string
          verifactu_compliance?: boolean
        }
        Update: {
          numero_factura?: string
          paciente_id?: string
          citas?: string[]
          subtotal?: number
          iva?: number
          total?: number
          estado?: 'borrador' | 'emitida' | 'pagada' | 'cancelada'
          fecha_emision?: string
          fecha_vencimiento?: string
          metodo_pago?: string
          qr_code?: string
          verifactu_compliance?: boolean
        }
      }
      whatsapp_messages: {
        Row: {
          id: string
          telefono: string
          mensaje: string
          tipo: 'entrante' | 'saliente'
          estado: 'pendiente' | 'enviado' | 'entregado' | 'leido' | 'urgente'
          fecha_envio: string
          paciente_id?: string
          requiere_respuesta: boolean
          resumen_urgencia?: string
        }
        Insert: {
          telefono: string
          mensaje: string
          tipo: 'entrante' | 'saliente'
          estado?: 'pendiente' | 'enviado' | 'entregado' | 'leido' | 'urgente'
          fecha_envio?: string
          paciente_id?: string
          requiere_respuesta?: boolean
          resumen_urgencia?: string
        }
        Update: {
          telefono?: string
          mensaje?: string
          tipo?: 'entrante' | 'saliente'
          estado?: 'pendiente' | 'enviado' | 'entregado' | 'leido' | 'urgente'
          fecha_envio?: string
          paciente_id?: string
          requiere_respuesta?: boolean
          resumen_urgencia?: string
        }
      }
      documentos_plantilla: {
        Row: {
          id: string
          nombre: string
          tipo: 'consentimiento' | 'presupuesto' | 'factura' | 'recordatorio' | 'primera_visita'
          contenido: string
          comandos: string[]
          parametros: any[] // ParametroPlantilla[]
          activo: boolean
          created_at: string
        }
        Insert: {
          nombre: string
          tipo: 'consentimiento' | 'presupuesto' | 'factura' | 'recordatorio' | 'primera_visita'
          contenido: string
          comandos: string[]
          parametros: any[]
          activo?: boolean
        }
        Update: {
          nombre?: string
          tipo?: 'consentimiento' | 'presupuesto' | 'factura' | 'recordatorio' | 'primera_visita'
          contenido?: string
          comandos?: string[]
          parametros?: any[]
          activo?: boolean
        }
      }
      automatizaciones: {
        Row: {
          id: string
          nombre: string
          tipo: 'mensaje_masivo' | 'recordatorio' | 'confirmacion' | 'cancelacion'
          documento_id?: string
          trigger: any // TriggerAutomatizacion
          condiciones: any[] // CondicionAutomatizacion[]
          mensaje: string
          activa: boolean
          ejecuciones: number
          created_at: string
        }
        Insert: {
          nombre: string
          tipo: 'mensaje_masivo' | 'recordatorio' | 'confirmacion' | 'cancelacion'
          documento_id?: string
          trigger: any
          condiciones: any[]
          mensaje: string
          activa?: boolean
          ejecuciones?: number
        }
        Update: {
          nombre?: string
          tipo?: 'mensaje_masivo' | 'recordatorio' | 'confirmacion' | 'cancelacion'
          documento_id?: string
          trigger?: any
          condiciones?: any[]
          mensaje?: string
          activa?: boolean
          ejecuciones?: number
        }
      }
      contactos: {
        Row: {
          id: string
          nombre: string
          apellido: string
          telefono: string
          email: string
          tipo: 'paciente' | 'prospecto' | 'referencia'
          origen: 'citas' | 'whatsapp' | 'manual'
          paciente_id?: string
          ultima_interaccion: string
          notas?: string
        }
        Insert: {
          nombre: string
          apellido: string
          telefono: string
          email: string
          tipo: 'paciente' | 'prospecto' | 'referencia'
          origen: 'citas' | 'whatsapp' | 'manual'
          paciente_id?: string
          ultima_interaccion?: string
          notas?: string
        }
        Update: {
          nombre?: string
          apellido?: string
          telefono?: string
          email?: string
          tipo?: 'paciente' | 'prospecto' | 'referencia'
          origen?: 'citas' | 'whatsapp' | 'manual'
          paciente_id?: string
          ultima_interaccion?: string
          notas?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}