import { supabase } from '@/lib/supabase'
import { whatsappService } from './whatsapp'
import type { Paciente, Doctor, Cita, Tratamiento } from '@/types'

export interface AIGenerationOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

class AIService {
  private llmHost: string
  private isAvailable: boolean = false

  constructor() {
    this.llmHost = process.env.LLM_HOST || 'http://192.168.1.34:11434'
    this.checkAvailability()
  }

  private async checkAvailability(): Promise<void> {
    try {
      const response = await fetch(`${this.llmHost}/api/tags`)
      this.isAvailable = response.ok
      console.log(this.isAvailable ? '✅ IA/Ollama disponible' : '❌ IA/Ollama no disponible')
    } catch (error) {
      console.log('❌ IA/Ollama no disponible')
      this.isAvailable = false
    }
  }

  // Generar respuesta usando IA local
  async generateResponse(
    messages: ChatMessage[], 
    options: AIGenerationOptions = {}
  ): Promise<string> {
    if (!this.isAvailable) {
      return 'Lo siento, el servicio de IA no está disponible en este momento.'
    }

    try {
      const lastMessage = messages[messages.length - 1]
      const systemPrompt = this.getSystemPrompt()
      
      const response = await fetch(`${this.llmHost}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || 'llama3',
          prompt: `${systemPrompt}\n\nUsuario: ${lastMessage.content}\nAsistente:`,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            num_predict: options.maxTokens || 500
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.response || 'No pude generar una respuesta.'
    } catch (error) {
      console.error('Error generando respuesta IA:', error)
      return 'Disculpa, hay un problema con el servicio de IA.'
    }
  }

  // Analizar mensaje de WhatsApp para determinar urgencia y tipo
  async analyzePatientMessage(mensaje: string): Promise<{
    isUrgent: boolean
    urgencyLevel: 'low' | 'medium' | 'high'
    category: 'pain' | 'emergency' | 'question' | 'booking' | 'other'
    response: string
    recommendedActions: string[]
  }> {
    try {
      if (!this.isAvailable) {
        // Fallback a análisis básico
        return this.basicMessageAnalysis(mensaje)
      }

      const prompt = `
Analiza este mensaje de un paciente dental y proporciona información detallada:

Mensaje: "${mensaje}"

Responde ÚNICAMENTE en formato JSON:
{
  "isUrgent": true/false,
  "urgencyLevel": "low/medium/high",
  "category": "pain/emergency/question/booking/other",
  "response": "Respuesta sugerida para enviar al paciente",
  "recommendedActions": ["acción1", "acción2", "acción3"]
}

Categorías:
- pain: Dolor o molestias
- emergency: Emergencia médica (sangrado, fiebre, etc.)
- question: Pregunta sobre tratamientos o citas
- booking: Solicitud de cita
- other: Otros temas

Urgencia: high (dolor severo, sangrado, fiebre), medium (dolor leve, molestias), low (consultas generales)
      `

      const response = await fetch(`${this.llmHost}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3',
          prompt,
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const aiResponse = JSON.parse(result.response)
      
      return aiResponse
    } catch (error) {
      console.error('Error analizando mensaje con IA:', error)
      return this.basicMessageAnalysis(mensaje)
    }
  }

  // Generar respuesta automática para consultas
  async generateAutoResponse(
    paciente: Paciente,
    consulta: string,
    contexto?: any
  ): Promise<string> {
    try {
      const clinicInfo = await this.getClinicInfo()
      
      const prompt = `
Eres el asistente de la Clínica Dental Rubio García. Responde de manera profesional y amable a la consulta del paciente.

Información de la clínica:
- Nombre: ${clinicInfo.nombre}
- Especialidad: ${clinicInfo.especialidad}
- Teléfono: ${clinicInfo.telefono}
- Dirección: ${clinicInfo.direccion}
- Horarios: ${clinicInfo.horarios}

Información del paciente:
- Nombre: ${paciente.nombre} ${paciente.apellido}
- Teléfono: ${paciente.telefono_movil}

Consulta del paciente: "${consulta}"

${contexto ? `Contexto adicional: ${JSON.stringify(contexto)}` : ''}

Responde de manera útil, profesional y amigable. Si la consulta requiere atención médica, deriva a que contacten directamente con la clínica.
      `

      return await this.generateResponse([{ role: 'user', content: prompt }])
    } catch (error) {
      console.error('Error generando respuesta automática:', error)
      return `Hola ${paciente.nombre}, gracias por tu consulta. Para una respuesta más detallada, te recomendamos contactar directamente con la clínica al ${process.env.ADMIN_EMAIL || 'info@rubiogarciadental.com'}.`
    }
  }

  // Generar contenido para documentos
  async generateDocumentContent(
    template: string,
    variables: Record<string, any>
  ): Promise<string> {
    try {
      const prompt = `
Genera el contenido para el siguiente documento usando las variables proporcionadas:

Plantilla: ${template}
Variables: ${JSON.stringify(variables, null, 2)}

Genera el contenido completo del documento manteniendo el tono profesional apropiado para una clínica dental.
      `

      return await this.generateResponse([{ role: 'user', content: prompt }])
    } catch (error) {
      console.error('Error generando contenido de documento:', error)
      throw error
    }
  }

  // Análisis de sentimientos para mensajes de pacientes
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral'
    confidence: number
    emotions: string[]
  }> {
    try {
      if (!this.isAvailable) {
        return this.basicSentimentAnalysis(text)
      }

      const prompt = `
Analiza el sentimiento y emociones en este mensaje de un paciente dental:

"${text}"

Responde ÚNICAMENTE en formato JSON:
{
  "sentiment": "positive/negative/neutral",
  "confidence": 0.0-1.0,
  "emotions": ["emoción1", "emoción2"]
}
      `

      const response = await fetch(`${this.llmHost}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3',
          prompt,
          stream: false
        })
      })

      const result = await response.json()
      return JSON.parse(result.response)
    } catch (error) {
      console.error('Error analizando sentimiento:', error)
      return this.basicSentimentAnalysis(text)
    }
  }

  // Recomendaciones de tratamiento
  async generateTreatmentRecommendation(
    symptoms: string,
    patientHistory: any
  ): Promise<{
    likelyDiagnosis: string
    recommendedTreatments: string[]
    urgency: 'low' | 'medium' | 'high'
    nextSteps: string[]
  }> {
    try {
      if (!this.isAvailable) {
        return {
          likelyDiagnosis: 'Consulta requerida',
          recommendedTreatments: ['Consulta presencial'],
          urgency: 'medium',
          nextSteps: ['Contactar clínica', 'Programar cita']
        }
      }

      const prompt = `
Como experto odontólogo, analiza estos síntomas y proporciona recomendaciones:

Síntomas: "${symptoms}"
Historial del paciente: ${JSON.stringify(patientHistory, null, 2)}

IMPORTANTE: Esto es para asistencia, NO reemplaza diagnóstico médico real.

Responde ÚNICAMENTE en formato JSON:
{
  "likelyDiagnosis": "diagnóstico probable",
  "recommendedTreatments": ["tratamiento1", "tratamiento2"],
  "urgency": "low/medium/high",
  "nextSteps": ["paso1", "paso2"]
}
      `

      const response = await fetch(`${this.llmHost}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3',
          prompt,
          stream: false
        })
      })

      const result = await response.json()
      return JSON.parse(result.response)
    } catch (error) {
      console.error('Error generando recomendación:', error)
      throw error
    }
  }

  // Chat con agente IA
  async chatWithAgent(
    message: string,
    userContext: {
      userId: string
      userType: 'patient' | 'staff'
      currentPage?: string
      patientData?: Paciente
    }
  ): Promise<{
    response: string
    suggestions: string[]
    actions: string[]
  }> {
    try {
      const contextPrompt = `
Contexto del usuario:
- Tipo: ${userContext.userType}
- Página actual: ${userContext.currentPage || 'No especificada'}
${userContext.patientData ? `- Datos del paciente: ${JSON.stringify(userContext.patientData)}` : ''}

Usuario: "${message}"

Proporciona una respuesta útil y relevante para el contexto.
      `

      const response = await this.generateResponse([
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: contextPrompt }
      ])

      // Extraer sugerencias y acciones del contexto
      const suggestions = await this.generateSuggestions(message, userContext)
      const actions = await this.generateActions(message, userContext)

      return {
        response,
        suggestions,
        actions
      }
    } catch (error) {
      console.error('Error en chat con agente:', error)
      return {
        response: 'Lo siento, hay un problema con el asistente IA.',
        suggestions: ['Contactar clínica', 'Reintentar'],
        actions: []
      }
    }
  }

  // Procesamiento de voz a texto (placeholder)
  async processVoiceInput(audioBuffer: Buffer): Promise<string> {
    // Implementación placeholder para speech-to-text
    // En producción usarías servicios como Whisper
    return 'Análisis de voz no implementado aún'
  }

  // Texto a voz
  async generateVoiceResponse(text: string): Promise<Buffer> {
    // Implementación placeholder para text-to-speech
    // En producción usarías servicios como OpenAI TTS
    return Buffer.from([])
  }

  // Métodos auxiliares privados
  private getSystemPrompt(): string {
    return `Eres el asistente inteligente de la Clínica Dental Rubio García, especializada en Implantología y Estética de Vanguardia.

Tu función es:
- Asistir a pacientes y personal de la clínica
- Responder consultas sobre tratamientos, horarios y servicios
- Proporcionar información relevante sobre la clínica
- Derivar casos urgentes al personal médico cuando sea necesario
- Mantener siempre un tono profesional y amigable

Información de la clínica:
- Ubicación: Madrid
- Especialidades: Implantología, Estética Dental, Ortodoncia, Endodoncia
- Horarios: L-J 10:00-14:00 y 16:00-20:00, V 10:00-14:00
- Contacto: 916 410 841

Siempre sé preciso, profesional y útil. Si no puedes responder una pregunta específica, deriva al personal de la clínica.`
  }

  private async getClinicInfo(): Promise<any> {
    const { data } = await supabase
      .from('clinica_config')
      .select('*')
      .single()
    
    return data || {
      nombre: 'Rubio García Dental',
      especialidad: 'Implantología y Estética de Vanguardia',
      telefono: '916 410 841',
      direccion: 'Calle Mayor 19, 28921 Alcorcón, Madrid',
      horarios: 'L-J 10:00-14:00 y 16:00-20:00, V 10:00-14:00'
    }
  }

  private async generateSuggestions(message: string, context: any): Promise<string[]> {
    // Lógica simple para generar sugerencias
    const suggestions = []
    
    if (message.toLowerCase().includes('cita')) {
      suggestions.push('Programar nueva cita')
      suggestions.push('Ver mis citas')
    }
    
    if (message.toLowerCase().includes('dolor')) {
      suggestions.push('Ver disponibilidad urgencias')
      suggestions.push('Contactar clínica')
    }
    
    return suggestions
  }

  private async generateActions(message: string, context: any): Promise<string[]> {
    const actions = []
    
    if (message.toLowerCase().includes('ayuda')) {
      actions.push('mostrar_ayuda')
    }
    
    if (message.toLowerCase().includes('emergencia')) {
      actions.push('contactar_urgencias')
    }
    
    return actions
  }

  private basicMessageAnalysis(mensaje: string) {
    const urgentKeywords = ['dolor', 'sangra', 'sangrado', 'urgente', 'emergency', 'fiebre', 'severo']
    const isUrgent = urgentKeywords.some(keyword => 
      mensaje.toLowerCase().includes(keyword)
    )

    let category = 'other'
    if (mensaje.toLowerCase().includes('cita') || mensaje.toLowerCase().includes('agenda')) {
      category = 'booking'
    } else if (mensaje.toLowerCase().includes('?')) {
      category = 'question'
    }

    return {
      isUrgent,
      urgencyLevel: isUrgent ? 'medium' : 'low',
      category: category as any,
      response: 'Gracias por tu mensaje. Te contactaremos pronto.',
      recommendedActions: isUrgent ? ['contactar_clinica'] : ['responder_normal']
    }
  }

  private basicSentimentAnalysis(text: string) {
    const positiveWords = ['bien', 'bueno', 'excelente', 'gracias', 'perfecto']
    const negativeWords = ['mal', 'dolor', 'problema', 'urgente', 'malo']
    
    const positiveCount = positiveWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length
    
    const negativeCount = negativeWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
    if (positiveCount > negativeCount) sentiment = 'positive'
    else if (negativeCount > positiveCount) sentiment = 'negative'
    
    return {
      sentiment,
      confidence: Math.max(positiveCount, negativeCount) / text.length,
      emotions: sentiment === 'positive' ? ['satisfacción'] : sentiment === 'negative' ? ['preocupación'] : ['neutral']
    }
  }
}

export const aiService = new AIService()
export default AIService