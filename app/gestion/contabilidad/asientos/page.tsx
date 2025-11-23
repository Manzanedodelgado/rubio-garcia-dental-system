'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  BanknotesIcon, 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'

import { contabilidadService, AsientoContable } from '@/services/contabilidad'

// =====================================================
// COMPONENTES LOCALES
// =====================================================

// Modal para crear/editar asiento
const AsientoModal = ({ 
  asiento, 
  isOpen, 
  onClose, 
  onSave 
}: {
  asiento?: AsientoContable
  isOpen: boolean
  onClose: () => void
  onSave: (asiento: AsientoContable) => void
}) => {
  const [formData, setFormData] = useState<Omit<AsientoContable, 'id' | 'numero_asiento' | 'created_at' | 'updated_at'>>({
    fecha_asiento: new Date().toISOString().split('T')[0],
    descripcion: '',
    tipo_asiento: 'diario',
    cuenta_contable: '',
    debe: 0,
    haber: 0,
    concepto: '',
    referencia_documento: '',
    paciente_id: undefined,
    factura_id: undefined
  })

  const [cuentasContables, setCuentasContables] = useState<any[]>([])
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Cargar cuentas contables
      contabilidadService.obtenerPlanContable()
        .then(setCuentasContables)
        .catch(console.error)

      if (asiento) {
        setFormData({
          fecha_asiento: asiento.fecha_asiento,
          descripcion: asiento.descripcion,
          tipo_asiento: asiento.tipo_asiento,
          cuenta_contable: asiento.cuenta_contable,
          debe: asiento.debe,
          haber: asiento.haber,
          concepto: asiento.concepto || '',
          referencia_documento: asiento.referencia_documento || '',
          paciente_id: asiento.paciente_id,
          factura_id: asiento.factura_id
        })
      }
    }
  }, [isOpen, asiento])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)

    try {
      await onSave(formData as AsientoContable)
      onClose()
    } catch (error) {
      console.error('Error guardando asiento:', error)
    } finally {
      setGuardando(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {asiento ? 'Editar Asiento' : 'Nuevo Asiento Contable'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fecha del asiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha del Asiento *
              </label>
              <input
                type="date"
                value={formData.fecha_asiento}
                onChange={(e) => setFormData({...formData, fecha_asiento: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Tipo de asiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Asiento *
              </label>
              <select
                value={formData.tipo_asiento}
                onChange={(e) => setFormData({...formData, tipo_asiento: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="diario">Diario</option>
                <option value="ingresos">Ingresos</option>
                <option value="gastos">Gastos</option>
                <option value="iva">IVA</option>
                <option value="amortizacion">Amortización</option>
                <option value="cierre">Cierre</option>
              </select>
            </div>

            {/* Cuenta contable */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuenta Contable *
              </label>
              <select
                value={formData.cuenta_contable}
                onChange={(e) => setFormData({...formData, cuenta_contable: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar cuenta</option>
                {cuentasContables.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.codigo_cuenta}>
                    {cuenta.codigo_cuenta} - {cuenta.nombre_cuenta}
                  </option>
                ))}
              </select>
            </div>

            {/* Importe Debe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Importe Debe (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.debe}
                onChange={(e) => setFormData({...formData, debe: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Importe Haber */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Importe Haber (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.haber}
                onChange={(e) => setFormData({...formData, haber: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Referencia documento */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referencia Documento
              </label>
              <input
                type="text"
                value={formData.referencia_documento || ''}
                onChange={(e) => setFormData({...formData, referencia_documento: e.target.value})}
                placeholder="FACT-2025-000001, COBRO-123, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción del Asiento *
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción detallada del movimiento contable..."
              required
            />
          </div>

          {/* Concepto */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Concepto Adicional
            </label>
            <textarea
              value={formData.concepto || ''}
              onChange={(e) => setFormData({...formData, concepto: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Concepto adicional o notas..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-150"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50 flex items-center"
            >
              {guardando && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {asiento ? 'Actualizar' : 'Crear'} Asiento
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function AsientosContablesPage() {
  // Estados principales
  const [asientos, setAsientos] = useState<AsientoContable[]>([])
  const [asientoSeleccionado, setAsientoSeleccionado] = useState<AsientoContable | null>(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [cargando, setCargando] = useState(true)

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo_asiento: '',
    fecha_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    cuenta_contable: ''
  })

  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Efecto de carga inicial
  useEffect(() => {
    cargarAsientos()
  }, [filtros])

  // Función para cargar asientos
  const cargarAsientos = async () => {
    try {
      setCargando(true)
      const filtrosService: any = {}
      
      if (filtros.fecha_inicio) filtrosService.fecha_inicio = filtros.fecha_inicio
      if (filtros.fecha_fin) filtrosService.fecha_fin = filtros.fecha_fin
      if (filtros.tipo_asiento) filtrosService.tipo_asiento = filtros.tipo_asiento
      if (filtros.cuenta_contable) filtrosService.cuenta_contable = filtros.cuenta_contable

      const data = await contabilidadService.obtenerAsientos(filtrosService)
      setAsientos(data)
    } catch (error) {
      console.error('Error cargando asientos:', error)
    } finally {
      setCargando(false)
    }
  }

  // Función para guardar asiento
  const guardarAsiento = async (asientoData: AsientoContable) => {
    try {
      if (asientoSeleccionado) {
        // Actualizar asiento existente
        const actualizado = await contabilidadService.actualizarAsiento(asientoSeleccionado.id!, asientoData)
        setAsientos(asientos.map(a => a.id === asientoSeleccionado.id ? actualizado : a))
      } else {
        // Crear nuevo asiento
        const nuevo = await contabilidadService.crearAsiento(asientoData)
        setAsientos([nuevo, ...asientos])
      }
    } catch (error) {
      console.error('Error guardando asiento:', error)
      throw error
    }
  }

  // Función para eliminar asiento
  const eliminarAsiento = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este asiento contable?')) {
      return
    }

    try {
      await contabilidadService.eliminarAsiento(id)
      setAsientos(asientos.filter(a => a.id !== id))
    } catch (error) {
      console.error('Error eliminando asiento:', error)
      alert('Error al eliminar el asiento')
    }
  }

  // Función para abrir modal de edición
  const editarAsiento = (asiento: AsientoContable) => {
    setAsientoSeleccionado(asiento)
    setMostrarModal(true)
  }

  // Función para abrir modal de creación
  const crearAsiento = () => {
    setAsientoSeleccionado(null)
    setMostrarModal(true)
  }

  // Función para exportar datos
  const exportarAsientos = async () => {
    try {
      const csvData = await contabilidadService.exportarContabilidad('csv', filtros)
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `asientos_contables_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exportando asientos:', error)
    }
  }

  // Formatear moneda
  const formatearMoneda = (cantidad: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(cantidad)
  }

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Filtrar asientos por búsqueda
  const asientosFiltrados = asientos.filter(asiento => {
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase()
      return (
        asiento.numero_asiento.toLowerCase().includes(busqueda) ||
        asiento.descripcion.toLowerCase().includes(busqueda) ||
        asiento.concepto?.toLowerCase().includes(busqueda) ||
        asiento.referencia_documento?.toLowerCase().includes(busqueda)
      )
    }
    return true
  })

  // =====================================================
  // COMPONENTE PRINCIPAL
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🏦 Asientos Contables
            </h1>
            <p className="text-lg text-gray-600">
              Gestión completa de movimientos contables y registros financieros
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={exportarAsientos}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-150 flex items-center"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Exportar CSV
            </button>
            <button
              onClick={crearAsiento}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-150 flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nuevo Asiento
            </button>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Búsqueda */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por número, descripción, concepto..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Botón de filtros */}
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-150"
          >
            <FunnelIcon className="w-5 h-5 mr-2" />
            Filtros
          </button>
        </div>

        {/* Panel de filtros expandible */}
        {mostrarFiltros && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filtros.fecha_inicio}
                  onChange={(e) => setFiltros({...filtros, fecha_inicio: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filtros.fecha_fin}
                  onChange={(e) => setFiltros({...filtros, fecha_fin: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo Asiento
                </label>
                <select
                  value={filtros.tipo_asiento}
                  onChange={(e) => setFiltros({...filtros, tipo_asiento: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los tipos</option>
                  <option value="diario">Diario</option>
                  <option value="ingresos">Ingresos</option>
                  <option value="gastos">Gastos</option>
                  <option value="iva">IVA</option>
                  <option value="amortizacion">Amortización</option>
                  <option value="cierre">Cierre</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFiltros({
                    busqueda: '',
                    tipo_asiento: '',
                    fecha_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                    fecha_fin: new Date().toISOString().split('T')[0],
                    cuenta_contable: ''
                  })}
                  className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-150"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de asientos */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Asientos Contables ({asientosFiltrados.length})
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CalendarIcon className="w-4 h-4" />
              <span>Período: {formatearFecha(filtros.fecha_inicio)} - {formatearFecha(filtros.fecha_fin)}</span>
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando asientos contables...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cuenta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Haber
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {asientosFiltrados.length > 0 ? (
                  asientosFiltrados.map((asiento, index) => (
                    <tr key={asiento.id || index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {asiento.numero_asiento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatearFecha(asiento.fecha_asiento)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        <div>
                          <div className="font-medium">{asiento.descripcion}</div>
                          {asiento.concepto && (
                            <div className="text-xs text-gray-500 truncate">{asiento.concepto}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          asiento.tipo_asiento === 'ingresos' ? 'bg-green-100 text-green-800' :
                          asiento.tipo_asiento === 'gastos' ? 'bg-red-100 text-red-800' :
                          asiento.tipo_asiento === 'iva' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {asiento.tipo_asiento.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {asiento.cuenta_contable}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                        {asiento.debe > 0 ? formatearMoneda(asiento.debe) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                        {asiento.haber > 0 ? formatearMoneda(asiento.haber) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/gestion/asientos/${asiento.id}`}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => editarAsiento(asiento)}
                            className="text-yellow-600 hover:text-yellow-900 transition-colors duration-150"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminarAsiento(asiento.id!)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <BanknotesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium">No se encontraron asientos</p>
                      <p className="text-sm">Ajusta los filtros o crea un nuevo asiento</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de asiento */}
      <AsientoModal
        asiento={asientoSeleccionado || undefined}
        isOpen={mostrarModal}
        onClose={() => {
          setMostrarModal(false)
          setAsientoSeleccionado(null)
        }}
        onSave={guardarAsiento}
      />
    </div>
  )
}
