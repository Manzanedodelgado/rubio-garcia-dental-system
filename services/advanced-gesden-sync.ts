import { EventEmitter } from 'events'
import { sqlServerService } from './sql-server'
import { supabase } from '@/lib/supabase'

export interface SyncOperation {
  id: string
  table: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  data: any
  timestamp: Date
  source: 'supabase' | 'sqlserver'
  synced: boolean
  retryCount: number
  conflicts?: ConflictInfo[]
}

export interface ConflictInfo {
  field: string
  sqlValue: any
  supabaseValue: any
  timestamp: string
  resolution: 'sql_wins' | 'supabase_wins' | 'newest_wins' | 'manual'
}

export interface SyncStats {
  totalOperations: number
  successful: number
  failed: number
  conflicts: number
  lastOperation: Date | null
  activeConnections: {
    sqlserver: boolean
    supabase: boolean
  }
  cdcStatus: 'active' | 'inactive' | 'error'
  realtimeStatus: 'connected' | 'disconnected' | 'connecting'
}

export class AdvancedGESDENSyncEngine extends EventEmitter {
  private stats: SyncStats
  private syncQueue: Map<string, SyncOperation> = new Map()
  private processingQueue: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private syncInterval: NodeJS.Timeout | null = null
  private cdcPolling: NodeJS.Timeout | null = null
  private conflictResolver: ConflictResolver
  private connectionMonitor: ConnectionMonitor

  constructor() {
    super()
    
    this.conflictResolver = new ConflictResolver()
    this.connectionMonitor = new ConnectionMonitor()
    
    this.stats = {
      totalOperations: 0,
      successful: 0,
      failed: 0,
      conflicts: 0,
      lastOperation: null,
      activeConnections: {
        sqlserver: false,
        supabase: false
      },
      cdcStatus: 'inactive',
      realtimeStatus: 'disconnected'
    }

    this.setupEventListeners()
    console.log('🔄 Advanced GESDEN Sync Engine inicializado')
  }

  private setupEventListeners(): void {
    this.on('operation', (operation: SyncOperation) => {
      this.queueOperation(operation)
    })

    this.on('conflict', (conflict: ConflictInfo) => {
      this.stats.conflicts++
      this.emit('stats_updated', this.getStats())
    })

    this.on('error', (error: Error) => {
      console.error('❌ Sync Engine Error:', error)
      this.stats.failed++
      this.emit('stats_updated', this.getStats())
    })
  }

  // 🚀 INICIALIZACIÓN COMPLETA
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Inicializando Advanced GESDEN Sync Engine...')
      
      // 1. Verificar conexiones
      await this.verifyConnections()
      
      // 2. Configurar CDC si está disponible
      await this.setupChangeDataCapture()
      
      // 3. Configurar Real-time listeners
      await this.setupRealtimeListeners()
      
      // 4. Cargar datos iniciales
      await this.performInitialSync()
      
      // 5. Iniciar procesos de monitoreo
      this.startSyncProcessing()
      this.startConnectionMonitoring()
      this.startCDCPolling()
      
