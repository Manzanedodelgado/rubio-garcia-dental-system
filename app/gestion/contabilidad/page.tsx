'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  BanknotesIcon, 
  DocumentChartBarIcon, 
  CalculatorIcon,
  ArchiveBoxArrowDownIcon,
  ClockIcon,
  CurrencyEuroIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  EyeIcon,
  PlusIcon,
  Cog6ToothIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesStackIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

import { contabilidadService, AsientoContable, CuentaContable, ArqueoCaja } from '@/services/contabilidad'

// =====================================================
// COMPONENTES LOCALES
// =====================================================

interface EstadisticasContables {
  total_ingresos: number
  total_gastos: number
  resultado_ejercicio: number
  numero_asientos: number
  caja_diaria: number
}

interface ResumenIVA {
  ejercicio: number
  periodo: string
  tipo: string
  total_base: number
  total_cuota: number
  num_operaciones: number
}

export default function ContabilidadPage() {
  // Estados principales
  const [asientosRecientes, setAsientosRecientes] = useState<AsientoContable[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasContables | null>(null)
  const [cargando, setCargando] = useState(true)
  const [fechaActual, setFechaActual] = useState(new Date().toISOString().split('T')[0])

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    fecha_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fecha_fin: fechaActual
  })

  // Efecto de carga inicial
  useEffect(() => {
    cargarDatos()
  }, [filtros])

  // Función para cargar datos
  const cargarDatos = async () => {
    try {
      setCargando(true)
      
      // Cargar asientos recientes
      const asientos = await contabilidadService.obtenerAsientos({
        fecha_inicio: filtros.fecha_inicio,
        fecha_fin: filtros.fecha_fin,
        limite: 10
      })
      setAsientosRecientes(asientos)

      // Cargar estadísticas
      const stats = await contabilidadService.obtenerEstadisticasContables(
        filtros.fecha_inicio,
        filtros.fecha_fin
      )
      setEstadisticas(stats)

    } catch (error) {
      console.error('Error cargando datos contables:', error)
    } finally {
      setCargando(false)
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

  // =====================================================
  // COMPONENTE DE ESTADÍSTICAS
  // =====================================================

  const TarjetaEstadistica = ({ 
    titulo, 
    valor, 
    icono, 
    color, 
    tendencia,
    comparacion 
  }: {
    titulo: string
    valor: string
    icono: React.ComponentType<any>
    color: string
    tendencia?: 'up' | 'down' | 'neutral'
    comparacion?: string
  }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{titulo}</p>
          <p className={`text-3xl font-bold ${color} mt-2`}>{valor}</p>
          {comparacion && (
            <p className="text-xs text-gray-500 mt-1">{comparacion}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          {React.createElement(icono, { className: `w-8 h-8 ${color}` })}
        </div>
      </div>
      {tendencia && (
        <div className="mt-4 flex items-center">
          {tendencia === 'up' && (
            <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
          )}
          {tendencia === 'down' && (
            <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm ${tendencia === 'up' ? 'text-green-600' : tendencia === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
            Comparación con mes anterior
          </span>
        </div>
      )}
    </div>
  )

  // =====================================================
  // COMPONENTE DE ASIENTOS RECIENTES
  // =====================================================

  const AsientoReciente = ({ asiento }: { asiento: AsientoContable }) => (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {asiento.numero_asiento}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatearFecha(asiento.fecha_asiento)}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
        {asiento.descripcion}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          asiento.tipo_asiento === 'ingresos' ? 'bg-green-100 text-green-800' :
          asiento.tipo_asiento === 'gastos' ? 'bg-red-100 text-red-800' :
          asiento.tipo_asiento === 'iva' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {asiento.tipo_asiento.toUpperCase()}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {asiento.cuenta_contable}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
        {asiento.debe > 0 && formatearMoneda(asiento.debe)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
        {asiento.haber > 0 && formatearMoneda(asiento.haber)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Link
          href={`/gestion/asientos/${asiento.id}`}
          className="text-blue-600 hover:text-blue-900 transition-colors duration-150"
        >
          <EyeIcon className="w-4 h-4 inline mr-1" />
          Ver
        </Link>
      </td>
    </tr>
  )

  // =====================================================
  // COMPONENTE PRINCIPAL
  // =====================================================

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando módulo de contabilidad...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Encabezado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🏦 Módulo de Contabilidad
            </h1>
            <p className="text-lg text-gray-600">
              Sistema contable completo con integración Verifactu y AEAT
            </p>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/gestion/asientos"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-150 flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nuevo Asiento
            </Link>
            <Link
              href="/gestion/contabilidad/configuracion"
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-150 flex items-center"
            >
              <Cog6ToothIcon className="w-5 h-5 mr-2" />
              Configuración
            </Link>
          </div>
        </div>
      </div>

      {/* Filtros de fecha */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros de Periodo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div className="flex items-end">
            <button
              onClick={cargarDatos}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-150 flex items-center justify-center"
            >
              <ClockIcon className="w-5 h-5 mr-2" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <TarjetaEstadistica
            titulo="Total Ingresos"
            valor={formatearMoneda(estadisticas.total_ingresos)}
            icono={TrendingUpIcon}
            color="text-green-600"
            tendencia="up"
          />
          <TarjetaEstadistica
            titulo="Total Gastos"
            valor={formatearMoneda(estadisticas.total_gastos)}
            icono={TrendingDownIcon}
            color="text-red-600"
            tendencia="down"
          />
          <TarjetaEstadistica
            titulo="Resultado Ejercicio"
            valor={formatearMoneda(estadisticas.resultado_ejercicio)}
            icono={ChartBarIcon}
            color={estadisticas.resultado_ejercicio >= 0 ? "text-green-600" : "text-red-600"}
          />
          <TarjetaEstadistica
            titulo="Caja Diaria"
            valor={formatearMoneda(estadisticas.caja_diaria)}
            icono={BanknotesStackIcon}
            color="text-blue-600"
          />
          <TarjetaEstadistica
            titulo="Asientos Registrados"
            valor={estadisticas.numero_asientos.toString()}
            icono={DocumentTextIcon}
            color="text-purple-600"
          />
        </div>
      )}

      {/* Módulos principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link 
          href="/gestion/contabilidad/asientos"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200 group"
        >
          <div className="flex items-center justify-between mb-4">
            <BanknotesIcon className="w-12 h-12 text-blue-600 group-hover:text-blue-700 transition-colors duration-200" />
            <ArrowTrendingUpIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
            Asientos Contables
          </h3>
          <p className="text-gray-600 mt-2">
            Registro y gestión de movimientos contables
          </p>
        </Link>

        <Link 
          href="/gestion/contabilidad/plan-contable"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200 group"
        >
          <div className="flex items-center justify-between mb-4">
            <DocumentChartBarIcon className="w-12 h-12 text-green-600 group-hover:text-green-700 transition-colors duration-200" />
            <ChartBarIcon className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition-colors duration-200" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-200">
            Plan Contable
          </h3>
          <p className="text-gray-600 mt-2">
            Catálogo de cuentas y saldos actualizados
          </p>
        </Link>

        <Link 
          href="/gestion/contabilidad/arqueo"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200 group"
        >
          <div className="flex items-center justify-between mb-4">
            <CurrencyEuroIcon className="w-12 h-12 text-yellow-600 group-hover:text-yellow-700 transition-colors duration-200" />
            <CalculatorIcon className="w-6 h-6 text-gray-400 group-hover:text-yellow-600 transition-colors duration-200" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors duration-200">
            Arqueo de Cajas
          </h3>
          <p className="text-gray-600 mt-2">
            Control diario del efectivo y medios de pago
          </p>
        </Link>

        <Link 
          href="/gestion/contabilidad/informes"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200 group"
        >
          <div className="flex items-center justify-between mb-4">
            <ArchiveBoxArrowDownIcon className="w-12 h-12 text-purple-600 group-hover:text-purple-700 transition-colors duration-200" />
            <DocumentTextIcon className="w-6 h-6 text-gray-400 group-hover:text-purple-600 transition-colors duration-200" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-200">
            Informes Financieros
          </h3>
          <p className="text-gray-600 mt-2">
            Balance, P&G, IVA y reportes personalizados
          </p>
        </Link>
      </div>

      {/* Asientos recientes */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Asientos Recientes
            </h3>
            <Link
              href="/gestion/contabilidad/asientos"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-150"
            >
              Ver todos →
            </Link>
          </div>
        </div>
        
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
              {asientosRecientes.length > 0 ? (
                asientosRecientes.map((asiento, index) => (
                  <AsientoReciente key={asiento.id || index} asiento={asiento} />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <BanknotesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium">No hay asientos registrados</p>
                    <p className="text-sm">Crea tu primer asiento contable para comenzar</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
