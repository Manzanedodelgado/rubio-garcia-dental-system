/**
 * API ROUTE - WHATSAPP ENVIAR MENSAJE
 * 
 * Envío de mensajes WhatsApp individuales
 * 
 * ENDPOINT:
 * - POST /api/whatsapp/send-message
 * 
 * BODY:
 * {
 *   "telefono": "34123456789",
 *   "mensaje": "Hola, su cita está confirmada",
 *   "mediaUrl": "optional_url"
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { whatsappBaileysService } from '@/services/supabase-whatsapp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telefono, mensaje, mediaUrl } = body

    // Validaciones
    if (!telefono || !mensaje) {
      return NextResponse.json({
        success: false,
        error: 'Teléfono y mensaje son obligatorios',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Validar formato de teléfono (básico)
    const telefonoLimpio = telefono.replace(/\D/g, '')
    if (telefonoLimpio.length < 9 || telefonoLimpio.length > 15) {
      return NextResponse.json({
        success: false,
        error: 'Formato de teléfono inválido',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    console.log(`📤 Enviando mensaje WhatsApp a ${telefonoLimpio}: ${mensaje.substring(0, 50)}...`)
    
    // Enviar mensaje
    const enviado = await whatsappBaileysService.enviarMensaje(telefonoLimpio, mensaje, mediaUrl)

    if (enviado) {
      return NextResponse.json({
        success: true,
        message: 'Mensaje enviado exitosamente',
        data: {
          telefono: telefonoLimpio,
          mensaje,
          mediaUrl: mediaUrl || null,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'No se pudo enviar el mensaje. Verifique la conexión.',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error enviando mensaje WhatsApp:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error enviando mensaje',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}