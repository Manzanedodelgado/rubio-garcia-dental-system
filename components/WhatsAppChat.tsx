/**
 * COMPONENTE WHATSAPP CHAT
 * 
 * Interfaz de chat WhatsApp con Baileys integrado
 * 
 * FUNCIONALIDADES:
 * - Chat en tiempo real
 * - Bot con AI integrado
 * - Estados de conexión
 * - Gestión de contactos
 * - Respuestas rápidas
 */

import React, { useState, useEffect, useRef } from 'react'
import { 
  MessageCircleIcon, 
  PhoneIcon, 
  PaperAirplaneIcon, 
  UserCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { WhatsAppMessage } from '@/services/supabase-whatsapp'

interface ChatProps {
  className?: string
}

interface ContactoChat {
  telefono: string
  nombre: string
  ultimo_mensaje: string
  ultima_actividad: string
  no_leidos: number
  estado: 'online' | 'offline' | 'escribiendo'
}

const WhatsAppChat: React.FC<ChatProps> = ({ className = '' }) => {
  // Estados principales
  const [isConnected, setIsConnected] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [conversacionActiva, setConversacionActiva] = useState<string | null>(null)
  const [mensajes, setMensajes] = useState<WhatsAppMessage[]>([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [contactos, setContactos] = useState<ContactoChat[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mensajeInputRef = useRef<HTMLTextAreaElement>(null)

  // Estados de conexión
  const [estadoConexion, setEstadoConexion] = useState({
    conectado: false,
    qr_code: null as string | null,
    reconnecting: false,
    last_error: null as string | null
  })

  // Inicialización
  useEffect(() => {
    verificarEstadoConexion()
    cargarContactos()
    configurarEventListeners()
  }, [])

  // Auto-scroll al final de mensajes
  useEffect(() => {
    scrollToBottom()
  }, [mensajes])

  const verificarEstadoConexion = async () => {
    try {
      const response = await fetch('/api/whatsapp/connect')
      const data = await response.json()
      
      if (data.success) {
        setEstadoConexion(data.data)
        setIsConnected(data.data.conectado)
        setQrCode(data.data.qr_code)
      }
    } catch (error) {
      console.error('Error verificando estado:', error)
    }
  }

  const configurarEventListeners = () => {
    // Aquí se configurarían los event listeners para WebSocket o Server-Sent Events
    // Por ahora simulamos con polling
    
    const interval = setInterval(async () => {
      if (isConnected) {
        await cargarMensajes(conversacionActiva)
      }
    }, 5000) // Cada 5 segundos

    return () => clearInterval(interval)
  }

  const cargarContactos = async () => {
    try {
      setLoading(true)
      // Simular carga de contactos desde Supabase
      // En implementación real, esto vendría de whatsapp_messages agrupados por telefono
      const contactosSimulados: ContactoChat[] = [
        {
          telefono: '34123456789',
          nombre: 'María García',
          ultimo_mensaje: 'Gracias por la información',
          ultima_actividad: new Date(Date.now() - 3600000).toISOString(),
          no_leidos: 2,
          estado: 'offline'
        },
        {
          telefono: '34567891234',
          nombre: 'Juan Pérez',
          ultimo_mensaje: '¿Puedo cambiar mi cita?',
          ultima_actividad: new Date(Date.now() - 1800000).toISOString(),
          no_leidos: 0,
          estado: 'online'
        }
      ]
      setContactos(contactosSimulados)
    } catch (error) {
      console.error('Error cargando contactos:', error)
      setError('Error cargando contactos')
    } finally {
      setLoading(false)
    }
  }

  const cargarMensajes = async (telefono: string | null) => {
    if (!telefono) return

    try {
      // En implementación real, esto sería:
      // const response = await fetch(`/api/whatsapp/conversation/${telefono}`)
      
      // Por ahora, simulamos mensajes
      const mensajesSimulados: WhatsAppMessage[] = [
        {
          telefono,
          mensaje: 'Hola, necesito información sobre implantes',
          tipo: 'entrante',
          estado: 'leido',
          fecha_envio: new Date(Date.now() - 7200000).toISOString(),
          requiere_respuesta: false
        },
        {
          telefono,
          mensaje: 'Buenos días, estaré encantado de ayudarle. ¿Qué tipo de implante necesita?',
          tipo: 'saliente',
          estado: 'leido',
          fecha_envio: new Date(Date.now() - 7100000).toISOString(),
          requiere_respuesta: false
        }
      ]
      setMensajes(mensajesSimulados)
    } catch (error) {
      console.error('Error cargando mensajes:', error)
    }
  }

  const conectarWhatsApp = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setEstadoConexion(data.data)
        setIsConnected(data.data.conectado)
        setQrCode(data.data.qr_code)
        
        if (!data.data.conectado && data.data.qr_code) {
          // Mostrar QR para escanear
          mostrarQRCode(data.data.qr_code)
        }
      } else {
        setError(data.error)
      }
    } catch (error) {
      console.error('Error conectando WhatsApp:', error)
      setError('Error conectando WhatsApp')
    } finally {
      setLoading(false)
    }
  }

  const desconectarWhatsApp = async () => {
    try {
      setLoading(true)
      
      await fetch('/api/whatsapp/connect', {
        method: 'DELETE'
      })
      
      setIsConnected(false)
      setQrCode(null)
      setConversacionActiva(null)
      setMensajes([])
      
    } catch (error) {
      console.error('Error desconectando WhatsApp:', error)
      setError('Error desconectando WhatsApp')
    } finally {
      setLoading(false)
    }
  }

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !conversacionActiva) return

    try {
      const mensaje = nuevoMensaje.trim()
      setNuevoMensaje('')
      
      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telefono: conversacionActiva,
          mensaje
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Agregar mensaje localmente
        const nuevoMsg: WhatsAppMessage = {
          telefono: conversacionActiva,
          mensaje,
          tipo: 'saliente',
          estado: 'enviado',
          fecha_envio: new Date().toISOString(),
          requiere_respuesta: false
        }
        setMensajes(prev => [...prev, nuevoMsg])
        
        // Actualizar último mensaje del contacto
        setContactos(prev => prev.map(contacto => 
          contacto.telefono === conversacionActiva 
            ? { ...contacto, ultimo_mensaje: mensaje, ultima_actividad: new Date().toISOString() }
            : contacto
        ))
      } else {
        setError(data.error)
        setNuevoMensaje(mensaje) // Restaurar mensaje si falló
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      setError('Error enviando mensaje')
      setNuevoMensaje(mensaje) // Restaurar mensaje si falló
    }
  }

  const seleccionarContacto = (telefono: string) => {
    setConversacionActiva(telefono)
    cargarMensajes(telefono)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const mostrarQRCode = (qr: string) => {
    // Implementación para mostrar QR (usando una librería como qrcode)
    console.log('QR Code:', qr)
  }

  const formatearHora = (fecha: string) => {
    const date = new Date(fecha)
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha)
    const hoy = new Date()
    const ayer = new Date(hoy)
    ayer.setDate(ayer.getDate() - 1)

    if (date.toDateString() === hoy.toDateString()) {
      return 'Hoy'
    } else if (date.toDateString() === ayer.toDateString()) {
      return 'Ayer'
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      })
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'leido':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'enviado':
        return <CheckCircleIcon className="h-4 w-4 text-gray-400" />
      case 'pendiente':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  if (!isConnected) {
    return (
      <div className={`bg-white rounded-lg shadow-sm ${className}`}>
        <div className="p-6">
          <div className="text-center">
            <MessageCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              WhatsApp no conectado
            </h2>
            <p className="text-gray-600 mb-6">
              Conecta tu WhatsApp para empezar a chatear con pacientes
            </p>
            
            {qrCode && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Escanea el código QR con tu WhatsApp:
                </p>
                <div className="bg-white p-2 rounded border">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`}
                    alt="QR Code"
                    className="mx-auto"
                  />
                </div>
              </div>
            )}
            
            <button
              onClick={conectarWhatsApp}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Conectando...' : 'Conectar WhatsApp'}
            </button>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Lista de contactos */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              WhatsApp Chat
            </h2>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Conectado</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading && !contactos.length ? (
            <div className="p-4 text-center text-gray-500">
              Cargando contactos...
            </div>
          ) : contactos.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No hay conversaciones
            </div>
          ) : (
            contactos.map((contacto) => (
              <div
                key={contacto.telefono}
                onClick={() => seleccionarContacto(contacto.telefono)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  conversacionActiva === contacto.telefono ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <UserCircleIcon className="h-10 w-10 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {contacto.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatearFecha(contacto.ultima_actividad)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {contacto.ultimo_mensaje}
                      </p>
                      {contacto.no_leidos > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-500 rounded-full">
                          {contacto.no_leidos}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={desconectarWhatsApp}
            className="w-full text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Desconectar
          </button>
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col">
        {conversacionActiva ? (
          <>
            {/* Header del chat */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {contactos.find(c => c.telefono === conversacionActiva)?.nombre || 'Conversación'}
                    </p>
                    <p className="text-sm text-gray-500">{conversacionActiva}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mensajes.map((mensaje, index) => (
                <div
                  key={index}
                  className={`flex ${mensaje.tipo === 'saliente' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      mensaje.tipo === 'saliente'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{mensaje.mensaje}</p>
                    <div className="flex items-center justify-end mt-1 space-x-1">
                      <span className={`text-xs ${
                        mensaje.tipo === 'saliente' ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {formatearHora(mensaje.fecha_envio)}
                      </span>
                      {mensaje.tipo === 'saliente' && getEstadoIcon(mensaje.estado)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensaje */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <textarea
                  ref={mensajeInputRef}
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      enviarMensaje()
                    }
                  }}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={1}
                />
                <button
                  onClick={enviarMensaje}
                  disabled={!nuevoMensaje.trim() || loading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircleIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>Selecciona una conversación para empezar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WhatsAppChat