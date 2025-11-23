// ===============================================
// HOOK PERSONALIZADO PARA WIDGET IA CONVERSACIONAL
// Sistema de Gestión Integral - Rubio García Dental
// ===============================================

'use client'

import { useState, useCallback, useEffect } from 'react'
import { procesadorComandosClinicos, ResultadoComando, ParametroExtraido, ComandoClinico } from '@/services/procesador-comandos-clinicos'

interface UsoWidget {
  mensajes: Array<{
    id: string
    tipo: 'usuario' | 'ia' | 'sistema'
    contenido: string
    timestamp: Date
    metadata?: any
  }>
  escuchando: boolean
  procesando: boolean
  sessionId: string
  errores: string[]
  estadisticas: {
    comandos_procesados: number
    comandos_exitosos: number
    comandos_fallidos: number
    tiempo_promedio_respuesta: number
  }
}

interface ConfiguracionWidget {
  tema: 'claro' | 'oscuro' | 'auto'
  idioma: 'es' | 'en' | 'auto'
  voz_activada: boolean
  respuesta_voz: boolean
  comandos_personalizados: ComandoClinico[]
  tratamientos_predefinidos: string[]
  mostrar_estadisticas: boolean
  modo_desarrollador: boolean
}

interface ComandoCustomizado {
  patron: string
  respuesta: string
  accion: string
  categoria: string
}

interface HookWidgetIAProps {
  configuracionInicial?: Partial<ConfiguracionWidget>
  sessionId?: string
  onComandoEjecutado?: (resultado: ResultadoComando, comando: string) => void
  onError?: (error: Error, comando: string) => void
  onEstadisticasActualizadas?: (estadisticas: any) => void
}

