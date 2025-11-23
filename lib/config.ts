// Configuración de rutas de la aplicación
export const ROUTES = {
  // Dashboard
  HOME: '/',
  DASHBOARD: '/dashboard',
  
  // Autenticación
  LOGIN: '/auth/login',
  
  // Módulo Clínica
  CLINICA: '/clinica',
  AGENDA: '/clinica/agenda',
  AGENDA_DETAIL: '/clinica/agenda/[id]',
  AGENDA_NEW: '/clinica/agenda/nueva',
  PACIENTES: '/clinica/pacientes',
  PACIENTE_DETAIL: '/clinica/pacientes/[id]',
  PACIENTE_NEW: '/clinica/pacientes/nuevo',
  HISTORIA_CLINICA: '/clinica/historia',
  
  // Módulo Mensajería
  MENSAJERIA: '/mensajeria',
  WHATSAPP: '/mensajeria/whatsapp',
  CORREO: '/mensajeria/correo',
  
  // Módulo IA
  IA: '/ia',
  AUTOMATIZACIONES: '/ia/automatizaciones',
  AGENTE_IA: '/ia/agente',
  CONTROL_VOZ: '/ia/voz',
  
  // Módulo Gestión
  GESTION: '/gestion',
  FACTURAS: '/gestion/facturas',
  CONTABILIDAD: '/gestion/contabilidad',
  
  // Configuración
  CONFIGURACION: '/configuracion',
  USUARIOS: '/configuracion/usuarios',
  TABLAS: '/configuracion/tablas',
} as const

export type Route = typeof ROUTES[keyof typeof ROUTES]

// Configuración de estados
export const ESTADOS_CITA = {
  PROGRAMADA: 'programada',
  CONFIRMADA: 'confirmada', 
  EN_CURSO: 'en_curso',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada',
  NO_ASISTIO: 'no_asistio',
  EMERGENCIA: 'emergencia',
} as const

export const ESTADOS_FACTURA = {
  BORRADOR: 'borrador',
  EMITIDA: 'emitida',
  PAGADA: 'pagada',
  CANCELADA: 'cancelada',
} as const

export const ROLES_USUARIO = {
  ADMIN: 'admin',
  USER: 'user',
} as const

// Configuración de días de la semana
export const DIAS_SEMANA = {
  1: { nombre: 'Lunes', abreviado: 'L' },
  2: { nombre: 'Martes', abreviado: 'M' },
  3: { nombre: 'Miércoles', abreviado: 'X' },
  4: { nombre: 'Jueves', abreviado: 'J' },
  5: { nombre: 'Viernes', abreviado: 'V' },
  6: { nombre: 'Sábado', abreviado: 'S' },
  7: { nombre: 'Domingo', abreviado: 'D' },
} as const

// Configuración de horarios de la clínica
export const HORARIOS_CLINICA = {
  LUNES_JUEVES: {
    manana: { inicio: '10:00', fin: '14:00' },
    tarde: { inicio: '16:00', fin: '20:00' }
  },
  VIERNES: {
    manana: { inicio: '10:00', fin: '14:00' },
    tarde: null
  },
  SABADO_DOMINGO: null
} as const

// Configuración de duración de citas (en minutos)
export const DURACION_CITAS = {
  CONSULTA: 30,
  LIMPIEZA: 45,
  TRATAMIENTO: 60,
  IMPLANTE: 90,
  EMERGENCIA: 15,
} as const

// Configuración de tipos de mensaje WhatsApp
export const TIPOS_MENSAJE = {
  ENTRANTE: 'entrante',
  SALIENTE: 'saliente',
} as const

export const ESTADOS_MENSAJE = {
  PENDIENTE: 'pendiente',
  ENVIADO: 'enviado',
  ENTREGADO: 'entregado',
  LEIDO: 'leido',
  URGENTE: 'urgente',
} as const

// Configuración de tipos de documento
export const TIPOS_DOCUMENTO = {
  CONSENTIMIENTO: 'consentimiento',
  PRESUPUESTO: 'presupuesto',
  FACTURA: 'factura',
  RECORDATORIO: 'recordatorio',
  PRIMERA_VISITA: 'primera_visita',
} as const

// Configuración de tipos de contacto
export const TIPOS_CONTACTO = {
  PACIENTE: 'paciente',
  PROSPECTO: 'prospecto',
  REFERENCIA: 'referencia',
} as const

export const ORIGEN_CONTACTO = {
  CITAS: 'citas',
  WHATSAPP: 'whatsapp',
  MANUAL: 'manual',
} as const

// Configuración de urgencia
export const NIVELES_URGENCIA = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const

// Configuración de categoría de mensaje
export const CATEGORIAS_MENSAJE = {
  PAIN: 'pain',
  EMERGENCY: 'emergency',
  QUESTION: 'question',
  BOOKING: 'booking',
  OTHER: 'other',
} as const

// Configuración de estados de plan de tratamiento
export const ESTADOS_TRATAMIENTO = {
  PLANIFICACION: 'planificacion',
  EN_PROCESO: 'en_proceso',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',
} as const

// Configuración de estado del diente
export const ESTADO_DIENTE = {
  SANO: 'sano',
  CARIES: 'caries',
  OBTURADO: 'obturado',
  CORONA: 'corona',
  AUSENTE: 'ausente',
  IMPLANTE: 'implante',
} as const

// Configuración de nivel de alerta
export const NIVELES_ALERTA = {
  INFO: 'info',
  ADVERTENCIA: 'advertencia',
  CRITICO: 'critico',
} as const

// Configuración de método de firma
export const METODOS_FIRMA = {
  DIGITAL: 'digital',
  FISICA: 'fisica',
  WHATSAPP: 'whatsapp',
} as const