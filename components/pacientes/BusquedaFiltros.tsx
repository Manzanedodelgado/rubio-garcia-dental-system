'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, X, Calendar, User, Phone, Mail } from 'lucide-react'
import { PacienteFilters } from '@/types'

interface BusquedaFiltrosProps {
  filters: PacienteFilters
  onFiltersChange: (filters: PacienteFilters) => void
  onReset: () => void
  loading?: boolean
}

export function BusquedaFiltros({ filters, onFiltersChange, onReset, loading = false }: BusquedaFiltrosProps) {
  const [localFilters, setLocalFilters] = useState<PacienteFilters>(filters)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Actualizar filtros locales cuando cambien los filtros del padre
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleSearchChange = (search: string) => {
    const newFilters = { ...localFilters, search, offset: 0 }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleEstadoChange = (estado: 'activo' | 'inactivo' | undefined) => {
    const newFilters = { ...localFilters, estado, offset: 0 }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleFechaRegistroChange = (campo: 'desde' | 'hasta', valor: string) => {
    const newFilters = { 
      ...localFilters, 
      [`fechaRegistro${campo === 'desde' ? 'Desde' : 'Hasta'}`]: valor || undefined,
      offset: 0 
    }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleLimitChange = (limit: number) => {
    const newFilters = { ...localFilters, limit, offset: 0 }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const limpiarFiltros = () => {
    setLocalFilters({ search: '', estado: 'activo', limit: 20 })
    onReset()
  }

  const tieneFiltrosActivos = localFilters.search || 
    localFilters.fechaRegistroDesde || 
    localFilters.fechaRegistroHasta || 
    localFilters.estado !== 'activo'

  return (
    <div className="space-y-4">
      {/* Búsqueda principal */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Campo de búsqueda */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI, teléfono, email o número de paciente..."
            value={localFilters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* Botón de filtros avanzados */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            showAdvanced ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {tieneFiltrosActivos && (
            <span className="bg-blue-500 text-white text-xs rounded-full w-2 h-2"></span>
          )}
        </button>
      </div>

      {/* Filtros básicos (siempre visibles) */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Estado:</label>
          <select
            value={localFilters.estado || 'activo'}
            onChange={(e) => handleEstadoChange(e.target.value as 'activo' | 'inactivo' | undefined)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
            <option value="">Todos</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Mostrar:</label>
          <select
            value={localFilters.limit || 20}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
        </div>

        {tieneFiltrosActivos && (
          <button
            onClick={limpiarFiltros}
            className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            disabled={loading}
          >
            <X className="h-3 w-3" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por fecha de registro desde */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4" />
                Fecha de registro desde:
              </label>
              <input
                type="date"
                value={localFilters.fechaRegistroDesde || ''}
                onChange={(e) => handleFechaRegistroChange('desde', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Filtro por fecha de registro hasta */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4" />
                Fecha de registro hasta:
              </label>
              <input
                type="date"
                value={localFilters.fechaRegistroHasta || ''}
                onChange={(e) => handleFechaRegistroChange('hasta', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          {/* Búsquedas rápidas por campos específicos */}
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Búsquedas rápidas:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSearchChange('Dr.')}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                disabled={loading}
              >
                <User className="h-3 w-3" />
                Dr.
              </button>
              <button
                onClick={() => handleSearchChange('666')}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                disabled={loading}
              >
                <Phone className="h-3 w-3" />
                666
              </button>
              <button
                onClick={() => handleSearchChange('@')}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                disabled={loading}
              >
                <Mail className="h-3 w-3" />
                Con email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}