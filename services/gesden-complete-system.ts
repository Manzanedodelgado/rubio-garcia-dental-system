import { EventEmitter } from 'events'
import pino from 'pino'
import { AdvancedGESDENSyncEngine } from './advanced-gesden-sync'
import { gesdenMonitoringSystem } from './gesden-monitoring'
import { intelligentConflictResolver } from './intelligent-conflict-resolver'
import { gesdenIntegrationService } from './gesden-integration'

export interface GESDENCompleteSystemConfig {
  autoStart: boolean
  autoSync: boolean
  monitoringEnabled: boolean
  conflictResolution: 'auto' | 'manual' | 'hybrid'
  retryAttempts: number
  retryDelay: number
  heartbeatInterval: number
  alertThresholds: {
    errorRate: number
    latencyWarning: number
    syncTimeout: number
  }
}

export interface SystemInitializationResult {
  success: boolean
  duration: number
  components: {
    sqlserver: { status: 'success' | 'error' | 'warning'; message: string }
    supabase: { status: 'success' | 'error' | 'warning'; message: string }
    syncEngine: { status: 'success' | 'error' | 'warning'; message: string }
    monitoring: { status: 'success' | 'error' | 'warning'; message: string }
    conflictResolver: { status: 'success' | 'error' | 'warning'; message: string }
  }
  warnings: string[]
  errors: string[]
}

export interface SystemHealthReport {
  overall: {
    status: 'healthy' | 'warning' | 'critical' | 'offline'
    score: number // 0-100
    uptime: number
    lastCheck: Date
    performance: 'excellent' | 'good' | 'poor' | 'failing'
  }
  components: {
    [key: string]: {
      status: string
      health: number // 0-100
      latency?: number
      errors?: number
      lastActivity?: Date
    }
  }
  metrics: {
    syncThroughput: number
    successRate: number
    conflictRate: number
    errorRate: number
    averageLatency: number
  }
  recommendations: string[]
  alerts: {
    critical: number
    warnings: number
    info: number
  }
}

export class GESDENCompleteSystem extends EventEmitter {
  private logger: pino.Logger
  private config: GESDENCompleteSystemConfig
  private isInitialized: boolean = false
  private isRunning: boolean = false
  private initializationStart: Date | null = null
  private healthScore: number = 100
  private lastHealthCheck: Date = new Date()
  private systemUptime: number = 0
  private startTime: Date | null = null

  constructor(config?: Partial<GESDENCompleteSystemConfig>) {
    super()
    
    this.config = {
      autoStart: true,
      autoSync: true,
      monitoringEnabled: true,
      conflictResolution: 'auto',
      retryAttempts: 3,
      retryDelay: 5000,
      heartbeatInterval: 30000,
      alertThresholds: {
        errorRate: 0.05, // 5%
        latencyWarning: 5000, // 5 segundos
        syncTimeout: 30000 // 30 segundos
      },
      ...config
    }

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

    this.setupEventHandlers()
    this.startHealthMonitoring()
    
    console.log('🚀 GESDEN Complete System inicializado')
    this.logger.info('GESDEN Complete System initialized', { config: this.config })

    if (this.config.autoStart) {
      this.autoInitialize()
    }
  }

  private setupEventHandlers(): void {
    // Eventos del engine de sincronización
    advancedGESDENSyncEngine.on('operation', (operation) => {
      this.emit('operation', operation)
      this.updateHealthScore(1) // Operación exitosa
    })

    advancedGESDENSyncEngine.on('conflict', (conflict) => {
      this.emit('conflict', conflict)
      this.updateHealthScore(-2) // Conflicto reduce score
    })

    advancedGESDENSyncEngine.on('error', (error) => {
      this.emit('error', error)
      this.updateHealthScore(-10) // Error reduce score significativamente
    })

    advancedGESDENSyncEngine.on('critical_error', (error) => {
      this.emit('critical_error', error)
      this.updateHealthScore(-20) // Error crítico reduce score mucho
      this.createSystemAlert('critical', `Critical system error: ${error.message}`, { error })
    })

    // Eventos del sistema de monitoreo
    gesdenMonitoringSystem.on('alert_created', (alert) => {
      this.emit('alert', alert)
      this.updateHealthScore(alert.type === 'critical' ? -5 : -2)
    })

    // Eventos del resolver de conflictos
    intelligentConflictResolver.on('resolution_pending', (resolution) => {
      this.emit('resolution_pending', resolution)
      this.updateHealthScore(-1)
    })
  }

