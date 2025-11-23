/**
 * API ROUTES - CITAS ADICIONALES
 * 
 * Endpoints específicos para citas
 * 
 * ENDPOINTS:
 * - GET /api/citas/[id] - Obtener cita específica
 * - PUT /api/citas/[id] - Actualizar cita
 * - DELETE /api/citas/[id] - Eliminar cita
 * - PUT /api/citas/[id]/estado - Cambiar estado
 */

import { NextRequest, NextResponse } from 'next/server'
import { citasService } from '@/services/supabase-citas'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID de cita requerido',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    console.log('📅 Obteniendo cita:', id)
    
    const cita = await citasService.obtenerCita(id)

    if (!cita) {
      return NextResponse.json({
        success: false,
        error: 'Cita no encontrada',
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: cita,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error obteniendo cita:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error obteniendo cita',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const updates = await request.json()

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID de cita requerido',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    console.log('📅 Actualizando cita:', id)
    
    // Validaciones de actualización
    if (updates.fecha) {
      const fechaCita = new Date(updates.fecha)
      if (isNaN(fechaCita.getTime())) {
        return NextResponse.json({
          success: false,
          error: 'Formato de fecha inválido',
          timestamp: new Date().toISOString()
        }, { status: 400 })
      }
    }

    if (updates.hora_inicio && updates.hora_inicio < '09:00:00') {
      return NextResponse.json({
        success: false,
        error: 'Horario de inicio debe ser después de las 9:00',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Actualizar cita
    const citaActualizada = await citasService.actualizarCita(id, updates)

    return NextResponse.json({
      success: true,
      data: citaActualizada,
      message: 'Cita actualizada exitosamente',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error actualizando cita:', error)
    
    if (error.message.includes('ya tiene una cita')) {
      return NextResponse.json({
        success: false,
        error: 'Conflicto de horario: El paciente ya tiene una cita en ese horario',
        timestamp: new Date().toISOString()
      }, { status: 409 })
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Error actualizando cita',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID de cita requerido',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    console.log('📅 Eliminando cita:', id)
    
    // Verificar que la cita existe
    const cita = await citasService.obtenerCita(id)
    
    if (!cita) {
      return NextResponse.json({
        success: false,
        error: 'Cita no encontrada',
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    // Eliminar cita
    const eliminada = await citasService.eliminarCita(id)

    if (eliminada) {
      return NextResponse.json({
        success: true,
        message: 'Cita eliminada exitosamente',
        data: {
          cita_id: id,
          paciente: `${cita.paciente?.nombre} ${cita.paciente?.apellido}`,
          fecha: cita.fecha,
          hora: cita.hora_inicio
        },
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'No se pudo eliminar la cita',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error eliminando cita:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error eliminando cita',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Endpoint para cambiar estado específico
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { action, notas } = body

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Acción requerida (cancelar, completar, no_asistio)',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    console.log(`📅 ${action} cita:`, id)
    
    let resultado
    switch (action) {
      case 'cancelar':
        resultado = await citasService.cancelarCita(id, notas)
        break
      case 'completar':
        resultado = await citasService.completarCita(id, notas)
        break
      case 'no_asistio':
        resultado = await citasService.marcarNoAsistio(id)
        break
      default:
        return NextResponse.json({
          success: false,
          error: 'Acción no válida',
          timestamp: new Date().toISOString()
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: resultado,
      message: `Cita ${action} exitosamente`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`Error en acción de cita:`, error)
    return NextResponse.json({
      success: false,
      error: error.message || `Error ${body.action}ing cita`,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}