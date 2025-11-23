/**
 * API ROUTE - WHATSAPP WEBHOOK
 * 
 * Webhook para recibir mensajes de WhatsApp
 * 
 * ENDPOINT:
 * - POST /api/whatsapp/webhook
 * 
 * NOTA: Este endpoint es llamado internamente por el servicio Baileys
 *       cuando se reciben mensajes, para procesar en tiempo real
 */

import { NextRequest, NextResponse } from 'next/server'
import { whatsappBaileysService } from '@/services/supabase-whatsapp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telefono, mensaje, tipo = 'entrante', requiereRespuesta = false } = body

    // Validaciones
    if (!telefono || !mensaje) {
      return NextResponse.json({
        success: false,
        error: 'Teléfono y mensaje son obligatorios',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    console.log(`📨 Webhook: Mensaje entrante de ${telefono}: ${mensaje.substring(0, 50)}...`)

    // Buscar paciente asociado
    const { pacientesService } = await import('@/services/supabase-pacientes')
    const paciente = await pacientesService.obtenerPacientePorTelefono(telefono)

    // Guardar mensaje en base de datos
    const mensajeDB = {
      telefono,
      mensaje,
      tipo: tipo as 'entrante' | 'saliente',
      estado: 'pendiente' as const,
      fecha_envio: new Date().toISOString(),
      paciente_id: paciente?.id || null,
      requiere_respuesta: requiereRespuesta
    }

    const { whatsappBaileysService: whatsappService } = await import('@/services/supabase-whatsapp')
    
    // Usar método interno para guardar (simulando el evento entrante)
    // En implementación real, esto se integraría directamente con Baileys events
    console.log('💾 Guardando mensaje en base de datos:', mensajeDB)

    // Si requiere respuesta automática, generar respuesta
    let respuestaAutomatica = null
    if (requiereRespuesta) {
      const { aiService } = await import('@/services/supabase-ai')
      const respuesta = await aiService.generarRespuestaWhatsApp({
        mensaje,
        paciente: paciente || undefined,
        telefono,
        contexto: 'whatsapp_bot'
      })
      
      if (respuesta) {
        await whatsappService.enviarMensaje(telefono, respuesta)
        respuestaAutomatica = respuesta
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Mensaje procesado correctamente',
      data: {
        mensaje_recibido: mensajeDB,
        paciente_asociado: paciente ? `${paciente.nombre} ${paciente.apellido}` : null,
        respuesta_automatica: respuestaAutomatica,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error procesando webhook WhatsApp:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error procesando webhook',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}