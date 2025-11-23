import { EventEmitter } from 'events'

export interface ConflictData {
  table: string
  recordId: string
  timestamp: Date
  source: 'sqlserver' | 'supabase'
  changes: Record<string, {
    oldValue: any
    newValue: any
    timestamp: string
  }>
}

export interface ConflictResolution {
  table: string
  recordId: string
  conflicts: ConflictData[]
  strategy: ResolutionStrategy
  resolution: ResolvedData
  appliedAt: Date
  verified: boolean
}

export interface ResolvedData {
  finalData: any
  sources: {
    sqlserver?: any
    supabase?: any
  }
  timestamps: {
    conflict: Date
    resolution: Date
  }
}

export interface ResolutionStrategy {
  name: 'last_write_wins' | 'field_level_merge' | 'manual_review' | 'priority_source' | 'timestamp_priority'
  config?: {
    priority?: 'sqlserver' | 'supabase'
    fields?: Record<string, 'sqlserver' | 'supabase' | 'newest' | 'manual'>
    manualRules?: ManualRule[]
  }
}

export interface ManualRule {
  condition: (record: any) => boolean
  resolveWith: 'sqlserver' | 'supabase' | 'custom'
  customValue?: any
}

export interface ConflictAnalysis {
  conflicts: ConflictData[]
  analysis: {
    hasFieldConflicts: boolean
    hasTimestampConflicts: boolean
    complexity: 'low' | 'medium' | 'high'
    recommendedStrategy: ResolutionStrategy['name']
    confidence: number // 0-100
  }
  suggestions: string[]
}

export class IntelligentConflictResolver extends EventEmitter {
  private conflictHistory: Map<string, ConflictResolution[]> = new Map()
  private resolutionPatterns: Map<string, ResolutionStrategy> = new Map()
  private autoResolutionThreshold = 95 // % de confianza mínima para auto-resolución
  private learningEnabled = true

  constructor() {
    super()
    this.initializePatterns()
    console.log('🤖 Intelligent Conflict Resolver inicializado')
  }

  private initializePatterns(): void {
    // Patrones aprendidos de resoluciones anteriores
    this.resolutionPatterns.set('pacientes.nombre', {
      name: 'last_write_wins',
      config: { priority: 'sqlserver' } // GESDEN es fuente de verdad para datos básicos
    })

    this.resolutionPatterns.set('citas.estado', {
      name: 'priority_source',
      config: { priority: 'supabase' } // App es fuente de verdad para estados
    })

    this.resolutionPatterns.set('doctores.*', {
      name: 'field_level_merge'
    })
  }

  // 🔍 DETECTAR CONFLICTOS
  async detectConflicts(table: string, sqlRecord: any, supabaseRecord: any): Promise<ConflictAnalysis> {
    console.log(`🔍 Analizando conflictos para ${table} (${sqlRecord.id})`)
    
    const conflicts: ConflictData[] = []
    const suggestions: string[] = []

    // Comparar campos que pueden tener conflictos
    const conflictProneFields = [
      'nombre', 'apellido', 'telefono', 'email', 'direccion', // Pacientes
      'fecha_hora', 'motivo', 'estado', 'doctor_id', // Citas
      'especialidad', 'horario_inicio', 'horario_fin' // Doctores
    ]

    for (const field of conflictProneFields) {
      if (sqlRecord[field] !== undefined && supabaseRecord[field] !== undefined) {
        const sqlTimestamp = new Date(sqlRecord.updated_at || sqlRecord.created_at)
        const supabaseTimestamp = new Date(supabaseRecord.updated_at || supabaseRecord.created_at)

        // Verificar si hay diferencias
        if (sqlRecord[field] !== supabaseRecord[field]) {
          conflicts.push({
            table,
            recordId: sqlRecord.id,
            timestamp: new Date(),
            source: 'sqlserver',
            changes: {
              [field]: {
                oldValue: supabaseRecord[field],
                newValue: sqlRecord[field],
                timestamp: sqlTimestamp.toISOString()
              }
            }
          })

          conflicts.push({
            table,
            recordId: supabaseRecord.id,
            timestamp: new Date(),
            source: 'supabase',
            changes: {
              [field]: {
                oldValue: sqlRecord[field],
                newValue: supabaseRecord[field],
                timestamp: supabaseTimestamp.toISOString()
              }
            }
          })

          suggestions.push(`Campo '${field}' modificado en ambas fuentes`)
        }
      }
    }

    // Análisis de complejidad
    const hasFieldConflicts = conflicts.length > 0
    const hasTimestampConflicts = this.hasTimestampConflicts(conflicts)
    const complexity = this.calculateComplexity(conflicts)
    const recommendedStrategy = this.recommendStrategy(table, conflicts)
    const confidence = this.calculateConfidence(conflicts, complexity)

    const analysis: ConflictAnalysis = {
      conflicts,
      analysis: {
        hasFieldConflicts,
        hasTimestampConflicts,
        complexity,
        recommendedStrategy,
        confidence
      },
      suggestions
    }

    this.emit('conflict_detected', analysis)
    
    console.log(`🔍 Análisis completado: ${conflicts.length} conflictos detectados, confianza ${confidence}%`)
    
    return analysis
  }