const useWidgetIA = (props: HookWidgetIAProps = {}) => {
  const {
    configuracionInicial = {},
    sessionId,
    onComandoEjecutado,
    onError,
    onEstadisticasActualizadas
  } = props

  const [estado, setEstado] = useState<UsoWidget>({
    mensajes: [],
    escuchando: false,
    procesando: false,
    sessionId: sessionId || `session_${Date.now()}`,
    errores: [],
    estadisticas: {
      comandos_procesados: 0,
      comandos_exitosos: 0,
      comandos_fallidos: 0,
      tiempo_promedio_respuesta: 0
    }
  })

  const [configuracion, setConfiguracion] = useState<ConfiguracionWidget>({
    tema: 'auto',
    idioma: 'auto',
    voz_activada: true,
    respuesta_voz: false,
    comandos_personalizados: [],
    tratamientos_predefinidos: [],
    mostrar_estadisticas: true,
    modo_desarrollador: false,
    ...configuracionInicial
  })

  const [comandosEjecutados, setComandosEjecutados] = useState<Array<{
    comando: string
    resultado: ResultadoComando
    timestamp: Date
  }>>([])

  const [tiemposRespuesta, setTiemposRespuesta] = useState<number[]>([])

  // Efecto para inicializar con mensaje de bienvenida
  useEffect(() => {
    if (estado.mensajes.length === 0) {
      agregarMensajeSistema('¡Hola! Soy tu asistente de IA clínica. Puedo ayudarte con gestión de citas, pacientes y comunicaciones.')
    }
  }, [])

  // Función para agregar mensajes
  const agregarMensaje = useCallback((
    contenido: string,
    tipo: 'usuario' | 'ia' | 'sistema' = 'ia',
    metadata?: any
  ) => {
    const mensaje = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tipo,
      contenido,
      timestamp: new Date(),
      metadata
    }

    setEstado(prev => ({
      ...prev,
      mensajes: [...prev.mensajes, mensaje]
    }))

    return mensaje.id
  }, [])

  const agregarMensajeSistema = useCallback((contenido: string, metadata?: any) => {
    return agregarMensaje(contenido, 'sistema', metadata)
  }, [agregarMensaje])

  // Procesar comando de entrada
  const procesarComando = useCallback(async (
    entrada: string,
    opciones: {
      fuente?: 'texto' | 'voz' | 'api'
      silencioso?: boolean
      mostrarProgreso?: boolean
    } = {}
  ) => {
    const { fuente = 'texto', silencioso = false, mostrarProgreso = true } = opciones

    if (!entrada.trim()) {
      throw new Error('El comando no puede estar vacío')
    }

    setEstado(prev => ({ ...prev, procesando: true }))

    const tiempoInicio = Date.now()

    try {
      if (mostrarProgreso && !silencioso) {
        agregarMensajeSistema('🔄 Procesando comando...')
      }

      // Agregar mensaje del usuario si no es silencioso
      if (!silencioso) {
        agregarMensaje(entrada, 'usuario', { fuente })
      }

      const resultado = await procesadorComandosClinicos.procesarComando(entrada, estado.sessionId)
      const tiempoProcesamiento = Date.now() - tiempoInicio

      // Actualizar estadísticas
      setComandosEjecutados(prev => [
        ...prev,
        { comando: entrada, resultado, timestamp: new Date() }
      ])

      setTiemposRespuesta(prev => [...prev, tiempoProcesamiento])

      setEstado(prev => ({
        ...prev,
        procesando: false,
        estadisticas: {
          comandos_procesados: prev.estadisticas.comandos_procesados + 1,
          comandos_exitosos: prev.estadisticas.comandos_exitosos + (resultado.exito ? 1 : 0),
          comandos_fallidos: prev.estadisticas.comandos_fallidos + (resultado.exito ? 0 : 1),
          tiempo_promedio_respuesta: 0 // Se calculará después
        }
      }))

      // Calcular tiempo promedio
      const tiemposActualizados = [...tiemposRespuesta, tiempoProcesamiento]
      const tiempoPromedio = tiemposActualizados.reduce((a, b) => a + b, 0) / tiemposActualizados.length

      setEstado(prev => ({
        ...prev,
        estadisticas: {
          ...prev.estadisticas,
          tiempo_promedio_respuesta: Math.round(tiempoPromedio)
        }
      }))

      // Notificar callback
      if (onComandoEjecutado) {
        onComandoEjecutado(resultado, entrada)
      }

      // Agregar respuesta de la IA
      if (!silencioso) {
        agregarMensaje(resultado.respuesta, 'ia', {
          comando_procesado: true,
          resultado,
          duracion_procesamiento: tiempoProcesamiento
        })
      }

      return resultado

    } catch (error) {
      const tiempoProcesamiento = Date.now() - tiempoInicio
      setEstado(prev => ({
        ...prev,
        procesando: false,
        errores: [...prev.errores, error instanceof Error ? error.message : 'Error desconocido']
      }))

      if (onError) {
        onError(error instanceof Error ? error : new Error('Error desconocido'), entrada)
      }

      if (!silencioso) {
        agregarMensaje(
          'Lo siento, hubo un error procesando tu comando. Por favor, inténtalo de nuevo.',
          'ia',
          { error: true, duracion_procesamiento: tiempoProcesamiento }
        )
      }

      throw error
    }
  }, [estado.sessionId, agregarMensaje, agregarMensajeSistema, onComandoEjecutado, onError, comandosEjecutados, tiemposRespuesta])

  // Reconocimiento de voz
  const [reconocimientoActivo, setReconocimientoActivo] = useState(false)
  const [transcripcionActual, setTranscripcionActual] = useState('')

  const iniciarReconocimientoVoz = useCallback(() => {
    if (!configuracion.voz_activada) {
      throw new Error('El reconocimiento de voz está deshabilitado')
    }

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      throw new Error('El reconocimiento de voz no está disponible en este navegador')
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = configuracion.idioma === 'es' ? 'es-ES' : 'en-US'

    recognition.onstart = () => {
      setReconocimientoActivo(true)
      setTranscripcionActual('')
      agregarMensajeSistema('🎤 Iniciando reconocimiento de voz...')
    }

    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setTranscripcionActual(transcript)
    }

    recognition.onerror = (event: any) => {
      setReconocimientoActivo(false)
      agregarMensajeSistema(`❌ Error en reconocimiento de voz: ${event.error}`)
      throw new Error(`Error de reconocimiento: ${event.error}`)
    }

    recognition.onend = () => {
      setReconocimientoActivo(false)
      
      if (transcripcionActual.trim()) {
        procesarComando(transcripcionActual, { fuente: 'voz' })
      } else {
        agregarMensajeSistema('⚠️ No se detectó ningún texto hablado')
      }
    }

    recognition.start()
    return recognition
  }, [configuracion, agregarMensajeSistema, procesarComando])

  const detenerReconocimientoVoz = useCallback(() => {
    setReconocimientoActivo(false)
    setTranscripcionActual('')
  }, [])

  // Funciones de gestión de configuración
  const actualizarConfiguracion = useCallback((nuevaConfig: Partial<ConfiguracionWidget>) => {
    setConfiguracion(prev => ({ ...prev, ...nuevaConfig }))
  }, [])

  const agregarComandoPersonalizado = useCallback((comando: ComandoCustomizado) => {
    const nuevoComando: ComandoClinico = {
      id: `custom_${Date.now()}`,
      patron: new RegExp(comando.patron, 'i'),
      tipo: 'general',
      descripcion: comando.categoria,
      parametros: [],
      ejemplos: [comando.patron],
      activo: true
    }

    setConfiguracion(prev => ({
      ...prev,
      comandos_personalizados: [...prev.comandos_personalizados, nuevoComando]
    }))
  }, [])

  const removerComandoPersonalizado = useCallback((id: string) => {
    setConfiguracion(prev => ({
      ...prev,
      comandos_personalizados: prev.comandos_personalizados.filter(c => c.id !== id)
    }))
  }, [])

  // Funciones de limpieza y gestión
  const limpiarHistorial = useCallback(() => {
    setEstado(prev => ({
      ...prev,
      mensajes: [],
      errores: []
    }))
    setComandosEjecutados([])
    setTiemposRespuesta([])
    agregarMensajeSistema('🧹 Historial limpiado. Listo para nuevos comandos.')
  }, [agregarMensajeSistema])

  const exportarHistorial = useCallback(() => {
    const datos = {
      sesion: estado.sessionId,
      fecha_exportacion: new Date().toISOString(),
      configuracion,
      estadisticas: estado.estadisticas,
      mensajes: estado.mensajes,
      comandos_ejecutados: comandosEjecutados,
      errores: estado.errores
    }

    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `widget-ia-historial-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [estado, configuracion, comandosEjecutados])

  // Funciones de diagnóstico
  const obtenerDiagnostico = useCallback(() => {
    const diagnostico = {
      timestamp: new Date().toISOString(),
      session_id: estado.sessionId,
      configuracion,
      estadisticas_actuales: estado.estadisticas,
      comandos_disponibles: procesadorComandosClinicos.obtenerComandosDisponibles(),
      tratamientos_disponibles: procesadorComandosClinicos.obtenerTratamientosDisponibles(),
      ultima_transcripcion: transcripcionActual,
      estado_reconocimiento_voz: reconocimientoActivo,
      mensajes_totales: estado.mensajes.length,
      comandos_ejecutados: comandosEjecutados.length,
      errores_recientes: estado.errores.slice(-5)
    }

    return diagnostico
  }, [estado, configuracion, transcripcionActual, reconocimientoActivo, comandosEjecutados])

  // Notificar actualizaciones de estadísticas
  useEffect(() => {
    if (onEstadisticasActualizadas && estado.mensajes.length > 0) {
      onEstadisticasActualizadas({
        ...estado.estadisticas,
        comandos_ejecutados: comandosEjecutados.length,
        precision: comandosEjecutados.length > 0 
          ? Math.round((estado.estadisticas.comandos_exitosos / estado.estadisticas.comandos_procesados) * 100)
          : 0
      })
    }
  }, [estado.estadisticas, comandosEjecutados.length, onEstadisticasActualizadas])

  return {
    // Estado
    estado,
    configuracion,
    comandosEjecutados,
    transcripcionActual,
    reconocimientoActivo,

    // Funciones principales
    procesarComando,
    iniciarReconocimientoVoz,
    detenerReconocimientoVoz,
    agregarMensaje,
    agregarMensajeSistema,

    // Gestión de configuración
    actualizarConfiguracion,
    agregarComandoPersonalizado,
    removerComandoPersonalizado,

    // Utilidades
    limpiarHistorial,
    exportarHistorial,
    obtenerDiagnostico,

    // Estado helpers
    setEscuchando: (escuchando: boolean) => setEstado(prev => ({ ...prev, escuchando })),
    setProcesando: (procesando: boolean) => setEstado(prev => ({ ...prev, procesando })),
    
    // Getters de datos
    obtenerUltimoComando: () => comandosEjecutados[comandosEjecutados.length - 1],
    obtenerComandosExitosos: () => comandosEjecutados.filter(c => c.resultado.exito),
    obtenerComandosFallidos: () => comandosEjecutados.filter(c => !c.resultado.exito),
    obtenerComandosPorCategoria: () => {
      const categorias: Record<string, number> = {}
      comandosEjecutados.forEach(c => {
        if (c.resultado.accion_ejecutada) {
          categorias[c.resultado.accion_ejecutada] = (categorias[c.resultado.accion_ejecutada] || 0) + 1
        }
      })
      return categorias
    }
  }
}

export default useWidgetIA
export type { ResultadoComando, ParametroExtraido, ComandoClinico, ConfiguracionWidget }