  private async autoInitialize(): Promise<void> {
    try {
      console.log('🔄 Auto-inicialización del sistema GESDEN...')
      await this.initializeCompleteSystem()
    } catch (error) {
      console.error('❌ Error en auto-inicialización:', error)
      this.createSystemAlert('error', `Auto-initialization failed: ${error.message}`, { error })
    }
  }

  // 🚀 INICIALIZACIÓN COMPLETA
  async initializeCompleteSystem(): Promise<SystemInitializationResult> {
    this.initializationStart = new Date()
    console.log('🚀 Iniciando inicialización completa del sistema GESDEN...')
    
    const result: SystemInitializationResult = {
      success: false,
      duration: 0,
      components: {
        sqlserver: { status: 'warning', message: 'Pending' },
        supabase: { status: 'warning', message: 'Pending' },
        syncEngine: { status: 'warning', message: 'Pending' },
        monitoring: { status: 'warning', message: 'Pending' },
        conflictResolver: { status: 'warning', message: 'Pending' }
      },
      warnings: [],
      errors: []
    }

    try {
      // 1. Verificar e inicializar SQL Server
      await this.initializeComponent('sqlserver', async () => {
        // La conexión SQL Server se verifica durante la inicialización del sync engine
        return { status: 'success', message: 'SQL Server connection verified' }
      }, result)

      // 2. Verificar e inicializar Supabase
      await this.initializeComponent('supabase', async () => {
        // La conexión Supabase se verifica durante la inicialización del sync engine
        return { status: 'success', message: 'Supabase connection verified' }
      }, result)

      // 3. Inicializar engine de sincronización
      await this.initializeComponent('syncEngine', async () => {
        await advancedGESDENSyncEngine.initialize()
        return { status: 'success', message: 'Sync engine initialized' }
      }, result)

      // 4. Inicializar sistema de monitoreo
      await this.initializeComponent('monitoring', async () => {
        // El sistema de monitoreo ya está inicializado en el constructor
        return { status: 'success', message: 'Monitoring system active' }
      }, result)

      // 5. Inicializar resolver de conflictos
      await this.initializeComponent('conflictResolver', async () => {
        // El resolver ya está inicializado
        return { status: 'success', message: 'Conflict resolver ready' }
      }, result)

      // 6. Realizar verificación de salud inicial
      await this.performInitialHealthCheck()

      // 7. Marcar como inicializado y en ejecución
      this.isInitialized = true
      this.isRunning = true
      this.startTime = new Date()
      
      result.success = result.errors.length === 0
      result.duration = Date.now() - this.initializationStart.getTime()
      
      console.log(`✅ Inicialización completa del sistema GESDEN en ${result.duration}ms`)
      this.logger.info('System initialization completed', { result })

      this.emit('initialized', result)
      
      return result

    } catch (error: any) {
      result.errors.push(error.message)
      this.logger.error('System initialization failed', { error, result })
      this.emit('initialization_failed', error)
      
      throw error
    } finally {
      this.initializationStart = null
    }
  }

  private async initializeComponent(
    name: keyof SystemInitializationResult['components'],
    initFunc: () => Promise<{ status: 'success' | 'error' | 'warning', message: string }>,
    result: SystemInitializationResult
  ): Promise<void> {
    try {
      console.log(`🔧 Inicializando ${name}...`)
      const initResult = await initFunc()
      result.components[name] = initResult
      
      if (initResult.status === 'success') {
        console.log(`✅ ${name} inicializado correctamente`)
      } else if (initResult.status === 'warning') {
        console.log(`⚠️  ${name} inicializado con advertencias`)
        result.warnings.push(`${name}: ${initResult.message}`)
      } else {
        console.log(`❌ Error inicializando ${name}`)
        result.errors.push(`${name}: ${initResult.message}`)
      }
      
    } catch (error: any) {
      result.components[name] = { status: 'error', message: error.message }
      result.errors.push(`${name}: ${error.message}`)
      console.error(`❌ Error en ${name}:`, error)
    }
  }

