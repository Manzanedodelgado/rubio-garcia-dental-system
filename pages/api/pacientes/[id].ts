/**
 * API ROUTE - PACIENTE ESPECÍFICO
 * 
 * Operaciones CRUD para un paciente específico
 * 
 * ENDPOINTS:
 * - GET /api/pacientes/[id] - Obtener paciente específico
 * - PUT /api/pacientes/[id] - Actualizar paciente
 * - DELETE /api/pacientes/[id] - Eliminar paciente (soft delete)
 * - POST /api/pacientes/[id]/reactivar - Reactivar paciente
 */

import { NextRequest, NextResponse } from 'next/server'
import { pacientesService } from '@/services/supabase-pacientes'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID de paciente requerido',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    console.log('👥 Obteniendo paciente:', id)
    
    const paciente = await pacientesService.obtenerPaciente(id)

    if (!paciente) {
      return NextResponse.json({
        success: false,
        error: 'Paciente no encontrado',
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: paciente,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error obteniendo paciente:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error obteniendo paciente',
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
        error: 'ID de paciente requerido',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    console.log('👥 Actualizando paciente:', id)
    
    // Validar datos de actualización
    const validacion = pacientesService.validarDatosPaciente({ ...updates })
    
    if (!validacion.valido) {
      return NextResponse.json({
        success: false,
        error: 'Datos de actualización inválidos',
        detalles: validacion.errores,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Si se actualiza DNI, verificar que no exista otro paciente
    if (updates.dni) {
      const existeDNI = await pacientesService.existePacienteConDNI(updates.dni, id)
      
      if (existeDNI) {
        return NextResponse.json({
          success: false,
          error: 'Ya existe otro paciente con ese DNI',
          timestamp: new Date().toISOString()
        }, { status: 409 })
      }
    }

    // Actualizar paciente
    const pacienteActualizado = await pacientesService.actualizarPaciente(id, updates)

    return NextResponse.json({
      success: true,
      data: pacienteActualizado,
      message: 'Paciente actualizado exitosamente',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error actualizando paciente:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error actualizando paciente',
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
        error: 'ID de paciente requerido',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    console.log('👥 Eliminando paciente:', id)
    
    // Verificar que el paciente existe
    const paciente = await pacientesService.obtenerPaciente(id)
    
    if (!paciente) {
      return NextResponse.json({
        success: false,
        error: 'Paciente no encontrado',
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    // Verificar que no tenga citas futuras (opcional - se puede configurar)
    // Por ahora, proceder con eliminación directa

    // Soft delete: cambiar estado a inactivo
    const eliminado = await pacientesService.eliminarPaciente(id)

    if (eliminado) {
      return NextResponse.json({
        success: true,
        message: 'Paciente eliminado exitosamente',
        data: {
          paciente_id: id,
          estado_anterior: paciente.estado,
          nuevo_estado: 'inactivo'
        },
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'No se pudo eliminar el paciente',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error eliminando paciente:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error eliminando paciente',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Endpoint separado para reactivar paciente
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { action } = await request.json()

    if (action !== 'reactivar') {
      return NextResponse.json({
        success: false,
        error: 'Acción no válida',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    console.log('👥 Reactivando paciente:', id)
    
    // Verificar que el paciente existe
    const paciente = await pacientesService.obtenerPaciente(id)
    
    if (!paciente) {
      return NextResponse.json({
        success: false,
        error: 'Paciente no encontrado',
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    if (paciente.estado === 'activo') {
      return NextResponse.json({
        success: false,
        error: 'El paciente ya está activo',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Reactivar paciente
    const pacienteReactivado = await pacientesService.reactivarPaciente(id)

    return NextResponse.json({
      success: true,
      data: pacienteReactivado,
      message: 'Paciente reactivado exitosamente',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error reactivando paciente:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error reactivando paciente',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}