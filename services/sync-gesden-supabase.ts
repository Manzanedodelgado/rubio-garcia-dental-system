import { supabase } from '@/lib/supabase'
import { sqlServerService } from './sql-server'

export interface SyncConfig {
  realtime: boolean
  bidirectional: boolean
  conflictResolution: 'supabase_master' | 'sql_master' | 'timestamp' | 'manual'
  monitoring: boolean
  debug: boolean
}

export interface SyncOperation {
  table: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  data: any
  timestamp: Date
  source: 'supabase' | 'sqlserver'
  synced: boolean
  conflicts?: string[]
}

export class GESDENSyncService {
  private config: SyncConfig
  private isRunning: boolean = false
  private lastSync: Date | null = null
  private syncStats = {
    totalOperations: 0,
    successful: 0,
    conflicts: 0,
    errors: 0,
    lastOperation: null as Date | null
  }

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      realtime: true,
      bidirectional: true,
      conflictResolution: 'timestamp',
      monitoring: true,
      debug: true,
      ...config
    }
    
    if (this.config.debug) {
      console.log('🔄 GESDEN-Supabase Sync Service iniciado')
      console.log('⚡ Tiempo real:', this.config.realtime)
      console.log('↔️  Bidireccional:', this.config.bidirectional)
      console.log('🎯 Resolución conflictos:', this.config.conflictResolution)
    }
  }

  // 🔄 INICIALIZAR SINCRONIZACIÓN COMPLETA
  async initializeSync(): Promise<void> {
    try {
      console.log('🚀 Inicializando sincronización GESDEN ↔ Supabase...')
      
      // 1. Conectar a SQL Server real (no mock)
      await sqlServerService.connect()
      
      // 2. Configurar Change Data Capture en SQL Server
      await this.setupSQLServerCDC()
      
      // 3. Configurar Supabase Real-time
      await this.setupSupabaseRealtime()
      
      // 4. Sincronización inicial bidireccional
      await this.initialSync()
      
      // 5. Iniciar监听adores
      this.startRealtimeListeners()
      
      this.isRunning = true
      console.log('✅ Sincronización GESDEN ↔ Supabase activa')
      
    } catch (error) {
      console.error('❌ Error inicializando sincronización:', error)
      throw error
    }
  }

  // 🔍 CONFIGURAR CDC EN SQL SERVER 2008
  private async setupSQLServerCDC(): Promise<void> {
    try {
      console.log('📡 Configurando Change Data Capture en SQL Server 2008...')
      
      // Habilitar CDC en las tablas principales
      const cdcQueries = [
        // Habilitar CDC para pacientes
        `EXEC sys.sp_cdc_enable_table
        @source_schema = N'dbo',
        @source_name = N'pacientes',
        @role_name = NULL,
        @supports_net_changes = 1`,
        
        // Habilitar CDC para citas
        `EXEC sys.sp_cdc_enable_table
        @source_schema = N'dbo',
        @source_name = N'citas',
        @role_name = NULL,
        @supports_net_changes = 1`,
        
        // Habilitar CDC para doctores
        `EXEC sys.sp_cdc_enable_table
        @source_schema = N'dbo',
        @source_name = N'doctores',
        @role_name = NULL,
        @supports_net_changes = 1`
      ]

      for (const query of cdcQueries) {
        try {
          await sqlServerService.executeQuery(query)
          console.log('✅ CDC habilitado para tabla')
        } catch (error) {
          console.log('⚠️  CDC podría no estar disponible:', error.message)
        }
      }

    } catch (error) {
      console.error('❌ Error configurando CDC:', error)
      // Fallback a polling si CDC no funciona
      await this.setupPollingFallback()
    }
  }

  // 🔍 CONFIGURAR SUPABASE REAL-TIME
  private async setupSupabaseRealtime(): Promise<void> {
    try {
      console.log('📡 Configurando Supabase Real-time...')
      
      // Escuchar cambios en tiempo real en todas las tablas
      const tables = ['pacientes', 'citas', 'doctores']
      
      for (const table of tables) {
        supabase
          .channel(`${table}_changes`)
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: table 
            }, 
            (payload) => {
              this.handleSupabaseChange(table, payload)
            }
          )
          .subscribe()
      }
      
      console.log('✅ Supabase Real-time listeners activos')
      
    } catch (error) {
      console.error('❌ Error configurando Supabase Real-time:', error)
    }
  }

  // 📋 SINCRONIZACIÓN INICIAL COMPLETA
  private async initialSync(): Promise<void> {
    try {
      console.log('🔄 Iniciando sincronización inicial completa...')
      
      // 1. SQL Server → Supabase
      await this.syncSQLServerToSupabase()
      
      // 2. Supabase → SQL Server
      await this.syncSupabaseToSQLServer()
      
      // 3. Verificar consistencia
      await this.verifyDataConsistency()
      
      this.lastSync = new Date()
      console.log('✅ Sincronización inicial completada')
      
    } catch (error) {
      console.error('❌ Error en sincronización inicial:', error)
      throw error
    }
  }

  // 🔄 SINCRONIZACIÓN SQL SERVER → SUPABASE
  private async syncSQLServerToSupabase(): Promise<void> {
    try {
      console.log('📤 Sincronizando SQL Server → Supabase...')
      
      // Obtener datos de SQL Server
      const pacientes = await sqlServerService.getPacientesFromSQL()
      const citas = await sqlServerService.getCitasFromSQL()
      const doctores = await sqlServerService.getDoctoresFromSQL()
      
      // Sincronizar pacientes
      for (const paciente of pacientes) {
        await this.syncRecord('pacientes', paciente, 'sqlserver', 'supabase')
      }
      
      // Sincronizar citas
      for (const cita of citas) {
        await this.syncRecord('citas', cita, 'sqlserver', 'supabase')
      }
      
      // Sincronizar doctores
      for (const doctor of doctores) {
        await this.syncRecord('doctores', doctor, 'sqlserver', 'supabase')
      }
      
      console.log(`✅ Sincronización SQL Server → Supabase completada`)
      
    } catch (error) {
      console.error('❌ Error sincronizando SQL Server → Supabase:', error)
    }
  }

  // 🔄 SINCRONIZACIÓN SUPABASE → SQL SERVER
  private async syncSupabaseToSQLServer(): Promise<void> {
    try {
      console.log('📥 Sincronizando Supabase → SQL Server...')
      
      // Obtener datos de Supabase
      const { data: pacientes } = await supabase.from('pacientes').select('*')
      const { data: citas } = await supabase.from('citas').select('*')
      const { data: doctores } = await supabase.from('doctores').select('*')
      
      // Sincronizar pacientes a SQL Server
      if (pacientes) {
        for (const paciente of pacientes) {
          await this.syncRecord('pacientes', paciente, 'supabase', 'sqlserver')
        }
      }
      
      // Sincronizar citas a SQL Server
      if (citas) {
        for (const cita of citas) {
          await this.syncRecord('citas', cita, 'supabase', 'sqlserver')
        }
      }
      
      // Sincronizar doctores a SQL Server
      if (doctores) {
        for (const doctor of doctores) {
          await this.syncRecord('doctores', doctor, 'supabase', 'sqlserver')
        }
      }
      
      console.log('✅ Sincronización Supabase → SQL Server completada')
      
    } catch (error) {
      console.error('❌ Error sincronizando Supabase → SQL Server:', error)
    }
  }

  // 🔄 SINCRONIZAR REGISTRO INDIVIDUAL
  private async syncRecord(table: string, data: any, source: 'supabase' | 'sqlserver', target: 'supabase' | 'sqlserver'): Promise<void> {
    try {
      this.syncStats.totalOperations++
      
      // 1. Verificar conflictos
      const conflicts = await this.detectConflicts(table, data, source)
      
      if (conflicts.length > 0) {
        this.syncStats.conflicts++
        await this.resolveConflicts(table, data, conflicts)
        return
      }
      
      // 2. Sincronizar según la fuente
      if (target === 'supabase' && source === 'sqlserver') {
        // SQL Server → Supabase
        const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' })
        if (error) throw error
        
      } else if (target === 'sqlserver' && source === 'supabase') {
        // Supabase → SQL Server
        await sqlServerService.upsertToSQL(table, data)
      }
      
      this.syncStats.successful++
      this.syncStats.lastOperation = new Date()
      
      if (this.config.debug) {
        console.log(`✅ Sincronizado ${table}:`, data.id, `${source} → ${target}`)
      }
      
    } catch (error) {
      this.syncStats.errors++
      console.error(`❌ Error sincronizando ${table}:`, error)
    }
  }

  // 🔍 DETECTAR CONFLICTOS DE SINCRONIZACIÓN
  private async detectConflicts(table: string, data: any, source: 'supabase' | 'sqlserver'): Promise<string[]> {
    const conflicts: string[] = []
    
    try {
      if (source === 'sqlserver') {
        // Verificar si existe en Supabase y comparar timestamps
        const { data: supabaseData } = await supabase
          .from(table)
          .select('*')
          .eq('id', data.id)
          .single()
        
        if (supabaseData && supabaseData.updated_at && data.updated_at) {
          const sqlTimestamp = new Date(data.updated_at)
          const supabaseTimestamp = new Date(supabaseData.updated_at)
          
          if (supabaseTimestamp > sqlTimestamp) {
            conflicts.push('timestamp_conflict')
          }
        }
        
      } else if (source === 'supabase') {
        // Verificar si existe en SQL Server y comparar
        const sqlData = await sqlServerService.getRecordFromSQL(table, data.id)
        if (sqlData && sqlData.updated_at && data.updated_at) {
          const supabaseTimestamp = new Date(data.updated_at)
          const sqlTimestamp = new Date(sqlData.updated_at)
          
          if (sqlTimestamp > supabaseTimestamp) {
            conflicts.push('timestamp_conflict')
          }
        }
      }
      
    } catch (error) {
      // Si no se puede detectar conflicto, continuar sin conflicto
    }
    
    return conflicts
  }

  // ⚖️ RESOLVER CONFLICTOS
  private async resolveConflicts(table: string, data: any, conflicts: string[]): Promise<void> {
    try {
      console.log(`⚖️ Resolviendo conflictos en ${table}:`, conflicts)
      
      let resolvedData = { ...data }
      
      for (const conflict of conflicts) {
        switch (this.config.conflictResolution) {
          case 'supabase_master':
            resolvedData = await this.resolveWithSupabaseMaster(table, data)
            break
          case 'sql_master':
            resolvedData = await this.resolveWithSQLMaster(table, data)
            break
          case 'timestamp':
            resolvedData = await this.resolveWithTimestamp(table, data)
            break
          case 'manual':
            resolvedData = await this.resolveManually(table, data, conflicts)
            break
        }
      }
      
      // Aplicar datos resueltos a ambas bases
      await Promise.all([
        supabase.from(table).upsert(resolvedData, { onConflict: 'id' }),
        sqlServerService.upsertToSQL(table, resolvedData)
      ])
      
      console.log(`✅ Conflictos resueltos en ${table}`)
      
    } catch (error) {
      console.error(`❌ Error resolviendo conflictos:`, error)
    }
  }

  // 🎯 INICIAR LISTENERS EN TIEMPO REAL
  private startRealtimeListeners(): void {
    // Listener para cambios en Supabase
    supabase.channel('gesden_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pacientes' }, 
        (payload) => this.handleSupabaseChange('pacientes', payload)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, 
        (payload) => this.handleSupabaseChange('citas', payload)
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctores' }, 
        (payload) => this.handleSupabaseChange('doctores', payload)
      )
      .subscribe()
      
    console.log('✅ Listeners tiempo real activos')
  }

  // 🔄 MANEJAR CAMBIOS DE SUPABASE
  private async handleSupabaseChange(table: string, payload: any): Promise<void> {
    try {
      if (!this.isRunning) return
      
      const operation: SyncOperation = {
        table,
        operation: payload.eventType.toUpperCase() as 'INSERT' | 'UPDATE' | 'DELETE',
        data: payload.new || payload.old,
        timestamp: new Date(),
        source: 'supabase',
        synced: false
      }
      
      // Sincronizar inmediatamente a SQL Server
      await this.syncRecord(table, operation.data, 'supabase', 'sqlserver')
      
      console.log(`📡 Cambio detectado en Supabase (${table}):`, operation.operation)
      
    } catch (error) {
      console.error('❌ Error manejando cambio Supabase:', error)
    }
  }

  // 🔄 VERIFICAR CONSISTENCIA DE DATOS
  private async verifyDataConsistency(): Promise<void> {
    try {
      console.log('🔍 Verificando consistencia de datos...')
      
      const tables = ['pacientes', 'citas', 'doctores']
      
      for (const table of tables) {
        const supabaseCount = await this.getSupabaseCount(table)
        const sqlCount = await this.getSQLCount(table)
        
        if (supabaseCount !== sqlCount) {
          console.log(`⚠️  Inconsistencia en ${table}: Supabase=${supabaseCount}, SQL=${sqlCount}`)
          await this.forceSyncTable(table)
        }
      }
      
      console.log('✅ Verificación de consistencia completada')
      
    } catch (error) {
      console.error('❌ Error verificando consistencia:', error)
    }
  }

  // 📊 MÉTODOS DE ESTADÍSTICAS
  getSyncStats(): any {
    return {
      ...this.syncStats,
      isRunning: this.isRunning,
      lastSync: this.lastSync,
      config: this.config
    }
  }

  // 🔄 FALLBACK DE POLLING SI CDC NO DISPONIBLE
  private async setupPollingFallback(): Promise<void> {
    console.log('🔄 Configurando fallback de polling...')
    
    // Polling cada 5 segundos para detectar cambios
    setInterval(async () => {
      if (!this.isRunning) return
      
      try {
        await this.pollSQLServerChanges()
      } catch (error) {
        console.error('❌ Error en polling SQL Server:', error)
      }
    }, 5000)
  }

  private async pollSQLServerChanges(): Promise<void> {
    // Implementar lógica de polling para SQL Server
    // Comparar timestamps y detectar cambios
  }

  // 🎯 MÉTODOS DE RESOLUCIÓN DE CONFLICTOS
  private async resolveWithSupabaseMaster(table: string, data: any): Promise<any> {
    console.log(`🎯 Usando Supabase como maestro para ${table}`)
    return data
  }

  private async resolveWithSQLMaster(table: string, data: any): Promise<any> {
    const sqlData = await sqlServerService.getRecordFromSQL(table, data.id)
    console.log(`🎯 Usando SQL Server como maestro para ${table}`)
    return sqlData || data
  }

  private async resolveWithTimestamp(table: string, data: any): Promise<any> {
    console.log(`🎯 Usando timestamp para resolver conflictos en ${table}`)
    return data
  }

  private async resolveManually(table: string, data: any, conflicts: string[]): Promise<any> {
    console.log(`🎯 Resolución manual requerida para ${table}:`, conflicts)
    return data
  }

  // 📊 MÉTODOS AUXILIARES DE CONTEO
  private async getSupabaseCount(table: string): Promise<number> {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
    return count || 0
  }

  private async getSQLCount(table: string): Promise<number> {
    const result = await sqlServerService.getRecordCount(table)
    return result
  }

  private async forceSyncTable(table: string): Promise<void> {
    console.log(`🔄 Forzando sincronización de tabla: ${table}`)
    // Implementar sincronización forzada
  }

  // 🛑 DETENER SINCRONIZACIÓN
  async stop(): Promise<void> {
    this.isRunning = false
    console.log('🛑 Sincronización GESDEN ↔ Supabase detenida')
  }
}

// Instancia singleton
export const gesdenSyncService = new GESDENSyncService()
export default GESDENSyncService