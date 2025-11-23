/**
 * DASHBOARD PRINCIPAL - RUBIO GARCÍA DENTAL
 * 
 * Dashboard actualizado con servicios Supabase únicamente
 * 
 * FUNCIONALIDADES:
 * - Métricas en tiempo real
 * - Gráficos de estadísticas
 * - Citas de hoy y próximas
 * - WhatsApp integrado
 * - Alertas y notificaciones
 */

import React, { useState, useEffect } from 'react'
import {
  CalendarDaysIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CurrencyEuroIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  PhoneIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

// Interfaces
interface EstadisticasPacientes {
  total_pacientes: number
  pacientes_activos: number
  pacientes_nuevos_mes: number
  porcentaje_activos: number
}

interface CitaHoy {
  id: string
  fecha: string
  hora_inicio: string
  paciente_nombre: string
  paciente_apellido: string
  doctor_nombre: string
  doctor_apellido: string
  estado: string
}

interface EstadisticasCitas {
  hoy: {
    total: number
    estados: Record<string, number>
  }
  semana: {
    total: number
    estados: Record<string, number>
  }
  mes: {
    total: number
    estados: Record<string, number>
  }
}

interface MensajeWhatsAppUrgente {
  id: string
  telefono: string
  mensaje: string
  fecha_envio: string
  paciente_nombre?: string
  resumen_urgencia?: string
}

const Dashboard: React.FC = () => {
  // Estados de datos
  const [estadisticasPacientes, setEstadisticasPacientes] = useState<EstadisticasPacientes | null>(null)
  const [citasHoy, setCitasHoy] = useState<CitaHoy[]>([])
  const [proximasCitas, setProximasCitas] = useState<CitaHoy[]>([])
  const [estadisticasCitas, setEstadisticasCitas] = useState<EstadisticasCitas | null>(null)
  const [mensajesUrgentes, setMensajesUrgentes] = useState<MensajeWhatsAppUrgente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados de interfaz
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<'hoy' | 'semana' | 'mes'>('hoy')

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatosDashboard()
    
    // Actualizar cada 5 minutos
    const interval = setInterval(cargarDatosDashboard, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const cargarDatosDashboard = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('📊 Cargando datos del dashboard...')

      // Cargar estadísticas de pacientes
      const pacientesResponse = await fetch('/api/pacientes/estadisticas')
      if (pacientesResponse.ok) {
        const pacientesData = await pacientesResponse.json()
        if (pacientesData.success) {
          setEstadisticasPacientes(pacientesData.data)
        }
      }

      // Cargar citas de hoy
      const citasHoyResponse = await fetch('/api/citas/especiales')
      if (citasHoyResponse.ok) {
        const citasData = await citasHoyResponse.json()
        if (citasData.success) {
          setCitasHoy(citasData.data.citas)
          setEstadisticasCitas(citasData.data.estadisticas)
        }
      }

      // Cargar próximas citas
      const proximasResponse = await fetch('/api/citas/proximas')
      if (proximasResponse.ok) {
        const proximasData = await proximasResponse.json()
        if (proximasData.success) {
          setProximasCitas(proximasData.data.citas.slice(0, 5)) // Solo próximas 5
        }
      }

      // Cargar mensajes urgentes (simulado - en implementación real sería de WhatsApp)
      const mensajesUrgentesSimulados: MensajeWhatsAppUrgente[] = [
        {
          id: '1',
          telefono: '34123456789',
          mensaje: 'Tengo mucho dolor después del implante',
          fecha_envio: new Date(Date.now() - 1800000).toISOString(),
          paciente_nombre: 'María García',
          resumen_urgencia: 'Dolor post-implante'
        }
      ]
      setMensajesUrgentes(mensajesUrgentesSimulados)

    } catch (error) {
      console.error('Error cargando dashboard:', error)
      setError('Error cargando datos del dashboard')
    } finally {
      setLoading(false)
    }
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
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completada':
        return 'text-green-600 bg-green-100'
      case 'programada':
        return 'text-blue-600 bg-blue-100'
      case 'cancelada':
        return 'text-red-600 bg-red-100'
      case 'no_asistio':
        return 'text-orange-600 bg-orange-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard - Rubio García Dental
          </h1>
          <p className="text-gray-600">
            Panel de control en tiempo real • Actualizado {new Date().toLocaleTimeString('es-ES')}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error cargando datos</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Pacientes */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pacientes Total
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {estadisticasPacientes?.total_pacientes || 0}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600">
                  +{estadisticasPacientes?.pacientes_nuevos_mes || 0} este mes
                </span>
              </div>
            </div>
          </div>

          {/* Citas de hoy */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarDaysIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Citas Hoy
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {estadisticasCitas?.hoy.total || 0}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-gray-600">
                  {estadisticasCitas?.hoy.estados?.completada || 0} completadas
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp mensajes */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Mensajes WhatsApp
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {mensajesUrgentes.length}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-orange-600">
                  {mensajesUrgentes.length} urgentes
                </span>
              </div>
            </div>
          </div>

          {/* Facturación */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyEuroIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Facturación Hoy
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    €0
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-gray-600">+€0 vs ayer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Citas de hoy */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  Citas de Hoy
                </h2>
                <ClockIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6">
              {citasHoy.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay citas programadas para hoy</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {citasHoy.map((cita) => (
                    <div key={cita.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium text-gray-900">
                          {cita.hora_inicio}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {cita.paciente_nombre} {cita.paciente_apellido}
                          </p>
                          <p className="text-sm text-gray-500">
                            Dr. {cita.doctor_nombre} {cita.doctor_apellido}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(cita.estado)}`}>
                        {cita.estado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Próximas citas */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Próximas Citas
              </h2>
            </div>
            <div className="p-6">
              {proximasCitas.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay próximas citas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {proximasCitas.map((cita) => (
                    <div key={cita.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatearFecha(cita.fecha)} - {cita.hora_inicio}
                        </p>
                        <p className="text-sm text-gray-600">
                          {cita.paciente_nombre} {cita.paciente_apellido}
                        </p>
                        <p className="text-xs text-gray-500">
                          Dr. {cita.doctor_nombre} {cita.doctor_apellido}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alertas y notificaciones */}
        {mensajesUrgentes.length > 0 && (
          <div className="mt-8">
            <div className="bg-orange-50 border border-orange-200 rounded-lg">
              <div className="px-6 py-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-400 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-orange-800">
                      Alertas Urgentes
                    </h3>
                    <div className="mt-2 text-sm text-orange-700">
                      {mensajesUrgentes.map((mensaje, index) => (
                        <div key={mensaje.id} className="mb-2 last:mb-0">
                          <p className="font-medium">
                            {mensaje.paciente_nombre} - {mensaje.telefono}
                          </p>
                          <p>{mensaje.resumen_urgencia}</p>
                          <p className="text-xs text-orange-600">
                            {formatearHora(mensaje.fecha_envio)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Nuevo Paciente
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <CalendarDaysIcon className="h-5 w-5 mr-2" />
              Nueva Cita
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <PhoneIcon className="h-5 w-5 mr-2" />
              WhatsApp
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Factura
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard