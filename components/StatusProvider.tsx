'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { whatsappService } from '@/services/whatsapp'
import { sqlServerService } from '@/services/sql-server'
import { aiService } from '@/services/ai'
import type { AppStatus } from '@/types'

interface StatusContextType {
  status: AppStatus
  isConnected: boolean
  refreshStatus: () => Promise<void>
  checkConnections: () => Promise<void>
}

const StatusContext = createContext<StatusContextType | undefined>(undefined)

export function StatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AppStatus>({
    supabase_connected: false,
    sql_server_connected: false,
    whatsapp_connected: false,
    ai_active: false,
    last_sync: undefined
  })

  const [isConnected, setIsConnected] = useState(false)

  const refreshStatus = async () => {
    try {
      await checkConnections()
    } catch (error) {
      console.error('Error refreshing status:', error)
    }
  }

  const checkConnections = async () => {
    console.log('🔍 Verificando conexiones de servicios...')
    
    // Check Supabase
    const supabaseConnected = await checkSupabaseConnection()
    
    // Check SQL Server
    const sqlConnected = await checkSQLServerConnection()
    
    // Check WhatsApp
    const whatsappConnected = await checkWhatsAppConnection()
    
    // Check AI
    const aiConnected = await checkAIConnection()

    const newStatus = {
      supabase_connected: supabaseConnected,
      sql_server_connected: sqlConnected,
      whatsapp_connected: whatsappConnected,
      ai_active: aiConnected,
      last_sync: new Date().toISOString()
    }

    setStatus(newStatus)
    setIsConnected(supabaseConnected && sqlConnected && whatsappConnected && aiConnected)
    
    console.log('✅ Verificación de conexiones completada:', newStatus)
  }

  const checkSupabaseConnection = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      return !error
    } catch (error) {
      console.error('Supabase connection failed:', error)
      return false
    }
  }

  const checkSQLServerConnection = async (): Promise<boolean> => {
    try {
      const connected = await sqlServerService.isConnected()
      return connected
    } catch (error) {
      console.error('SQL Server connection failed:', error)
      return false
    }
  }

  const checkWhatsAppConnection = async (): Promise<boolean> => {
    try {
      const connected = await whatsappService.checkConnection()
      return connected
    } catch (error) {
      console.error('WhatsApp connection failed:', error)
      return false
    }
  }

  const checkAIConnection = async (): Promise<boolean> => {
    try {
      // Verificar si el servicio de IA está disponible
      const response = await fetch(`${process.env.NEXT_PUBLIC_LLM_HOST || 'http://192.168.1.34:11434'}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      return response.ok
    } catch (error) {
      console.error('AI connection failed:', error)
      return false
    }
  }

  useEffect(() => {
    // Initial check
    checkConnections()
    
    // Set up periodic checks
    const interval = setInterval(checkConnections, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [])

  // Listen for real-time updates from Supabase
  useEffect(() => {
    const channel = supabase.channel('status-changes')
      .on('broadcast', { event: 'status-update' }, (payload) => {
        console.log('📡 Received status update:', payload.payload)
        setStatus(payload.payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <StatusContext.Provider value={{
      status,
      isConnected,
      refreshStatus,
      checkConnections
    }}>
      {children}
    </StatusContext.Provider>
  )
}

export function useStatus() {
  const context = useContext(StatusContext)
  if (context === undefined) {
    throw new Error('useStatus must be used within a StatusProvider')
  }
  return context
}