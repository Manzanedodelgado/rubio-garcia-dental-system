'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { WhatsAppMessage } from '@/types'
import {
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PhoneIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface UrgentMessagesBoxProps {
  messages: WhatsAppMessage[]
}

export function UrgentMessagesBox({ messages }: UrgentMessagesBoxProps) {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())

  const toggleExpanded = (messageId: string) => {
    const newExpanded = new Set(expandedMessages)
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId)
    } else {
      newExpanded.add(messageId)
    }
    setExpandedMessages(newExpanded)
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'urgente':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'entregado':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'leido':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getUrgencyIcon = (estado: string) => {
    if (estado === 'urgente') {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
    }
    return <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600" />
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer'
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      })
    }
  }

  const getContactoInfo = (message: WhatsAppMessage) => {
    // En una implementación real, buscarías el contacto en la base de datos
    return {
      nombre: 'Contacto',
      numero: message.telefono
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-orange-600" />
            Mensajes Urgentes
          </h3>
          <span className="text-sm text-gray-500">
            WhatsApp Business
          </span>
        </div>

        {messages.length === 0 ? (
          <div className="mt-6 text-center py-8">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay mensajes urgentes
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Todos los mensajes han sido procesados.
            </p>
            <div className="mt-6">
              <Link
                href="/mensajeria/whatsapp"
                className="btn-secondary"
              >
                Ver Todos los Mensajes
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {messages.map((message) => {
              const contacto = getContactoInfo(message)
              const isExpanded = expandedMessages.has(message.id)
              
              return (
                <div
                  key={message.id}
                  className={clsx(
                    'border rounded-lg p-4 transition-all',
                    message.estado === 'urgente' 
                      ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getUrgencyIcon(message.estado)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-900">
                              {contacto.nombre}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {formatTime(message.fecha_envio)}
                              </span>
                              <span className={clsx(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                                getEstadoColor(message.estado)
                              )}>
                                {message.estado}
                              </span>
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {formatDate(message.fecha_envio)} • {message.telefono}
                          </div>
                        </div>
                      </div>

                      {/* Message preview */}
                      <div className="mt-3">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {message.mensaje}
                        </p>
                        
                        {message.resumen_urgencia && (
                          <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800">
                            <strong>Resumen de urgencia:</strong> {message.resumen_urgencia}
                          </div>
                        )}
                      </div>

                      {/* Actions and expandable details */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button className="text-xs text-navy-600 hover:text-navy-800 underline">
                            Responder
                          </button>
                          <button
                            onClick={() => toggleExpanded(message.id)}
                            className="text-xs text-gray-600 hover:text-gray-800 underline"
                          >
                            {isExpanded ? 'Menos' : 'Más detalles'}
                          </button>
                        </div>
                        
                        {message.requiere_respuesta && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            Requiere respuesta
                          </span>
                        )}
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <h4 className="text-xs font-medium text-gray-900 mb-2">
                                Información del Contacto
                              </h4>
                              <div className="space-y-2 text-xs text-gray-600">
                                <div className="flex items-center">
                                  <UserIcon className="h-3 w-3 mr-2" />
                                  {contacto.nombre}
                                </div>
                                <div className="flex items-center">
                                  <PhoneIcon className="h-3 w-3 mr-2" />
                                  {contacto.numero}
                                </div>
                                <div className="flex items-center">
                                  <ClockIcon className="h-3 w-3 mr-2" />
                                  Recibido: {new Date(message.fecha_envio).toLocaleString('es-ES')}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-xs font-medium text-gray-900 mb-2">
                                Mensaje Completo
                              </h4>
                              <div className="text-xs text-gray-700 bg-gray-50 p-3 rounded border">
                                {message.mensaje}
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <button className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                                Responder en WhatsApp
                              </button>
                              <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                                Crear Cita
                              </button>
                              <button className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700">
                                Marcar como Leído
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {messages.length} mensaje{messages.length !== 1 ? 's' : ''} urgente{messages.length !== 1 ? 's' : ''}
                </div>
                <div className="flex space-x-3">
                  <Link
                    href="/mensajeria/whatsapp"
                    className="btn-secondary text-sm"
                  >
                    Ver Todos los Mensajes
                  </Link>
                  <button className="btn-primary text-sm">
                    Ir a WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}