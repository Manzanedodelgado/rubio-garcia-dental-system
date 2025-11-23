/**
 * API ROUTE - CITAS ESPECIALES
 * 
 * Endpoints específicos para citas de hoy y próximas
 * 
 * ENDPOINTS:
 * - GET /api/citas/hoy - Citas de hoy
 * - GET /api/citas/proximas - Próximas citas
 * - GET /api/citas/calendario/[fecha] - Calendario de fecha específica
 */

import { NextRequest, NextResponse } from 'next/server'
import { citasService } from '@/services/supabase-citas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = request.nextUrl.pathname.split('/').pop()

    switch (endpoint) {
      case 'hoy':
        return await obtenerCitasHoy()
      case 'proximas':
        return await obtenerProximasCitas()
      case 'calendario':
        const fecha = searchParams.get('fecha')
        if (fecha) {
          return await obtenerCalendarioFecha(fecha)
        } else {
          return NextResponse.json({
            success: false,
            error: 'Fecha requerida para calendario',
            timestamp: new Date().toISOString()
          }, { status: 400 })
        }
      default:
        return NextResponse.json({
          success: false,
          error: 'Endpoint no válido',
          timestamp: new Date().toISOString()
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Error en endpoint de citas:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error procesando solicitud',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function obtenerCitasHoy() {
  try {
    console.log('📅 Obteniendo citas de hoy...')
    
    const resultado = await citasService.obtenerCitasHoy()

    // Separar citas por estado para mejor visualización
    const citasPorEstado = resultado.citas.reduce((acc, cita) => {
      const estado = cita.estado
      if (!acc[estado]) acc[estado] = []
      acc[estado].push(cita)
      return acc
    }, {} as Record<string, any[]>)

    // Calcular estadísticas del día
    const totalCitas = resultado.citas.length
    const completadas = citasPorEstado.completada?.length || 0
    const canceladas = citasPorEstado.cancelada?.length || 0
    const pendientes = (citasPorEstado.programada?.length || 0) + (citasPorEstado.confirmada?.length || 0)
    const enCurso = citasPorEstado.en_curso?.length || 0

    return NextResponse.json({
      success: true,
      data: {
        citas: resultado.citas,
        total: resultado.total,
        citas_por_estado: citasPorEstado,
        estadisticas: {
          total_citas: totalCitas,
          completadas,
          canceladas,
          pendientes,
          en_curso,
          porcentaje_completadas: totalCitas > 0 ? (completadas / totalCitas) * 100 : 0
        },
        fecha: new Date().toISOString().split('T')[0]
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error obteniendo citas de hoy:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error obteniendo citas de hoy',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function obtenerProximasCitas() {
  try {
    console.log('📅 Obteniendo próximas citas...')
    
    const resultado = await citasService.obtenerProximasCitas()

    // Agrupar citas por fecha
    const citasPorFecha = resultado.citas.reduce((acc, cita) => {
      const fecha = cita.fecha
      if (!acc[fecha]) acc[fecha] = []
      acc[fecha].push(cita)
      return acc
    }, {} as Record<string, any[]>)

    // Ordenar fechas
    const fechasOrdenadas = Object.keys(citasPorFecha).sort()

    return NextResponse.json({
      success: true,
      data: {
        citas: resultado.citas,
        total: resultado.total,
        citas_por_fecha: citasPorFecha,
        fechas_disponibles: fechasOrdenadas,
        periodo: 'Próximos 7 días'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error obteniendo próximas citas:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error obteniendo próximas citas',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function obtenerCalendarioFecha(fecha: string) {
  try {
    console.log(`📅 Obteniendo calendario para ${fecha}`)
    
    const calendario = await citasService.obtenerCalendarioFecha(fecha)

    // Validar formato de fecha
    const fechaObj = new Date(fecha)
    if (isNaN(fechaObj.getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Formato de fecha inválido (YYYY-MM-DD)',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Separar citas por hora para mejor visualización
    const citasPorHora = calendario.citas.reduce((acc, cita) => {
      const hora = cita.hora_inicio
      if (!acc[hora]) acc[hora] = []
      acc[hora].push(cita)
      return acc
    }, {} as Record<string, any[]>)

    // Obtener disponibilidad del día (para mostrar slots libres)
    const doctorIds = [...new Set(calendario.citas.map(c => c.doctor_id))]
    const disponibilidadPorDoctor: Record<string, any[]> = {}
    
    for (const doctorId of doctorIds) {
      try {
        const disponibilidad = await citasService.obtenerDisponibilidadDoctor(doctorId, fecha)
        disponibilidadPorDoctor[doctorId] = disponibilidad
      } catch (error) {
        console.warn(`No se pudo obtener disponibilidad para doctor ${doctorId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        fecha: calendario.fecha,
        citas: calendario.citas,
        total_citas: calendario.citas.length,
        citas_por_hora: citasPorHora,
        disponibilidad_por_doctor: disponibilidadPorDoctor,
        estadisticas: {
          doctores_con_citas: doctorIds.length,
          citas_por_estado: calendario.citas.reduce((acc, cita) => {
            acc[cita.estado] = (acc[cita.estado] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error obteniendo calendario:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error obteniendo calendario',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}