import { EventEmitter } from 'events'
import pino from 'pino'
import { AdvancedGESDENSyncEngine } from './advanced-gesden-sync'

export interface MonitoringAlert {
  id: string
  type: 'error' | 'warning' | 'info' | 'critical'
  source: 'sqlserver' | 'supabase' | 'sync_engine' | 'system'
  message: string
  details?: any
  timestamp: Date
  acknowledged: boolean
  resolved: boolean
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  components: {
    sqlserver: ConnectionHealth
    supabase: ConnectionHealth
    sync_engine: EngineHealth
    websocket: WebSocketHealth
    cdc: CDCHealth
  }
  metrics: SystemMetrics
  uptime: number
  lastCheck: Date
}

export interface ConnectionHealth {
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error'
  latency: number
  lastSuccess: Date | null
  errorCount: number
  details?: string
}

export interface EngineHealth {
  status: 'active' | 'stopped' | 'error'
  operations: {
    total: number
    successful: number
    failed: number
    queued: number
  }
  conflicts: number
  resolutionRate: number
}

export interface WebSocketHealth {
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  reconnectAttempts: number
  lastConnection: Date | null
  messageCount: number
}

export interface CDCHealth {
  status: 'active' | 'inactive' | 'error'
  lastChange: Date | null
  processedChanges: number
  errorRate: number
}

export interface SystemMetrics {
  cpuUsage: number
  memoryUsage: number
  networkLatency: number
  diskUsage: number
  activeConnections: number
  syncThroughput: number // operaciones por segundo
}

export class GESDENMonitoringSystem extends EventEmitter {
  private logger: pino.Logger
  private alerts: Map<string, MonitoringAlert> = new Map()
  private systemHealth: SystemHealth
  private monitoringInterval: NodeJS.Timeout | null = null
  private alertCleanupInterval: NodeJS.Timeout | null = null
  private notificationCallbacks: Array<(alert: MonitoringAlert) => Promise<void>> = []
  private historyRetention = 1000 // Retener últimos 1000 registros

