import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { aiService } from '@/services/ai'
import { Navigation } from '@/components/Navigation'
import LoadingSpinner from '@/components/LoadingSpinner'

interface AIMetrics {
  conversaciones_totales: number
  mensajes_procesados: number
  tokens_consumidos: number
  tiempo_responsa_promedio_ms: number
  precision_analisis: number
  satisfaccion_promedio: number
  errores_totales: number
}

interface ActiveConversation {
  id: string
  session_id: string
  usuario_tipo: string
  contexto_pagina?: string
  tema_principal?: string
  tokens_usados: number
  duracion_segundos?: number
  satisfaccion_usuario?: number
  created_at: string
  total_mensajes: number
  mensajes_usuario: number
  mensajes_ia: number
  tiempo_procesamiento_promedio_ms: number
  ultima_actividad: string
}

interface SentimentAnalysis {
  id: string
  texto_original: string
  sentiment: string
  confidence: string
  emotions: string
  fuente: string
  numero_paciente?: string
  nombre?: string
  apellido?: string
  created_at: string
}

interface AIConfig {
  modelo_principal: string
  modelo_backup: string
  enable_analisis_automatico: boolean
  enable_recomendaciones: boolean
  enable_generacion_documentos: boolean
  idiomas_soportados: string[]
  configurado_por: string
}

