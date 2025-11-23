'use client'

// ===============================================
// PÁGINA PRINCIPAL WIDGET IA CONVERSACIONAL
// Sistema de Gestión Integral - Rubio García Dental
// ===============================================

import React, { useState, useEffect } from 'react'
import WidgetIAConversacional from '@/components/WidgetIAConversacional'
import useWidgetIA from '@/hooks/useWidgetIA'
import {
  SparklesIcon,
  MicrophoneIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  CloudArrowDownIcon,
  LightBulbIcon,
  CommandLineIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline'

interface EstadisticasWidget {
  comandos_procesados: number
  comandos_exitosos: number
  comandos_fallidos: number
  tiempo_promedio_respuesta: number
  precision: number
  comandos_ejecutados: number
}

const WidgetIAPage: React.FC = () => {
  const [showAdmin, setShowAdmin] = useState(false)
  const [estadisticas, setEstadisticas] = useState<EstadisticasWidget>({
    comandos_procesados: 0,
    comandos_exitosos: 0,
    comandos_fallidos: 0,
    tiempo_promedio_respuesta: 0,
    precision: 0,
    comandos_ejecutados: 0
  })

  const widgetIA = useWidgetIA({
    configuracionInicial: {
      voz_activada: true,
      respuesta_voz: false,
      mostrar_estadisticas: true,
      modo_desarrollador: false
    },
    onComandoEjecutado: (resultado, comando) => {
      console.log('Comando ejecutado:', { resultado, comando })
    },
    onEstadisticasActualizadas: (stats) => {
      setEstadisticas(stats)
    }
  })

  const [comandosDemo] = useState([
    {
      titulo: 'Crear Cita',
      comando: 'Crea una cita para Manuel Rodriguez Rodriguez el dia 17 de diciembre para una reconstruccion que dure 30 min',
      categoria: 'Agenda'
    },
    {
      titulo: 'Enviar Mensaje',
      comando: 'Manda una mensaje a Maria Garcia Toledo y preguntale si se puede venir a las 16.30h',
      categoria: 'Comunicación'
    },
    {
      titulo: 'Consultar Cita',
      comando: 'Que dia tiene cita Carmen Pardo Pardo?',
      categoria: 'Consultas'
    },
    {
      titulo: 'Buscar Paciente',
      comando: 'Buscar paciente Ana Lopez Garcia',
      categoria: 'Pacientes'
    },
    {
      titulo: 'Disponibilidad',
      comando: 'Cuando tienes libre el viernes para una endodoncia?',
      categoria: 'Agenda'
    },
    {
      titulo: 'Contacto Urgente',
      comando: 'Contacta a Juan Perez urgentemente sobre el dolor de muelas',
      categoria: 'Urgencias'
    }
  ])

  const ejecutarComandoDemo = async (comando: string) => {
    try {
      await widgetIA.procesarComando(comando, { mostrarProgreso: true })
    } catch (error) {
      console.error('Error ejecutando comando demo:', error)
    }
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              🎯 Widget IA Conversacional
            </h1>
            <p className="text-gray-600">
              Asistente inteligente para gestión clínica mediante comandos de voz y texto
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span>Configuración</span>
            </button>
          </div>
        </div>

        {/* Estadísticas en tiempo real */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CommandLineIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Procesados</p>
                <p className="text-xl font-bold text-blue-600">{estadisticas.comandos_procesados}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Exitosos</p>
                <p className="text-xl font-bold text-green-600">{estadisticas.comandos_exitosos}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <ArrowPathIcon className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">Fallidos</p>
                <p className="text-xl font-bold text-red-600">{estadisticas.comandos_fallidos}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-900">Precisión</p>
                <p className="text-xl font-bold text-purple-600">{estadisticas.precision}%</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-900">Velocidad</p>
                <p className="text-xl font-bold text-orange-600">{estadisticas.tiempo_promedio_respuesta}ms</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <MicrophoneIcon className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Sesión IA</p>
                <p className="text-xl font-bold text-gray-600">{widgetIA.comandosEjecutados.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comandos Demo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <LightBulbIcon className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            Comandos de Ejemplo
          </h2>
          <span className="text-sm text-gray-500">(Haz clic para probar)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comandosDemo.map((demo, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => ejecutarComandoDemo(demo.comando)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">{demo.titulo}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {demo.categoria}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                "{demo.comando}"
              </p>
              
              <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                <PlayIcon className="w-4 h-4" />
                <span>Probar Comando</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Información de Tratamientos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          📋 Tratamientos de Agenda Disponibles
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            'Control', 'Urgencia', 'Protesis Fija', 'Cirugia/Injerto',
            'Retirar Ortodoncia', 'Protesis Removible', 'Colocacion Ortodoncia', 'Periodoncia',
            'Cirugía de Implante', 'Mensualidad Ortodoncia', 'Ajuste Prot/tto', 'Primera Visita',
            'Higiene Dental', 'Endodoncia', 'Reconstruccion', 'Exodoncia',
            'Estudio Ortodoncia', 'Rx/escaner'
          ].map((tratamiento, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-sm font-medium text-gray-900">{tratamiento}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <LightBulbIcon className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">💡 Consejos de Uso</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Sé específico con nombres de pacientes y fechas</li>
                <li>• Usa nombres completos para mejores resultados</li>
                <li>• Especifica la duración cuando no sea estándar</li>
                <li>• Para urgencias, usa palabras como "urgente" o "emergencia"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Características del Widget */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          🚀 Características Principales
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MicrophoneIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Control por Voz</h3>
              <p className="text-sm text-gray-600">
                Reconocimiento de voz en español para comandos naturales y cómodos
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">IA Inteligente</h3>
              <p className="text-sm text-gray-600">
                Procesamiento inteligente con comprensión contextual y aprendizaje
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CommandLineIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Comandos Específicos</h3>
              <p className="text-sm text-gray-600">
                Comandos optimizados para gestión clínica y tareas específicas
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Análisis en Tiempo Real</h3>
              <p className="text-sm text-gray-600">
                Estadísticas y métricas de uso para optimización continua
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <SpeakerWaveIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Respuesta por Voz</h3>
              <p className="text-sm text-gray-600">
                Síntesis de voz para respuestas audibles (opcional)
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Historial Completo</h3>
              <p className="text-sm text-gray-600">
                Registro detallado de comandos y resultados para auditoría
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderConfiguracion = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            ⚙️ Configuración del Widget
          </h2>
          <button
            onClick={() => setShowAdmin(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Volver al Dashboard
          </button>
        </div>

        {/* Controles de configuración */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">🎤 Audio y Voz</h3>
            
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Reconocimiento de voz activado</span>
              <input
                type="checkbox"
                checked={widgetIA.estado.escuchando || widgetIA.reconocimientoActivo}
                onChange={(e) => {
                  if (e.target.checked) {
                    widgetIA.iniciarReconocimientoVoz()
                  } else {
                    widgetIA.detenerReconocimientoVoz()
                  }
                }}
                className="rounded border-gray-300"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Respuesta por voz</span>
              <input
                type="checkbox"
                defaultChecked={false}
                onChange={(e) => {
                  widgetIA.actualizarConfiguracion({ respuesta_voz: e.target.checked })
                }}
                className="rounded border-gray-300"
              />
            </label>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">📊 Visualización</h3>
            
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Mostrar estadísticas</span>
              <input
                type="checkbox"
                defaultChecked={true}
                onChange={(e) => {
                  widgetIA.actualizarConfiguracion({ mostrar_estadisticas: e.target.checked })
                }}
                className="rounded border-gray-300"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Modo desarrollador</span>
              <input
                type="checkbox"
                defaultChecked={false}
                onChange={(e) => {
                  widgetIA.actualizarConfiguracion({ modo_desarrollador: e.target.checked })
                }}
                className="rounded border-gray-300"
              />
            </label>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => widgetIA.limpiarHistorial()}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Limpiar Historial</span>
            </button>

            <button
              onClick={() => widgetIA.exportarHistorial()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CloudArrowDownIcon className="w-4 h-4" />
              <span>Exportar Datos</span>
            </button>

            <button
              onClick={() => console.log('Diagnóstico:', widgetIA.obtenerDiagnostico())}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ChartBarIcon className="w-4 h-4" />
              <span>Diagnóstico</span>
            </button>
          </div>
        </div>

        {/* Comandos personalizados */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">🛠️ Comandos Personalizados</h3>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Los comandos personalizados permiten agregar patrones específicos para tu práctica clínica.
              Esta funcionalidad se puede desarrollar según las necesidades específicas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Página principal */}
        {!showAdmin && renderDashboard()}
        
        {/* Página de configuración */}
        {showAdmin && renderConfiguracion()}
        
        {/* Widget flotante */}
        <div className="fixed bottom-6 right-6 z-50">
          <WidgetIAConversacional />
        </div>
      </div>
    </div>
  )
}

export default WidgetIAPage