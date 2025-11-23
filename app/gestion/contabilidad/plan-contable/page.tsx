'use client'

import React, { useState, useEffect } from 'react'
import { 
  DocumentChartBarIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  AdjustmentsHorizontalIcon,
  BanknotesIcon,
  CurrencyEuroIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

import { contabilidadService, CuentaContable } from '@/services/contabilidad'

// =====================================================
// INTERFACES LOCALES
// =====================================================

interface CuentaConSaldo extends CuentaContable {
  saldo_actualizado?: number
}

// =====================================================
// COMPONENTE DETALLE CUENTA
// =====================================================

const DetalleCuentaModal = ({ 
  cuenta, 
  isOpen, 
  onClose 
}: {
  cuenta: CuentaConSaldo | null
  isOpen: boolean
  onClose: () => void
}) => {
  const [movimientos, setMovimientos] = useState<any[]>([])

  useEffect(() => {
    if (isOpen && cuenta) {
      // Cargar movimientos de la cuenta
      contabilidadService.obtenerAsientos({
        cuenta_contable: cuenta.codigo_cuenta,
        limite: 50
      }).then(setMovimientos).catch(console.error)
    }
  }, [isOpen, cuenta])

  if (!isOpen || !cuenta) return null

  const formatearMoneda = (cantidad: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(cantidad)
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const obtenerColorTipoCuenta = (tipo: string) => {
    switch (tipo) {
      case 'activo': return 'text-blue-600 bg-blue-100'
      case 'pasivo': return 'text-red-600 bg-red-100'
      case 'ingresos': return 'text-green-600 bg-green-100'
      case 'gastos': return 'text-orange-600 bg-orange-100'
      case 'patrimonio': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {cuenta.codigo_cuenta} - {cuenta.nombre_cuenta}
              </h3>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${obtenerColorTipoCuenta(cuenta.tipo_cuenta)}`}>
                  {cuenta.tipo_cuenta.toUpperCase()}
                </span>
                <span className="text-sm text-gray-600">
                  Saldo Actual: <span className="font-semibold">{formatearMoneda(cuenta.saldo_actual || 0)}</span>
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
            >
              <span className="sr-only">Cerrar</span>
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Información de la cuenta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Saldo Inicial</h4>
              <p className="text-2xl font-bold text-gray-900">
                {formatearMoneda(cuenta.saldo_inicial || 0)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Saldo Actual</h4>
              <p className="text-2xl font-bold text-gray-900">
                {formatearMoneda(cuenta.saldo_actual || 0)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Variación</h4>
              <p className={`text-2xl font-bold ${
                (cuenta.saldo_actual || 0) >= (cuenta.saldo_inicial || 0) ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatearMoneda((cuenta.saldo_actual || 0) - (cuenta.saldo_inicial || 0))}
              </p>
            </div>
          </div>

          {/* Movimientos recientes */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Movimientos Recientes ({movimientos.length})
            </h4>
            {movimientos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Debe
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Haber
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {movimientos.map((movimiento, index) => (
                      <tr key={movimiento.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatearFecha(movimiento.fecha_asiento)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {movimiento.numero_asiento}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                          {movimiento.descripcion}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            movimiento.tipo_asiento === 'ingresos' ? 'bg-green-100 text-green-800' :
                            movimiento.tipo_asiento === 'gastos' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {movimiento.tipo_asiento?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">
                          {movimiento.debe > 0 ? formatearMoneda(movimiento.debe) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">
                          {movimiento.haber > 0 ? formatearMoneda(movimiento.haber) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BanknotesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>No hay movimientos registrados para esta cuenta</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function PlanContablePage() {
  // Estados principales
  const [cuentas, setCuentas] = useState<CuentaConSaldo[]>([])
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaConSaldo | null>(null)
  const [mostrarDetalle, setMostrarDetalle] = useState(false)
  const [cargando, setCargando] = useState(true)

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    tipo_cuenta: '',
    mostrar_saldo_cero: false
  })

  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Estados de resumen
  const [resumenPorTipo, setResumenPorTipo] = useState<{[key: string]: number}>({})

  // Efecto de carga inicial
  useEffect(() => {
    cargarPlanContable()
  }, [filtros])

  // Función para cargar plan contable
  const cargarPlanContable = async () => {
    try {
      setCargando(true)
      const data = await contabilidadService.obtenerPlanContable()
      
      // Calcular saldos actuales para cada cuenta
      const cuentasConSaldos = await Promise.all(
        data.map(async (cuenta) => {
          const saldo = await contabilidadService.obtenerSaldoCuenta(cuenta.codigo_cuenta)
          return {
            ...cuenta,
            saldo_actual: cuenta.saldo_actual || 0 + saldo,
            saldo_actualizado: saldo
          }
        })
      )
      
      setCuentas(cuentasConSaldos)

      // Calcular resumen por tipo
      const resumen: {[key: string]: number} = {}
      cuentasConSaldos.forEach(cuenta => {
        if (!resumen[cuenta.tipo_cuenta]) {
          resumen[cuenta.tipo_cuenta] = 0
        }
        resumen[cuenta.tipo_cuenta] += cuenta.saldo_actual || 0
      })
      setResumenPorTipo(resumen)

    } catch (error) {
      console.error('Error cargando plan contable:', error)
    } finally {
      setCargando(false)
    }
  }

  // Función para ver detalle de cuenta
  const verDetalleCuenta = (cuenta: CuentaConSaldo) => {
    setCuentaSeleccionada(cuenta)
    setMostrarDetalle(true)
  }

  // Formatear moneda
  const formatearMoneda = (cantidad: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(cantidad)
  }

  // Filtrar cuentas
  const cuentasFiltradas = cuentas.filter(cuenta => {
    const coincideBusqueda = !filtros.busqueda || 
      cuenta.codigo_cuenta.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      cuenta.nombre_cuenta.toLowerCase().includes(filtros.busqueda.toLowerCase())

    const coincideTipo = !filtros.tipo_cuenta || cuenta.tipo_cuenta === filtros.tipo_cuenta

    const noMostrarCero = !filtros.mostrar_saldo_cero || 
      (cuenta.saldo_actual || 0) !== 0

    return coincideBusqueda && coincideTipo && noMostrarCero
  })

  // Obtener color por tipo de cuenta
  const obtenerColorTipoCuenta = (tipo: string) => {
    switch (tipo) {
      case 'activo': return 'text-blue-600 bg-blue-100'
      case 'pasivo': return 'text-red-600 bg-red-100'
      case 'ingresos': return 'text-green-600 bg-green-100'
      case 'gastos': return 'text-orange-600 bg-orange-100'
      case 'patrimonio': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const obtenerIconoTipoCuenta = (tipo: string) => {
    switch (tipo) {
      case 'activo': return '💰'
      case 'pasivo': return '💳'
      case 'ingresos': return '📈'
      case 'gastos': return '📉'
      case 'patrimonio': return '🏛️'
      default: return '💼'
    }
  }

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
              📊 Plan Contable
            </h1>
            <p className="text-lg text-gray-600">
              Catálogo de cuentas contables con saldos actualizados en tiempo real
            </p>
          </div>
        </div>
      </div>

      {/* Resumen por tipos */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {Object.entries(resumenPorTipo).map(([tipo, total]) => (
          <div key={tipo} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 capitalize">{tipo}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatearMoneda(total)}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-2xl mr-2">
                    {obtenerIconoTipoCuenta(tipo)}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${obtenerColorTipoCuenta(tipo)}`}>
                    {tipo.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
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
                placeholder="Buscar por código o nombre de cuenta..."
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Cuenta
                </label>
                <select
                  value={filtros.tipo_cuenta}
                  onChange={(e) => setFiltros({...filtros, tipo_cuenta: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los tipos</option>
                  <option value="activo">Activo</option>
                  <option value="pasivo">Pasivo</option>
                  <option value="ingresos">Ingresos</option>
                  <option value="gastos">Gastos</option>
                  <option value="patrimonio">Patrimonio</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="mostrar_saldo_cero"
                  checked={filtros.mostrar_saldo_cero}
                  onChange={(e) => setFiltros({...filtros, mostrar_saldo_cero: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="mostrar_saldo_cero" className="ml-2 block text-sm text-gray-700">
                  Mostrar solo cuentas con saldo
                </label>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFiltros({
                    busqueda: '',
                    tipo_cuenta: '',
                    mostrar_saldo_cero: false
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

      {/* Tabla del plan contable */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Plan Contable ({cuentasFiltradas.length} cuentas)
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <ChartBarIcon className="w-4 h-4" />
              <span>Actualización en tiempo real</span>
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando plan contable...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre de la Cuenta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo Inicial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variación
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cuentasFiltradas.length > 0 ? (
                  cuentasFiltradas.map((cuenta, index) => {
                    const variacion = (cuenta.saldo_actual || 0) - (cuenta.saldo_inicial || 0)
                    const saldoActual = cuenta.saldo_actual || 0
                    
                    return (
                      <tr key={cuenta.id || index} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900">
                          {cuenta.codigo_cuenta}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{cuenta.nombre_cuenta}</div>
                            {cuenta.subcuenta && (
                              <div className="text-xs text-gray-500">{cuenta.subcuenta}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{obtenerIconoTipoCuenta(cuenta.tipo_cuenta)}</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${obtenerColorTipoCuenta(cuenta.tipo_cuenta)}`}>
                              {cuenta.tipo_cuenta.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                          {formatearMoneda(cuenta.saldo_inicial || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                          <span className={`font-semibold ${saldoActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatearMoneda(saldoActual)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <div className={`font-mono ${variacion >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {variacion >= 0 ? '+' : ''}{formatearMoneda(variacion)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => verDetalleCuenta(cuenta)}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150 flex items-center"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            Ver
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <DocumentChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium">No se encontraron cuentas</p>
                      <p className="text-sm">Ajusta los filtros de búsqueda</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalle de cuenta */}
      <DetalleCuentaModal
        cuenta={cuentaSeleccionada}
        isOpen={mostrarDetalle}
        onClose={() => {
          setMostrarDetalle(false)
          setCuentaSeleccionada(null)
        }}
      />
    </div>
  )
}
