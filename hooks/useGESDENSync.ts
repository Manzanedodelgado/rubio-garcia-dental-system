'use client'

import { useEffect, useRef, useState } from 'react'
import { gesdenIntegrationService } from '@/services/gesden-integration'
import { toast } from 'react-hot-toast'

export interface GESDENSyncHookReturn {
  isInitialized: boolean
  syncStatus: any
  error: string | null
  reinitialize: () => Promise<void>
  forceSync: () => Promise<void>
}

/**
 * Hook para manejar la integración automática GESDEN ↔ Supabase
 * Inicializa la sincronización bidireccional en tiempo real
 */
export const useGESDENSync = (): GESDENSyncHookReturn => {
  const isInitialized = useRef(false)
  const error = useRef<string | null>(null)
  const status = useRef<any>(null)

  const initializeGESDEN = async (): Promise<void> => {
    try {
      if (isInitialized.current) {
        console.log('ℹ️  GESDEN Integration ya inicializado')
        return
      }

      console.log('🚀 Inicializando integración GESDEN ↔ Supabase...')
      
      // Verificar que está configurado para auto-sync
      const autoSync = process.env.NEXT_PUBLIC_GESDEN_AUTO_SYNC || process.env.GESDEN_AUTO_SYNC
      
      if (!autoSync) {
        console.log('⚠️  GESDEN auto-sync deshabilitado')
        return
      }

      // Inicializar la integración
      await gesdenIntegrationService.initialize()
      
      isInitialized.current = true
      error.current = null
      
      // Obtener estado inicial
      status.current = gesdenIntegrationService.getSyncStatus()
      
      toast.success('🔄 GESDEN ↔ Supabase sincronización activa')
      console.log('✅ Integración GESDEN ↔ Supabase inicializada correctamente')
      
      // Mostrar estado de conexiones
      if (status.current?.sqlConnected && status.current?.supabaseConnected) {
        toast.success('✅ SQL Server y Supabase conectados', {
          duration: 3000,
          icon: '🔗'
        })
      } else {
        const issues = []
        if (!status.current?.sqlConnected) issues.push('SQL Server')
        if (!status.current?.supabaseConnected) issues.push('Supabase')
        
        toast.error(`⚠️  Problemas de conexión: ${issues.join(', ')}`, {
          duration: 5000
        })
      }
      
    } catch (err: any) {
      console.error('❌ Error inicializando GESDEN Integration:', err)
      error.current = err.message
      isInitialized.current = false
      
      toast.error(`❌ Error GESDEN: ${err.message}`, {
        duration: 8000,
        icon: '🚨'
      })
    }
  }

  const reinitialize = async (): Promise<void> => {
    console.log('🔄 Reinicializando GESDEN Integration...')
    isInitialized.current = false
    await initializeGESDEN()
  }

  const forceSync = async (): Promise<void> => {
    try {
      console.log('🔄 Forzando sincronización completa...')
      await gesdenIntegrationService.forceFullSync()
      status.current = gesdenIntegrationService.getSyncStatus()
      toast.success('🔄 Sincronización completa ejecutada', {
        duration: 3000,
        icon: '🔄'
      })
    } catch (err: any) {
      console.error('❌ Error en sincronización forzada:', err)
      toast.error(`❌ Error sincronización: ${err.message}`)
    }
  }

  // Inicializar cuando el componente se monta
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      initializeGESDEN().catch(console.error)
    }, 1000) // Delay para asegurar que otros hooks estén listos

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (isInitialized.current) {
        console.log('🧹 Limpiando GESDEN Integration...')
        gesdenIntegrationService.stop().catch(console.error)
      }
    }
  }, [])

  return {
    isInitialized: isInitialized.current,
    syncStatus: status.current,
    error: error.current,
    reinitialize,
    forceSync
  }
}

/**
 * Hook para mostrar el estado de sincronización en tiempo real
 */
export const useGESDENStatus = () => {
  const [status, setStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const updateStatus = async () => {
      try {
        const currentStatus = gesdenIntegrationService.getSyncStatus()
        setStatus(currentStatus)
        setError(null)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    // Actualizar estado inmediatamente
    updateStatus()

    // Actualizar cada 10 segundos
    const interval = setInterval(updateStatus, 10000)

    return () => clearInterval(interval)
  }, [])

  return { status, isLoading, error }
}

/**
 * Componente para mostrar el estado de sincronización GESDEN
 */
export const GESDENStatusWidget: React.FC = () => {
  const { status, isLoading, error } = useGESDENStatus()

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-blue-700">Iniciando GESDEN...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
        <div className="flex items-center">
          <span className="text-red-600 mr-2">❌</span>
          <span className="text-red-700">Error GESDEN: {error}</span>
        </div>
      </div>
    )
  }

  if (!status) {
    return null
  }

  const { sqlConnected, supabaseConnected, running, lastSync } = status

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${sqlConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-gray-700">SQL Server</span>
        </div>
        
        <div className="flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${supabaseConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-gray-700">Supabase</span>
        </div>
        
        <div className="flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${running ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
          <span className="text-gray-700">Sincronización</span>
        </div>
        
        {lastSync && (
          <div className="text-xs text-gray-500">
            Última sync: {new Date(lastSync).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  )
}

export default useGESDENSync