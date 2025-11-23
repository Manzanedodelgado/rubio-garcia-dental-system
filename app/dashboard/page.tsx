'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { StatusProvider } from '@/components/StatusProvider'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { DashboardWidgets } from '@/components/dashboard/DashboardWidgets'
import { TodayCitasBox } from '@/components/dashboard/TodayCitasBox'
import { UrgentMessagesBox } from '@/components/dashboard/UrgentMessagesBox'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { supabase } from '@/lib/supabase'
import { whatsappService } from '@/services/whatsapp'
import type { Cita, WhatsAppMessage } from '@/types'
import { toast } from 'react-hot-toast'
import {
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const [citas, setCitas] = useState<Cita[]>([])
  const [urgentMessages, setUrgentMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboardData()
      
      // Set up real-time subscriptions
      setupRealtimeSubscriptions()
      
      // Load data periodically
      const interval = setInterval(loadDashboardData, 60000) // Every minute
      return () => {
        clearInterval(interval)
        // Cleanup subscriptions
        supabase.removeAllChannels()
      }
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load today's appointments
      await loadTodayAppointments()
      
      // Load urgent WhatsApp messages
      await loadUrgentMessages()
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Error cargando datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('citas')
        .select(`
          *,
          paciente:pacientes(nombre, apellido, telefono_movil),
          doctor:doctors(nombre, apellido)
        `)
        .eq('fecha', today)
        .in('estado', ['programada', 'confirmada', 'en_curso'])
        .order('hora_inicio', { ascending: true })

      if (error) {
        console.error('Error loading appointments:', error)
        return
      }

      setCitas(data || [])
    } catch (error) {
      console.error('Error loading today appointments:', error)
    }
  }

  const loadUrgentMessages = async () => {
    try {
      const messages = await whatsappService.getUrgentMessages()
      setUrgentMessages(messages)
    } catch (error) {
      console.error('Error loading urgent messages:', error)
    }
  }

  const setupRealtimeSubscriptions = () => {
    // Subscribe to cita changes
    const citasChannel = supabase
      .channel('citas-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'citas'
      }, () => {
        loadTodayAppointments()
      })
      .subscribe()

    // Subscribe to WhatsApp message changes
    const messagesChannel = supabase
      .channel('whatsapp-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'whatsapp_messages'
      }, () => {
        loadUrgentMessages()
      })
      .subscribe()
  }

  const handleQuickAction = async (action: string) => {
    try {
      switch (action) {
        case 'nueva_cita':
          // Navigate to new appointment creation
          window.location.href = '/clinica/agenda/nueva'
          break
        case 'nuevo_contacto':
          // Navigate to new contact creation
          window.location.href = '/clinica/pacientes/nuevo'
          break
        case 'nuevo_documento':
          // Navigate to document creation
          window.location.href = '/ia/documentos/nuevo'
          break
        case 'nuevo_usuario':
          // Navigate to user creation (admin only)
          if (user?.role === 'admin') {
            window.location.href = '/configuracion/usuarios/nuevo'
          } else {
            toast.error('No tienes permisos para esta acción')
          }
          break
        default:
          console.log('Unknown action:', action)
      }
    } catch (error) {
      console.error('Error executing quick action:', error)
      toast.error('Error ejecutando acción rápida')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Bienvenido, {user?.name}. Panel de control del sistema.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <div className="text-sm text-gray-500">
            Última actualización: {new Date().toLocaleTimeString('es-ES')}
          </div>
        </div>
      </div>

      {/* System Status Widgets */}
      <DashboardWidgets />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Appointments */}
        <div className="lg:col-span-2">
          <TodayCitasBox citas={citas} />
        </div>

        {/* Right Column - Urgent Messages */}
        <div className="lg:col-span-1">
          <UrgentMessagesBox messages={urgentMessages} />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />

      {/* System Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Información del Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <CalendarDaysIcon className="mx-auto h-8 w-8 text-navy-600" />
            <div className="mt-2 text-sm text-gray-600">Citas Hoy</div>
            <div className="text-2xl font-semibold text-gray-900">{citas.length}</div>
          </div>
          <div className="text-center">
            <ChatBubbleLeftRightIcon className="mx-auto h-8 w-8 text-orange-600" />
            <div className="mt-2 text-sm text-gray-600">Mensajes Urgentes</div>
            <div className="text-2xl font-semibold text-orange-600">{urgentMessages.length}</div>
          </div>
          <div className="text-center">
            <SparklesIcon className="mx-auto h-8 w-8 text-golden-600" />
            <div className="mt-2 text-sm text-gray-600">IA Activa</div>
            <div className="text-lg font-semibold text-golden-600">●</div>
          </div>
          <div className="text-center">
            <BeakerIcon className="mx-auto h-8 w-8 text-green-600" />
            <div className="mt-2 text-sm text-gray-600">Sistema</div>
            <div className="text-lg font-semibold text-green-600">●</div>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-navy-50 border border-navy-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-navy-900 mb-2">
          🦷 Rubio García Dental - Sistema de Gestión
        </h3>
        <p className="text-navy-700">
          Especializados en <strong>Implantología y Estética de Vanguardia</strong>. 
          Sistema integral con IA, WhatsApp Business y sincronización SQL Server 2008.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-navy-600">
          <div>📍 Madrid, España</div>
          <div>📞 916 410 841 | 664 218 253</div>
          <div>🌐 www.rubiogarciadental.com</div>
        </div>
      </div>
    </div>
  )
}