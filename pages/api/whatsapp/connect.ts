/**
 * API ROUTE - WHATSAPP CONEXIÓN
 * 
 * Maneja la conexión y configuración de WhatsApp Baileys
 * 
 * ENDPOINTS:
 * - GET /api/whatsapp/connect - Obtener estado de conexión
 * - POST /api/whatsapp/connect - Iniciar conexión
 * - DELETE /api/whatsapp/connect - Desconectar
 */

import { NextRequest, NextResponse } from 'next/server'
import { whatsappBaileysService } from '@/services/supabase-whatsapp'

export async function GET(request: NextRequest) {
  try {
    const estado = whatsappBaileysService.obtenerEstadoConexion()
    
    return NextResponse.json({
      success: true,
      data: estado,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error obteniendo estado WhatsApp:', error)
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo estado de conexión',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 Iniciando conexión WhatsApp...')
    
    // Iniciar conexión
    const estado = await whatsappBaileysService.iniciarConexion()
    
    return NextResponse.json({
      success: true,
      data: estado,
      message: estado.conectado ? 'Conexión establecida' : 'Iniciando proceso de conexión',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error iniciando conexión WhatsApp:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error iniciando conexión',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🔌 Desconectando WhatsApp...')
    
    await whatsappBaileysService.desconectar()
    
    return NextResponse.json({
      success: true,
      message: 'WhatsApp desconectado exitosamente',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error desconectando WhatsApp:', error)
    return NextResponse.json({
      success: false,
      error: 'Error desconectando WhatsApp',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}