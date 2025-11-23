import { NextApiRequest, NextApiResponse } from 'next'
import { gesdenMonitoringSystem } from '@/services/gesden-monitoring'
import { advancedGESDENSyncEngine } from '@/services/advanced-gesden-sync'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Inicializar sistemas si no están activos
    await initializeSystems()
    
    // Obtener estado actual del sistema
    const systemHealth = gesdenMonitoringSystem.getSystemHealth()
    const syncStats = advancedGESDENSyncEngine.getStats()
    
    const status = {
      overall: determineOverallStatus(systemHealth, syncStats),
      components: {
        sqlserver: {
          status: systemHealth.components.sqlserver.status,
          latency: systemHealth.components.sqlserver.latency,
          lastSuccess: systemHealth.components.sqlserver.lastSuccess,
          errorCount: systemHealth.components.sqlserver.errorCount,
          details: systemHealth.components.sqlserver.details
        },
        supabase: {
          status: systemHealth.components.supabase.status,
          latency: systemHealth.components.supabase.latency,
          lastSuccess: systemHealth.components.supabase.lastSuccess,
          errorCount: systemHealth.components.supabase.errorCount,
          details: systemHealth.components.supabase.details
        },
        sync_engine: {
          status: systemHealth.components.sync_engine.status,
          operations: systemHealth.components.sync_engine.operations,
          conflicts: systemHealth.components.sync_engine.conflicts,
          resolutionRate: systemHealth.components.sync_engine.resolutionRate
        },
        websocket: {
          status: systemHealth.components.websocket.status,
          reconnectAttempts: systemHealth.components.websocket.reconnectAttempts,
          lastConnection: systemHealth.components.websocket.lastConnection,
          messageCount: systemHealth.components.websocket.messageCount
        },
        cdc: {
          status: systemHealth.components.cdc.status,
          lastChange: systemHealth.components.cdc.lastChange,
          processedChanges: systemHealth.components.cdc.processedChanges,
          errorRate: systemHealth.components.cdc.errorRate
        }
      },
      metrics: {
        totalOperations: syncStats.totalOperations,
        successfulOperations: syncStats.successful,
        failedOperations: syncStats.failed,
        conflicts: syncStats.conflicts,
        avgLatency: calculateAverageLatency(systemHealth),
        uptime: systemHealth.uptime,
        activeAlerts: gesdenMonitoringSystem.getActiveAlerts().length
      },
      lastUpdate: new Date().toISOString(),
      timestamp: Date.now()
    }

    res.status(200).json(status)

  } catch (error: any) {
    console.error('Error in /api/gesden/status:', error)
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

function determineOverallStatus(health: any, stats: any): string {
  const { components } = health
  
  // Verificar si hay errores críticos
  if (
    components.sqlserver.status === 'error' ||
    components.supabase.status === 'error' ||
    components.sync_engine.status === 'error'
  ) {
    return 'critical'
  }
  
  // Verificar si hay componentes desconectados
  if (
    components.sqlserver.status === 'disconnected' ||
    components.supabase.status === 'disconnected'
  ) {
    return 'critical'
  }
  
  // Verificar si hay advertencias
  if (
    components.sqlserver.status === 'reconnecting' ||
    components.supabase.status === 'reconnecting' ||
    stats.failed > stats.totalOperations * 0.2 // Más del 20% de fallos
  ) {
    return 'warning'
  }
  
  return 'healthy'
}

function calculateAverageLatency(health: any): number {
  const latencies = [
    health.components.sqlserver.latency,
    health.components.supabase.latency
  ].filter(l => l > 0)
  
  return latencies.length > 0 
    ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length 
    : 0
}

async function initializeSystems() {
  try {
    // Verificar si el sync engine está inicializado
    const stats = advancedGESDENSyncEngine.getStats()
    if (!stats.isRunning) {
      console.log('🔄 Inicializando sistemas GESDEN...')
      await advancedGESDENSyncEngine.initialize()
    }
  } catch (error) {
    console.error('Error inicializando sistemas:', error)
  }
}