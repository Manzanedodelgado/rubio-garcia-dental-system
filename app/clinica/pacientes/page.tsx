'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Download, Upload, RefreshCw } from 'lucide-react'
import { Paciente, PacienteFilters } from '@/types'
import { PacientesService } from '@/services/pacientes'
import { PacientesTable } from '@/components/pacientes/PacientesTable'
import { PacienteModal } from '@/components/pacientes/PacienteModal'
import { BusquedaFiltros } from '@/components/pacientes/BusquedaFiltros'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [totalPacientes, setTotalPacientes] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false)
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  // Estado para filtros
  const [filters, setFilters] = useState<PacienteFilters>({
    search: '',
    estado: 'activo',
    limit: 20
  })

  // Cargar pacientes iniciales
  useEffect(() => {
    cargarPacientes(true)
  }, [filters])

  const cargarPacientes = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true)
        setCurrentPage(0)
      } else {
        setLoadingMore(true)
      }

      const offset = reset ? 0 : currentPage * (filters.limit || 20)
      const searchFilters = {
        ...filters,
        offset,
        limit: filters.limit
      }

      const resultado = await PacientesService.buscarPacientes(searchFilters)
      
      if (reset) {
        setPacientes(resultado.pacientes)
      } else {
        setPacientes(prev => [...prev, ...resultado.pacientes])
      }

      setTotalPacientes(resultado.total)
      setHasMore(resultado.hasMore)
      setCurrentPage(prev => prev + 1)
    } catch (error) {
      console.error('Error al cargar pacientes:', error)
      // Mostrar notificación de error
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setSearchLoading(false)
    }
  }

  const handleSearch = async (nuevosFiltros: PacienteFilters) => {
    setFilters(nuevosFiltros)
    setSearchLoading(true)
  }

  const handleRecargar = async () => {
    setCurrentPage(0)
    await cargarPacientes(true)
  }

  const handleSync = async () => {
    setSyncLoading(true)
    try {
      await PacientesService.sincronizarConSqlServer()
      // Mostrar notificación de éxito
      await handleRecargar()
    } catch (error) {
      console.error('Error en sincronización:', error)
      // Mostrar notificación de error
    } finally {
      setSyncLoading(false)
    }
  }

  const handleNuevoPaciente = () => {
    setPacienteSeleccionado(null)
    setIsEditing(false)
    setShowModal(true)
  }

  const handleEditarPaciente = (paciente: Paciente) => {
    setPacienteSeleccionado(paciente)
    setIsEditing(true)
    setShowModal(true)
  }

  const handleGuardarPaciente = async (datosPaciente: Omit<Paciente, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (isEditing && pacienteSeleccionado) {
        await PacientesService.actualizarPaciente(pacienteSeleccionado.id, datosPaciente)
      } else {
        const numeroPaciente = await PacientesService.generarNumeroPaciente()
        await PacientesService.crearPaciente({
          ...datosPaciente,
          numero_paciente: numeroPaciente
        })
      }

      await handleRecargar()
      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar paciente:', error)
      throw error
    }
  }

  const handleEliminarPaciente = async (paciente: Paciente) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al paciente ${paciente.nombre} ${paciente.apellido}?`)) {
      return
    }

    try {
      await PacientesService.eliminarPaciente(paciente.id)
      await handleRecargar()
    } catch (error) {
      console.error('Error al eliminar paciente:', error)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Pacientes</h1>
          <p className="text-gray-600 mt-1">
            {totalPacientes} pacientes registrados • Filtrados por {filters.estado || 'todos'}
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSync}
            disabled={syncLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>

          <button
            onClick={handleRecargar}
            disabled={searchLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${searchLoading ? 'animate-spin' : ''}`} />
            Recargar
          </button>

          <button
            onClick={handleNuevoPaciente}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Paciente
          </button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <BusquedaFiltros
          filters={filters}
          onFiltersChange={handleSearch}
          onReset={() => handleSearch({ search: '', estado: 'activo', limit: 20 })}
          loading={searchLoading}
        />
      </div>

      {/* Tabla de pacientes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <PacientesTable
            pacientes={pacientes}
            onEditar={handleEditarPaciente}
            onEliminar={handleEliminarPaciente}
            loading={loadingMore}
            hasMore={hasMore}
            onCargarMas={cargarPacientes}
          />
        )}
      </div>

      {/* Modal de paciente */}
      {showModal && (
        <PacienteModal
          paciente={pacienteSeleccionado}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleGuardarPaciente}
          isEditing={isEditing}
        />
      )}
    </div>
  )
}