  private hasTimestampConflicts(conflicts: ConflictData[]): boolean {
    const timestamps = conflicts.flatMap(c => 
      Object.values(c.changes).map(change => new Date(change.timestamp))
    )
    
    const uniqueTimestamps = [...new Set(timestamps.map(t => t.getTime()))]
    return uniqueTimestamps.length > 1
  }

  private calculateComplexity(conflicts: ConflictData[]): 'low' | 'medium' | 'high' {
    const conflictCount = conflicts.length
    const fieldsAffected = new Set(conflicts.flatMap(c => Object.keys(c.changes))).size

    if (conflictCount <= 2 && fieldsAffected <= 2) return 'low'
    if (conflictCount <= 5 && fieldsAffected <= 4) return 'medium'
    return 'high'
  }

  private recommendStrategy(table: string, conflicts: ConflictData[]): ResolutionStrategy['name'] {
    // Buscar patrón aprendido
    for (const [pattern, strategy] of this.resolutionPatterns.entries()) {
      if (this.matchesPattern(table, pattern)) {
        return strategy.name
      }
    }

    // Estrategia por defecto según el tipo de tabla
    switch (table) {
      case 'pacientes':
        return 'field_level_merge' // Datos de pacientes requieren revisión cuidadosa
      case 'citas':
        return 'last_write_wins' // Citas más recientes tienen prioridad
      case 'doctores':
        return 'priority_source' // Fuente principal definida
      default:
        return 'timestamp_priority' // Timestamp como criterio por defecto
    }
  }

  private calculateConfidence(conflicts: ConflictData[], complexity: string): number {
    let confidence = 100

    // Reducir confianza por complejidad
    if (complexity === 'medium') confidence -= 20
    if (complexity === 'high') confidence -= 50

    // Reducir confianza por número de conflictos
    if (conflicts.length > 5) confidence -= 30
    if (conflicts.length > 10) confidence -= 50

    // Considerar patrones aprendidos
    if (this.learningEnabled && conflicts.length > 0) {
      // Si hay historial de resoluciones para este tipo de conflicto
      confidence += 10
    }

    return Math.max(0, Math.min(100, confidence))
  }

  private matchesPattern(table: string, pattern: string): boolean {
    if (pattern === table) return true
    if (pattern.includes('*')) {
      const prefix = pattern.replace('*', '')
      return table.startsWith(prefix)
    }
    return false
  }

  // ⚖️ RESOLVER CONFLICTOS
  async resolveConflicts(analysis: ConflictAnalysis): Promise<ConflictResolution> {
    const { conflicts, analysis: { recommendedStrategy, confidence } } = analysis

    console.log(`⚖️ Resolviendo ${conflicts.length} conflictos con estrategia ${recommendedStrategy}`)

    // Si la confianza es muy alta, resolver automáticamente
    if (confidence >= this.autoResolutionThreshold) {
      const strategy = this.getStrategy(recommendedStrategy, analysis)
      return await this.applyResolutionStrategy(conflicts, strategy)
    }

    // Si no, crear resolución pendiente de revisión manual
    return this.createPendingResolution(conflicts, analysis)
  }

  private getStrategy(strategyName: ResolutionStrategy['name'], analysis: ConflictAnalysis): ResolutionStrategy {
    // Buscar configuración aprendida
    for (const [pattern, strategy] of this.resolutionPatterns.entries()) {
      if (strategy.name === strategyName) {
        return strategy
      }
    }

    // Configuración por defecto
    switch (strategyName) {
      case 'priority_source':
        return { name: strategyName, config: { priority: 'sqlserver' } }
      case 'field_level_merge':
        return { name: strategyName }
      default:
        return { name: 'last_write_wins' }
    }
  }

