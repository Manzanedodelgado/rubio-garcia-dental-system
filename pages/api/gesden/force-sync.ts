import { NextApiRequest, NextApiResponse } from 'next'
import { advancedGESDENSyncEngine } from '@/services/advanced-gesden-sync'
import { gesdenMonitoringSystem } from '@/services/gesden-monitoring'
import { intelligentConflictResolver } from '@/services/intelligent-conflict-resolver'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      return handleForceSync(req, res)
    } else if (req.method === 'GET') {
      return handleGetSyncStats(req, res)
    } else {
      res.setHeader('Allow', ['GET', 'POST'])
      return res.status(405).json({ error: 'Method not allowed' })
    }

  } catch (error: any) {
    console.error('Error in /api/gesden/force-sync:', error)
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message
    })
  }
}

async function handleForceSync(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { table, conflictResolution } = req.body || {}
    
    // Validar parámetros si se especifican
    if (table && !['pacientes', 'citas', 'doctores'].includes(table)) {
      return res.status(400).json({ 
        error: 'Tabla no válida',
        validTables: ['pacientes', 'citas', 'doctores'],
        requestedTable: table
      })
    }

    // Verificar que los sistemas estén inicializados
    await ensureSystemsInitialized()

    console.log(`🔄 Iniciando sincronización forzada${table ? ` para tabla: ${table}` : ' completa'}`)

    const startTime = Date.now()
    
    // Ejecutar sincronización
    if (table) {
      await advancedGESDENSyncEngine.forceSync(table)
    } else {
      await advancedGESDENSyncEngine.forceSync()
    }

    const duration = Date.now() - startTime

    // Obtener estadísticas actualizadas
    const stats = advancedGESDENSyncEngine.getStats()
    const conflictStats = intelligentConflictResolver.getStats()

    const response = {
      success: true,
      operation: 'force_sync',
      table: table || 'all',
      duration: `${duration}ms`,
      stats: {
        totalOperations: stats.totalOperations,
        successfulOperations: stats.successful,
        failedOperations: stats.failed,
        conflicts: stats.conflicts,
        syncThroughput: duration > 0 ? Math.round((stats.totalOperations / duration) * 1000) : 0
      },
      conflictResolution: {
        totalConflicts: conflictStats.totalConflicts,
        resolutionRate: conflictStats.autoResolutionThreshold,
        patternsLearned: conflictStats.patternsLearned
      },
      timestamp: new Date().toISOString(),
      performedBy: req.headers['x-user-agent'] || 'manual'
    }

    console.log(`✅ Sincronización forzada completada en ${duration}ms`)
    
    // Crear alerta informativa
    gesdenMonitoringSystem.createAlert(
      'info', 
      'sync_engine', 
      `Sincronización forzada completada (${table || 'completa'})`,
      { duration, stats }
    )

    res.status(200).json(response)

  } catch (error: any) {
    console.error('Error in force sync:', error)
    
    // Crear alerta de error
    gesdenMonitoringSystem.createAlert(
      'error', 
      'sync_engine', 
      `Error en sincronización forzada: ${error.message}`,
      { error: error.stack }
    )

    res.status(500).json({ 
      error: 'Error ejecutando sincronización forzada',
      details: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

async function handleGetSyncStats(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Obtener estadísticas del engine de sincronización
    const syncStats = advancedGESDENSyncEngine.getStats()
    
    // Obtener estadísticas del resolver de conflictos
    const conflictStats = intelligentConflictResolver.getStats()
    
    // Obtener estadísticas del sistema de monitoreo
    const systemHealth = gesdenMonitoringSystem.getSystemHealth()
    const activeAlerts = gesdenMonitoringSystem.getActiveAlerts()

    const response = {
      syncEngine: {
        status: syncStats.isRunning ? 'active' : 'stopped',
        totalOperations: syncStats.totalOperations,
        successfulOperations: syncStats.successful,
        failedOperations: syncStats.failed,
        conflicts: syncStats.conflicts,
        lastOperation: syncStats.lastOperation,
        queueSize: syncStats.totalOperations - syncStats.successful - syncStats.failed,
        successRate: syncStats.totalOperations > 0 
          ? Math.round((syncStats.successful / syncStats.totalOperations) * 100)
          : 100,
        connections: syncStats.activeConnections
      },
      conflictResolver: {
        totalConflicts: conflictStats.totalConflicts,
        patternsLearned: conflictStats.patternsLearned,
        learningEnabled: conflictStats.learningEnabled,
        autoResolutionThreshold: conflictStats.autoResolutionThreshold
      },
      systemHealth: {
        overallStatus: systemHealth.status,
        componentStatus: {
          sqlserver: systemHealth.components.sqlserver.status,
          supabase: systemHealth.components.supabase.status,
          sync_engine: systemHealth.components.sync_engine.status,
          websocket: systemHealth.components.websocket.status,
          cdc: systemHealth.components.cdc.status
        },
        metrics: systemHealth.metrics,
        uptime: systemHealth.uptime
      },
      monitoring: {
        activeAlerts: activeAlerts.length,
        criticalAlerts: activeAlerts.filter(a => a.type === 'critical').length,
        alertsByType: {
          critical: activeAlerts.filter(a => a.type === 'critical').length,
          error: activeAlerts.filter(a => a.type === 'error').length,
          warning: activeAlerts.filter(a => a.type === 'warning').length,
          info: activeAlerts.filter(a => a.type === 'info').length
        }
      },
      timestamp: new Date().toISOString()
    }

    res.status(200).json(response)

  } catch (error: any) {
    console.error('Error getting sync stats:', error)
    res.status(500).json({ 
      error: 'Error obteniendo estadísticas',
      details: error.message
    })
  }
}

async function ensureSystemsInitialized() {
  try {
    // Verificar si el sync engine está inicializado
    const stats = advancedGESDENSyncEngine.getStats()
    if (!stats.isRunning) {
      console.log('🔄 Inicializando sistemas GESDEN...')
      await advancedGESDENSyncEngine.initialize()
    }
  } catch (error) {
    console.error('Error inicializando sistemas:', error)
    throw new Error('No se pudieron inicializar los sistemas de sincronización')
  }
}