  constructor() {
    super()
    
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname'
        }
      }
    })

    this.systemHealth = this.initializeSystemHealth()
    
    this.setupEventHandlers()
    this.startMonitoring()
    this.startAlertCleanup()
    
    console.log('📊 GESDEN Monitoring System inicializado')
  }

  private initializeSystemHealth(): SystemHealth {
    return {
      status: 'healthy',
      components: {
        sqlserver: {
          status: 'disconnected',
          latency: 0,
          lastSuccess: null,
          errorCount: 0
        },
        supabase: {
          status: 'disconnected',
          latency: 0,
          lastSuccess: null,
          errorCount: 0
        },
        sync_engine: {
          status: 'stopped',
          operations: {
            total: 0,
            successful: 0,
            failed: 0,
            queued: 0
          },
          conflicts: 0,
          resolutionRate: 0
        },
        websocket: {
          status: 'disconnected',
          reconnectAttempts: 0,
          lastConnection: null,
          messageCount: 0
        },
        cdc: {
          status: 'inactive',
          lastChange: null,
          processedChanges: 0,
          errorRate: 0
        }
      },
      metrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        networkLatency: 0,
        diskUsage: 0,
        activeConnections: 0,
        syncThroughput: 0
      },
      uptime: 0,
      lastCheck: new Date()
    }
  }

  private setupEventHandlers(): void {
    // Escuchar eventos del engine de sincronización
    advancedGESDENSyncEngine.on('operation', (operation) => {
      this.recordOperation(operation)
    })

    advancedGESDENSyncEngine.on('conflict', (conflict) => {
      this.handleConflict(conflict)
    })

    advancedGESDENSyncEngine.on('error', (error) => {
      this.createAlert('error', 'sync_engine', `Sync Engine Error: ${error.message}`, { error })
    })

    advancedGESDENSyncEngine.on('critical_error', (error) => {
      this.createAlert('critical', 'system', `Critical Error: ${error.message}`, { error })
    })
  }

  private startMonitoring(): void {
    // Monitoreo de salud cada 30 segundos
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck()
        await this.updateMetrics()
        await this.checkAlertConditions()
        
        this.emit('health_updated', this.systemHealth)
        
      } catch (error) {
        this.logger.error('Error en health check:', error)
        this.createAlert('error', 'system', `Monitoring Error: ${error.message}`, { error })
      }
    }, 30000)

    // Métricas detalladas cada 10 segundos
    setInterval(async () => {
      try {
        await this.collectDetailedMetrics()
      } catch (error) {
        this.logger.error('Error collecting metrics:', error)
      }
    }, 10000)

    console.log('🔍 Monitoreo del sistema iniciado (cada 30s)')
  }

  private startAlertCleanup(): void {
    // Limpiar alertas antiguas cada hora
    this.alertCleanupInterval = setInterval(() => {
      this.cleanupOldAlerts()
    }, 3600000) // 1 hora
  }

  private async performHealthCheck(): Promise<void> {
    const checks = await Promise.allSettled([
      this.checkSQLServerHealth(),
      this.checkSupabaseHealth(),
      this.checkSyncEngineHealth(),
      this.checkWebSocketHealth(),
      this.checkCDCHealth()
    ])

    // Actualizar estado general
    const hasCritical = checks.some(result => 
      result.status === 'fulfilled' && result.value === 'critical'
    )
    const hasWarning = checks.some(result => 
      result.status === 'fulfilled' && result.value === 'warning'
    )

    if (hasCritical) {
      this.systemHealth.status = 'critical'
      this.createAlert('critical', 'system', 'Sistema en estado crítico')
    } else if (hasWarning) {
      this.systemHealth.status = 'warning'
    } else {
      this.systemHealth.status = 'healthy'
    }

    this.systemHealth.lastCheck = new Date()
  }

  private async checkSQLServerHealth(): Promise<'healthy' | 'warning' | 'critical'> {
    const startTime = Date.now()
    
    try {
      // Verificar conexión básica
      // En una implementación real, usar sqlServerService.isSQLServerConnected()
      // Por ahora simular respuesta
      const isConnected = Math.random() > 0.1 // 90% de éxito para demo
      
      const latency = Date.now() - startTime
      this.systemHealth.components.sqlserver.latency = latency
      this.systemHealth.components.sqlserver.lastSuccess = isConnected ? new Date() : this.systemHealth.components.sqlserver.lastSuccess

      if (isConnected) {
        this.systemHealth.components.sqlserver.status = 'connected'
        return 'healthy'
      } else {
        this.systemHealth.components.sqlserver.status = 'disconnected'
        this.createAlert('warning', 'sqlserver', 'SQL Server desconectado')
        return 'warning'
      }

    } catch (error) {
      this.systemHealth.components.sqlserver.status = 'error'
      this.systemHealth.components.sqlserver.errorCount++
      this.createAlert('error', 'sqlserver', `SQL Server Error: ${error.message}`, { error })
      return 'critical'
    }
  }

  private async checkSupabaseHealth(): Promise<'healthy' | 'warning' | 'critical'> {
    const startTime = Date.now()
    
    try {
      // Verificar conexión Supabase
      // Simular respuesta por ahora
      const isConnected = Math.random() > 0.05 // 95% de éxito
      
      const latency = Date.now() - startTime
      this.systemHealth.components.supabase.latency = latency
      this.systemHealth.components.supabase.lastSuccess = isConnected ? new Date() : this.systemHealth.components.supabase.lastSuccess

      if (isConnected) {
        this.systemHealth.components.supabase.status = 'connected'
        return 'healthy'
      } else {
        this.systemHealth.components.supabase.status = 'disconnected'
        this.createAlert('warning', 'supabase', 'Supabase desconectado')
        return 'warning'
      }

    } catch (error) {
      this.systemHealth.components.supabase.status = 'error'
      this.systemHealth.components.supabase.errorCount++
      this.createAlert('error', 'supabase', `Supabase Error: ${error.message}`, { error })
      return 'critical'
    }
  }

  private async checkSyncEngineHealth(): Promise<'healthy' | 'warning' | 'critical'> {
    try {
      const stats = advancedGESDENSyncEngine.getStats()
      
      this.systemHealth.components.sync_engine.operations = {
        total: stats.totalOperations,
        successful: stats.successful,
        failed: stats.failed,
        queued: stats.totalOperations - stats.successful - stats.failed
      }

      // Calcular tasa de éxito
      const successRate = stats.totalOperations > 0 ? (stats.successful / stats.totalOperations) * 100 : 100
      this.systemHealth.components.sync_engine.resolutionRate = successRate

      if (successRate < 80) {
        this.systemHealth.components.sync_engine.status = 'error'
        this.createAlert('warning', 'sync_engine', `Tasa de éxito baja: ${successRate.toFixed(1)}%`)
        return 'warning'
      } else {
        this.systemHealth.components.sync_engine.status = 'active'
        return 'healthy'
      }

    } catch (error) {
      this.systemHealth.components.sync_engine.status = 'error'
      this.createAlert('error', 'sync_engine', `Engine Error: ${error.message}`, { error })
      return 'critical'
    }
  }

  private async checkWebSocketHealth(): Promise<'healthy' | 'warning' | 'critical'> {
    // Verificar estado de WebSockets (Supabase Real-time)
    this.systemHealth.components.websocket.messageCount++ // Incrementar contador

    // Simular estado de WebSocket
    const isConnected = Math.random() > 0.2 // 80% de éxito
    
    if (isConnected) {
      this.systemHealth.components.websocket.status = 'connected'
      this.systemHealth.components.websocket.lastConnection = new Date()
      return 'healthy'
    } else {
      this.systemHealth.components.websocket.status = 'disconnected'
      this.systemHealth.components.websocket.reconnectAttempts++
      return 'warning'
    }
  }

  private async checkCDCHealth(): Promise<'healthy' | 'warning' | 'critical'> {
    // Verificar estado de CDC
    const stats = advancedGESDENSyncEngine.getStats()
    
    this.systemHealth.components.cdc.processedChanges = stats.totalOperations
    this.systemHealth.components.cdc.lastChange = stats.lastOperation

    if (stats.cdcStatus === 'active') {
      this.systemHealth.components.cdc.status = 'active'
      return 'healthy'
    } else if (stats.cdcStatus === 'inactive') {
      this.systemHealth.components.cdc.status = 'inactive'
      this.createAlert('warning', 'system', 'CDC no está activo, usando polling')
      return 'warning'
    } else {
      this.systemHealth.components.cdc.status = 'error'
      this.createAlert('error', 'system', 'CDC Error')
      return 'critical'
    }
  }

  private async updateMetrics(): Promise<void> {
    try {
      // Obtener métricas del sistema (en una implementación real usar os module)
      this.systemHealth.metrics = {
        cpuUsage: Math.random() * 100, // Simulado
        memoryUsage: Math.random() * 100, // Simulado
        networkLatency: Math.random() * 100, // Simulado
        diskUsage: Math.random() * 100, // Simulado
        activeConnections: Math.random() * 10, // Simulado
        syncThroughput: Math.random() * 10 // Simulado
      }

      // Calcular uptime
      this.systemHealth.uptime = process.uptime()

    } catch (error) {
      this.logger.error('Error updating metrics:', error)
    }
  }

  private async collectDetailedMetrics(): Promise<void> {
    // Métricas detalladas para debugging
    const detailedMetrics = {
      timestamp: new Date(),
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
      rss: process.memoryUsage().rss,
      cpuUsage: process.cpuUsage(),
      eventLoopDelay: await this.measureEventLoopDelay(),
      activeAlerts: this.getActiveAlerts().length,
      recentOperations: this.getRecentOperations()
    }

    this.logger.info('Detailed metrics collected', detailedMetrics)
  }

  private async measureEventLoopDelay(): Promise<number> {
    return new Promise(resolve => {
      const start = process.hrtime.bigint()
      setImmediate(() => {
        const end = process.hrtime.bigint()
        resolve(Number(end - start) / 1000000) // Convertir a milisegundos
      })
    })
  }

  private createAlert(type: MonitoringAlert['type'], source: MonitoringAlert['source'], message: string, details?: any): void {
    const alert: MonitoringAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      source,
      message,
      details,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false
    }

    this.alerts.set(alert.id, alert)
    this.logger.warn('Alert created:', { id: alert.id, type, source, message })

    // Notificar callbacks registrados
    this.notificationCallbacks.forEach(callback => {
      callback(alert).catch(error => {
        this.logger.error('Error in notification callback:', error)
      })
    })

    this.emit('alert_created', alert)
  }

  private handleConflict(conflict: any): void {
    this.createAlert('warning', 'sync_engine', `Sync conflict detected: ${conflict.field}`, { conflict })
  }

  private recordOperation(operation: any): void {
    // Registrar operación para análisis posterior
    this.logger.info('Operation recorded:', { table: operation.table, operation: operation.operation })
  }

  private cleanupOldAlerts(): void {
    const maxAlerts = this.historyRetention
    if (this.alerts.size > maxAlerts) {
      const sortedAlerts = Array.from(this.alerts.values())
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      
      // Mantener solo los últimos maxAlerts
      const toDelete = sortedAlerts.slice(maxAlerts)
      toDelete.forEach(alert => {
        this.alerts.delete(alert.id)
      })

      this.logger.info('Old alerts cleaned up', { removed: toDelete.length, remaining: this.alerts.size })
    }
  }

  private checkAlertConditions(): void {
    // Verificar condiciones especiales para alertas automáticas
    
    // Alerta si hay muchas operaciones fallidas
    const stats = advancedGESDENSyncEngine.getStats()
    const failureRate = stats.totalOperations > 0 ? (stats.failed / stats.totalOperations) * 100 : 0
    
    if (failureRate > 20) {
      this.createAlert('warning', 'sync_engine', `Alta tasa de fallos: ${failureRate.toFixed(1)}%`)
    }

    // Alerta si no hay operaciones recientes
    const lastOp = stats.lastOperation
    if (lastOp && Date.now() - lastOp.getTime() > 300000) { // 5 minutos
      this.createAlert('warning', 'sync_engine', 'No hay operaciones recientes')
    }

    // Alerta si la latencia es muy alta
    const avgLatency = (this.systemHealth.components.sqlserver.latency + this.systemHealth.components.supabase.latency) / 2
    if (avgLatency > 5000) { // 5 segundos
      this.createAlert('warning', 'system', `Latencia alta detectada: ${avgLatency.toFixed(0)}ms`)
    }
  }

  // MÉTODOS PÚBLICOS

  public getSystemHealth(): SystemHealth {
    return { ...this.systemHealth }
  }

  public getActiveAlerts(): MonitoringAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved)
  }

  public getAllAlerts(limit: number = 100): MonitoringAlert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId)
    if (alert) {
      alert.acknowledged = true
      this.logger.info('Alert acknowledged:', { alertId })
      return true
    }
    return false
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId)
    if (alert) {
      alert.resolved = true
      this.logger.info('Alert resolved:', { alertId })
      return true
    }
    return false
  }

  public addNotificationCallback(callback: (alert: MonitoringAlert) => Promise<void>): void {
    this.notificationCallbacks.push(callback)
  }

  public removeNotificationCallback(callback: (alert: MonitoringAlert) => Promise<void>): void {
    const index = this.notificationCallbacks.indexOf(callback)
    if (index > -1) {
      this.notificationCallbacks.splice(index, 1)
    }
  }

  private getRecentOperations(): any[] {
    // Obtener operaciones recientes para métricas
    return []
  }

  public generateHealthReport(): string {
    const health = this.systemHealth
    const alerts = this.getActiveAlerts()
    
    return `
# 📊 GESDEN System Health Report

**Generated:** ${health.lastCheck.toISOString()}
**Status:** ${health.status.toUpperCase()}
**Uptime:** ${Math.floor(health.uptime / 60)} minutes

## Components Status
- **SQL Server:** ${health.components.sqlserver.status} (${health.components.sqlserver.latency}ms)
- **Supabase:** ${health.components.supabase.status} (${health.components.supabase.latency}ms)
- **Sync Engine:** ${health.components.sync_engine.status}
- **WebSocket:** ${health.components.websocket.status}
- **CDC:** ${health.components.cdc.status}

## Active Alerts: ${alerts.length}
${alerts.map(alert => `- [${alert.type.toUpperCase()}] ${alert.message}`).join('\n')}

## Metrics
- CPU Usage: ${health.metrics.cpuUsage.toFixed(1)}%
- Memory Usage: ${health.metrics.memoryUsage.toFixed(1)}%
- Sync Throughput: ${health.metrics.syncThroughput.toFixed(1)} ops/sec
- Active Connections: ${health.metrics.activeConnections}
`
  }

  public stop(): void {
    console.log('📊 Deteniendo GESDEN Monitoring System...')
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    
    if (this.alertCleanupInterval) {
      clearInterval(this.alertCleanupInterval)
      this.alertCleanupInterval = null
    }
    
    this.logger.info('GESDEN Monitoring System stopped')
  }
}

// Instancia singleton
export const gesdenMonitoringSystem = new GESDENMonitoringSystem()
export default GESDENMonitoringSystem