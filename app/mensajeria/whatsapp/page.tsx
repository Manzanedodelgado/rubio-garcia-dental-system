import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { whatsappService } from '@/services/whatsapp'
import { aiService } from '@/services/ai'
import { Navigation } from '@/components/Navigation'
import LoadingSpinner from '@/components/LoadingSpinner'

interface WhatsAppStats {
  mensajes_hoy: number
  mensajes_recibidos_hoy: number
  mensajes_enviados_hoy: number
  mensajes_urgentes_hoy: number
  contactos_activos: number
  pacientes_whatsapp: number
  automatizaciones_activas: number
  tiempo_respuesta_promedio_minutos: number
}

interface UrgentMessage {
  id: string
  telefono: string
  mensaje: string
  fecha_envio: string
  resumen_urgencia: string
  nombre?: string
  apellido?: string
  numero_paciente?: string
}

interface Contact {
  id: string
  telefono: string
  nombre?: string
  apellido?: string
  tipo: string
  ultima_interaccion: string
  mensajes_no_leidos: number
  ultimo_mensaje?: string
  fecha_ultimo_mensaje?: string
  estado: string
}

interface ChatMessage {
  id: string
  telefono: string
  mensaje: string
  fecha_envio: string
  tipo: 'entrante' | 'saliente'
  estado: string
  paciente_id?: string
}

interface CitaInfo {
  id: string
  fecha_cita: string
  hora_cita: string
  doctor_id: string
  estado: string
  tipo_tratamiento: string
  observaciones?: string
}

