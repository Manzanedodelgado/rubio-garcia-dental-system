'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Cita } from '@/types'
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface TodayCitasBoxProps {
  citas: Cita[]
}

export function TodayCitasBox({ citas }: TodayCitasBoxProps) {
  const [expandedCitas, setExpandedCitas] = useState<Set<string>>(new Set())

  const toggleExpanded = (citaId: string) => {
    const newExpanded = new Set(expandedCitas)
    if (newExpanded.has(citaId)) {
      newExpanded.delete(citaId)
    } else {
      newExpanded.add(citaId)
    }
    setExpandedCitas(newExpanded)
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'programada':
        return 'bg-blue-100 text-blue-800'
      case 'confirmada':
        return 'bg-green-100 text-green-800'
      case 'en_curso':
        return 'bg-yellow-100 text-yellow-800'
      case 'completada':
        return 'bg-gray-100 text-gray-800'
      case 'cancelada':
        return 'bg-red-100 text-red-800'
      case 'no_asistio':
        return 'bg-red-100 text-red-800'
      case 'emergencia':
        return 'bg-red-200 text-red-900 font-semibold'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      programada: 'Programada',
      confirmada: 'Confirmada',
      en_curso: 'En Curso',
      completada: 'Completada',
      cancelada: 'Cancelada',
      no_asistio: 'No Asistió',
      emergencia: 'Emergencia'
    }
    return labels[estado] || estado
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <CalendarDaysIcon className="h-5 w-5 mr-2 text-navy-600" />
            Citas de Hoy
          </h3>
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>

        {citas.length === 0 ? (
          <div className="mt-6 text-center py-8">
            <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay citas hoy</h3>
            <p className="mt-1 text-sm text-gray-500">
              ¡Día libre! O revisa la agenda para ver las próximas citas.
            </p>
            <div className="mt-6">
              <Link
                href="/clinica/agenda"
                className="btn-primary"
              >
                Ver Agenda
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {citas.map((cita) => (
              <div
                key={cita.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <ClockIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {cita.hora_inicio} - {cita.hora_fin}
                        </div>
                        <div className="text-xs text-gray-500">
                          {cita.tratamiento}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={clsx(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getEstadoColor(cita.estado)
                        )}>
                          {getEstadoLabel(cita.estado)}
                        </span>
                      </div>
                    </div>

                    {/* Patient and Doctor info */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <UserIcon className="h-4 w-4 mr-1" />
                          {cita.paciente?.nombre} {cita.paciente?.apellido}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          {cita.paciente?.telefono_movil}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          Dr. {cita.doctor?.apellido}
                        </span>
                        <button
                          onClick={() => toggleExpanded(cita.id)}
                          className="text-xs text-navy-600 hover:text-navy-800 underline"
                        >
                          {expandedCitas.has(cita.id) ? 'Menos' : 'Más'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {expandedCitas.has(cita.id) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-medium text-gray-900 mb-1">
                              Información del Paciente
                            </h4>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>Nombre: {cita.paciente?.nombre} {cita.paciente?.apellido}</div>
                              <div>Teléfono: {cita.paciente?.telefono_movil}</div>
                              <div>Email: {cita.paciente?.email}</div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-gray-900 mb-1">
                              Detalles de la Cita
                            </h4>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>Tratamiento: {cita.tratamiento}</div>
                              <div>Doctor: Dr. {cita.doctor?.nombre} {cita.doctor?.apellido}</div>
                              <div>Estado: {getEstadoLabel(cita.estado)}</div>
                            </div>
                          </div>
                        </div>
                        
                        {cita.notas && (
                          <div className="mt-3">
                            <h4 className="text-xs font-medium text-gray-900 mb-1">
                              Notas
                            </h4>
                            <p className="text-xs text-gray-600">{cita.notas}</p>
                          </div>
                        )}

                        <div className="mt-3 flex space-x-2">
                          <Link
                            href={`/clinica/agenda/${cita.id}`}
                            className="text-xs bg-navy-600 text-white px-2 py-1 rounded hover:bg-navy-700"
                          >
                            Ver Detalle
                          </Link>
                          <button className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700">
                            Editar
                          </button>
                          <button className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                            <ChatBubbleLeftIcon className="h-3 w-3 mr-1 inline" />
                            WhatsApp
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Total de citas hoy: {citas.length}
                </div>
                <div className="flex space-x-3">
                  <Link
                    href="/clinica/agenda"
                    className="btn-secondary text-sm"
                  >
                    Ver Agenda Completa
                  </Link>
                  <Link
                    href="/clinica/agenda/nueva"
                    className="btn-primary text-sm"
                  >
                    Nueva Cita
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}