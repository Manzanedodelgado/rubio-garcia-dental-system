'use client'

import React from 'react'
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Edit, 
  Trash2, 
  Eye,
  AlertCircle,
  FileText,
  Clock,
  UserCheck,
  History
} from 'lucide-react'
import { Paciente } from '@/types'
import { DIAS_SEMANA } from '@/lib/config'
import { PacientesService } from '@/services/pacientes'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PacientesTableProps {
  pacientes: Paciente[]
  onEditar: (paciente: Paciente) => void
  onEliminar: (paciente: Paciente) => void
  loading?: boolean
  hasMore?: boolean
  onCargarMas?: () => void
}

export function PacientesTable({ 
  pacientes, 
  onEditar, 
  onEliminar, 
  loading = false, 
  hasMore = false, 
  onCargarMas 
}: PacientesTableProps) {
  const [pacienteExpandido, setPacienteExpandido] = useState<string | null>(null)
  const [citasPaciente, setCitasPaciente] = useState<{ [key: string]: any }>({})
  const router = useRouter()

  const irHistoriaClinica = (pacienteId: string) => {
    router.push(`/clinica/historia-clinica?paciente=${pacienteId}`)
  }

  const toggleExpansion = async (pacienteId: string) => {
    if (pacienteExpandido === pacienteId) {
      setPacienteExpandido(null)
      return
    }

    setPacienteExpandido(pacienteId)

    // Cargar citas si no están cargadas
    if (!citasPaciente[pacienteId]) {
      try {
        const [ultimasCitas, proximaCita] = await Promise.all([
          PacientesService.obtenerUltimasCitas(pacienteId),
          PacientesService.obtenerProximaCita(pacienteId)
        ])

        setCitasPaciente(prev => ({
          ...prev,
          [pacienteId]: {
            ultimasCitas,
            proximaCita
          }
        }))
      } catch (error) {
        console.error('Error al cargar citas del paciente:', error)
      }
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatearTelefono = (telefono: string | undefined) => {
    if (!telefono) return '-'
    // Formato español: XXX XXX XXX
    const limpia = telefono.replace(/\D/g, '')
    if (limpia.length === 9) {
      return `${limpia.slice(0, 3)} ${limpia.slice(3, 6)} ${limpia.slice(6)}`
    }
    return telefono
  }

  const tieneAlertasMedicas = (paciente: Paciente) => {
    return !!(paciente.alergias || paciente.medicamentos || paciente.enfermedades)
  }

  const estadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800'
      case 'inactivo':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const consentimientoColor = (estado: string) => {
    switch (estado) {
      case 'firmado':
        return 'bg-green-100 text-green-800'
      case 'sin_firmar':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (pacientes.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pacientes</h3>
        <p className="text-gray-500">
          No se encontraron pacientes con los filtros aplicados.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header de la tabla */}
      <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b text-sm font-medium text-gray-700">
        <div className="col-span-3">Paciente</div>
        <div className="col-span-2">Contacto</div>
        <div className="col-span-2">Dirección</div>
        <div className="col-span-1">Estado</div>
        <div className="col-span-1">LOPD</div>
        <div className="col-span-1">Registro</div>
        <div className="col-span-1">Alertas</div>
        <div className="col-span-1">Acciones</div>
      </div>

      {/* Filas de pacientes */}
      {pacientes.map((paciente) => (
        <div key={paciente.id} className="border-b border-gray-200">
          {/* Fila principal */}
          <div className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors">
            {/* Paciente */}
            <div className="col-span-3">
              <div className="font-medium text-gray-900">
                {paciente.nombre} {paciente.apellido}
              </div>
              <div className="text-sm text-gray-500">
                {paciente.numero_paciente} • {paciente.dni}
              </div>
              {paciente.fecha_nacimiento && (
                <div className="text-xs text-gray-400">
                  {new Date().getFullYear() - new Date(paciente.fecha_nacimiento).getFullYear()} años
                </div>
              )}
            </div>

            {/* Contacto */}
            <div className="col-span-2">
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <Phone className="h-3 w-3" />
                {formatearTelefono(paciente.telefono_movil)}
              </div>
              {paciente.telefono_fijo && (
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                  <Phone className="h-3 w-3" />
                  {formatearTelefono(paciente.telefono_fijo)}
                </div>
              )}
              {paciente.email && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{paciente.email}</span>
                </div>
              )}
            </div>

            {/* Dirección */}
            <div className="col-span-2">
              <div className="flex items-start gap-1 text-sm text-gray-600">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span className="truncate">{paciente.direccion}</span>
              </div>
            </div>

            {/* Estado */}
            <div className="col-span-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${estadoColor(paciente.estado)}`}>
                {paciente.estado === 'activo' ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {/* LOPD */}
            <div className="col-span-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${consentimientoColor(paciente.consentimiento_lopd)}`}>
                {paciente.consentimiento_lopd === 'firmado' ? 'Firmado' : 'Sin firmar'}
              </span>
            </div>

            {/* Registro */}
            <div className="col-span-1">
              <div className="text-sm text-gray-600">
                {formatearFecha(paciente.fecha_registro)}
              </div>
            </div>

            {/* Alertas */}
            <div className="col-span-1">
              {tieneAlertasMedicas(paciente) ? (
                <div className="flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-amber-500" title="Tiene información médica importante" />
                </div>
              ) : (
                <div className="flex items-center justify-center text-gray-300">
                  <AlertCircle className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="col-span-1">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleExpansion(paciente.id)}
                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  title="Ver detalles"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => irHistoriaClinica(paciente.id)}
                  className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                  title="Historia Clínica"
                >
                  <History className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onEditar(paciente)}
                  className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onEliminar(paciente)}
                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Panel expandido con detalles */}
          {pacienteExpandido === paciente.id && (
            <div className="bg-blue-50 p-4 border-t">
              {citasPaciente[paciente.id] ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Información médica */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Información Médica
                    </h4>
                    <div className="space-y-2 text-sm">
                      {paciente.alergias && (
                        <div>
                          <span className="font-medium text-red-700">Alergias:</span>
                          <span className="text-gray-600 ml-2">{paciente.alergias}</span>
                        </div>
                      )}
                      {paciente.enfermedades && (
                        <div>
                          <span className="font-medium text-orange-700">Enfermedades:</span>
                          <span className="text-gray-600 ml-2">{paciente.enfermedades}</span>
                        </div>
                      )}
                      {paciente.medicamentos && (
                        <div>
                          <span className="font-medium text-blue-700">Medicamentos:</span>
                          <span className="text-gray-600 ml-2">{paciente.medicamentos}</span>
                        </div>
                      )}
                      {paciente.preferencias_comunicacion && (
                        <div>
                          <span className="font-medium">Preferencias:</span>
                          <span className="text-gray-600 ml-2">{paciente.preferencias_comunicacion}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Citas */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Historial de Citas
                    </h4>
                    
                    {/* Próxima cita */}
                    {citasPaciente[paciente.id].proximaCita && (
                      <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                          <UserCheck className="h-4 w-4" />
                          Próxima Cita
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatearFecha(citasPaciente[paciente.id].proximaCita.fecha)} - {citasPaciente[paciente.id].proximaCita.hora_inicio}
                          {citasPaciente[paciente.id].proximaCita.doctor && (
                            <span className="ml-2">
                              con {citasPaciente[paciente.id].proximaCita.doctor.nombre} {citasPaciente[paciente.id].proximaCita.doctor.apellido}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Últimas citas */}
                    <div className="space-y-2">
                      {citasPaciente[paciente.id].ultimasCitas.length > 0 ? (
                        citasPaciente[paciente.id].ultimasCitas.map((cita: any) => (
                          <div key={cita.id} className="p-2 bg-white border rounded text-sm">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{formatearFecha(cita.fecha)}</span>
                                <span className="text-gray-600 ml-2">{cita.hora_inicio} - {cita.hora_fin}</span>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${estadoColor(cita.estado)}`}>
                                {cita.estado}
                              </span>
                            </div>
                            {cita.doctor && (
                              <div className="text-gray-600 mt-1">
                                {cita.doctor.nombre} {cita.doctor.apellido}
                              </div>
                            )}
                            {cita.tratamiento && (
                              <div className="text-gray-500 mt-1">
                                {cita.tratamiento}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm italic">No hay citas registradas</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Botón cargar más */}
      {hasMore && (
        <div className="p-4 text-center">
          <button
            onClick={onCargarMas}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Cargar más pacientes'}
          </button>
        </div>
      )}
    </div>
  )
}