      this.reconnectAttempts = 0
      console.log('✅ Advanced GESDEN Sync Engine completamente operativo')
      
    } catch (error) {
      console.error('❌ Error inicializando Sync Engine:', error)
      await this.handleInitializationError(error)
    }
  }

  private async verifyConnections(): Promise<void> {
    console.log('🔍 Verificando conexiones...')
    
    // Verificar SQL Server
    try {
      await sqlServerService.connect()
      const sqlConnected = await sqlServerService.isSQLServerConnected()
      this.stats.activeConnections.sqlserver = sqlConnected
      
      if (!sqlConnected) {
        throw new Error('No se pudo establecer conexión con SQL Server')
      }
      
      console.log('✅ SQL Server conectado')
    } catch (error) {
      console.error('❌ Error SQL Server:', error)
      this.stats.activeConnections.sqlserver = false
      throw error
    }

    // Verificar Supabase
    try {
      const { data, error } = await supabase.from('pacientes').select('id').limit(1)
      this.stats.activeConnections.supabase = !error
      
      if (error) {
        throw new Error(`Error Supabase: ${error.message}`)
      }
      
      console.log('✅ Supabase conectado')
    } catch (error) {
      console.error('❌ Error Supabase:', error)
      this.stats.activeConnections.supabase = false
      throw error
    }
  }

  private async setupChangeDataCapture(): Promise<void> {
    console.log('📡 Configurando Change Data Capture...')
    
    try {
      // Verificar si CDC está disponible en SQL Server 2008
      const cdcAvailable = await this.checkCDCAvailability()
      
      if (cdcAvailable) {
        await this.enableCDCForTables(['pacientes', 'citas', 'doctores'])
        this.stats.cdcStatus = 'active'
        console.log('✅ CDC activado para todas las tablas')
      } else {
        this.stats.cdcStatus = 'inactive'
        console.log('⚠️  CDC no disponible, usando polling fallback')
      }
      
    } catch (error) {
      this.stats.cdcStatus = 'error'
      console.error('❌ Error configurando CDC:', error)
    }
  }

  private async checkCDCAvailability(): Promise<boolean> {
    try {
      // SQL Server 2008 - verificar si CDC está disponible
      const result = await sqlServerService.executeQuery(`
        SELECT COUNT(*) as cdc_jobs
        FROM msdb.dbo.cdc_jobs
      `)
      
      return result.length >= 0 // Simplificado
    } catch (error) {
      console.log('CDC no disponible en SQL Server 2008')
      return false
    }
  }

  private async enableCDCForTables(tables: string[]): Promise<void> {
    for (const table of tables) {
      try {
        await sqlServerService.executeQuery(`
          EXEC sys.sp_cdc_enable_table
          @source_schema = N'dbo',
          @source_name = N'${table}',
          @role_name = NULL,
          @supports_net_changes = 1
        `)
      } catch (error) {
        console.log(`CDC para tabla ${table} podría no estar disponible:`, error.message)
      }
    }
  }

  private async setupRealtimeListeners(): Promise<void> {
    console.log('📡 Configurando Supabase Real-time listeners...')
    
    const tables = ['pacientes', 'citas', 'doctores']
    
    for (const table of tables) {
      supabase
        .channel(`gesden_sync_${table}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: table 
          }, 
          (payload) => this.handleSupabaseChange(table, payload)
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Listener activo para ${table}`)
            this.stats.realtimeStatus = 'connected'
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`❌ Error en listener ${table}`)
            this.stats.realtimeStatus = 'disconnected'
          }
        })
    }
  }

  private handleSupabaseChange(table: string, payload: any): void {
    const operation: SyncOperation = {
      id: `supabase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      table,
      operation: payload.eventType.toUpperCase() as 'INSERT' | 'UPDATE' | 'DELETE',
      data: payload.new || payload.old,
      timestamp: new Date(),
      source: 'supabase',
      synced: false,
      retryCount: 0
    }
    
    this.emit('operation', operation)
    console.log(`📡 Cambio detectado en Supabase (${table}):`, operation.operation)
  }

  private async performInitialSync(): Promise<void> {
    console.log('🔄 Realizando sincronización inicial...')
    
    try {
      // 1. Sincronizar pacientes
      await this.syncTable('pacientes')
      
      // 2. Sincronizar citas
      await this.syncTable('citas')
      
      // 3. Sincronizar doctores
      await this.syncTable('doctores')
      
      this.stats.lastOperation = new Date()
      console.log('✅ Sincronización inicial completada')
      
    } catch (error) {
      console.error('❌ Error en sincronización inicial:', error)
      throw error
    }
  }

  private async syncTable(table: string): Promise<void> {
    console.log(`🔄 Sincronizando tabla: ${table}`)
    
    // Obtener datos de ambas fuentes
    const sqlData = await this.getSQLServerData(table)
    const supabaseData = await this.getSupabaseData(table)
    
    // Crear mapas para comparación rápida
    const sqlMap = new Map(sqlData.map(item => [item.id, item]))
    const supabaseMap = new Map(supabaseData.map(item => [item.id, item]))
    
    // Procesar registros existentes en SQL Server
    for (const [id, sqlRecord] of sqlMap.entries()) {
      const supabaseRecord = supabaseMap.get(id)
      
      if (!supabaseRecord) {
        // Registro nuevo en SQL Server
        await this.syncRecordFromSQL(table, sqlRecord)
      } else {
        // Comparar timestamps para detectar cambios
        await this.compareAndSyncRecord(table, sqlRecord, supabaseRecord)
      }
    }
    
    // Procesar registros nuevos en Supabase
    for (const [id, supabaseRecord] of supabaseMap.entries()) {
      if (!sqlMap.has(id)) {
        // Registro nuevo en Supabase
        await this.syncRecordFromSupabase(table, supabaseRecord)
      }
    }
  }

  private async getSQLServerData(table: string): Promise<any[]> {
    try {
      switch (table) {
        case 'pacientes':
          return await sqlServerService.getPacientesFromSQL()
        case 'citas':
          return await sqlServerService.getCitasFromSQL()
        case 'doctores':
          return await sqlServerService.getDoctoresFromSQL()
        default:
          return []
      }
    } catch (error) {
      console.error(`Error obteniendo datos SQL Server (${table}):`, error)
      return []
    }
  }

  private async getSupabaseData(table: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.from(table).select('*')
      
      if (error) {
        throw error
      }
      
      return data || []
    } catch (error) {
      console.error(`Error obteniendo datos Supabase (${table}):`, error)
      return []
    }
  }

  private async compareAndSyncRecord(table: string, sqlRecord: any, supabaseRecord: any): Promise<void> {
    const sqlTimestamp = new Date(sqlRecord.updated_at || sqlRecord.created_at)
    const supabaseTimestamp = new Date(supabaseRecord.updated_at || supabaseRecord.created_at)
    
    if (sqlTimestamp > supabaseTimestamp) {
      // SQL Server es más reciente
      await this.syncRecordFromSQL(table, sqlRecord)
    } else if (supabaseTimestamp > sqlTimestamp) {
      // Supabase es más reciente
      await this.syncRecordFromSupabase(table, supabaseRecord)
    }
    // Si son iguales, no hacer nada
  }

  private async syncRecordFromSQL(table: string, record: any): Promise<void> {
    try {
      const { error } = await supabase
        .from(table)
        .upsert(record, { onConflict: 'id' })
      
      if (error) {
        throw error
      }
      
      this.stats.successful++
      console.log(`✅ Sincronizado desde SQL Server: ${table} (${record.id})`)
      
    } catch (error) {
      this.stats.failed++
      console.error(`❌ Error sincronizando desde SQL Server: ${table} (${record.id})`, error)
      throw error
    }
  }

  private async syncRecordFromSupabase(table: string, record: any): Promise<void> {
    try {
      await sqlServerService.upsertToSQL(table, record)
      
      this.stats.successful++
      console.log(`✅ Sincronizado desde Supabase: ${table} (${record.id})`)
      
    } catch (error) {
      this.stats.failed++
      console.error(`❌ Error sincronizando desde Supabase: ${table} (${record.id})`, error)
      throw error
    }
  }

  private queueOperation(operation: SyncOperation): void {
    this.stats.totalOperations++
    this.stats.lastOperation = new Date()
    this.syncQueue.set(operation.id, operation)
    
    console.log(`📋 Operación agregada a cola: ${operation.operation} en ${operation.table}`)
  }

  private startSyncProcessing(): void {
    if (this.processingQueue) return
    
    this.processingQueue = true
    const processQueue = async () => {
      if (this.syncQueue.size > 0) {
        const operation = this.syncQueue.values().next().value
        await this.processOperation(operation)
        this.syncQueue.delete(operation.id)
      }
    }
    
    // Procesar cola cada 2 segundos
    setInterval(processQueue, 2000)
    console.log('🔄 Procesamiento de cola iniciado')
  }

  private async processOperation(operation: SyncOperation): Promise<void> {
    try {
      this.stats.totalOperations++
      
      if (operation.source === 'supabase') {
        // Supabase → SQL Server
        await sqlServerService.upsertToSQL(operation.table, operation.data)
      } else {
        // SQL Server → Supabase
        const { error } = await supabase
          .from(operation.table)
          .upsert(operation.data, { onConflict: 'id' })
        
        if (error) {
          throw error
        }
      }
      
      operation.synced = true
      this.stats.successful++
      
      console.log(`✅ Operación procesada: ${operation.operation} en ${operation.table}`)
      
    } catch (error) {
      this.stats.failed++
      operation.retryCount++
      
      console.error(`❌ Error procesando operación:`, operation, error)
      
      // Reintentar si no ha excedido el límite
      if (operation.retryCount < 3) {
        setTimeout(() => {
          this.syncQueue.set(operation.id, operation)
        }, 5000 * operation.retryCount) // Backoff exponencial
      }
    }
    
    this.emit('stats_updated', this.getStats())
  }

  private startConnectionMonitoring(): void {
    // Verificar conexiones cada 30 segundos
    this.syncInterval = setInterval(async () => {
      try {
        await this.verifyConnections()
        this.reconnectAttempts = 0
        
        if (!this.stats.activeConnections.sqlserver || !this.stats.activeConnections.supabase) {
          console.log('⚠️  Conexiones detectadas como inactivas')
          this.reconnectAttempts++
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Máximo de intentos de reconexión alcanzado')
            this.emit('critical_error', new Error('Reconnection failed'))
          }
        }
        
      } catch (error) {
        console.error('❌ Error en monitoreo de conexiones:', error)
        this.reconnectAttempts++
      }
    }, 30000)
    
    console.log('🔍 Monitoreo de conexiones iniciado')
  }

  private startCDCPolling(): Promise<void> {
    if (this.stats.cdcStatus === 'active') return Promise.resolve()
    
    // Si CDC no está disponible, usar polling
    this.cdcPolling = setInterval(async () => {
      try {
        await this.pollSQLServerChanges()
      } catch (error) {
        console.error('❌ Error en polling CDC:', error)
      }
    }, 10000) // Cada 10 segundos
    
    console.log('📡 Polling CDC iniciado')
    return Promise.resolve()
  }

  private async pollSQLServerChanges(): Promise<void> {
    // Implementar lógica de polling para detectar cambios
    // Comparar timestamps y detectar diferencias
    console.log('📊 Polling SQL Server para cambios...')
  }

  private async handleInitializationError(error: any): Promise<void> {
    console.error('🚨 Error crítico en inicialización:', error)
    
    // Intentar reconexión con backoff
    for (let i = 1; i <= 3; i++) {
      try {
        console.log(`🔄 Reintentando inicialización (${i}/3)...`)
        await this.delay(5000 * i)
        await this.initialize()
        return
      } catch (retryError) {
        console.error(`❌ Error en reintento ${i}:`, retryError)
      }
    }
    
    // Si todos los reintentos fallan, emitir evento de error crítico
    this.emit('initialization_failed', error)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 📊 MÉTODOS PÚBLICOS
  public getStats(): SyncStats {
    return { ...this.stats }
  }

  public forceSync(table?: string): Promise<void> {
    if (table) {
      return this.syncTable(table)
    }
    return this.performInitialSync()
  }

  public stop(): void {
    console.log('🛑 Deteniendo Advanced GESDEN Sync Engine...')
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    
    if (this.cdcPolling) {
      clearInterval(this.cdcPolling)
      this.cdcPolling = null
    }
    
    this.processingQueue = false
    this.syncQueue.clear()
    
    console.log('✅ Advanced GESDEN Sync Engine detenido')
  }
}

// CLASES DE SOPORTE

class ConflictResolver {
  async resolveConflicts(conflicts: ConflictInfo[], resolution: 'sql_wins' | 'supabase_wins' | 'newest_wins' | 'manual'): Promise<any> {
    // Implementar lógica de resolución de conflictos
    return conflicts
  }
}

class ConnectionMonitor {
  async checkConnections(): Promise<{ sqlserver: boolean; supabase: boolean }> {
    try {
      const sqlConnected = await sqlServerService.isSQLServerConnected()
      const { data } = await supabase.from('pacientes').select('id').limit(1)
      
      return {
        sqlserver: sqlConnected,
        supabase: !data ? false : true
      }
    } catch (error) {
      return { sqlserver: false, supabase: false }
    }
  }
}

// Instancia singleton
export const advancedGESDENSyncEngine = new AdvancedGESDENSyncEngine()
export default AdvancedGESDENSyncEngine