export default function AIHubPage() {
  const [metrics, setMetrics] = useState<AIMetrics | null>(null)
  const [activeConversations, setActiveConversations] = useState<ActiveConversation[]>([])
  const [recentSentiments, setRecentSentiments] = useState<SentimentAnalysis[]>([])
  const [aiConfig, setAIConfig] = useState<AIConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiAvailable, setAIAvailable] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'conversations' | 'analysis' | 'config'>('dashboard')
  const [chatInput, setChatInput] = useState('')
  const [currentChat, setCurrentChat] = useState<Array<{role: string, content: string}>>([])

  useEffect(() => {
    loadAIData()
    
    // Configurar realtime subscriptions
    const conversationSubscription = supabase
      .channel('ai_conversaciones')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ai_conversaciones' },
        () => {
          loadAIData()
        }
      )
      .subscribe()

    const analysisSubscription = supabase
      .channel('ai_analisis')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ai_analisis' },
        () => {
          loadAIData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(conversationSubscription)
      supabase.removeChannel(analysisSubscription)
    }
  }, [])

  const loadAIData = async () => {
    try {
      // Verificar disponibilidad de IA
      const isAvailable = await aiService.checkAvailability()
      setAIAvailable(isAvailable)

      // Cargar configuración de IA
      const { data: configData } = await supabase
        .from('ai_config')
        .select('*')
        .single()

      if (configData) {
        setAIConfig(configData)
      }

      // Cargar métricas del día
      const { data: metricsData } = await supabase
        .from('v_ai_metricas_diarias')
        .select('*')
        .eq('fecha', new Date().toISOString().split('T')[0])
        .single()

      if (metricsData) {
        setMetrics(metricsData)
      }

      // Cargar conversaciones activas
      const { data: conversationsData } = await supabase
        .from('v_ai_conversaciones_activas')
        .select('*')
        .limit(10)

      setActiveConversations(conversationsData || [])

      // Cargar análisis de sentiment recientes
      const { data: sentimentData } = await supabase
        .from('v_ai_sentiment_pacientes')
        .select('*')
        .limit(10)

      setRecentSentiments(sentimentData || [])
    } catch (error) {
      console.error('Error cargando datos de IA:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !aiAvailable) return

    const userMessage = { role: 'user', content: chatInput }
    setCurrentChat(prev => [...prev, userMessage])
    setChatInput('')

    try {
      // Simular llamada al servicio de IA
      const response = await aiService.generateResponse([...currentChat, userMessage])
      const aiMessage = { role: 'assistant', content: response }
      setCurrentChat(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error en chat:', error)
      const errorMessage = { role: 'assistant', content: 'Lo siento, hay un problema con el servicio de IA.' }
      setCurrentChat(prev => [...prev, errorMessage])
    }
  }

  const analyzeText = async (text: string, type: 'sentiment' | 'urgency' | 'category') => {
    try {
      if (type === 'sentiment') {
        const result = await aiService.analyzeSentiment(text)
        alert(`Análisis de sentimiento:\nSentimiento: ${result.sentiment}\nConfianza: ${(result.confidence * 100).toFixed(1)}%\nEmociones: ${result.emotions.join(', ')}`)
      } else if (type === 'urgency') {
        const result = await aiService.analyzePatientMessage(text)
        alert(`Análisis de urgencia:\nUrgente: ${result.isUrgent ? 'Sí' : 'No'}\nNivel: ${result.urgencyLevel}\nCategoría: ${result.category}\nRespuesta recomendada: ${result.response}`)
      }
      loadAIData()
    } catch (error) {
      console.error('Error en análisis:', error)
      alert('Error al realizar el análisis')
    }
  }

  const generateTreatmentRecommendation = async () => {
    try {
      const sintomas = prompt('Describe los síntomas del paciente:')
      if (!sintomas) return

      const result = await aiService.generateTreatmentRecommendation(sintomas, {})
      alert(`Recomendación generada:\nDiagnóstico: ${result.likelyDiagnosis}\nUrgencia: ${result.urgency}\nTratamientos: ${result.recommendedTreatments.join(', ')}\nPróximos pasos: ${result.nextSteps.join(', ')}`)
    } catch (error) {
      console.error('Error generando recomendación:', error)
      alert('Error al generar recomendación')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Centro de IA</h1>
              <p className="mt-2 text-sm text-gray-600">
                Inteligencia Artificial para Clínica Dental
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                aiAvailable 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  aiAvailable ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                {aiAvailable ? 'IA Activa' : 'IA No Disponible'}
              </div>
              
              <button
                onClick={loadAIData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: '📊' },
              { id: 'conversations', name: 'Conversaciones', icon: '💬' },
              { id: 'analysis', name: 'Análisis', icon: '🔍' },
              { id: 'config', name: 'Configuración', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('conversations')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-2xl mr-2">💬</span>
                  <span className="font-medium text-gray-700">Nueva Conversación</span>
                </button>
                
                <button
                  onClick={generateTreatmentRecommendation}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <span className="text-2xl mr-2">🔬</span>
                  <span className="font-medium text-gray-700">Recomendación Médica</span>
                </button>
                
                <button
                  onClick={() => analyzeText(prompt('Texto a analizar:') || '', 'sentiment')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <span className="text-2xl mr-2">📊</span>
                  <span className="font-medium text-gray-700">Analizar Sentimiento</span>
                </button>
              </div>
            </div>

            {/* Metrics Cards */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <span className="text-2xl">💬</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Conversaciones Hoy</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.conversaciones_totales}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Tiempo Respuesta</p>
                      <p className="text-2xl font-bold text-gray-900">{Math.round(metrics.tiempo_responsa_promedio_ms)}ms</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Precisión</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.precision_analisis?.toFixed(1) || 0}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <span className="text-2xl">😊</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Satisfacción</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.satisfaccion_promedio?.toFixed(1) || 0}/5</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Sentiment Analysis */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Análisis de Sentimiento Recientes</h2>
              </div>
              <div className="divide-y">
                {recentSentiments.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No hay análisis de sentimiento recientes
                  </div>
                ) : (
                  recentSentiments.map((analysis) => (
                    <div key={analysis.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              analysis.sentiment === 'positive' 
                                ? 'bg-green-100 text-green-800'
                                : analysis.sentiment === 'negative'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {analysis.sentiment}
                            </span>
                            <span className="ml-2 text-sm text-gray-500">
                              {(parseFloat(analysis.confidence) * 100).toFixed(0)}% confianza
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-700 max-w-2xl">
                            {analysis.texto_original}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {analysis.nombre && analysis.apellido 
                              ? `${analysis.nombre} ${analysis.apellido}`
                              : `Paciente ${analysis.numero_paciente || 'N/A'}`
                            } • {new Date(analysis.created_at).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Chat con IA</h2>
              </div>
              
              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {currentChat.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>Inicia una conversación con la IA</p>
                    <p className="text-sm mt-2">Puedes hacer preguntas sobre pacientes, tratamientos o solicitar recomendaciones</p>
                  </div>
                ) : (
                  currentChat.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Chat Input */}
              <div className="p-6 border-t">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!aiAvailable}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || !aiAvailable}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Enviar
                  </button>
                </div>
                {!aiAvailable && (
                  <p className="text-sm text-red-600 mt-2">
                    El servicio de IA no está disponible
                  </p>
                )}
              </div>
            </div>

            {/* Active Conversations List */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Conversaciones Activas</h2>
              </div>
              <div className="divide-y">
                {activeConversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No hay conversaciones activas
                  </div>
                ) : (
                  activeConversations.map((conversation) => (
                    <div key={conversation.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {conversation.session_id}
                          </p>
                          <p className="text-sm text-gray-500">
                            {conversation.usuario_tipo} • {conversation.total_mensajes} mensajes
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Iniciado: {new Date(conversation.created_at).toLocaleString('es-ES')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {conversation.tiempo_procesamiento_promedio_ms}ms promedio
                          </p>
                          {conversation.satisfaccion_usuario && (
                            <p className="text-sm text-gray-500">
                              Satisfacción: {conversation.satisfaccion_usuario}/5
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Herramientas de Análisis</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => analyzeText(prompt('Texto para análisis de sentimiento:') || '', 'sentiment')}
                  className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="text-2xl mb-2">😊</div>
                  <h3 className="font-medium">Análisis de Sentimiento</h3>
                  <p className="text-sm text-gray-600 mt-1">Analiza emociones en textos de pacientes</p>
                </button>
                
                <button
                  onClick={() => analyzeText(prompt('Mensaje para análisis de urgencia:') || '', 'urgency')}
                  className="p-4 border rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                >
                  <div className="text-2xl mb-2">🚨</div>
                  <h3 className="font-medium">Análisis de Urgencia</h3>
                  <p className="text-sm text-gray-600 mt-1">Detecta emergencias médicas en mensajes</p>
                </button>
                
                <button
                  onClick={generateTreatmentRecommendation}
                  className="p-4 border rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  <div className="text-2xl mb-2">🔬</div>
                  <h3 className="font-medium">Recomendaciones</h3>
                  <p className="text-sm text-gray-600 mt-1">Genera sugerencias de tratamiento</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración de IA</h2>
              
              {aiConfig ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Modelo Principal
                      </label>
                      <p className="text-sm text-gray-900">{aiConfig.modelo_principal}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Modelo Backup
                      </label>
                      <p className="text-sm text-gray-900">{aiConfig.modelo_backup}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-gray-900">Funcionalidades Activadas</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={aiConfig.enable_analisis_automatico}
                          readOnly
                          className="mr-3"
                        />
                        <span className="text-sm text-gray-700">Análisis Automático de Mensajes</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={aiConfig.enable_recomendaciones}
                          readOnly
                          className="mr-3"
                        />
                        <span className="text-sm text-gray-700">Recomendaciones de Tratamiento</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={aiConfig.enable_generacion_documentos}
                          readOnly
                          className="mr-3"
                        />
                        <span className="text-sm text-gray-700">Generación de Documentos</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idiomas Soportados
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {aiConfig.idiomas_soportados.map((lang) => (
                        <span
                          key={lang}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {lang.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p>No se pudo cargar la configuración</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}