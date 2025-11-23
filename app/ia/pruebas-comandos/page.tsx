'use client'

// ===============================================
// PÁGINA DE PRUEBA AVANZADA COMANDOS IA
// Sistema de Gestión Integral - Rubio García Dental
// ===============================================

import React, { useState, useCallback } from 'react'
import useWidgetIA from '@/hooks/useWidgetIA'
import {
  PlayIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CommandLineIcon,
  SparklesIcon,
  BeakerIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CloudArrowDownIcon,
  ClipboardDocumentIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface ResultadoPrueba {
  id: string
  comando: string
  resultado: any
  tiempo: number
  timestamp: Date
  categoria: string
  exito: boolean
  parametros_extraidos?: any
}

interface PruebaConfig {
  velocidad_prueba: 'lento' | 'normal' | 'rapido'
  mostrar_parametros: boolean
  mostrar_debug: boolean
  categorias_seleccionadas: string[]
  comandos_personalizados: string[]
}

const PruebaComandosIA: React.FC = () => {
  const [resultados, setResultados] = useState<ResultadoPrueba[]>([])
  const [pruebaEnProgreso, setPruebaEnProgreso] = useState(false)
  const [configPrueba, setConfigPrueba] = useState<PruebaConfig>({
    velocidad_prueba: 'normal',
    mostrar_parametros: true,
    mostrar_debug: false,
    categorias_seleccionadas: ['todos'],
    comandos_personalizados: []
  })

  const widgetIA = useWidgetIA({
    configuracionInicial: {
      modo_desarrollador: true
    }
  })

  const comandosPrueba = [
    // Citas y Agenda
    {
      categoria: 'Crear Citas',
      comandos: [
        'Crea una cita para Manuel Rodriguez Rodriguez el dia 17 de diciembre para una reconstruccion que dure 30 min',
        'Agendar cita para Maria Garcia Toledo el 20 de enero para una endodoncia',
        'Nueva cita el viernes para control de ortodoncia',
        'Programar cita urgente para Juan Perez hoy mismo',
        'Crear cita mañana a las 16:00 para una higiene dental'
      ]
    },
    // Comunicación
    {
      categoria: 'Enviar Mensajes',
      comandos: [
        'Manda una mensaje a Maria Garcia Toledo y preguntale si se puede venir a las 16.30h',
        'Enviar mensaje a Juan Perez sobre la cita de mañana',
        'SMS a Carmen Pardo confirmando su cita',
        'Contactar a Ana Lopez sobre el tratamiento pendiente',
        'Escribir a Roberto Martinez preguntando por su disponibilidad'
      ]
    },
    // Consultas
    {
      categoria: 'Consultas',
      comandos: [
        'Que dia tiene cita Carmen Pardo Pardo?',
        'Cuando tiene cita Manuel Rodriguez?',
        'Que fecha tiene la próxima cita Juan Garcia?',
        'Cuántas citas tiene Ana Lopez este mes?',
        'Buscar citas de la próxima semana'
      ]
    },
    // Búsqueda de Pacientes
    {
      categoria: 'Pacientes',
      comandos: [
        'Busca al paciente Maria Garcia',
        'Buscar paciente Ana Rodriguez Lopez',
        'Encontrar datos de Juan Carlos Garcia',
        'Localizar a Carmen Fernandez',
        'Buscar por teléfono 916410841'
      ]
    },
    // Disponibilidad
    {
      categoria: 'Disponibilidad',
      comandos: [
        'Cuando tienes libre el viernes?',
        'Que disponibilidad hay mañana?',
        'Que citas tienes para el lunes?',
        'Disponible el jueves a las 17:00?',
        'Horarios libres esta semana'
      ]
    },
    // Urgencias
    {
      categoria: 'Urgencias',
      comandos: [
        'Crear cita urgente para dolor de muelas',
        'Contactar paciente urgentemente sobre sangrado',
        'Programar emergencia para hoy mismo',
        'Enviar mensaje urgente a Maria Garcia',
        'Reservar hueco para urgencia'
      ]
    }
  ]

  const ejecutarComandoPrueba = useCallback(async (
    comando: string,
    categoria: string
  ): Promise<ResultadoPrueba> => {
    const tiempoInicio = Date.now()
    
    try {
      const resultado = await widgetIA.procesarComando(comando, { 
        mostrarProgreso: false,
        silencioso: true
      })
      
      const tiempoTotal = Date.now() - tiempoInicio
      
      return {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        comando,
        resultado,
        tiempo: tiempoTotal,
        timestamp: new Date(),
        categoria,
        exito: resultado.exito,
        parametros_extraidos: {} // Se podría extraer del resultado
      }
    } catch (error) {
      const tiempoTotal = Date.now() - tiempoInicio
      
      return {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        comando,
        resultado: { 
          exito: false, 
          respuesta: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}` 
        },
        tiempo: tiempoTotal,
        timestamp: new Date(),
        categoria,
        exito: false
      }
    }
  }, [widgetIA])

  const ejecutarSuitePruebas = useCallback(async () => {
    if (pruebaEnProgreso) return
    
    setPruebaEnProgreso(true)
    setResultados([])

    const velocidadDelay = {
      lento: 2000,
      normal: 1000,
      rapido: 300
    }[configPrueba.velocidad_prueba]

    try {
      for (const suite of comandosPrueba) {
        if (configPrueba.categorias_seleccionadas.includes('todos') || 
            configPrueba.categorias_seleccionadas.includes(suite.categoria)) {
          
          for (const comando of suite.comandos) {
            // Verificar si es comando personalizado
            const esPersonalizado = configPrueba.comandos_personalizados.includes(comando)
            
            if (!esPersonalizado || configPrueba.comandos_personalizados.length === 0) {
              const resultado = await ejecutarComandoPrueba(comando, suite.categoria)
              
              setResultados(prev => [...prev, resultado])
              
              // Delay entre pruebas
              if (configPrueba.velocidad_prueba !== 'rapido') {
                await new Promise(resolve => setTimeout(resolve, velocidadDelay))
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error ejecutando suite de pruebas:', error)
    } finally {
      setPruebaEnProgreso(false)
    }
  }, [pruebaEnProgreso, configPrueba, comandosPrueba, ejecutarComandoPrueba])

  const limpiarResultados = useCallback(() => {
    setResultados([])
  }, [])

  const exportarResultados = useCallback(() => {
    const datos = {
      fecha_prueba: new Date().toISOString(),
      configuracion: configPrueba,
      estadisticas: calcularEstadisticas(),
      resultados: resultados,
      resumen: {
        total_comandos: resultados.length,
        exitosos: resultados.filter(r => r.exito).length,
        fallidos: resultados.filter(r => !r.exito).length,
        tiempo_promedio: resultados.reduce((acc, r) => acc + r.tiempo, 0) / resultados.length,
        categorias: [...new Set(resultados.map(r => r.categoria))]
      }
    }

    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prueba-comandos-ia-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [resultados, configPrueba])

  const calcularEstadisticas = useCallback(() => {
    if (resultados.length === 0) return null

    const total = resultados.length
    const exitosos = resultados.filter(r => r.exito).length
    const fallidos = total - exitosos
    const tiempoPromedio = resultados.reduce((acc, r) => acc + r.tiempo, 0) / total

    const porCategoria = resultados.reduce((acc, r) => {
      acc[r.categoria] = acc[r.categoria] || { total: 0, exitosos: 0, fallidos: 0 }
      acc[r.categoria].total++
      if (r.exito) acc[r.categoria].exitosos++
      else acc[r.categoria].fallidos++
      return acc
    }, {} as Record<string, { total: number; exitosos: number; fallidos: number }>)

    const velocidad = resultados.reduce((acc, r) => {
      if (r.tiempo < 1000) acc.rapido++
      else if (r.tiempo < 3000) acc.normal++
      else acc.lento++
      return acc
    }, { rapido: 0, normal: 0, lento: 0 })

    return {
      total,
      exitosos,
      fallidos,
      precision: Math.round((exitosos / total) * 100),
      tiempo_promedio: Math.round(tiempoPromedio),
      por_categoria: porCategoria,
      velocidad
    }
  }, [resultados])

  const copiarComando = useCallback((comando: string) => {
    navigator.clipboard.writeText(comando)
  }, [])

  const renderEstadisticas = () => {
    const stats = calcularEstadisticas()
    
    if (!stats) return null

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <ChartBarIcon className="w-6 h-6" />
          <span>Estadísticas de Pruebas</span>
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">Total Comandos</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900">Exitosos</p>
            <p className="text-2xl font-bold text-green-600">{stats.exitosos}</p>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm font-medium text-red-900">Fallidos</p>
            <p className="text-2xl font-bold text-red-600">{stats.fallidos}</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-900">Precisión</p>
            <p className="text-2xl font-bold text-purple-600">{stats.precision}%</p>
          </div>
        </div>

        {/* Estadísticas por categoría */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Por Categoría</h3>
            <div className="space-y-2">
              {Object.entries(stats.por_categoria).map(([categoria, data]) => (
                <div key={categoria} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-700">{categoria}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-green-600">✅ {data.exitosos}</span>
                    <span className="text-xs text-red-600">❌ {data.fallidos}</span>
                    <span className="text-xs text-gray-500">({data.total})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Velocidad de Respuesta</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">Rápido (&lt;1s)</span>
                <span className="text-sm font-medium text-green-600">{stats.velocidad.rapido}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">Normal (1-3s)</span>
                <span className="text-sm font-medium text-yellow-600">{stats.velocidad.normal}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">Lento (&gt;3s)</span>
                <span className="text-sm font-medium text-red-600">{stats.velocidad.lento}</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                ⏱️ Tiempo promedio: <span className="font-medium">{stats.tiempo_promedio}ms</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderResultado = (resultado: ResultadoPrueba) => (
    <div key={resultado.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              resultado.exito ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {resultado.exito ? (
                <CheckCircleIcon className="w-3 h-3 mr-1" />
              ) : (
                <XCircleIcon className="w-3 h-3 mr-1" />
              )}
              {resultado.categoria}
            </span>
            
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-100 text-gray-700">
              <ClockIcon className="w-3 h-3 mr-1" />
              {resultado.tiempo}ms
            </span>
          </div>
          
          <p className="text-sm font-medium text-gray-900 mb-1">
            "{resultado.comando}"
          </p>
          
          <p className="text-sm text-gray-600 line-clamp-2">
            {resultado.resultado.respuesta}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => copiarComando(resultado.comando)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Copiar comando"
          >
            <ClipboardDocumentIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {configPrueba.mostrar_debug && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              Ver detalles técnicos
            </summary>
            <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
              {JSON.stringify(resultado.resultado, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
            <BeakerIcon className="w-8 h-8 text-blue-600" />
            <span>Laboratorio de Pruebas IA</span>
          </h1>
          <p className="text-gray-600">
            Prueba exhaustiva del sistema de comandos de IA conversacional
          </p>
        </div>

        {/* Panel de Control */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <CommandLineIcon className="w-6 h-6" />
            <span>Configuración de Pruebas</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Velocidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Velocidad de Prueba
              </label>
              <select
                value={configPrueba.velocidad_prueba}
                onChange={(e) => setConfigPrueba(prev => ({ 
                  ...prev, 
                  velocidad_prueba: e.target.value as any 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="lento">Lento (2s entre comandos)</option>
                <option value="normal">Normal (1s entre comandos)</option>
                <option value="rapido">Rápido (300ms entre comandos)</option>
              </select>
            </div>

            {/* Categorías */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorías a Probar
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configPrueba.categorias_seleccionadas.includes('todos')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setConfigPrueba(prev => ({
                          ...prev,
                          categorias_seleccionadas: ['todos']
                        }))
                      } else {
                        setConfigPrueba(prev => ({
                          ...prev,
                          categorias_seleccionadas: []
                        }))
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Todas las categorías</span>
                </label>
                
                {comandosPrueba.map(suite => (
                  <label key={suite.categoria} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={configPrueba.categorias_seleccionadas.includes(suite.categoria)}
                      onChange={(e) => {
                        setConfigPrueba(prev => {
                          const nuevas = e.target.checked
                            ? [...prev.categorias_seleccionadas.filter(c => c !== 'todos'), suite.categoria]
                            : prev.categorias_seleccionadas.filter(c => c !== suite.categoria)
                          return {
                            ...prev,
                            categorias_seleccionadas: nuevas.length === comandosPrueba.length 
                              ? ['todos'] 
                              : nuevas
                          }
                        })
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{suite.categoria}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Opciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opciones de Visualización
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configPrueba.mostrar_parametros}
                    onChange={(e) => setConfigPrueba(prev => ({
                      ...prev,
                      mostrar_parametros: e.target.checked
                    }))}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Mostrar parámetros</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configPrueba.mostrar_debug}
                    onChange={(e) => setConfigPrueba(prev => ({
                      ...prev,
                      mostrar_debug: e.target.checked
                    }))}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Mostrar debug</span>
                </label>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={ejecutarSuitePruebas}
              disabled={pruebaEnProgreso}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlayIcon className="w-5 h-5" />
              <span>{pruebaEnProgreso ? 'Ejecutando...' : 'Ejecutar Suite de Pruebas'}</span>
            </button>

            <button
              onClick={limpiarResultados}
              disabled={pruebaEnProgreso}
              className="flex items-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5" />
              <span>Limpiar</span>
            </button>

            <button
              onClick={exportarResultados}
              disabled={resultados.length === 0}
              className="flex items-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CloudArrowDownIcon className="w-5 h-5" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        {renderEstadisticas()}

        {/* Comandos Disponibles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📋 Comandos de Prueba Disponibles
          </h2>
          
          <div className="space-y-6">
            {comandosPrueba.map((suite, index) => (
              <div key={index}>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {suite.categoria}
                  <span className="ml-2 text-sm text-gray-500">
                    ({suite.comandos.length} comandos)
                  </span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suite.comandos.map((comando, cmdIndex) => (
                    <div key={cmdIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <p className="text-sm text-gray-700 flex-1 mr-3 line-clamp-2">
                        "{comando}"
                      </p>
                      <button
                        onClick={() => ejecutarComandoPrueba(comando, suite.categoria)}
                        className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        <PlayIcon className="w-3 h-3" />
                        <span>Probar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resultados */}
        {resultados.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📊 Resultados de Pruebas ({resultados.length})
            </h2>
            
            <div className="space-y-4">
              {resultados.map(renderResultado)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PruebaComandosIA