export default function WhatsAppPage() {
  const [stats, setStats] = useState<WhatsAppStats | null>(null)
  const [urgentMessages, setUrgentMessages] = useState<UrgentMessage[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'messages' | 'contacts' | 'automation' | 'chat'>('dashboard')
  
  // NUEVAS FUNCIONALIDADES
  const [aiEnabled, setAiEnabled] = useState<boolean>(true)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [patientAppointments, setPatientAppointments] = useState<{
    ultimasCitas: CitaInfo[],
    proximasCitas: CitaInfo[]
  }>({ ultimasCitas: [], proximasCitas: [] })
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    loadWhatsAppData()
    
    // Configurar realtime subscriptions
    const messageSubscription = supabase
      .channel('whatsapp_messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'whatsapp_messages' },
        () => {
          loadWhatsAppData()
        }
      )
      .subscribe()

    const contactSubscription = supabase
      .channel('whatsapp_contactos')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_contactos' },
        () => {
          loadWhatsAppData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messageSubscription)
      supabase.removeChannel(contactSubscription)
    }
  }, [])

  const loadWhatsAppData = async () => {
    try {
      // Verificar conexión con WhatsApp
      const isConnected = await whatsappService.checkConnection()
      setConnectionStatus(isConnected)

      // Cargar estadísticas
      const { data: statsData } = await supabase
        .from('v_whatsapp_estadisticas')
        .select('*')
        .single()

      if (statsData) {
        setStats(statsData)
      }

      // Cargar mensajes urgentes
      const { data: urgentData } = await supabase
        .from('v_whatsapp_mensajes_urgentes')
        .select('*')
        .limit(10)

      setUrgentMessages(urgentData || [])

      // Cargar conversaciones activas
      const { data: contactsData } = await supabase
        .from('v_whatsapp_conversaciones_activas')
        .select('*')
        .limit(20)

      setContacts(contactsData || [])
    } catch (error) {
      console.error('Error cargando datos de WhatsApp:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendQuickMessage = async (telefono: string, message: string) => {
    try {
      const success = await whatsappService.sendMessage(telefono, message)
      if (success) {
        alert('Mensaje enviado correctamente')
        loadWhatsAppData()
      } else {
        alert('Error al enviar mensaje')
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      alert('Error al enviar mensaje')
    }
  }

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_messages')
        .update({ estado: 'leido' })
        .eq('id', messageId)

      if (!error) {
        loadWhatsAppData()
      }
    } catch (error) {
      console.error('Error marcando mensaje como leído:', error)
    }
  }

  // NUEVAS FUNCIONALIDADES

  // Toggle IA ON/OFF
  const toggleAI = async () => {
    try {
      const newStatus = !aiEnabled
      setAiEnabled(newStatus)
      
      // Guardar en localStorage
      localStorage.setItem('whatsapp_ai_enabled', JSON.stringify(newStatus))
      
      alert(`IA ${newStatus ? 'ACTIVADA' : 'DESACTIVADA'}`)
    } catch (error) {
      console.error('Error toggleando IA:', error)
    }
  }

  // Cargar citas del paciente
  const loadPatientAppointments = async (phoneNumber: string) => {
    try {
      // Buscar paciente por teléfono
      const { data: paciente } = await supabase
        .from('pacientes')
        .select('id')
        .eq('telefono', phoneNumber)
        .single()

      if (paciente) {
        // Cargar últimas 5 citas
        const { data: ultimasCitas } = await supabase
          .from('citas')
          .select('*')
          .eq('paciente_id', paciente.id)
          .order('fecha_cita', { ascending: false })
          .limit(5)

        // Cargar próximas citas
        const { data: proximasCitas } = await supabase
          .from('citas')
          .select('*')
          .eq('paciente_id', paciente.id)
          .gte('fecha_cita', new Date().toISOString().split('T')[0])
          .order('fecha_cita', { ascending: true })
          .limit(5)

        setPatientAppointments({
          ultimasCitas: ultimasCitas || [],
          proximasCitas: proximasCitas || []
        })
      }
    } catch (error) {
      console.error('Error cargando citas del paciente:', error)
    }
  }

  // Abrir chat con contacto
  const openChat = async (contact: Contact) => {
    setSelectedContact(contact)
    setActiveTab('chat')
    
    // Cargar mensajes de la conversación
    const { data: mensajes } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('telefono', contact.telefono)
      .order('fecha_envio', { ascending: true })
      .limit(50)

    setChatMessages(mensajes || [])
    
    // Cargar citas del paciente si es paciente
    if (contact.tipo === 'paciente') {
      await loadPatientAppointments(contact.telefono)
    }
  }

  // Enviar mensaje desde chat
  const sendChatMessage = async () => {
    if (!selectedContact || !messageText.trim()) return

    setSendingMessage(true)
    try {
      const success = await whatsappService.sendMessage(selectedContact.telefono, messageText)
      
      if (success) {
        // Agregar mensaje localmente
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          telefono: selectedContact.telefono,
          mensaje: messageText,
          fecha_envio: new Date().toISOString(),
          tipo: 'saliente',
          estado: 'enviado'
        }
        setChatMessages(prev => [...prev, newMessage])
        setMessageText('')
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      alert('Error al enviar mensaje')
    } finally {
      setSendingMessage(false)
    }
  }

  // Generar respuesta con IA
  const generateAIResponse = async () => {
    if (!aiEnabled || !selectedContact || !messageText.trim()) {
      alert('IA desactivada o mensaje vacío')
      return
    }

    setSendingMessage(true)
    try {
      // Obtener contexto de conversación
      const { data: lastMessages } = await supabase
        .from('whatsapp_messages')
        .select('mensaje')
        .eq('telefono', selectedContact.telefono)
        .order('fecha_envio', { ascending: false })
        .limit(3)

      const context = lastMessages?.map(m => m.mensaje).join('\n') || ''
      
      // Generar respuesta con IA
      const response = await aiService.generateResponse([
        {
          role: 'system',
          content: 'Eres un asistente dental profesional. Responde de manera amigable y profesional sobre consultas dentales.'
        },
        {
          role: 'user',
          content: `Contexto: ${context}\nNuevo mensaje: ${messageText}\nGenera una respuesta profesional y útil.`
        }
      ])

      // Enviar respuesta automática
      const success = await whatsappService.sendMessage(selectedContact.telefono, response)
      
      if (success) {
        alert('Respuesta IA enviada automáticamente')
        setMessageText('')
      }
    } catch (error) {
      console.error('Error generando respuesta IA:', error)
      alert('Error con IA')
    } finally {
      setSendingMessage(false)
    }
  }

  // Enviar automatización
  const sendAutomation = async (automationType: string) => {
    if (!selectedContact) return

    let message = ''
    switch (automationType) {
      case 'recordatorio_cita':
        message = `🔔 Recordatorio: Tiene una cita programada mañana a las 10:00 AM. ¿Necesita reagendar? Responda 'REAGENDAR' para cambiar la fecha.`
        break
      case 'seguimiento_tratamiento':
        message = `🩺 Seguimiento: ¿Cómo se siente después de su tratamiento de ayer? Si tiene molestias, contáctenos inmediatamente.`
        break
      case 'bienvenida_paciente':
        message = `👋 ¡Bienvenido/a! Nos alegra tenerle con nosotros. Su primera cita ha sido programada para el [fecha]. Nuestro equipo está aquí para ayudarle.`
        break
      case 'confirmacion_cita':
        message = `🎉 Confirmación: Su cita ha sido confirmada exitosamente. Recibirá un recordatorio 24 horas antes. ¡Nos vemos pronto!`
        break
      case 'tratamiento_completado':
        message = `✅ ¡Tratamiento Completado! Su tratamiento ha sido realizado exitosamente. Recuerde seguir las indicaciones post-tratamiento.`
        break
      case 'recordatorio_higiene':
        message = `🪥 Recordatorio de Higiene: Mantenga una excelente higiene dental. ¡Su sonrisa es nuestra prioridad!`
        break
    }

    if (message) {
      const success = await whatsappService.sendMessage(selectedContact.telefono, message)
      if (success) {
        alert(`Automatización '${automationType}' enviada`)
        
        // Agregar mensaje a la interfaz local
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          telefono: selectedContact.telefono,
          mensaje: message,
          fecha_envio: new Date().toISOString(),
          tipo: 'saliente',
          estado: 'enviado'
        }
        setChatMessages(prev => [...prev, newMessage])
      }
    }
  }

  // Inicializar IA desde localStorage
  useEffect(() => {
    const savedAIStatus = localStorage.getItem('whatsapp_ai_enabled')
    if (savedAIStatus) {
      setAiEnabled(JSON.parse(savedAIStatus))
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WhatsApp Business</h1>
              <p className="mt-2 text-sm text-gray-600">
                Centro de control de mensajería WhatsApp
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Toggle IA ON/OFF */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">IA:</span>
                <button
                  onClick={toggleAI}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    aiEnabled ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      aiEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${aiEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                  {aiEnabled ? 'ON' : 'OFF'}
                </span>
              </div>

              <div className={`flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                connectionStatus 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  connectionStatus ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                {connectionStatus ? 'Conectado' : 'Desconectado'}
              </div>
              
              <button
                onClick={loadWhatsAppData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: '📊' },
              { id: 'messages', name: 'Mensajes', icon: '💬' },
              { id: 'contacts', name: 'Contactos', icon: '👥' },
              { id: 'automation', name: 'Automatizaciones', icon: '🤖' },
              { id: 'chat', name: 'Chat', icon: '💬', disabled: !selectedContact }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <span className="text-2xl">📱</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Mensajes Hoy</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.mensajes_hoy}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <span className="text-2xl">🚨</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Mensajes Urgentes</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.mensajes_urgentes_hoy}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Contactos Activos</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.contactos_activos}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Automatizaciones</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.automatizaciones_activas}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Urgent Messages */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Mensajes Urgentes</h2>
              </div>
              <div className="divide-y">
                {urgentMessages.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No hay mensajes urgentes
                  </div>
                ) : (
                  urgentMessages.map((message) => (
                    <div key={message.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="text-red-600 font-bold">!</span>
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">
                                {message.nombre && message.apellido 
                                  ? `${message.nombre} ${message.apellido}`
                                  : message.telefono
                                }
                              </p>
                              <p className="text-sm text-gray-500">{message.telefono}</p>
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-gray-700">{message.mensaje}</p>
                          <p className="mt-2 text-xs text-gray-500">
                            {new Date(message.fecha_envio).toLocaleString('es-ES')}
                          </p>
                          {message.resumen_urgencia && (
                            <p className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                              {message.resumen_urgencia}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 flex space-x-2">
                          <button
                            onClick={() => sendQuickMessage(message.telefono, 'Entiendo tu situación, te contactaremos pronto.')}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Responder
                          </button>
                          <button
                            onClick={() => markMessageAsRead(message.id)}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            Marcar Leído
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Historial de Mensajes</h2>
              </div>
              <div className="p-6 text-center text-gray-500">
                <p>Historial completo de mensajes</p>
                <p className="text-sm mt-2">Esta funcionalidad estará disponible en la interfaz de chat</p>
              </div>
            </div>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Contactos</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Nuevo Contacto
                  </button>
                </div>
              </div>
              <div className="divide-y">
                {contacts.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No hay contactos activos
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <div key={contact.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            contact.mensajes_no_leidos > 0 ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <span className="text-gray-600 font-medium">
                              {(contact.nombre || contact.apellido || contact.telefono).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {contact.nombre && contact.apellido 
                                ? `${contact.nombre} ${contact.apellido}`
                                : contact.telefono
                              }
                            </p>
                            <p className="text-sm text-gray-500">{contact.telefono}</p>
                            <div className="flex items-center mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                contact.tipo === 'paciente' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {contact.tipo}
                              </span>
                              {contact.mensajes_no_leidos > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                                  {contact.mensajes_no_leidos}
                                </span>
                              )}
                              {/* Punto naranja para conversaciones urgentes >24 horas */}
                              {(() => {
                                const tiempoSinRespuesta = new Date().getTime() - new Date(contact.ultima_interaccion).getTime()
                                const esUrgente = tiempoSinRespuesta > (24 * 60 * 60 * 1000)
                                return esUrgente && (
                                  <span 
                                    className="ml-2 inline-flex items-center justify-center w-3 h-3 bg-orange-500 rounded-full" 
                                    title="Conversación sin respuesta por más de 24 horas"
                                  ></span>
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(contact.ultima_interaccion).toLocaleString('es-ES')}
                          </p>
                          {contact.ultimo_mensaje && (
                            <p className="text-sm text-gray-700 mt-1 max-w-xs truncate">
                              {contact.ultimo_mensaje}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Automation Tab */}
        {activeTab === 'automation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Automatizaciones</h2>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Nueva Automatización
                  </button>
                </div>
              </div>
              <div className="p-6 text-center text-gray-500">
                <p>Gestión de automatizaciones de mensajes</p>
                <p className="text-sm mt-2">Recordatorios, seguimientos y respuestas automáticas</p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab - INTERFAZ COMPLETA */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de Contactos */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Contactos</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => openChat(contact)}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedContact?.id === contact.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            {(() => {
                              const tiempoSinRespuesta = new Date().getTime() - new Date(contact.ultima_interaccion).getTime()
                              const esUrgente = tiempoSinRespuesta > (24 * 60 * 60 * 1000)
                              return (
                                <>
                                  <p className={`font-medium ${esUrgente ? 'text-orange-700 font-bold' : 'text-gray-900'}`}>
                                    {contact.nombre || contact.telefono}
                                    {esUrgente && ' ⚠️'}
                                  </p>
                                  <p className="text-sm text-gray-500">{contact.tipo}</p>
                                  {esUrgente && (
                                    <p className="text-xs text-orange-600 font-medium">
                                      {Math.floor(tiempoSinRespuesta / (1000 * 60 * 60))}h sin respuesta
                                    </p>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                          <div className="flex items-center space-x-2">
                            {contact.mensajes_no_leidos > 0 && (
                              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                                {contact.mensajes_no_leidos}
                              </span>
                            )}
                            {(() => {
                              const tiempoSinRespuesta = new Date().getTime() - new Date(contact.ultima_interaccion).getTime()
                              const esUrgente = tiempoSinRespuesta > (24 * 60 * 60 * 1000)
                              return esUrgente && (
                                <div className="w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></div>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Área de Chat */}
              <div className="lg:col-span-2">
                {selectedContact ? (
                  <div className="bg-white rounded-lg shadow-sm border h-96 flex flex-col">
                    {/* Header del Chat */}
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {selectedContact.nombre || selectedContact.telefono}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {selectedContact.tipo} • {selectedContact.estado}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {aiEnabled && (
                            <button
                              onClick={generateAIResponse}
                              className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                              disabled={sendingMessage}
                            >
                              🤖 IA
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Panel de Citas del Paciente */}
                    {patientAppointments.ultimasCitas.length > 0 && (
                      <div className="p-3 bg-blue-50 border-b">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">📅 Información de Citas</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="font-medium text-blue-800">Últimas 5 Citas:</p>
                            {patientAppointments.ultimasCitas.map((cita, idx) => (
                              <p key={idx} className="text-blue-700">
                                {new Date(cita.fecha_cita).toLocaleDateString()} - {cita.estado}
                              </p>
                            ))}
                          </div>
                          <div>
                            <p className="font-medium text-blue-800">Próximas Citas:</p>
                            {patientAppointments.proximasCitas.map((cita, idx) => (
                              <p key={idx} className="text-blue-700">
                                {new Date(cita.fecha_cita).toLocaleDateString()} - {cita.estado}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Automatizaciones - TODOS LOS 6 BOTONES */}
                    <div className="p-2 bg-gray-50 border-b">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => sendAutomation('recordatorio_cita')}
                          className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs hover:bg-green-200 flex items-center space-x-1"
                        >
                          <span>🔔</span><span>Recordatorio</span>
                        </button>
                        <button
                          onClick={() => sendAutomation('seguimiento_tratamiento')}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs hover:bg-blue-200 flex items-center space-x-1"
                        >
                          <span>🩺</span><span>Seguimiento</span>
                        </button>
                        <button
                          onClick={() => sendAutomation('bienvenida_paciente')}
                          className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs hover:bg-purple-200 flex items-center space-x-1"
                        >
                          <span>👋</span><span>Bienvenida</span>
                        </button>
                        <button
                          onClick={() => sendAutomation('confirmacion_cita')}
                          className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-xs hover:bg-yellow-200 flex items-center space-x-1"
                        >
                          <span>🎉</span><span>Confirmación</span>
                        </button>
                        <button
                          onClick={() => sendAutomation('tratamiento_completado')}
                          className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs hover:bg-green-200 flex items-center space-x-1"
                        >
                          <span>✅</span><span>Completado</span>
                        </button>
                        <button
                          onClick={() => sendAutomation('recordatorio_higiene')}
                          className="bg-teal-100 text-teal-700 px-3 py-1 rounded text-xs hover:bg-teal-200 flex items-center space-x-1"
                        >
                          <span>🪥</span><span>Higiene</span>
                        </button>
                      </div>
                    </div>

                    {/* Mensajes del Chat */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.tipo === 'saliente' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.tipo === 'saliente'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.mensaje}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.fecha_envio).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Input de Mensaje */}
                    <div className="p-4 border-t">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                          placeholder="Escribe tu mensaje..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={sendChatMessage}
                          disabled={sendingMessage || !messageText.trim()}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                          📤
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border h-96 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <p className="text-lg">💬</p>
                      <p className="mt-2">Selecciona un contacto para iniciar chat</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}