  private async applyResolutionStrategy(conflicts: ConflictData[], strategy: ResolutionStrategy): Promise<ConflictResolution> {
    const recordId = conflicts[0].recordId
    const table = conflicts[0].table

    let resolvedData: any = {}
    const sources = { sqlserver: {}, supabase: {} }

    switch (strategy.name) {
      case 'last_write_wins':
        return await this.lastWriteWins(conflicts, strategy)

      case 'field_level_merge':
        return await this.fieldLevelMerge(conflicts, strategy)

      case 'priority_source':
        return await this.prioritySource(conflicts, strategy)

      case 'timestamp_priority':
        return await this.timestampPriority(conflicts, strategy)

      default:
        throw new Error(`Estrategia desconocida: ${strategy.name}`)
    }
  }

  private async lastWriteWins(conflicts: ConflictData[], strategy: ResolutionStrategy): Promise<ConflictResolution> {
    // Tomar el registro más reciente
    const latestTimestamp = conflicts.reduce((latest, conflict) => {
      const conflictTime = Math.max(...Object.values(conflict.changes).map(c => new Date(c.timestamp).getTime()))
      return Math.max(latest, conflictTime)
    }, 0)

    const latestSource = conflicts.find(conflict => {
      return Object.values(conflict.changes).some(change => 
        new Date(change.timestamp).getTime() === latestTimestamp
      )
    })?.source || 'sqlserver'

    const resolvedRecord = latestSource === 'sqlserver' ? 
      this.extractRecordFromConflicts(conflicts, 'sqlserver') :
      this.extractRecordFromConflicts(conflicts, 'supabase')

    const resolution: ConflictResolution = {
      table: conflicts[0].table,
      recordId: conflicts[0].recordId,
      conflicts,
      strategy,
      resolution: {
        finalData: resolvedRecord,
        sources: {
          sqlserver: latestSource === 'sqlserver' ? resolvedRecord : null,
          supabase: latestSource === 'supabase' ? resolvedRecord : null
        },
        timestamps: {
          conflict: new Date(),
          resolution: new Date()
        }
      },
      appliedAt: new Date(),
      verified: true
    }

    // Aprender de esta resolución
    this.learnFromResolution(resolution)

    console.log(`✅ Conflicto resuelto con Last Write Wins (${latestSource})`)
    return resolution
  }

  private async fieldLevelMerge(conflicts: ConflictData[], strategy: ResolutionStrategy): Promise<ConflictResolution> {
    const mergedRecord: any = { id: conflicts[0].recordId }
    const sources = { sqlserver: {}, supabase: {} }

    // Obtener datos base de ambas fuentes
    const sqlData = this.extractRecordFromConflicts(conflicts, 'sqlserver')
    const supabaseData = this.extractRecordFromConflicts(conflicts, 'supabase')

    // Merge campo por campo
    const allFields = new Set([
      ...Object.keys(sqlData || {}),
      ...Object.keys(supabaseData || {})
    ])

    for (const field of allFields) {
      if (field === 'id') {
        mergedRecord[field] = conflicts[0].recordId
        continue
      }

      const sqlValue = sqlData?.[field]
      const supabaseValue = supabaseData?.[field]

      if (sqlValue === supabaseValue) {
        mergedRecord[field] = sqlValue || supabaseValue
      } else {
        // Usar configuración de campo si existe
        const fieldConfig = strategy.config?.fields?.[field]
        
        if (fieldConfig) {
          switch (fieldConfig) {
            case 'sqlserver':
              mergedRecord[field] = sqlValue
              break
            case 'supabase':
              mergedRecord[field] = supabaseValue
              break
            case 'newest':
              const sqlTimestamp = new Date(sqlData.updated_at || sqlData.created_at || 0)
              const supabaseTimestamp = new Date(supabaseData.updated_at || supabaseData.created_at || 0)
              mergedRecord[field] = sqlTimestamp > supabaseTimestamp ? sqlValue : supabaseValue
              break
            default:
              // Manual review required
              mergedRecord[field] = { __CONFLICT__: { sqlValue, supabaseValue } }
          }
        } else {
          // Por defecto, usar el más reciente
          const sqlTimestamp = new Date(sqlData.updated_at || sqlData.created_at || 0)
          const supabaseTimestamp = new Date(supabaseData.updated_at || supabaseData.created_at || 0)
          mergedRecord[field] = sqlTimestamp > supabaseTimestamp ? sqlValue : supabaseValue
        }
      }
    }

    const resolution: ConflictResolution = {
      table: conflicts[0].table,
      recordId: conflicts[0].recordId,
      conflicts,
      strategy,
      resolution: {
        finalData: mergedRecord,
        sources,
        timestamps: {
          conflict: new Date(),
          resolution: new Date()
        }
      },
      appliedAt: new Date(),
      verified: true
    }

    this.learnFromResolution(resolution)
    console.log('✅ Conflicto resuelto con Field Level Merge')
    return resolution
  }

