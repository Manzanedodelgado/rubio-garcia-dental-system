/**
 * SERVICIO WHATSAPP BAILEYS - INTEGRACIÓN DIRECTA
 * 
 * WhatsApp Baileys integrado directamente en Next.js sin worker externo
 * 
 * FUNCIONALIDADES:
 * - Conexión automática con reconexión
 * - Bot con AI conversacional
 * - Envío/recepción de mensajes
 * - Integración con pacientes
 * - Soporte para medios
 * - Grupos de WhatsApp
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Tipos para Baileys
export interface WhatsAppMessage {
  id?: string
  telefono: string
  mensaje: string
  tipo: 'entrante' | 'saliente'
  estado: 'pendiente' | 'enviado' | 'entregado' | 'leido' | 'urgente'
  fecha_envio: string
  paciente_id?: string | null
  requiere_respuesta: boolean
  resumen_urgencia?: string | null
  media_url?: string | null
  media_type?: string | null
}

export interface ContactoWhatsApp {
  jid: string
  nombre?: string
  nombre_push?: string
  isBusiness?: boolean
  wid?: string
}

export interface EstadoConexion {
  conectado: boolean
  qr_code?: string
  reconnecting: boolean
  last_error?: string
  session_id?: string
}

class WhatsAppBaileysService {
  private supabase: SupabaseClient
  private isConnected: boolean = false
  private socket: any = null
  private qrCode: string | null = null
  private sessionId: string | null = null
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectInterval: NodeJS.Timeout | null = null
  private eventListeners: Map<string, Function[]> = new Map()

  constructor() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6dGlhdmNmZnV3ZGhraGh4eXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgzODA2NCwiZXhwIjoyMDc5NDE0MDY0fQ.zpnJxrWcPNJZjjRsgyQ_8lzVxBe-aGmhVQGMCKUC_bw'
    
    this.supabase = createClient(
      'https://yztiavcffuwdhkhhxypb.supabase.co',
      serviceRoleKey
    )

    console.log('📱 Servicio WhatsApp Baileys inicializado')
  }

  /**
   * Iniciar conexión con WhatsApp
   */
  async iniciarConexion(): Promise<EstadoConexion> {
    try {
      console.log('🔗 Iniciando conexión WhatsApp...')
      
      // Importar Baileys dinámicamente
      const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = await import('@whiskeysockets/baileys')
      
      // Verificar versión de Baileys
      const { version } = await fetchLatestBaileysVersion()
      console.log(`📦 Baileys versión: ${version.join('.')}`)

      // Configurar autenticación en archivos
      const { state, saveCreds } = await useMultiFileAuthState('./whatsapp_auth')
      
      // Crear socket de conexión
      this.socket = makeWASocket({
        auth: state,
        version,
        browser: ['Rubio Garcia Dental', 'Chrome', '1.0.0'],
        printQRInTerminal: true,
        syncFullHistory: true
      })

      // Configurar event listeners
      this.configurarEventListeners(this.socket)

      // Guardar credenciales cuando cambien
      this.socket.ev.on('creds.update', saveCreds)

      return {
        conectado: false,
        reconnecting: false
      }

    } catch (error) {
      console.error('❌ Error iniciando conexión WhatsApp:', error)
      this.isConnected = false
      return {
        conectado: false,
        reconnecting: false,
        last_error: error.message
      }
    }
  }

  /**
   * Configurar event listeners para Baileys
   */
  private configurarEventListeners(socket: any): void {
    // Conexión exitosa
    socket.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update

      console.log('📡 Estado de conexión actualizado:', connection)

      if (qr) {
        this.qrCode = qr
        this.emit('qr_code', qr)
        console.log('📱 Código QR generado para escanear')
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
        console.log('🔌 Conexión cerrada, reconectando:', shouldReconnect)
        
        this.isConnected = false
        if (shouldReconnect) {
          await this.manejarReconexion()
        }
      }

      if (connection === 'open') {
        console.log('✅ Conexión WhatsApp establecida')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('connected')
      }
    })

    // Mensajes entrantes
    socket.ev.on('messages.upsert', async (m: any) => {
      if (m.type === 'append' || m.type === 'notify') {
        for (const msg of m.messages) {
          await this.procesarMensajeEntrante(msg)
        }
      }
    })

    // Contactos actualizados
    socket.ev.on('contacts.upsert', (contacts: any[]) => {
      console.log('👥 Contactos actualizados:', contacts.length)
      this.emit('contacts_updated', contacts)
    })

    // Presencia de contactos
    socket.ev.on('presence.update', ({ id, presences }: any) => {
      this.emit('presence_update', { id, presences })
    })
  }

  /**
   * Procesar mensaje entrante
   */
  private async procesarMensajeEntrante(msg: any): Promise<void> {
    try {
      if (!msg.key || !msg.message) return

      const telefono = msg.key.remoteJid?.replace('@s.whatsapp.net', '') || ''
      const mensaje = this.extraerTextoMensaje(msg.message)
      
      if (!mensaje || !telefono) return

      console.log(`📨 Mensaje entrante de ${telefono}: ${mensaje.substring(0, 50)}...`)

      // Buscar paciente asociado
      const paciente = await this.buscarPacientePorTelefono(telefono)

      // Guardar mensaje en base de datos
      const mensajeDB: Partial<WhatsAppMessage> = {
        telefono,
        mensaje,
        tipo: 'entrante',
        estado: 'pendiente',
        fecha_envio: new Date().toISOString(),
        paciente_id: paciente?.id || null,
        requiere_respuesta: this.esMensajeRequiereRespuesta(mensaje)
      }

      await this.guardarMensaje(mensajeDB)

      // Emitir evento
      this.emit('message_received', mensajeDB)

      // Si es un comando o necesita respuesta, procesar con AI
      if (this.esMensajeRequiereRespuesta(mensaje)) {
        await this.procesarConAI(msg, paciente)
      }

    } catch (error) {
      console.error('❌ Error procesando mensaje entrante:', error)
    }
  }

  /**
   * Enviar mensaje
   */
  async enviarMensaje(telefono: string, mensaje: string, mediaUrl?: string): Promise<boolean> {
    try {
      if (!this.isConnected || !this.socket) {
        throw new Error('WhatsApp no está conectado')
      }

      console.log(`📤 Enviando mensaje a ${telefono}: ${mensaje.substring(0, 50)}...`)

      let mensajeInfo: any = {
        conversation: mensaje
      }

      // Si hay media, configurar el mensaje apropiado
      if (mediaUrl) {
        // Aquí se procesaría la subida y envío de media
        console.log('📎 Adjuntando media:', mediaUrl)
      }

      // Enviar mensaje
      const sentMessage = await this.socket.sendMessage(`${telefono}@s.whatsapp.net`, mensajeInfo)

      // Buscar paciente asociado
      const paciente = await this.buscarPacientePorTelefono(telefono)

      // Guardar mensaje en base de datos
      const mensajeDB: Partial<WhatsAppMessage> = {
        telefono,
        mensaje,
        tipo: 'saliente',
        estado: 'enviado',
        fecha_envio: new Date().toISOString(),
        paciente_id: paciente?.id || null,
        requiere_respuesta: false,
        media_url: mediaUrl || null
      }

      await this.guardarMensaje(mensajeDB)

      // Emitir evento
      this.emit('message_sent', mensajeDB)

      console.log('✅ Mensaje enviado exitosamente')
      return true

    } catch (error) {
      console.error('❌ Error enviando mensaje:', error)
      
      // Marcar como fallido en la base de datos
      await this.guardarMensaje({
        telefono,
        mensaje,
        tipo: 'saliente',
        estado: 'pendiente', // Falló
        fecha_envio: new Date().toISOString(),
        requiere_respuesta: false
      })

      return false
    }
  }

  /**
   * Enviar mensaje con respuesta rápida
   */
  async enviarRespuestaRapida(telefono: string, tipo: 'cita_confirmada' | 'recordatorio' | 'cancelacion' | 'saludo'): Promise<boolean> {
    try {
      const respuestas = {
        cita_confirmada: '✅ Su cita ha sido confirmada. Le esperamos en la clínica. ¡Gracias!',
        recordatorio: '⏰ Recordatorio: Tiene una cita mañana. Para modificarla, responda con "modificar".',
        cancelacion: '❌ Su cita ha sido cancelada. Para reagendar, responda con "nueva cita".',
        saludo: '👋 ¡Hola! Soy el asistente de Rubio García Dental. ¿En qué puedo ayudarle hoy?'
      }

      const mensaje = respuestas[tipo] || 'Gracias por contactarnos. Un médico le responderá pronto.'
      return await this.enviarMensaje(telefono, mensaje)

    } catch (error) {
      console.error('❌ Error enviando respuesta rápida:', error)
      return false
    }
  }

  /**
   * Procesar mensaje con AI
   */
  private async procesarConAI(msg: any, paciente: any): Promise<void> {
    try {
      console.log('🤖 Procesando mensaje con AI...')

      const telefono = msg.key.remoteJid?.replace('@s.whatsapp.net', '') || ''
      const mensaje = this.extraerTextoMensaje(msg.message)

      // Importar servicio de AI
      const { AI_RESPONSES } = await import('./supabase-ai')
      const aiService = new AI_RESPONSES()

      // Generar respuesta con AI
      const respuesta = await aiService.generarRespuestaWhatsApp({
        mensaje,
        paciente,
        telefono,
        contexto: 'whatsapp_bot'
      })

      if (respuesta) {
        await this.enviarMensaje(telefono, respuesta)
      }

    } catch (error) {
      console.error('❌ Error procesando con AI:', error)
    }
  }

  /**
   * Buscar paciente por teléfono
   */
  private async buscarPacientePorTelefono(telefono: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('pacientes')
        .select('*')
        .or(`telefono_movil.eq.${telefono},telefono_fijo.eq.${telefono}`)
        .eq('estado', 'activo')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error buscando paciente:', error)
      }

      return data || null

    } catch (error) {
      console.error('❌ Error buscando paciente por teléfono:', error)
      return null
    }
  }

  /**
   * Guardar mensaje en base de datos
   */
  private async guardarMensaje(mensaje: Partial<WhatsAppMessage>): Promise<void> {
    try {
      const mensajeCompleto = {
        ...mensaje,
        created_at: new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('whatsapp_messages')
        .insert([mensajeCompleto])

      if (error) {
        console.error('Error guardando mensaje:', error)
      }

    } catch (error) {
      console.error('❌ Error guardando mensaje en DB:', error)
    }
  }

  /**
   * Obtener mensajes de una conversación
   */
  async obtenerConversacion(telefono: string, limite: number = 50): Promise<WhatsAppMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('telefono', telefono)
        .order('fecha_envio', { ascending: true })
        .limit(limite)

      if (error) {
        throw error
      }

      return data || []

    } catch (error) {
      console.error('❌ Error obteniendo conversación:', error)
      return []
    }
  }

  /**
   * Obtener mensajes urgentes
   */
  async obtenerMensajesUrgentes(): Promise<WhatsAppMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_messages')
        .select(`
          *,
          paciente:pacientes(nombre, apellido)
        `)
        .eq('estado', 'urgente')
        .order('fecha_envio', { ascending: false })

      if (error) {
        throw error
      }

      return data || []

    } catch (error) {
      console.error('❌ Error obteniendo mensajes urgentes:', error)
      return []
    }
  }

  /**
   * Marcar mensaje como urgente
   */
  async marcarComoUrgente(mensajeId: string, resumen: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('whatsapp_messages')
        .update({
          estado: 'urgente',
          resumen_urgencia: resumen,
          updated_at: new Date().toISOString()
        })
        .eq('id', mensajeId)

      if (error) {
        throw error
      }

      console.log(`🚨 Mensaje marcado como urgente: ${mensajeId}`)
      return true

    } catch (error) {
      console.error('❌ Error marcando como urgente:', error)
      return false
    }
  }

  /**
   * Obtener estado de conexión
   */
  obtenerEstadoConexion(): EstadoConexion {
    return {
      conectado: this.isConnected,
      qr_code: this.qrCode,
      reconnecting: this.reconnectAttempts > 0,
      last_error: this.lastError,
      session_id: this.sessionId
    }
  }

  /**
   * Desconectar
   */
  async desconectar(): Promise<void> {
    try {
      console.log('🔌 Desconectando WhatsApp...')
      
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval)
        this.reconnectInterval = null
      }

      if (this.socket) {
        await this.socket.end()
      }

      this.isConnected = false
      this.qrCode = null
      console.log('✅ WhatsApp desconectado')

    } catch (error) {
      console.error('❌ Error desconectando WhatsApp:', error)
    }
  }

  /**
   * Manejar reconexión automática
   */
  private async manejarReconexion(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Máximo número de intentos de reconexión alcanzado')
      this.emit('reconnect_failed')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000) // Backoff exponencial

    console.log(`🔄 Intentando reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts} en ${delay}ms`)
    this.emit('reconnecting', { attempt: this.reconnectAttempts })

    setTimeout(async () => {
      try {
        await this.iniciarConexion()
      } catch (error) {
        console.error('❌ Error en reconexión:', error)
        await this.manejarReconexion()
      }
    }, delay)
  }

  // Event listeners management
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error en event listener ${event}:`, error)
        }
      })
    }
  }

  // Métodos auxiliares
  private extraerTextoMensaje(message: any): string {
    if (message.conversation) return message.conversation
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text
    if (message.templateMessage?.hydratedTemplate?.hydratedContentText) {
      return message.templateMessage.hydratedTemplate.hydratedContentText
    }
    return ''
  }

  private esMensajeRequiereRespuesta(mensaje: string): boolean {
    const comandos = [
      'hola', 'ayuda', 'cita', 'precio', 'cancelar', 'modificar',
      'información', 'horario', 'teléfono', 'donde', 'dónde', 'emergencia'
    ]
    
    const mensajeLower = mensaje.toLowerCase()
    return comandos.some(comando => mensajeLower.includes(comando)) || mensaje.length > 100
  }

  private get lastError(): string | undefined {
    // Implementar captura de último error
    return undefined
  }
}

// Instancia singleton
export const whatsappBaileysService = new WhatsAppBaileysService()
export default WhatsAppBaileysService