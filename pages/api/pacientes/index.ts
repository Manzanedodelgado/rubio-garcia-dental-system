/**
 * API ROUTE - PACIENTES
 * 
 * Gestión completa de pacientes usando Supabase
 * 
 * ENDPOINTS:
 * - GET /api/pacientes - Buscar/filtrar pacientes
 * - GET /api/pacientes/[id] - Obtener paciente específico
 * - POST /api/pacientes - Crear nuevo paciente
 * - PUT /api/pacientes/[id] - Actualizar paciente
 * - DELETE /api/pacientes/[id] - Eliminar paciente (soft delete)
 * - GET /api/pacientes/estadisticas - Obtener estadísticas
 */

import { NextRequest, NextResponse } from 'next/server'
import { pacientesService, FiltrosPacientes } from '@/services/supabase-pacientes'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extraer filtros de la query string
    const filtros: FiltrosPacientes = {
      busqueda: searchParams.get('busqueda') || undefined,
      estado: searchParams.get('estado') as any || null,
      fecha_desde: searchParams.get('fecha_desde') || undefined,
      fecha_hasta: searchParams.get('fecha_hasta') || undefined,
      offset: parseInt(searchParams.get('offset') || '0'),
      limite: parseInt(searchParams.get('limite') || '20')
    }

    console.log('🔍 Buscando pacientes con filtros:', filtros)
    
    const resultado = await pacientesService.buscarPacientes(filtros)

    return NextResponse.json({
      success: true,
      data: {
        pacientes: resultado.pacientes,
        total: resultado.total,
        tiene_mas: resultado.tiene_mas,
        filtros_aplicados: filtros
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error buscando pacientes:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error buscando pacientes',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const pacienteData = await request.json()

    console.log('👥 Creando nuevo paciente:', pacienteData.nombre, pacienteData.apellido)
    
    // Validar datos del paciente
    const validacion = pacientesService.validarDatosPaciente(pacienteData)
    
    if (!validacion.valido) {
      return NextResponse.json({
        success: false,
        error: 'Datos del paciente inválidos',
        detalles: validacion.errores,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Verificar que no exista paciente con mismo DNI
    const existeDNI = await pacientesService.existePacienteConDNI(pacienteData.dni)
    
    if (existeDNI) {
      return NextResponse.json({
        success: false,
        error: 'Ya existe un paciente con ese DNI',
        timestamp: new Date().toISOString()
      }, { status: 409 })
    }

    // Crear paciente
    const pacienteCreado = await pacientesService.crearPaciente(pacienteData)

    return NextResponse.json({
      success: true,
      data: pacienteCreado,
      message: 'Paciente creado exitosamente',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error creando paciente:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error creando paciente',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}