  private async prioritySource(conflicts: ConflictData[], strategy: ResolutionStrategy): Promise<ConflictResolution> {
    const priority = strategy.config?.priority || 'sqlserver'
    const sourceData = this.extractRecordFromConflicts(conflicts, priority)
    
    const resolution: ConflictResolution = {
      table: conflicts[0].table,
      recordId: conflicts[0].recordId,
      conflicts,
      strategy,
      resolution: {
        finalData: sourceData,
        sources: {
          sqlserver: priority === 'sqlserver' ? sourceData : this.extractRecordFromConflicts(conflicts, 'sqlserver'),
          supabase: priority === 'supabase' ? sourceData : this.extractRecordFromConflicts(conflicts, 'supabase')
        },
        timestamps: {
          conflict: new Date(),
          resolution: new Date()
        }
      },
      appliedAt: new Date(),
      verified: true
    }

    this.learnFromResolution(resolution)
    console.log(`✅ Conflicto resuelto con Priority Source (${priority})`)
    return resolution
  }

  private async timestampPriority(conflicts: ConflictData[], strategy: ResolutionStrategy): Promise<ConflictResolution> {
    // Similar a last_write_wins pero más explícito
    return await this.lastWriteWins(conflicts, strategy)
  }

  private createPendingResolution(conflicts: ConflictData[], analysis: ConflictAnalysis): ConflictResolution {
    const resolution: ConflictResolution = {
      table: conflicts[0].table,
      recordId: conflicts[0].recordId,
      conflicts,
      strategy: this.getStrategy(analysis.analysis.recommendedStrategy, analysis),
      resolution: {
        finalData: null,
        sources: {
          sqlserver: this.extractRecordFromConflicts(conflicts, 'sqlserver'),
          supabase: this.extractRecordFromConflicts(conflicts, 'supabase')
        },
        timestamps: {
          conflict: new Date(),
          resolution: new Date()
        }
      },
      appliedAt: new Date(),
      verified: false // Requiere revisión manual
    }

    this.emit('resolution_pending', resolution)
    console.log('⏳ Resolución pendiente de revisión manual')
    return resolution
  }

  private extractRecordFromConflicts(conflicts: ConflictData[], source: 'sqlserver' | 'supabase'): any {
    const relevantConflicts = conflicts.filter(c => c.source === source)
    if (relevantConflicts.length === 0) return {}

    const record: any = { id: conflicts[0].recordId }

    for (const conflict of relevantConflicts) {
      for (const [field, change] of Object.entries(conflict.changes)) {
        record[field] = change.newValue
      }
    }

    return record
  }

  private learnFromResolution(resolution: ConflictResolution): void {
    if (!this.learningEnabled) return

    const pattern = `${resolution.table}.*`
    this.resolutionPatterns.set(pattern, resolution.strategy)

    // Agregar al historial
    const key = `${resolution.table}_${resolution.recordId}`
    if (!this.conflictHistory.has(key)) {
      this.conflictHistory.set(key, [])
    }
    this.conflictHistory.get(key)!.push(resolution)

    console.log('🧠 Patrón aprendido para futuras resoluciones')
  }

  // 📊 MÉTODOS PÚBLICOS
  public getConflictHistory(table?: string, limit?: number): ConflictResolution[] {
    let resolutions = Array.from(this.conflictHistory.values()).flat()
    
    if (table) {
      resolutions = resolutions.filter(r => r.table === table)
    }
    
    resolutions.sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime())
    
    if (limit) {
      resolutions = resolutions.slice(0, limit)
    }
    
    return resolutions
  }

  public getResolutionPatterns(): Map<string, ResolutionStrategy> {
    return new Map(this.resolutionPatterns)
  }

  public updatePattern(pattern: string, strategy: ResolutionStrategy): void {
    this.resolutionPatterns.set(pattern, strategy)
    console.log(`📝 Patrón actualizado: ${pattern}`)
  }

  public enableLearning(enabled: boolean): void {
    this.learningEnabled = enabled
    console.log(`🧠 Aprendizaje ${enabled ? 'activado' : 'desactivado'}`)
  }

  public getStats(): any {
    return {
      totalConflicts: this.conflictHistory.size,
      patternsLearned: this.resolutionPatterns.size,
      learningEnabled: this.learningEnabled,
      autoResolutionThreshold: this.autoResolutionThreshold
    }
  }
}

// Instancia singleton
export const intelligentConflictResolver = new IntelligentConflictResolver()
export default IntelligentConflictResolver