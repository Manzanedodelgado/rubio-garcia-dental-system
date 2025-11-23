/**
 * API ROUTE - CITAS
 * 
 * Gestión completa de citas usando Supabase
 * 
 * ENDPOINTS:
 * - GET /api/citas - Buscar/filtrar citas
 * - POST /api/citas - Crear nueva cita
 * - GET /api/citas/hoy - Obtener citas de hoy
 * - GET /api/citas/proximas - Obtener próximas citas
 */

import { NextRequest, NextResponse } from 'next/server'
import { citasService, FiltrosCitas } from '@/services/supabase-citas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extraer filtros de la query string
    const filtros: FiltrosCitas = {
      paciente_id: searchParams.get('paciente_id') || undefined,
      doctor_id: searchParams.get('doctor_id') || undefined,
      estado: searchParams.get('estado') || undefined,
      fecha_desde: searchParams.get('fecha_desde') || undefined,
      fecha_hasta: searchParams.get('fecha_hasta') || undefined,
      offset: parseInt(searchParams.get('offset') || '0'),
      limite: parseInt(searchParams.get('limite') || '50')
    }

    console.log('🔍 Buscando citas con filtros:', filtros)
    
    const resultado = await citasService.buscarCitas(filtros)

    return NextResponse.json({
      success: true,
      data: {
        citas: resultado.citas,
        total: resultado.total,
        filtros_aplicados: filtros
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error buscando citas:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error buscando citas',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const citaData = await request.json()

    console.log('📅 Creando nueva cita:', citaData.fecha, citaData.hora_inicio)
    
    // Validaciones básicas
    if (!citaData.paciente_id || !citaData.doctor_id || !citaData.fecha || !citaData.hora_inicio || !citaData.hora_fin) {
      return NextResponse.json({
        success: false,
        error: 'Datos obligatorios faltantes: paciente_id, doctor_id, fecha, hora_inicio, hora_fin',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Validar formato de fecha
    const fechaCita = new Date(citaData.fecha)
    if (isNaN(fechaCita.getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Formato de fecha inválido',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Validar que la fecha no sea en el pasado
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    if (fechaCita < hoy) {
      return NextResponse.json({
        success: false,
        error: 'No se pueden crear citas en fechas pasadas',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Validar horario de la cita (9:00 - 20:00)
    const horaInicio = citaData.hora_inicio
    const horaFin = citaData.hora_fin
    
    if (horaInicio < '09:00:00' || horaInicio >= '20:00:00') {
      return NextResponse.json({
        success: false,
        error: 'El horario de la clínica es de 9:00 a 20:00',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Crear cita
    const citaCreada = await citasService.crearCita({
      ...citaData,
      estado: citaData.estado || 'programada',
      notas: citaData.notas || null,
      proxima_cita: citaData.proxima_cita || false,
      documentos_firmados: citaData.documentos_firmados || []
    })

    return NextResponse.json({
      success: true,
      data: citaCreada,
      message: 'Cita creada exitosamente',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error creando cita:', error)
    
    // Manejo específico de errores
    if (error.message.includes('ya tiene una cita')) {
      return NextResponse.json({
        success: false,
        error: 'El paciente ya tiene una cita en ese horario',
        timestamp: new Date().toISOString()
      }, { status: 409 })
    }
    
    if (error.message.includes('doctor ya tiene una cita')) {
      return NextResponse.json({
        success: false,
        error: 'El doctor ya tiene una cita en ese horario',
        timestamp: new Date().toISOString()
      }, { status: 409 })
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Error creando cita',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}