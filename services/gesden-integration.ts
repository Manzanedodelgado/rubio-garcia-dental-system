import { gesdenSyncService } from './sync-gesden-supabase'
import { sqlServerService } from './sql-server'
import { supabase } from '@/lib/supabase'

export interface GESDENIntegrationConfig {
  autoStartSync: boolean
  realtimeEnabled: boolean
  cdcEnabled: boolean
  fallbackPolling: boolean
  syncInterval: number
  monitoring: boolean
  debug: boolean
}

export interface SyncStatus {
  running: boolean
  lastSync: Date | null
  totalOperations: number
  successful: number
  conflicts: number
  errors: number
  sqlConnected: boolean
  supabaseConnected: boolean
}

// 🔄 SERVICIO DE INTEGRACIÓN GESDEN ↔ SUPABASE
export class GESDENIntegrationService {
  private config: GESDENIntegrationConfig
  private syncStatus: SyncStatus
  private monitoringInterval: NodeJS.Timeout | null = null
  private isInitialized: boolean = false

  constructor(config: Partial<GESDENIntegrationConfig> = {}) {
    this.config = {
      autoStartSync: true,
      realtimeEnabled: true,
      cdcEnabled: true,
      fallbackPolling: true,
      syncInterval: 5000, // 5 segundos
      monitoring: true,
      debug: true,
      ...config
    }

    this.syncStatus = {
      running: false,
      lastSync: null,
      totalOperations: 0,
      successful: 0,
      conflicts: 0,
      errors: 0,
      sqlConnected: false,
      supabaseConnected: false
    }

    console.log('🔗 GESDEN-Supabase Integration Service inicializado')
    console.log('🎯 Auto-sync:', this.config.autoStartSync)
    console.log('⚡ Tiempo real:', this.config.realtimeEnabled)
  }

