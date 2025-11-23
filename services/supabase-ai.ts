/**
 * SERVICIO AI - MEJORADO PARA WHATSAPP Y APLICACIÓN
 * 
 * AI conversacional mejorado con integración completa
 * 
 * FUNCIONALIDADES:
 * - Respuestas contextuales en WhatsApp
 * - Análisis de sentimientos
 * - Sugerencias de tratamientos
 * - Triage automático de urgencias
 * - Respuestas personalizadas por paciente
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface AIRequest {
  mensaje: string
  paciente?: any
  telefono?: string
  contexto: 'whatsapp_bot' | 'chat_web' | 'analisis_urgencia' | 'sugerencias'
  historial?: string[]
}

export interface AIResponse {
  respuesta: string
  sentimiento?: 'positivo' | 'negativo' | 'neutro'
  urgencia?: 'baja' | 'media' | 'alta' | 'critica'
  sugerencias?: string[]
  requiere_accion?: boolean
  confianza?: number
}

export interface ContextoPaciente {
  nombre: string
  apellido: string
  tratamientos_previos?: string[]
  proximas_citas?: string[]
  preferencias_comunicacion?: string
  historial_medico?: string
}

class AIService {
  private supabase: SupabaseClient
  private ollamaHost: string
  private model: string = 'llama3:8b'
  private conversacionesCache: Map<string, any[]> = new Map()

  constructor() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6dGlhdmNmZnV3ZGhraGh4eXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgzODA2NCwiZXhwIjoyMDc5NDE0MDY0fQ.zpnJxrWcPNJZjjRsgyQ_8lzVxBe-aGmhVQGMCKUC_bw'
    
    this.supabase = createClient(
      'https://yztiavcffuwdhkhhxypb.supabase.co',
      serviceRoleKey
    )

    this.ollamaHost = process.env.LLM_HOST || 'http://192.168.1.34:11434'
    console.log('🤖 Servicio AI inicializado')
  }

  /**
   * Generar respuesta para WhatsApp
   */
  async generarRespuestaWhatsApp(request: AIRequest): Promise<string> {
    try {
      console.log('🤖 Generando respuesta WhatsApp...')
      
      const contextoCompleto = await this.construirContextoWhatsApp(request)
      const prompt = this.construirPromptWhatsApp(request, contextoCompleto)
      
      // Generar respuesta con AI
      const respuesta = await this.consultarOllama(prompt)
      
      // Analizar sentimiento y urgencia
      const analisis = await this.analizarMensaje(request.mensaje)
      
      // Guardar en historial de conversación
      await this.guardarEnHistorial(request.telefono!, request.mensaje, respuesta)
      
      console.log('✅ Respuesta WhatsApp generada:', respuesta.substring(0, 50) + '...')
      return respuesta

    } catch (error) {
      console.error('❌ Error generando respuesta WhatsApp:', error)
      return this.generarRespuestaFallback(request.contexto)
    }
  }

  /**
   * Análisis de urgencia automática
   */
  async analizarUrgencia(mensaje: string): Promise<{ urgencia: AIResponse['urgencia'], motivo: string }> {
    try {
      console.log('🚨 Analizando urgencia del mensaje...')
      
      const palabrasUrgentes = {
        critica: ['emergencia', 'dolor', 'sangrado', 'accidente', 'trauma', 'grave'],
        alta: ['dolor fuerte', 'muy mal', 'horrible', 'insoportable', 'no puedo'],
        media: ['molestias', 'un poco de dolor', 'molesta', 'incómodo'],
        baja: ['duda', 'pregunta', 'información', 'consulta']
      }

      const mensajeLower = mensaje.toLowerCase()
      
      for (const [nivel, palabras] of Object.entries(palabrasUrgentes)) {
        if (palabras.some(palabra => mensajeLower.includes(palabra))) {
          const motivo = `Palabras detectadas: ${palabras.filter(p => mensajeLower.includes(p)).join(', ')}`
          return { urgencia: nivel as AIResponse['urgencia'], motivo }
        }
      }

      return { urgencia: 'baja', motivo: 'Sin indicadores de urgencia' }

    } catch (error) {
      console.error('❌ Error analizando urgencia:', error)
      return { urgencia: 'baja', motivo: 'Error en análisis' }
    }
  }

  /**
   * Sugerir tratamientos basados en síntomas
   */
  async sugerirTratamientos(sintomas: string, historial?: string): Promise<string[]> {
    try {
      console.log('💊 Sugiriendo tratamientos...')
      
      const prompt = `
Como dentista profesional, analiza estos síntomas y sugiere 3-5 posibles tratamientos:

Síntomas: ${sintomas}
Historial: ${historial || 'No especificado'}

Responde SOLO con una lista de tratamientos separados por comas.
Ejemplo: "Empastes de amalgama, Tratamiento de conducto, Extracción dental, Corona de porcelana, Blanqueamiento dental"
      `.trim()

      const respuesta = await this.consultarOllama(prompt)
      const tratamientos = respuesta.split(',').map(t => t.trim()).filter(t => t.length > 0)
      
      console.log('💊 Tratamientos sugeridos:', tratamientos)
      return tratamientos.slice(0, 5) // Máximo 5 tratamientos

    } catch (error) {
      console.error('❌ Error sugiriendo tratamientos:', error)
      return [
        'Consulta de diagnóstico',
        'Radiografía dental',
        'Limpieza profesional',
        'Empastes',
        'Revisión general'
      ]
    }
  }

  /**
   * Generar mensaje de seguimiento automático
   */
  async generarMensajeSeguimiento(tipo: 'post_tratamiento' | 'recordatorio_cita' | 'checkup', datos: any): Promise<string> {
    try {
      console.log(`📝 Generando mensaje de ${tipo}...`)
      
      const prompts = {
        post_tratamiento: `
Genera un mensaje de seguimiento post-tratamiento dental para ${datos.nombre} ${datos.apellido}.

Tratamiento: ${datos.tratamiento}
Fecha: ${datos.fecha}
Médico: ${datos.medico}

El mensaje debe:
- Ser cálido y profesional
- Mencionar cuidados específicos
- Dar instrucciones claras
- Sugerir seguimiento si necesario
- Máximo 150 palabras
        `.trim(),

        recordatorio_cita: `
Genera un recordatorio de cita dental para ${datos.nombre} ${datos.apellido}.

Cita: ${datos.fecha} a las ${datos.hora}
Doctor: ${datos.doctor}
Tratamiento: ${datos.tratamiento}

El mensaje debe:
- Ser amable y recordatorio
- Confirmar detalles de la cita
- Mencionar tiempo de llegada recomendado
- Sugerir preparación si necesaria
- Máximo 100 palabras
        `.trim(),

        checkup: `
Genera un mensaje de invitación para revisión dental para ${datos.nombre} ${datos.apellido}.

Última visita: ${datos.ultima_visita}
Doctor preferido: ${datos.doctor}

El mensaje debe:
- Ser preventivo y cuidado
- Mencionar importancia de revisiones regulares
- Ofrecer opciones de horario
- Ser motivador hacia la salud dental
- Máximo 120 palabras
        `.trim()
      }

      const prompt = prompts[tipo]
      const mensaje = await this.consultarOllama(prompt)
      
      console.log(`✅ Mensaje de ${tipo} generado`)
      return mensaje

    } catch (error) {
      console.error(`❌ Error generando mensaje de ${tipo}:`, error)
      
      // Mensajes fallback
      const fallbacks = {
        post_tratamiento: `Hola ${datos.nombre}, esperamos que se encuentre bien tras su tratamiento. Recuerde seguir las indicaciones del doctor y contactarnos si tiene alguna duda. ¡Que tenga un excelente día!`,
        recordatorio_cita: `Recordatorio: Tiene cita mañana ${datos.hora} con el Dr. ${datos.doctor}. Llegue 15 minutos antes. ¡Nos vemos mañana!`,
        checkup: `Hola ${datos.nombre}, es momento de su revisión dental. ¿Le viene bien agendar una cita? Estaremos encantados de atenderle.`
      }
      
      return fallbacks[tipo] || 'Gracias por contactarnos. Un miembro de nuestro equipo le responderá pronto.'
    }
  }

  /**
   * Análisis de sentimiento de conversación
   */
  async analizarSentimientoConversacion(mensajes: { tipo: 'entrante' | 'saliente', mensaje: string }[]): Promise<{
    sentimiento_general: 'positivo' | 'negativo' | 'neutro',
    confianza: number,
    razones: string[]
  }> {
    try {
      console.log('😊 Analizando sentimiento de conversación...')
      
      const mensajesTexto = mensajes.map(m => `${m.tipo === 'entrante' ? 'Paciente' : 'Clinica'}: ${m.mensaje}`).join('\n')
      
      const prompt = `
Analiza el sentimiento de esta conversación médica y responde en formato JSON:

${mensajesTexto}

Responde SOLO con JSON válido con este formato:
{
  "sentimiento": "positivo|negativo|neutro",
  "confianza": 0.0-1.0,
  "razones": ["razón1", "razón2"]
}
      `.trim()

      const respuesta = await this.consultarOllama(prompt)
      const analisis = JSON.parse(respuesta)
      
      console.log('✅ Análisis de sentimiento completado:', analisis)
      return analisis

    } catch (error) {
      console.error('❌ Error analizando sentimiento:', error)
      return {
        sentimiento_general: 'neutro',
        confianza: 0.5,
        razones: ['Análisis no disponible']
      }
    }
  }

  /**
   * Personalizar respuesta por perfil de paciente
   */
  async personalizarRespuesta(respuesta: string, paciente: ContextoPaciente): Promise<string> {
    try {
      console.log(`🎯 Personalizando respuesta para ${paciente.nombre} ${paciente.apellido}...`)
      
      // Agregar saludo personalizado
      const saludoPersonalizado = `Hola ${paciente.nombre}, `
      
      // Adaptar tono según preferencias
      const tonoAdaptado = paciente.preferencias_comunicacion?.includes('formal') 
        ? respuesta.replace(/¡Hola!/g, 'Buenos días').replace(/¡!/g, '.')
        : respuesta

      // Mencionar contexto si es relevante
      const contextoMedico = paciente.historial_medico 
        ? respuesta + `\n\nRecordando su historial médico: ${paciente.historial_medico}`
        : tonoAdaptado

      const respuestaFinal = saludoPersonalizado + contextoMedico
      
      console.log('✅ Respuesta personalizada generada')
      return respuestaFinal

    } catch (error) {
      console.error('❌ Error personalizando respuesta:', error)
      return respuesta
    }
  }

  // Métodos privados

  private async construirContextoWhatsApp(request: AIRequest): Promise<string> {
    try {
      let contexto = `Contexto de la clínica dental Rubio García:

UBICACIÓN: Madrid, España
HORARIOS: Lunes a Viernes 9:00-20:00, Sábados 9:00-14:00
SERVICIOS: Implantología, Ortodoncia, Periodoncia, Endodoncia, Estética Dental, Blanqueamiento
DOCTORES: Mario Rubio García (Implantología), Virginia Tresgallo (Ortodoncia), Irene García (Endodoncia), Juan Antonio Manzanedo (Higiene)
TELÉFONO: +34 91 123 45 67
EMAIL: info@rubiogarciadental.com

PACIENTE:`
      
      if (request.paciente) {
        contexto += `
- Nombre: ${request.paciente.nombre} ${request.paciente.apellido}
- Estado: ${request.paciente.estado}
- Preferencias: ${request.paciente.preferencias_comunicacion || 'No especificadas'}
- Última visita: ${request.paciente.updated_at ? new Date(request.paciente.updated_at).toLocaleDateString() : 'No registrada'}`
      } else {
        contexto += `
- Paciente nuevo (sin historial)
- Desconocido para el sistema`
      }

      // Agregar historial de conversación si existe
      if (request.telefono && this.conversacionesCache.has(request.telefono)) {
        const historial = this.conversacionesCache.get(request.telefono)!
        contexto += `\n\nHISTORIAL DE CONVERSACIÓN RECIENTE:\n${historial.slice(-5).map(h => `${h.tipo.toUpperCase()}: ${h.mensaje}`).join('\n')}`
      }

      return contexto

    } catch (error) {
      console.error('❌ Error construyendo contexto:', error)
      return 'Contexto de la clínica dental no disponible.'
    }
  }

  private construirPromptWhatsApp(request: AIRequest, contexto: string): string {
    return `
${contexto}

INSTRUCCIONES:
Eres un asistente virtual profesional de la clínica dental Rubio García. Tu objetivo es:

1. Responder de forma cálida, profesional y empática
2. Proporcionar información precisa sobre servicios dentales
3. Agendar citas cuando sea solicitado
4. Identificar urgencias dentales y derivarlas
5. Ofrecer consejos básicos de higiene dental
6. Dirigir a profesionales cuando sea necesario

MENSAJE DEL PACIENTE: "${request.mensaje}"

Responde como el asistente virtual, máximo 200 palabras, en español, tono profesional pero amigable.

IMPORTANTE:
- Si es una emergencia dental grave, dirige a urgencias hospitalarias
- Si solicitan cita, pregunta preferencia de horario
- Si hay dolor severo, sugiere consulta inmediata
- Siempre muestra empatía y comprensión
- Da información práctica y útil
    `.trim()
  }

  private async consultarOllama(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.ollamaHost}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 500
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Error Ollama: ${response.status}`)
      }

      const data = await response.json()
      return data.response || 'Lo siento, no pude procesar su solicitud en este momento.'

    } catch (error) {
      console.error('❌ Error consultando Ollama:', error)
      throw error
    }
  }

  private async analizarMensaje(mensaje: string): Promise<{ sentimiento: string, urgencia: string }> {
    try {
      const palabrasSentimiento = {
        positivo: ['gracias', 'perfecto', 'excelente', 'bien', 'genial', 'feliz'],
        negativo: ['dolor', 'mal', 'terrible', 'horrible', 'problema', 'preocupado']
      }

      const mensajeLower = mensaje.toLowerCase()
      let sentimiento = 'neutro'
      
      if (palabrasSentimiento.positivo.some(p => mensajeLower.includes(p))) {
        sentimiento = 'positivo'
      } else if (palabrasSentimiento.negativo.some(p => mensajeLower.includes(p))) {
        sentimiento = 'negativo'
      }

      const analisisUrgencia = await this.analizarUrgencia(mensaje)
      
      return {
        sentimiento,
        urgencia: analisisUrgencia.urgencia
      }

    } catch (error) {
      console.error('❌ Error analizando mensaje:', error)
      return {
        sentimiento: 'neutro',
        urgencia: 'baja'
      }
    }
  }

  private async guardarEnHistorial(telefono: string, mensaje: string, respuesta: string): Promise<void> {
    try {
      const historial = this.conversacionesCache.get(telefono) || []
      
      historial.push({
        tipo: 'entrante',
        mensaje,
        timestamp: new Date().toISOString()
      })
      
      historial.push({
        tipo: 'saliente',
        mensaje: respuesta,
        timestamp: new Date().toISOString()
      })

      // Mantener solo últimos 20 mensajes por conversación
      if (historial.length > 20) {
        historial.splice(0, historial.length - 20)
      }

      this.conversacionesCache.set(telefono, historial)

    } catch (error) {
      console.error('❌ Error guardando en historial:', error)
    }
  }

  private generarRespuestaFallback(contexto: string): string {
    const respuestas = {
      whatsapp_bot: 'Hola, gracias por contactarnos. Un miembro de nuestro equipo le responderá pronto. Para urgencias, llame al 91 123 45 67.',
      chat_web: 'Gracias por su mensaje. Un asistente le atenderá en breve.',
      analisis_urgencia: 'No se pudo procesar la solicitud.',
      sugerencias: 'Hubo un error técnico. Por favor, intente más tarde.'
    }

    return respuestas[contexto] || 'Gracias por contactarnos. Un miembro de nuestro equipo le responderá pronto.'
  }
}

// Instancia singleton
export const aiService = new AIService()

// Para compatibilidad con WhatsApp service
export const AI_RESPONSES = AIService

export default AIService