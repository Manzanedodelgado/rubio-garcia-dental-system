// Tipos principales para la aplicación
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  permissions: string[]
  created_at: string
  last_activity?: string
  is_active: boolean
}

export interface Doctor {
  id: string
  nombre: string
  apellido: string
  numero_colegiado: string
  especialidades: string[]
  horarios: HorarioDoctor[]
  estado: 'activo' | 'inactivo'
  created_at: string
}

export interface HorarioDoctor {
  dia_semana: number // 1=Lunes, 7=Domingo
  hora_inicio: string // HH:MM
  hora_fin: string // HH:MM
  activo: boolean
}

export interface Paciente {
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

export interface Cita {
  id: string
  paciente_id: string
  doctor_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  tratamiento: string
  estado: EstadoCita
  notas?: string
  proxima_cita?: boolean
  documentos_firmados: string[]
  created_at: string
  updated_at: string
  
  // Datos relacionados (joins)
  paciente?: Paciente
  doctor?: Doctor
}

export type EstadoCita = 
  | 'programada' 
  | 'confirmada' 
  | 'en_curso' 
  | 'completada' 
  | 'cancelada' 
  | 'no_asistio' 
  | 'emergencia'

export interface Tratamiento {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  precio_base: number
  duracion_estimada: number // minutos
  requiere_anestesia: boolean
  requiere_documentos: string[]
  activo: boolean
}

export interface Factura {
  id: string
  numero_factura: string
  paciente_id: string
  citas: string[] // IDs de citas relacionadas
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
  
  // Datos relacionados
  paciente?: Paciente
  lineas_factura: LineaFactura[]
}

export interface LineaFactura {
  id: string
  concepto: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  tratamiento_id?: string
}

export interface WhatsAppMessage {
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

export interface DocumentoPlantilla {
  id: string
  nombre: string
  tipo: 'consentimiento' | 'presupuesto' | 'factura' | 'recordatorio' | 'primera_visita'
  contenido: string
  comandos: string[] // {{name}}, {{date}}, etc.
  parametros: ParametroPlantilla[]
  activo: boolean
  created_at: string
}

export interface ParametroPlantilla {
  nombre: string
  tipo: 'string' | 'number' | 'date' | 'boolean'
  requerido: boolean
  default?: string
}

export interface Automatizacion {
  id: string
  nombre: string
  tipo: 'mensaje_masivo' | 'recordatorio' | 'confirmacion' | 'cancelacion'
  documento_id?: string
  trigger: TriggerAutomatizacion
  condiciones: CondicionAutomatizacion[]
  mensaje: string
  activa: boolean
  ejecuciones: number
  created_at: string
}

export interface TriggerAutomatizacion {
  tipo: 'fecha_antes_cita' | 'confirmacion_cita' | 'cancelacion_cita' | 'primera_cita'
  horas_antes?: number
}

export interface CondicionAutomatizacion {
  campo: string
  operador: 'equals' | 'not_equals' | 'contains' | 'greater_than'
  valor: string
}

export interface Contacto {
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
  UltimasCitas: Cita[]
  proximaCita?: Cita
}

// Estados de la aplicación
export interface AppStatus {
  supabase_connected: boolean
  sql_server_connected: boolean
  whatsapp_connected: boolean
  ai_active: boolean
  last_sync?: string
}

export interface SyncLog {
  id: string
  tipo: 'sql_to_supabase' | 'supabase_to_sql' | 'manual'
  tabla: string
  registros_afectados: number
  errores: number
  estado: 'exitoso' | 'fallido' | 'parcial'
  timestamp: string
  detalles?: string
}

// Configuración de la clínica
export interface ClinicaConfig {
  id: string
  nombre: string
  especialidad: string
  website: string
  direccion: string
  telefono: string
  movil: string
  email: string
  horario_atencion: string
  horarios_detalle: HorarioAtencion[]
  created_at: string
}

export interface HorarioAtencion {
  dia_semana: number
  horarios: HorarioDia[]
}

export interface HorarioDia {
  hora_inicio: string
  hora_fin: string
  activo: boolean
}

// Historial clínico
export interface HistoriaClinica {
  id: string
  paciente_id: string
  tratamientos: PlanTratamiento[]
  odontograma?: Odontograma
  fotos_tratamientos: FotoTratamiento[]
  alertas: AlertaMedica[]
  documentos_firmados: DocumentoFirmado[]
  created_at: string
  updated_at: string
}

export interface PlanTratamiento {
  id: string
  paciente_id: string
  doctor_id: string
  titulo: string
  descripcion: string
  tratamientos: string[] // IDs
  estado: 'planificacion' | 'en_proceso' | 'completado' | 'cancelado'
  fecha_inicio: string
  fecha_estimada_fin: string
  fecha_real_fin?: string
  costo_total: number
  notas: string
  created_at: string
}

export interface Odontograma {
  paciente_id: string
  dientes: Diente[]
  ultima_actualizacion: string
}

export interface Diente {
  numero: number // 1-32
  estado: 'sano' | 'caries' | 'obturado' | 'corona' | 'ausente' | 'implante'
  tratamientos: string[]
  notas?: string
  fecha_ultimo_tratamiento?: string
}

export interface FotoTratamiento {
  id: string
  paciente_id: string
  cita_id?: string
  tratamiento_id: string
  descripcion: string
  url_foto: string
  fecha_toma: string
  etiquetas: string[]
}

export interface AlertaMedica {
  id: string
  paciente_id: string
  tipo: 'alergia' | 'medicamento' | 'procedimiento' | 'nota'
  titulo: string
  descripcion: string
  nivel: 'info' | 'advertencia' | 'critico'
  activa: boolean
  fecha_creacion: string
}

export interface DocumentoFirmado {
  id: string
  paciente_id: string
  tipo: 'consentimiento' | 'lopd' | 'tratamiento' | 'presupuesto'
  titulo: string
  url_documento: string
  fecha_firma: string
  metodo_firma: 'digital' | 'fisica' | 'whatsapp'
  firma_validada: boolean
  hash_documento?: string
}