  // 🚀 INICIALIZAR INTEGRACIÓN COMPLETA
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('⚠️  Integración ya inicializada')
        return
      }

      console.log('🚀 Inicializando integración GESDEN ↔ Supabase...')

      // 1. Verificar conexión Supabase
      await this.verifySupabaseConnection()

      // 2. Conectar a SQL Server 2008
      await this.verifySQLServerConnection()

      // 3. Inicializar sincronización bidireccional
      if (this.config.autoStartSync) {
        await this.startBidirectionalSync()
      }

      // 4. Configurar monitoreo continuo
      if (this.config.monitoring) {
        this.setupContinuousMonitoring()
      }

      this.isInitialized = true
      console.log('✅ Integración GESDEN ↔ Supabase completamente operativa')

    } catch (error) {
      console.error('❌ Error inicializando integración:', error)
      throw error
    }
  }

  // 🔍 VERIFICAR CONEXIÓN SUPABASE
  private async verifySupabaseConnection(): Promise<void> {
    try {
      console.log('🔍 Verificando conexión Supabase...')
      
      const { data, error } = await supabase.from('pacientes').select('id').limit(1)
      
      if (error) {
        throw new Error(`Error Supabase: ${error.message}`)
      }
      
      this.syncStatus.supabaseConnected = true
      console.log('✅ Conexión Supabase verificada')
      
    } catch (error) {
      console.error('❌ Error conectando a Supabase:', error)
      this.syncStatus.supabaseConnected = false
      throw error
    }
  }

  // 🔍 VERIFICAR CONEXIÓN SQL SERVER
  private async verifySQLServerConnection(): Promise<void> {
    try {
      console.log('🔍 Verificando conexión SQL Server 2008...')
      
      await sqlServerService.connect()
      
      const isConnected = await sqlServerService.isSQLServerConnected()
      this.syncStatus.sqlConnected = isConnected
      
      if (isConnected) {
        console.log('✅ Conexión SQL Server 2008 verificada')
        console.log('🔄 GESDEN puede sincronizar normalmente')
      } else {
        throw new Error('No se pudo establecer conexión con SQL Server')
      }
      
    } catch (error) {
      console.error('❌ Error conectando a SQL Server 2008:', error)
      this.syncStatus.sqlConnected = false
      throw error
    }
  }

  // 🔄 INICIAR SINCRONIZACIÓN BIDIRECCIONAL
  private async startBidirectionalSync(): Promise<void> {
    try {
      console.log('🔄 Iniciando sincronización bidireccional GESDEN ↔ Supabase...')
      
      // Inicializar el servicio de sincronización
      await gesdenSyncService.initializeSync()
      
      this.syncStatus.running = true
      
      console.log('✅ Sincronización bidireccional activa')
      console.log('📡 Cambios en GESDEN se reflejan en Supabase inmediatamente')
      console.log('📡 Cambios en Supabase se reflejan en GESDEN inmediatamente')
      
    } catch (error) {
      console.error('❌ Error iniciando sincronización bidireccional:', error)
      this.syncStatus.running = false
      throw error
    }
  }

  // 📊 CONFIGURAR MONITOREO CONTINUO
  private setupContinuousMonitoring(): void {
    console.log('📊 Configurando monitoreo continuo...')
    
    // Monitoreo cada 10 segundos
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck()
      } catch (error) {
        console.error('❌ Error en monitoreo:', error)
        await this.handleMonitoringError(error)
      }
    }, 10000)
    
    console.log('✅ Monitoreo continuo activo (cada 10s)')
  }

  // 🏥 VERIFICACIÓN DE SALUD DEL SISTEMA
  private async performHealthCheck(): Promise<void> {
    const checks = {
      supabase: await this.checkSupabaseHealth(),
      sqlserver: await this.checkSQLServerHealth(),
      sync: await this.checkSyncHealth(),
      timestamp: new Date()
    }

    if (this.config.debug) {
      console.log('🏥 Health Check:', {
        supabase: checks.supabase ? '✅' : '❌',
        sqlserver: checks.sqlserver ? '✅' : '❌',
        sync: checks.sync ? '✅' : '❌',
        time: checks.timestamp.toISOString()
      })
    }

    // Actualizar estado
    this.syncStatus.supabaseConnected = checks.supabase
    this.syncStatus.sqlConnected = checks.sqlserver
    
    // Actualizar estadísticas de sincronización
    const stats = gesdenSyncService.getSyncStats()
    this.syncStatus.totalOperations = stats.totalOperations
    this.syncStatus.successful = stats.successful
    this.syncStatus.conflicts = stats.conflicts
    this.syncStatus.errors = stats.errors
    this.syncStatus.lastSync = stats.lastSync
  }

  private async checkSupabaseHealth(): Promise<boolean> {
    try {
      await supabase.from('pacientes').select('id').limit(1)
      return true
    } catch (error) {
      return false
    }
  }

  private async checkSQLServerHealth(): Promise<boolean> {
    try {
      return await sqlServerService.isSQLServerConnected()
    } catch (error) {
      return false
    }
  }

  private async checkSyncHealth(): Promise<boolean> {
    try {
      const stats = gesdenSyncService.getSyncStats()
      return stats.isRunning
    } catch (error) {
      return false
    }
  }

  private async handleMonitoringError(error: any): Promise<void> {
    console.error('🚨 Error detectado en monitoreo:', error)
    
    // Intentar recuperación automática
    try {
      if (!this.syncStatus.supabaseConnected) {
        console.log('🔄 Reintentando conexión Supabase...')
        await this.verifySupabaseConnection()
      }
      
      if (!this.syncStatus.sqlConnected) {
        console.log('🔄 Reintentando conexión SQL Server...')
        await this.verifySQLServerConnection()
      }
      
      if (!this.syncStatus.running) {
        console.log('🔄 Reiniciando sincronización...')
        await this.startBidirectionalSync()
      }
      
    } catch (recoveryError) {
      console.error('❌ Error en recuperación automática:', recoveryError)
    }
  }

  // 📊 OBTENER ESTADO ACTUAL
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus }
  }

  // 🔄 SINCRONIZACIÓN MANUAL COMPLETA
  async forceFullSync(): Promise<void> {
    try {
      console.log('🔄 Forzando sincronización completa manual...')
      
      // Verificar que ambas conexiones estén activas
      await this.verifySupabaseConnection()
      await this.verifySQLServerConnection()
      
      // Ejecutar sincronización completa
      await gesdenSyncService.initializeSync()
      
      this.syncStatus.lastSync = new Date()
      console.log('✅ Sincronización completa ejecutada manualmente')
      
    } catch (error) {
      console.error('❌ Error en sincronización manual:', error)
      throw error
    }
  }

  // 🔄 SINCRONIZACIÓN DE TABLA ESPECÍFICA
  async syncTable(table: string): Promise<void> {
    try {
      console.log(`🔄 Sincronizando tabla específica: ${table}`)
      
      // Obtener datos de SQL Server
      let sqlData: any[] = []
      
      switch (table) {
        case 'pacientes':
          sqlData = await sqlServerService.getPacientesFromSQL()
          break
        case 'citas':
          sqlData = await sqlServerService.getCitasFromSQL()
          break
        case 'doctores':
          sqlData = await sqlServerService.getDoctoresFromSQL()
          break
        default:
          throw new Error(`Tabla no reconocida: ${table}`)
      }
      
      // Sincronizar cada registro
      for (const record of sqlData) {
        await supabase.from(table).upsert(record, { onConflict: 'id' })
      }
      
      console.log(`✅ Tabla ${table} sincronizada:`, sqlData.length, 'registros')
      
    } catch (error) {
      console.error(`❌ Error sincronizando tabla ${table}:`, error)
      throw error
    }
  }

  // 🔍 VERIFICAR CONSISTENCIA DE DATOS
  async verifyDataConsistency(): Promise<any> {
    try {
      console.log('🔍 Verificando consistencia de datos...')
      
      const tables = ['pacientes', 'citas', 'doctores']
      const consistency = {}
      
      for (const table of tables) {
        const supabaseCount = await this.getSupabaseCount(table)
        const sqlCount = await this.getSQLCount(table)
        
        consistency[table] = {
          supabase: supabaseCount,
          sqlserver: sqlCount,
          difference: Math.abs(supabaseCount - sqlCount),
          isConsistent: supabaseCount === sqlCount
        }
      }
      
      console.log('📊 Consistencia de datos:', consistency)
      return consistency
      
    } catch (error) {
      console.error('❌ Error verificando consistencia:', error)
      throw error
    }
  }

  private async getSupabaseCount(table: string): Promise<number> {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
    return count || 0
  }

  private async getSQLCount(table: string): Promise<number> {
    return await sqlServerService.getRecordCount(table)
  }

  // 🛑 DETENER SERVICIO
  async stop(): Promise<void> {
    try {
      console.log('🛑 Deteniendo integración GESDEN ↔ Supabase...')
      
      // Detener monitoreo
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval)
        this.monitoringInterval = null
      }
      
      // Detener sincronización
      await gesdenSyncService.stop()
      
      // Desconectar de SQL Server
      await sqlServerService.disconnect()
      
      this.isInitialized = false
      this.syncStatus.running = false
      
      console.log('✅ Integración GESDEN ↔ Supabase detenida')
      
    } catch (error) {
      console.error('❌ Error deteniendo integración:', error)
    }
  }

  // 📊 ESTADÍSTICAS DETALLADAS
  getDetailedStats(): any {
    return {
      config: this.config,
      status: this.syncStatus,
      sqlServer: sqlServerService.getConnectionStatus(),
      syncService: gesdenSyncService.getSyncStats(),
      timestamp: new Date().toISOString()
    }
  }
}

// Instancia singleton
export const gesdenIntegrationService = new GESDENIntegrationService()
export default GESDENIntegrationService

// 🚀 AUTO-INICIALIZACIÓN SI ESTÁ CONFIGURADA
if (process.env.GESDEN_AUTO_SYNC === 'true') {
  console.log('🔄 Auto-inicializando GESDEN ↔ Supabase...')
  gesdenIntegrationService.initialize().catch(error => {
    console.error('❌ Error en auto-inicialización:', error)
  })
}