'use client'

import { useStatus } from '@/components/StatusProvider'
import {
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline'

export function DashboardWidgets() {
  const { status, isConnected, refreshStatus } = useStatus()

  const widgets = [
    {
      title: 'Agenda',
      status: 'connected',
      active: true,
      icon: CalendarDaysIcon,
      description: 'Sincronizado',
      details: status.sql_server_connected ? 'SQL Server conectado' : 'Desconectado',
      color: status.sql_server_connected ? 'green' : 'red'
    },
    {
      title: 'WhatsApp',
      status: status.whatsapp_connected ? 'connected' : 'disconnected',
      active: status.whatsapp_connected,
      icon: ChatBubbleLeftRightIcon,
      description: status.whatsapp_connected ? 'Conectado' : 'Desconectado',
      details: status.whatsapp_connected ? 'Baileys operativo' : 'Worker no disponible',
      color: status.whatsapp_connected ? 'green' : 'red'
    },
    {
      title: 'IA',
      status: status.ai_active ? 'connected' : 'disconnected',
      active: status.ai_active,
      icon: SparklesIcon,
      description: status.ai_active ? 'Activa' : 'Inactiva',
      details: status.ai_active ? 'Ollama disponible' : 'Servicio no disponible',
      color: status.ai_active ? 'green' : 'red'
    },
    {
      title: 'Automatizaciones',
      status: 'active',
      active: status.sql_server_connected && status.supabase_connected,
      icon: BeakerIcon,
      description: 'Funcionando',
      details: `${status.sql_server_connected && status.supabase_connected ? 'Listo' : 'Inicializando'}`,
      color: (status.sql_server_connected && status.supabase_connected) ? 'green' : 'yellow'
    }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'red':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getIconColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-green-600'
      case 'red':
        return 'text-red-600'
      case 'yellow':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {widgets.map((widget, index) => (
        <div
          key={index}
          className={`
            relative overflow-hidden rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md
            ${getColorClasses(widget.color)}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`${getIconColor(widget.color)}`}>
                <widget.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-medium">
                  {widget.title}
                </h3>
                <p className="text-xs opacity-80">
                  {widget.description}
                </p>
              </div>
            </div>
            
            {/* Status indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                widget.status === 'connected' ? 'bg-green-500' : 
                widget.status === 'active' ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`} />
              <button
                onClick={refreshStatus}
                className="text-xs opacity-60 hover:opacity-100 underline"
                title="Actualizar estado"
              >
                ↻
              </button>
            </div>
          </div>
          
          {/* Details */}
          <div className="mt-2 text-xs opacity-75">
            {widget.details}
          </div>
          
          {/* Editable indicator */}
          <div className="absolute top-2 right-2">
            <button className="text-xs opacity-40 hover:opacity-100" title="Configurar">
              ⚙
            </button>
          </div>
        </div>
      ))}
      
      {/* System Connection Status */}
      <div className="md:col-span-2 lg:col-span-4">
        <div className={`
          rounded-lg border p-4
          ${isConnected 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
          }
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`} />
              <span className={`font-medium ${
                isConnected ? 'text-green-800' : 'text-red-800'
              }`}>
                Estado General del Sistema: {isConnected ? 'Conectado y Funcionando' : 'Problemas de Conexión'}
              </span>
            </div>
            <div className="text-xs opacity-75">
              {status.last_sync && `Última verificación: ${new Date(status.last_sync).toLocaleTimeString('es-ES')}`}
            </div>
          </div>
          
          {!isConnected && (
            <div className="mt-2 text-xs text-red-700">
              ⚠️ Revisa las conexiones de Supabase, SQL Server, WhatsApp Worker y IA
            </div>
          )}
        </div>
      </div>
    </div>
  )
}