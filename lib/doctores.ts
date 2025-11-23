import { Doctor } from '@/types'

export const DOCTORES: Doctor[] = [
  {
    id: 'dr-mario-rubio',
    nombre: 'Mario',
    apellido: 'Rubio García',
    numero_colegiado: 'COLEG-001',
    especialidades: ['Implantología', 'Periodoncia', 'Estética Dental'],
    horarios: [
      {
        dia_semana: 3, // Miércoles
        hora_inicio: '10:00',
        hora_fin: '14:00',
        activo: true
      },
      {
        dia_semana: 3, // Miércoles
        hora_inicio: '16:00',
        hora_fin: '20:00',
        activo: true
      }
    ],
    estado: 'activo',
    created_at: new Date().toISOString()
  },
  {
    id: 'dra-virginia-tresgallo',
    nombre: 'Virginia',
    apellido: 'Tresgallo',
    numero_colegiado: 'COLEG-002',
    especialidades: ['Ortodoncia', 'Ortopedia Dentofacial'],
    horarios: [
      {
        dia_semana: 1, // Lunes
        hora_inicio: '10:00',
        hora_fin: '14:00',
        activo: true
      },
      {
        dia_semana: 1, // Lunes
        hora_inicio: '16:00',
        hora_fin: '20:00',
        activo: true
      }
    ],
    estado: 'activo',
    created_at: new Date().toISOString()
  },
  {
    id: 'dra-irene-garcia',
    nombre: 'Irene',
    apellido: 'García',
    numero_colegiado: 'COLEG-003',
    especialidades: ['Endodoncia', 'Odontología General'],
    horarios: [
      {
        dia_semana: 2, // Martes
        hora_inicio: '10:00',
        hora_fin: '14:00',
        activo: true
      },
      {
        dia_semana: 2, // Martes
        hora_inicio: '16:00',
        hora_fin: '20:00',
        activo: true
      }
    ],
    estado: 'activo',
    created_at: new Date().toISOString()
  },
  {
    id: 'tc-juan-antonio',
    nombre: 'Juan Antonio',
    apellido: 'Manzanedo',
    numero_colegiado: 'TC-001',
    especialidades: ['Higiene Dental', 'Blanqueamiento'],
    horarios: [
      {
        dia_semana: 4, // Jueves
        hora_inicio: '10:00',
        hora_fin: '14:00',
        activo: true
      }
    ],
    estado: 'activo',
    created_at: new Date().toISOString()
  }
]

// Función para obtener doctor por ID
export const getDoctorById = (id: string): Doctor | undefined => {
  return DOCTORES.find(doctor => doctor.id === id)
}

// Función para obtener doctores disponibles en un día específico
export const getDoctoresDisponibles = (diaSemana: number): Doctor[] => {
  return DOCTORES.filter(doctor => 
    doctor.estado === 'activo' && 
    doctor.horarios.some(horario => horario.dia_semana === diaSemana && horario.activo)
  )
}