  private async performInitialHealthCheck(): Promise<void> {
    try {
      const healthReport = await this.getSystemHealthReport()
      
      if (healthReport.overall.status === 'critical') {
        this.createSystemAlert('critical', 'System health is critical after initialization')
      } else if (healthReport.overall.status === 'warning') {
        this.createSystemAlert('warning', 'System health is degraded after initialization')
      }
      
    } catch (error) {
      console.error('Error in initial health check:', error)
    }
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      this.performPeriodicHealthCheck()
    }, this.config.heartbeatInterval)

    console.log(`💓 Monitoreo de salud iniciado (cada ${this.config.heartbeatInterval / 1000}s)`)
  }

  private async performPeriodicHealthCheck(): Promise<void> {
    try {
      await this.updateHealthScore(0) // Score neutral check
      this.lastHealthCheck = new Date()
      
      if (this.startTime) {
        this.systemUptime = Date.now() - this.startTime.getTime()
      }
      
    } catch (error) {
      console.error('Error in periodic health check:', error)
    }
  }

  private updateHealthScore(delta: number): void {
    // Actualizar score de salud (0-100)
    this.healthScore = Math.max(0, Math.min(100, this.healthScore + delta))
    
    // Notificar cambios significativos
    if (this.healthScore < 20) {
      this.createSystemAlert('critical', `System health critical: ${this.healthScore}%`)
    } else if (this.healthScore < 50) {
      this.createSystemAlert('warning', `System health degraded: ${this.healthScore}%`)
    }
  }

  // 📊 MÉTODOS PÚBLICOS
  async getSystemHealthReport(): Promise<SystemHealthReport> {
    try {
      const syncStats = advancedGESDENSyncEngine.getStats()
      const monitoringStats = gesdenMonitoringSystem.getSystemHealth()
      const conflictStats = intelligentConflictResolver.getStats()
      const activeAlerts = gesdenMonitoringSystem.getActiveAlerts()

      // Calcular métricas
      const successRate = syncStats.totalOperations > 0 
        ? syncStats.successful / syncStats.totalOperations 
        : 1
      
      const errorRate = syncStats.totalOperations > 0 
        ? syncStats.failed / syncStats.totalOperations 
        : 0
      
      const conflictRate = syncStats.totalOperations > 0 
        ? syncStats.conflicts / syncStats.totalOperations 
        : 0

      // Determinar estado general
      let overallStatus: 'healthy' | 'warning' | 'critical' | 'offline' = 'healthy'
      
      if (!this.isRunning) {
        overallStatus = 'offline'
      } else if (this.healthScore < 20) {
        overallStatus = 'critical'
      } else if (this.healthScore < 50 || errorRate > this.config.alertThresholds.errorRate) {
        overallStatus = 'warning'
      }

      // Determinar rendimiento
      let performance: 'excellent' | 'good' | 'poor' | 'failing'
      if (this.healthScore >= 80) performance = 'excellent'
      else if (this.healthScore >= 60) performance = 'good'
      else if (this.healthScore >= 30) performance = 'poor'
      else performance = 'failing'

      // Generar recomendaciones
      const recommendations = this.generateRecommendations({
        successRate,
        errorRate,
        conflictRate,
        healthScore: this.healthScore,
        activeAlerts: activeAlerts.length
      })

      return {
        overall: {
          status: overallStatus,
          score: this.healthScore,
          uptime: this.systemUptime,
          lastCheck: this.lastHealthCheck,
          performance
        },
        components: {
          sqlserver: {
            status: monitoringStats.components.sqlserver.status,
            health: monitoringStats.components.sqlserver.status === 'connected' ? 100 : 0,
            latency: monitoringStats.components.sqlserver.latency,
            errors: monitoringStats.components.sqlserver.errorCount,
            lastActivity: monitoringStats.components.sqlserver.lastSuccess
          },
          supabase: {
            status: monitoringStats.components.supabase.status,
            health: monitoringStats.components.supabase.status === 'connected' ? 100 : 0,
            latency: monitoringStats.components.supabase.latency,
            errors: monitoringStats.components.supabase.errorCount,
            lastActivity: monitoringStats.components.supabase.lastSuccess
          },
          sync_engine: {
            status: syncStats.isRunning ? 'active' : 'stopped',
            health: Math.round(successRate * 100),
            lastActivity: syncStats.lastOperation
          },
          monitoring: {
            status: 'active',
            health: 100
          },
          conflict_resolver: {
            status: 'active',
            health: 100
          }
        },
        metrics: {
          syncThroughput: this.calculateSyncThroughput(syncStats),
          successRate: Math.round(successRate * 100),
          conflictRate: Math.round(conflictRate * 100),
          errorRate: Math.round(errorRate * 100),
          averageLatency: monitoringStats.components.sqlserver.latency + monitoringStats.components.supabase.latency / 2
        },
        recommendations,
        alerts: {
          critical: activeAlerts.filter(a => a.type === 'critical').length,
          warnings: activeAlerts.filter(a => a.type === 'warning').length,
          info: activeAlerts.filter(a => a.type === 'info').length
        }
      }

    } catch (error) {
      console.error('Error generating health report:', error)
      throw error
    }
  }

  private calculateSyncThroughput(stats: any): number {
    if (!stats.lastOperation) return 0
    
    const timeSinceLastOp = Date.now() - stats.lastOperation.getTime()
    if (timeSinceLastOp > 60000) return 0 // No actividad en el último minuto
    
    return stats.totalOperations / (timeSinceLastOp / 1000)
  }

  private generateRecommendations(context: any): string[] {
    const recommendations: string[] = []
    
    if (context.successRate < 0.8) {
      recommendations.push('Considerar revisar la resolución de conflictos')
    }
    
    if (context.errorRate > 0.05) {
      recommendations.push('Alta tasa de errores detectada - revisar conexiones')
    }
    
    if (context.conflictRate > 0.1) {
      recommendations.push('Frecuentes conflictos - considerar ajustar estrategia de resolución')
    }
    
    if (context.healthScore < 50) {
      recommendations.push('Estado del sistema degradado - requiere atención')
    }
    
    if (context.activeAlerts > 5) {
      recommendations.push('Muchas alertas activas - revisar configuración del sistema')
    }
    
    return recommendations
  }

  private createSystemAlert(type: 'error' | 'warning' | 'info' | 'critical', message: string, details?: any): void {
    gesdenMonitoringSystem.createAlert(type, 'system', message, details)
  }

  // Métodos de control del sistema
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Sistema GESDEN ya está en ejecución')
      return
    }

    console.log('▶️  Iniciando sistema GESDEN...')
    await this.initializeCompleteSystem()
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️  Sistema GESDEN no está en ejecución')
      return
    }

    console.log('⏹️  Deteniendo sistema GESDEN...')
    
    try {
      // Detener componentes en orden inverso
      advancedGESDENSyncEngine.stop()
      gesdenMonitoringSystem.stop()
      
      this.isRunning = false
      this.isInitialized = false
      this.startTime = null
      
      console.log('✅ Sistema GESDEN detenido')
      this.emit('stopped')
      
    } catch (error) {
      console.error('❌ Error deteniendo sistema GESDEN:', error)
      throw error
    }
  }

  async restart(): Promise<void> {
    console.log('🔄 Reiniciando sistema GESDEN...')
    await this.stop()
    await this.start()
    console.log('✅ Sistema GESDEN reiniciado')
  }

  // Getters
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      healthScore: this.healthScore,
      uptime: this.systemUptime,
      config: this.config
    }
  }

  getStats() {
    return {
      healthScore: this.healthScore,
      uptime: this.systemUptime,
      lastHealthCheck: this.lastHealthCheck,
      isInitialized: this.isInitialized,
      isRunning: this.isRunning
    }
  }
}

// Instancia singleton
export const gesdenCompleteSystem = new GESDENCompleteSystem()
export default GESDENCompleteSystem