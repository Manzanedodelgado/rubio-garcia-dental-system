import { supabase } from '@/lib/supabase'
import type { WhatsAppMessage } from '@/types'

export interface WhatsAppConfig {
  host: string
  dbUrl: string
}

class WhatsAppService {
  private config: WhatsAppConfig
  private isConnected: boolean = false

  constructor() {
    this.config = {
      host: process.env.WHATSAPP_BAILEYS_HOST || 'http://192.168.1.34:3001',
      dbUrl: process.env.WHATSAPP_WORKER_DB_URL || ''
    }
  }

  // Verificar conexión con WhatsApp Worker
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.host}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      this.isConnected = response.ok
      return response.ok
    } catch (error) {
      console.error('Error verificando conexión WhatsApp:', error)
      this.isConnected = false
      return false
    }
  }

  // Obtener mensajes urgentes
  async getUrgentMessages(): Promise<WhatsAppMessage[]> {
    try {
      const response = await fetch(`${this.config.host}/messages/urgent`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const messages = await response.json()
      return messages.map((msg: any) => this.mapToType(msg))
    } catch (error) {
      console.error('Error obteniendo mensajes urgentes:', error)
      return []
    }
  }

  // Enviar mensaje
  async sendMessage(telefono: string, mensaje: string, tipo: 'text' | 'image' | 'document' = 'text'): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.host}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: telefono,
          message: mensaje,
          type: tipo
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Guardar mensaje en Supabase
      await this.saveMessageToSupabase({
        telefono,
        mensaje,
        tipo: 'saliente',
        estado: result.status || 'enviado',
        requiere_respuesta: false
      })

      return true
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      return false
    }
  }

  // Analizar mensaje con IA para detectar urgencias
  async analyzeMessageWithAI(mensaje: string): Promise<{
    isUrgent: boolean
    summary: string
    urgencyLevel: 'low' | 'medium' | 'high'
  }> {
    try {
      const llmHost = process.env.LLM_HOST || 'http://192.168.1.34:11434'
      
      const response = await fetch(`${llmHost}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3',
          prompt: `
Analiza este mensaje de WhatsApp de un paciente dental y determina si es urgente:

Mensaje: "${mensaje}"

Responde ÚNICAMENTE en formato JSON:
{
  "isUrgent": true/false,
  "summary": "resumen de la urgencia en 1-2 líneas",
  "urgencyLevel": "low/medium/high"
}

Considera urgente si:
- Dolor severo
- Sangrado
- Emergencia después de cirugía
- Pérdida de pieza
- Fiebre o síntomas sistémicos
        `,
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const aiResponse = JSON.parse(result.response)
      
      return {
        isUrgent: aiResponse.isUrgent,
        summary: aiResponse.summary,
        urgencyLevel: aiResponse.urgencyLevel
      }
    } catch (error) {
      console.error('Error analizando mensaje con IA:', error)
      // Análisis básico de urgencia por palabras clave
      const urgentKeywords = ['dolor', 'urgente', 'sangra', 'sangrado', 'emergency', 'fiebre', 'severo']
      const isUrgent = urgentKeywords.some(keyword => 
        mensaje.toLowerCase().includes(keyword)
      )
      
      return {
        isUrgent,
        summary: isUrgent ? 'Paciente reporta síntomas que requieren atención inmediata' : 'Mensaje normal',
        urgencyLevel: isUrgent ? 'medium' : 'low'
      }
    }
  }

  // Procesar mensaje entrante
  async processIncomingMessage(telefono: string, mensaje: string): Promise<void> {
    try {
      // Analizar mensaje con IA
      const analysis = await this.analyzeMessageWithAI(mensaje)
      
      // Determinar si el contacto es paciente existente
      const pacienteId = await this.findPacienteByPhone(telefono)
      
      // Guardar mensaje
      const messageId = await this.saveMessageToSupabase({
        telefono,
        mensaje,
        tipo: 'entrante',
        estado: analysis.isUrgent ? 'urgente' : 'pendiente',
        paciente_id: pacienteId || undefined,
        requiere_respuesta: analysis.isUrgent,
        resumen_urgencia: analysis.summary
      })

      // Si es urgente, crear notificación
      if (analysis.isUrgent) {
        await this.createUrgentNotification(messageId, telefono, analysis)
      }

      // Crear o actualizar contacto si no existe
      if (!pacienteId) {
        await this.createContactFromMessage(telefono, mensaje)
      }

    } catch (error) {
      console.error('Error procesando mensaje entrante:', error)
    }
  }

  // Obtener conversaciones de un número
  async getConversations(telefono: string): Promise<WhatsAppMessage[]> {
    try {
      const response = await fetch(`${this.config.host}/messages/conversation/${telefono}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const messages = await response.json()
      return messages.map((msg: any) => this.mapToType(msg))
    } catch (error) {
      console.error('Error obteniendo conversaciones:', error)
      return []
    }
  }

  // Enviar recordatorio de cita
  async sendAppointmentReminder(cita: any, paciente: any): Promise<boolean> {
    const mensaje = `
¡Hola ${paciente.nombre}! 

Te recordamos tu cita para ${cita.tratamiento}:

📅 Fecha: ${new Date(cita.fecha).toLocaleDateString('es-ES')}
⏰ Hora: ${cita.hora_inicio}
👨‍⚕️ Doctor: ${cita.doctor?.nombre} ${cita.doctor?.apellido}

📍 Clínica Rubio García Dental
📞 Tel: 916 410 841

¿Podrías confirmar tu asistencia respondiendo con SÍ o NO?

¡Gracias!
    `.trim()

    return await this.sendMessage(paciente.telefono_movil, mensaje)
  }

  // Enviar documento firmado
  async sendSignedDocument(contacto: any, documentoUrl: string, titulo: string): Promise<boolean> {
    const mensaje = `Hola ${contacto.nombre}, te enviamos el documento "${titulo}" para tu firma.`

    return await this.sendMessage(contacto.telefono, mensaje, 'document')
  }

  // Buscar paciente por teléfono
  private async findPacienteByPhone(telefono: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('id')
        .or(`telefono_movil.eq.${telefono},telefono_fijo.eq.${telefono}`)
        .eq('estado', 'activo')
        .single()

      if (error || !data) return null
      return data.id
    } catch (error) {
      console.error('Error buscando paciente por teléfono:', error)
      return null
    }
  }

  // Guardar mensaje en Supabase
  private async saveMessageToSupabase(message: Omit<WhatsAppMessage, 'id' | 'fecha_envio'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .insert({
          ...message,
          fecha_envio: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      console.error('Error guardando mensaje en Supabase:', error)
      throw error
    }
  }

  // Crear notificación urgente
  private async createUrgentNotification(messageId: string, telefono: string, analysis: any): Promise<void> {
    try {
      // Esto podría ser implementado como una tabla de notificaciones
      // o como un sistema de alertas en tiempo real
      console.log(`🚨 Notificación urgente creada: ${telefono} - ${analysis.summary}`)
      
      // Aquí podrías enviar una notificación push al equipo médico
      // o crear una alerta en el dashboard
    } catch (error) {
      console.error('Error creando notificación urgente:', error)
    }
  }

  // Crear contacto desde mensaje
  private async createContactFromMessage(telefono: string, mensaje: string): Promise<void> {
    try {
      // Extraer nombre del mensaje o usar "Nuevo Contacto"
      const nombre = this.extractNameFromMessage(mensaje) || 'Nuevo Contacto'
      
      await supabase
        .from('contactos')
        .insert({
          nombre,
          apellido: '',
          telefono,
          email: '',
          tipo: 'prospecto',
          origen: 'whatsapp',
          ultima_interaccion: new Date().toISOString(),
          notas: mensaje.substring(0, 200)
        })
    } catch (error) {
      console.error('Error creando contacto:', error)
    }
  }

  private extractNameFromMessage(mensaje: string): string | null {
    // Lógica simple para extraer nombre del mensaje
    const namePatterns = [
      /me llamo (.+?)[,\s]/i,
      /mi nombre es (.+?)[,\s]/i,
      /^Hola[,\s]*soy (.+?)[,\s]/i
    ]

    for (const pattern of namePatterns) {
      const match = mensaje.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }
    
    return null
  }

  private mapToType(msg: any): WhatsAppMessage {
    return {
      id: msg.id || msg._id,
      telefono: msg.telefono || msg.from,
      mensaje: msg.mensaje || msg.message,
      tipo: msg.tipo || msg.type,
      estado: msg.estado || msg.status,
      fecha_envio: msg.fecha_envio || msg.timestamp,
      paciente_id: msg.paciente_id,
      requiere_respuesta: msg.requiere_respuesta || false,
      resumen_urgencia: msg.resumen_urgencia
    }
  }
}

export const whatsappService = new WhatsAppService()
export default WhatsAppService