/**
 * API ROUTE - ESTADÍSTICAS PACIENTES
 * 
 * Obtener estadísticas y métricas de pacientes
 * 
 * ENDPOINT:
 * - GET /api/pacientes/estadisticas
 */

import { NextRequest, NextResponse } from 'next/server'
import { pacientesService } from '@/services/supabase-pacientes'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Obteniendo estadísticas de pacientes...')
    
    const estadisticas = await pacientesService.obtenerEstadisticasPacientes()

    // Obtener datos adicionales para gráficos
    const hoy = new Date()
    const haceUnMes = new Date()
    haceUnMes.setMonth(haceUnMes.getMonth() - 1)
    const haceSeisMeses = new Date()
    haceSeisMeses.setMonth(haceSeisMeses.getMonth() - 6)

    // Pacientes registrados en los últimos 6 meses
    const pacientesRecientes = await pacientesService.buscarPacientes({
      fecha_desde: haceSeisMeses.toISOString().split('T')[0],
      limite: 1000
    })

    // Agrupar por mes
    const registrosPorMes = new Map()
    pacientesRecientes.pacientes.forEach(paciente => {
      const fecha = new Date(paciente.fecha_registro)
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      registrosPorMes.set(mesKey, (registrosPorMes.get(mesKey) || 0) + 1)
    })

    // Estados de pacientes
    const pacientesActivos = await pacientesService.obtenerTodosPacientes('activo')
    const pacientesInactivos = await pacientesService.obtenerTodosPacientes('inactivo')

    // Pacientes nuevos este mes
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const pacientesEsteMes = pacientesRecientes.pacientes.filter(p => 
      new Date(p.fecha_registro) >= inicioMes
    ).length

    const estadisticasCompletas = {
      ...estadisticas,
      registros_por_mes: Object.fromEntries(registrosPorMes),
      pacientes_este_mes: pacientesEsteMes,
      distribucion_estado: {
        activos: pacientesActivos.length,
        inactivos: pacientesInactivos.length
      },
      promedio_registros_mes: registrosPorMes.size > 0 ? 
        Array.from(registrosPorMes.values()).reduce((a, b) => a + b, 0) / registrosPorMes.size : 0,
      tasa_crecimiento_mensual: pacientesEsteMes > 0 ? 
        ((pacientesEsteMes / Math.max(pacientesRecientes.pacientes.length - pacientesEsteMes, 1)) * 100) : 0
    }

    return NextResponse.json({
      success: true,
      data: estadisticasCompletas,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error obteniendo estadísticas de pacientes:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error obteniendo estadísticas',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}