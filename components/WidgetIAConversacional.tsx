// ===============================================
// WIDGET IA CONVERSACIONAL CLÍNICO
// Sistema de Gestión Integral - Rubio García Dental
// ===============================================

'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  MicrophoneIcon,
  PaperAirplaneIcon,
  SpeakerWaveIcon,
  UserIcon,
  SparklesIcon,
  PhoneIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { procesadorComandosClinicos, ResultadoComando, TRATAMIENTOS_AGENDA } from '@/services/procesador-comandos-clinicos'

interface MensajeWidget {
  id: string
  tipo: 'usuario' | 'ia' | 'sistema'
  contenido: string
  timestamp: Date
  metadata?: {
    comando_procesado?: boolean
    resultado?: ResultadoComando
    duracion_procesamiento?: number
  }
}

interface EstadoWidget {
  mensajes: MensajeWidget[]
  escuchando: boolean
  procesando: boolean
  sessionId: string
  ultimoComando?: string
  tratamientoSeleccionado?: string
}

interface TratamientoAgenda {
  nombre: string
  duracion_minutos: number
  categoria: string
}

const WidgetIAConversacional: React.FC = () => {
  const [estado, setEstado] = useState<EstadoWidget>({
    mensajes: [],
    escuchando: false,
    procesando: false,
    sessionId: `session_${Date.now()}`,
    tratamientoSeleccionado: undefined
  })

  const [mensajeActual, setMensajeActual] = useState('')
  const [showPanelComandos, setShowPanelComandos] = useState(false)
  const [reconocimientoVoz, setReconocimientoVoz] = useState<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    inicializarWidget()
    configurarReconocimientoVoz()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [estado.mensajes])

  const inicializarWidget = () => {
    const mensajeBienvenida: MensajeWidget = {
      id: '1',
      tipo: 'ia',
      contenido: `¡Hola! Soy tu asistente de IA especializado en gestión clínica. 

Puedo ayudarte con:
• 🎯 Crear citas: "Crea una cita para Manuel Rodriguez el 17 de diciembre para una reconstrucción"
• 📱 Enviar mensajes: "Manda un mensaje a Maria Garcia preguntándole si puede venir a las 16:30h"
• 📅 Consultar citas: "Qué día tiene cita Carmen Pardo?"
• 👤 Buscar pacientes: "Busca al paciente Ana Lopez"

¿En qué puedo ayudarte hoy?`,
      timestamp: new Date()
    }

    setEstado(prev => ({
      ...prev,
      mensajes: [mensajeBienvenida]
    }))
  }

  const configurarReconocimientoVoz = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'es-ES'

      recognition.onstart = () => {
        setEstado(prev => ({ ...prev, escuchando: true }))
        agregarMensajeSistema('🎤 Iniciando reconocimiento de voz...')
      }

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript
        setMensajeActual(transcript)
        await procesarEntrada(transcript, 'voz')
      }

      recognition.onerror = (event: any) => {
        console.error('Error de reconocimiento de voz:', event.error)
        setEstado(prev => ({ ...prev, escuchando: false }))
        agregarMensajeSistema('❌ Error en reconocimiento de voz: ' + event.error)
      }

      recognition.onend = () => {
        setEstado(prev => ({ ...prev, escuchando: false }))
      }

      recognitionRef.current = recognition
    }
  }

  const agregarMensaje = (mensaje: Omit<MensajeWidget, 'id' | 'timestamp'>) => {
    const nuevoMensaje: MensajeWidget = {
      ...mensaje,
      id: `msg_${Date.now()}`,
      timestamp: new Date()
    }

    setEstado(prev => ({
      ...prev,
      mensajes: [...prev.mensajes, nuevoMensaje]
    }))
  }

  const agregarMensajeSistema = (contenido: string) => {
    agregarMensaje({
      tipo: 'sistema',
      contenido
    })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const procesarEntrada = async (entrada: string, fuente: 'texto' | 'voz' = 'texto') => {
    if (!entrada.trim() || estado.procesando) return

    setEstado(prev => ({ ...prev, procesando: true }))

    // Agregar mensaje del usuario
    agregarMensaje({
      tipo: 'usuario',
      contenido: entrada,
      metadata: { comando_procesado: false }
    })

    setMensajeActual('')

    const tiempoInicio = Date.now()

    try {
      const resultado = await procesadorComandosClinicos.procesarComando(entrada, estado.sessionId)
      const tiempoProcesamiento = Date.now() - tiempoInicio

      // Agregar respuesta de la IA
      agregarMensaje({
        tipo: 'ia',
        contenido: resultado.respuesta,
        metadata: {
          comando_procesado: true,
          resultado,
          duracion_procesamiento: tiempoProcesamiento
        }
      })

      // Mostrar siguientes pasos si existen
      if (resultado.siguientes_pasos && resultado.siguientes_pasos.length > 0) {
        setTimeout(() => {
          agregarMensajeSistema(`📋 Siguientes pasos:\n${resultado.siguientes_pasos?.map(paso => `• ${paso}`).join('\n')}`)
        }, 1000)
      }

      // Manejar requerimientos de confirmación
      if (resultado.requiere_confirmacion) {
        setTimeout(() => {
          agregarMensajeSistema('⚠️ Algunos datos faltan. Puedes proporcionar más información o intentar con un comando más específico.')
        }, 1500)
      }

      setEstado(prev => ({ 
        ...prev, 
        ultimoComando: entrada,
        procesando: false 
      }))

    } catch (error) {
      console.error('Error procesando comando:', error)
      agregarMensaje({
        tipo: 'ia',
        contenido: 'Lo siento, hubo un error procesando tu comando. Por favor, inténtalo de nuevo con una descripción más clara.'
      })
      setEstado(prev => ({ ...prev, procesando: false }))
    }
  }

  const iniciarEscucha = () => {
    if (recognitionRef.current && !estado.escuchando) {
      recognitionRef.current.start()
    }
  }

  const detenerEscucha = () => {
    if (recognitionRef.current && estado.escuchando) {
      recognitionRef.current.stop()
    }
  }

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mensajeActual.trim()) {
      await procesarEntrada(mensajeActual, 'texto')
    }
  }

  const comandosRápidos = [
    {
      texto: 'Crear cita para Manuel Rodriguez el 17 de diciembre para reconstrucción',
      descripcion: 'Crear nueva cita'
    },
    {
      texto: 'Mandar mensaje a Maria Garcia preguntándole si puede venir a las 16:30h',
      descripcion: 'Enviar mensaje'
    },
    {
      texto: 'Qué día tiene cita Carmen Pardo?',
      descripcion: 'Consultar citas'
    },
    {
      texto: 'Buscar paciente Ana Lopez',
      descripcion: 'Buscar paciente'
    }
  ]

  const renderMensaje = (mensaje: MensajeWidget) => {
    const esUsuario = mensaje.tipo === 'usuario'
    const esSistema = mensaje.tipo === 'sistema'

    return (
      <div
        key={mensaje.id}
        className={`flex ${esUsuario ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-lg ${esUsuario ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            esUsuario 
              ? 'bg-blue-600 text-white ml-2' 
              : esSistema
              ? 'bg-gray-500 text-white mr-2'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white mr-2'
          }`}>
            {esUsuario ? (
              <UserIcon className="w-5 h-5" />
            ) : esSistema ? (
              <ExclamationTriangleIcon className="w-5 h-5" />
            ) : (
              <SparklesIcon className="w-5 h-5" />
            )}
          </div>

          {/* Contenido */}
          <div className={`rounded-lg px-4 py-3 ${
            esUsuario
              ? 'bg-blue-600 text-white'
              : esSistema
              ? 'bg-gray-100 text-gray-700 border border-gray-200'
              : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
          }`}>
            <div className="text-sm whitespace-pre-wrap">
              {mensaje.contenido}
            </div>
            
            {/* Metadata */}
            <div className={`text-xs mt-2 ${
              esUsuario ? 'text-blue-100' : esSistema ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {mensaje.timestamp.toLocaleTimeString()}
              {mensaje.metadata?.duracion_procesamiento && (
                <span className="ml-2">
                  • Procesado en {mensaje.metadata.duracion_procesamiento}ms
                </span>
              )}
              {mensaje.metadata?.resultado && (
                <span className="ml-2">
                  • {mensaje.metadata.resultado.exito ? '✅' : '❌'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderComandosPanel = () => (
    <div className="bg-white border-t border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Comandos Rápidos</h3>
      <div className="grid grid-cols-1 gap-2">
        {comandosRápidos.map((comando, index) => (
          <button
            key={index}
            onClick={() => setMensajeActual(comando.texto)}
            className="text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <div className="font-medium text-gray-900 mb-1">{comando.descripcion}</div>
            <div className="text-gray-600 text-xs line-clamp-2">{comando.texto}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Tratamientos Disponibles</h4>
        <div className="flex flex-wrap gap-2">
          {TRATAMIENTOS_AGENDA.slice(0, 8).map((tratamiento, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
              onClick={() => setEstado(prev => ({ 
                ...prev, 
                tratamientoSeleccionado: tratamiento.nombre 
              }))}
            >
              {tratamiento.nombre} ({tratamiento.duracion_minutos}min)
            </span>
          ))}
          {TRATAMIENTOS_AGENDA.length > 8 && (
            <span className="text-xs text-gray-500 py-1">
              +{TRATAMIENTOS_AGENDA.length - 8} más...
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">IA Clínica</h3>
              <p className="text-xs text-white/80">Asistente inteligente</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-white/80">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs">En línea</span>
            </div>
            
            <button
              onClick={() => setShowPanelComandos(!showPanelComandos)}
              className="p-1 text-white/80 hover:text-white transition-colors"
              title="Comandos y tratamientos"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Panel de Comandos */}
      {showPanelComandos && renderComandosPanel()}

      {/* Mensajes */}
      <div className="h-80 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {estado.mensajes.map(renderMensaje)}
        
        {/* Indicadores de estado */}
        {estado.procesando && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center">
                <SparklesIcon className="w-5 h-5" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">Procesando comando...</div>
              </div>
            </div>
          </div>
        )}

        {estado.escuchando && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-700 font-medium">🎤 Escuchando...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={enviarMensaje} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={mensajeActual}
              onChange={(e) => setMensajeActual(e.target.value)}
              placeholder="Describe lo que necesitas hacer..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-20"
              disabled={estado.procesando || estado.escuchando}
            />
            {estado.tratamientoSeleccionado && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {estado.tratamientoSeleccionado}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={estado.escuchando ? detenerEscucha : iniciarEscucha}
              className={`p-2 rounded-lg transition-colors ${
                estado.escuchando
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              disabled={estado.procesando}
              title={estado.escuchando ? 'Detener grabación' : 'Iniciar grabación'}
            >
              <MicrophoneIcon className="w-5 h-5" />
            </button>
            
            <button
              type="submit"
              disabled={!mensajeActual.trim() || estado.procesando || estado.escuchando}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Enviar mensaje"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
        
        {/* Estado de tratamiento seleccionado */}
        {estado.tratamientoSeleccionado && (
          <div className="mt-2 text-xs text-blue-600 flex items-center space-x-1">
            <CheckCircleIcon className="w-4 h-4" />
            <span>Tratamiento seleccionado: {estado.tratamientoSeleccionado}</span>
            <button
              onClick={() => setEstado(prev => ({ ...prev, tratamientoSeleccionado: undefined }))}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default WidgetIAConversacional