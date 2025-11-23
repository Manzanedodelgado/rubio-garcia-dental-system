import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const sql = require('mssql')

export interface SQLServerConfig {
  host: string
  database: string
  user: string
  password: string
  port?: number
  options?: any
}

export interface SQLRecord {
  id: string
  [key: string]: any
  updated_at?: string
  created_at?: string
}

// 🔧 IMPLEMENTACIÓN REAL DE SQL SERVER 2008 PARA GESDEN
class SQLServerService {
  private config: SQLServerConfig
  private pool: any = null
  private isConnected: boolean = false
  private connectionAttempts: number = 0
  private maxAttempts: number = 3
  private reconnectInterval: NodeJS.Timeout | null = null

  constructor() {
    this.config = {
      host: process.env.SQLSERVER_HOST || 'gabinete2\\INFOMED',
      database: process.env.SQLSERVER_DATABASE || 'GELITE',
      user: process.env.SQLSERVER_USER || 'RUBIOGARCIADENTAL',
      password: process.env.SQLSERVER_PASSWORD || '666666',
      port: 1433,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        // Configuraciones específicas para SQL Server 2008
        requestTimeout: 30000,
        connectionTimeout: 30000
      }
    }
    
    console.log('🔌 SQL Server 2008 Service inicializado para GESDEN')
    console.log('📍 Host:', this.config.host)
    console.log('🗃️  Base de datos:', this.config.database)
  }

  async connect(): Promise<void> {
    try {
      console.log('🔗 Conectando a SQL Server 2008 (GESDEN)...')
      
      // Configurar pool de conexiones
      this.pool = new sql.ConnectionPool({
        server: this.config.host,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        port: this.config.port || 1433,
        options: this.config.options
      })

      // Conectar
      await this.pool.connect()
      this.isConnected = true
      this.connectionAttempts = 0
      
      console.log('✅ Conectado exitosamente a SQL Server 2008')
      console.log('🔄 GESDEN puede sincronizar normalmente')
      
      // Configurar reconexión automática
      this.setupAutoReconnect()
      
    } catch (error) {
      this.isConnected = false
      this.connectionAttempts++
      
      console.error('❌ Error conectando a SQL Server 2008:', error)
      
      if (this.connectionAttempts < this.maxAttempts) {
        console.log(`🔄 Reintentando conexión (${this.connectionAttempts}/${this.maxAttempts})...`)
        await this.delay(5000 * this.connectionAttempts)
        return this.connect()
      } else {
        console.error('❌ Máximo de intentos de conexión alcanzado')
        throw new Error('No se pudo conectar a SQL Server 2008 después de varios intentos')
      }
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.close()
        this.pool = null
        this.isConnected = false
      }
      
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval)
        this.reconnectInterval = null
      }
      
      console.log('🔌 Desconectado de SQL Server 2008')
    } catch (error) {
      console.error('❌ Error desconectando de SQL Server:', error)
    }
  }

  async isSQLServerConnected(): Promise<boolean> {
    if (!this.isConnected || !this.pool) {
      return false
    }
    
    try {
      // Ping simple para verificar conexión
      await this.pool.request().query('SELECT 1')
      return true
    } catch (error) {
      console.error('❌ Conexión SQL Server perdida:', error)
      this.isConnected = false
      return false
    }
  }

  // 🔄 CONFIGURAR RECONEXIÓN AUTOMÁTICA
  private setupAutoReconnect(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
    }
    
    // Verificar conexión cada 30 segundos
    this.reconnectInterval = setInterval(async () => {
      if (!this.isConnected) {
        console.log('🔄 Intentando reconexión automática...')
        try {
          await this.connect()
        } catch (error) {
          console.error('❌ Error en reconexión automática:', error)
        }
      }
    }, 30000)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 📊 MÉTODOS DE PACIENTES
  async getPacientesFromSQL(): Promise<any[]> {
    try {
      if (!this.isConnected) await this.connect()
      
      const result = await this.pool.request().query(`
        SELECT * FROM pacientes 
        ORDER BY updated_at DESC
      `)
      
      return result.recordset || []
    } catch (error) {
      console.error('❌ Error obteniendo pacientes:', error)
      return []
    }
  }

  async createPacienteInSQL(paciente: any): Promise<any> {
    try {
      if (!this.isConnected) await this.connect()
      
      const request = this.pool.request()
      
      // Asignar ID si no existe
      if (!paciente.id) {
        paciente.id = `pac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      
      paciente.updated_at = new Date().toISOString()
      paciente.created_at = paciente.created_at || paciente.updated_at
      
      const query = `
        INSERT INTO pacientes (id, nombre, apellido, telefono, email, direccion, created_at, updated_at)
        VALUES (@id, @nombre, @apellido, @telefono, @email, @direccion, @created_at, @updated_at)
      `
      
      request.input('id', sql.VarChar(50), paciente.id)
      request.input('nombre', sql.VarChar(100), paciente.nombre || '')
      request.input('apellido', sql.VarChar(100), paciente.apellido || '')
      request.input('telefono', sql.VarChar(20), paciente.telefono || '')
      request.input('email', sql.VarChar(150), paciente.email || '')
      request.input('direccion', sql.Text, paciente.direccion || '')
      request.input('created_at', sql.DateTime, paciente.created_at)
      request.input('updated_at', sql.DateTime, paciente.updated_at)
      
      await request.query(query)
      
      return paciente
    } catch (error) {
      console.error('❌ Error creando paciente:', error)
      throw error
    }
  }

  async updatePacienteInSQL(id: string, updates: any): Promise<void> {
    try {
      if (!this.isConnected) await this.connect()
      
      updates.updated_at = new Date().toISOString()
      
      let setClause = ''
      const request = this.pool.request()
      request.input('id', sql.VarChar(50), id)
      request.input('updated_at', sql.DateTime, updates.updated_at)
      
      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'id') {
          setClause += `${key} = @${key}, `
          request.input(key, this.getSQLType(key), value)
        }
      }
      
      setClause = setClause.slice(0, -2) // Quitar última coma
      
      const query = `
        UPDATE pacientes 
        SET ${setClause} 
        WHERE id = @id
      `
      
      await request.query(query)
      console.log('✅ Paciente actualizado en SQL Server:', id)
      
    } catch (error) {
      console.error('❌ Error actualizando paciente:', error)
      throw error
    }
  }

  // 📅 MÉTODOS DE CITAS
  async getCitasFromSQL(): Promise<any[]> {
    try {
      if (!this.isConnected) await this.connect()
      
      const result = await this.pool.request().query(`
        SELECT * FROM citas 
        ORDER BY fecha_hora DESC
      `)
      
      return result.recordset || []
    } catch (error) {
      console.error('❌ Error obteniendo citas:', error)
      return []
    }
  }

  async createCitaInSQL(cita: any): Promise<any> {
    try {
      if (!this.isConnected) await this.connect()
      
      const request = this.pool.request()
      
      if (!cita.id) {
        cita.id = `cita_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      
      cita.updated_at = new Date().toISOString()
      cita.created_at = cita.created_at || cita.updated_at
      
      const query = `
        INSERT INTO citas (id, paciente_id, doctor_id, fecha_hora, motivo, estado, created_at, updated_at)
        VALUES (@id, @paciente_id, @doctor_id, @fecha_hora, @motivo, @estado, @created_at, @updated_at)
      `
      
      request.input('id', sql.VarChar(50), cita.id)
      request.input('paciente_id', sql.VarChar(50), cita.paciente_id || '')
      request.input('doctor_id', sql.VarChar(50), cita.doctor_id || '')
      request.input('fecha_hora', sql.DateTime, cita.fecha_hora || new Date())
      request.input('motivo', sql.Text, cita.motivo || '')
      request.input('estado', sql.VarChar(50), cita.estado || 'programada')
      request.input('created_at', sql.DateTime, cita.created_at)
      request.input('updated_at', sql.DateTime, cita.updated_at)
      
      await request.query(query)
      
      return cita
    } catch (error) {
      console.error('❌ Error creando cita:', error)
      throw error
    }
  }

  async updateCitaInSQL(id: string, updates: any): Promise<void> {
    try {
      if (!this.isConnected) await this.connect()
      
      updates.updated_at = new Date().toISOString()
      
      let setClause = ''
      const request = this.pool.request()
      request.input('id', sql.VarChar(50), id)
      request.input('updated_at', sql.DateTime, updates.updated_at)
      
      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'id') {
          setClause += `${key} = @${key}, `
          request.input(key, this.getSQLType(key), value)
        }
      }
      
      setClause = setClause.slice(0, -2)
      
      const query = `
        UPDATE citas 
        SET ${setClause} 
        WHERE id = @id
      `
      
      await request.query(query)
      console.log('✅ Cita actualizada en SQL Server:', id)
      
    } catch (error) {
      console.error('❌ Error actualizando cita:', error)
      throw error
    }
  }

  // 👨‍⚕️ MÉTODOS DE DOCTORES
  async getDoctoresFromSQL(): Promise<any[]> {
    try {
      if (!this.isConnected) await this.connect()
      
      const result = await this.pool.request().query(`
        SELECT * FROM doctores 
        ORDER BY nombre DESC
      `)
      
      return result.recordset || []
    } catch (error) {
      console.error('❌ Error obteniendo doctores:', error)
      return []
    }
  }

  // 🔄 MÉTODOS DE SINCRONIZACIÓN BIDIRECCIONAL
  async upsertToSQL(table: string, data: any): Promise<void> {
    try {
      const existing = await this.getRecordFromSQL(table, data.id)
      
      if (existing) {
        // Actualizar registro existente
        await this.updateRecordInSQL(table, data.id, data)
      } else {
        // Crear nuevo registro
        await this.createRecordInSQL(table, data)
      }
      
    } catch (error) {
      console.error(`❌ Error sincronizando registro en tabla ${table}:`, error)
      throw error
    }
  }

  async getRecordFromSQL(table: string, id: string): Promise<any | null> {
    try {
      if (!this.isConnected) await this.connect()
      
      const result = await this.pool.request()
        .input('id', sql.VarChar(50), id)
        .query(`SELECT * FROM ${table} WHERE id = @id`)
      
      return result.recordset[0] || null
    } catch (error) {
      console.error(`❌ Error obteniendo registro de ${table}:`, error)
      return null
    }
  }

  private async createRecordInSQL(table: string, data: any): Promise<void> {
    if (table === 'pacientes') {
      await this.createPacienteInSQL(data)
    } else if (table === 'citas') {
      await this.createCitaInSQL(data)
    } else {
      // Implementación genérica para otras tablas
      await this.createGenericRecord(table, data)
    }
  }

  private async updateRecordInSQL(table: string, id: string, updates: any): Promise<void> {
    if (table === 'pacientes') {
      await this.updatePacienteInSQL(id, updates)
    } else if (table === 'citas') {
      await this.updateCitaInSQL(id, updates)
    } else {
      // Implementación genérica para otras tablas
      await this.updateGenericRecord(table, id, updates)
    }
  }

  private async createGenericRecord(table: string, data: any): Promise<void> {
    if (!this.isConnected) await this.connect()
    
    const request = this.pool.request()
    
    if (!data.id) {
      data.id = `${table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    data.updated_at = new Date().toISOString()
    data.created_at = data.created_at || data.updated_at
    
    const columns = Object.keys(data).join(', ')
    const values = Object.keys(data).map((key, i) => `@${key}`).join(', ')
    const insertQuery = `INSERT INTO ${table} (${columns}) VALUES (${values})`
    
    // Agregar parámetros
    for (const [key, value] of Object.entries(data)) {
      request.input(key, this.getSQLType(key), value)
    }
    
    await request.query(insertQuery)
    console.log(`✅ Registro creado en ${table}:`, data.id)
  }

  private async updateGenericRecord(table: string, id: string, updates: any): Promise<void> {
    if (!this.isConnected) await this.connect()
    
    updates.updated_at = new Date().toISOString()
    
    let setClause = ''
    const request = this.pool.request()
    request.input('id', sql.VarChar(50), id)
    request.input('updated_at', sql.DateTime, updates.updated_at)
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id') {
        setClause += `${key} = @${key}, `
        request.input(key, this.getSQLType(key), value)
      }
    }
    
    setClause = setClause.slice(0, -2)
    
    const updateQuery = `
      UPDATE ${table} 
      SET ${setClause} 
      WHERE id = @id
    `
    
    await request.query(updateQuery)
    console.log(`✅ Registro actualizado en ${table}:`, id)
  }

  // 🔍 CAMBIO DE DATOS CDC
  async getCDCChanges(table: string): Promise<any[]> {
    try {
      if (!this.isConnected) await this.connect()
      
      // Query CDC para SQL Server 2008 (si está disponible)
      const result = await this.pool.request()
        .query(`
          SELECT * FROM cdc.dbo_${table}_ct 
          ORDER BY __$operation DESC
        `)
      
      return result.recordset || []
    } catch (error) {
      console.log('⚠️  CDC no disponible, usando métodos alternativos')
      return []
    }
  }

  // 🔄 EJECUTAR QUERY PERSONALIZADA
  async executeQuery(query: string): Promise<any> {
    try {
      if (!this.isConnected) await this.connect()
      
      const result = await this.pool.request().query(query)
      return result.recordset || []
    } catch (error) {
      console.error('❌ Error ejecutando query:', error)
      throw error
    }
  }

  // 📊 CONTEO DE REGISTROS
  async getRecordCount(table: string): Promise<number> {
    try {
      if (!this.isConnected) await this.connect()
      
      const result = await this.pool.request()
        .query(`SELECT COUNT(*) as count FROM ${table}`)
      
      return result.recordset[0].count || 0
    } catch (error) {
      console.error(`❌ Error contando registros en ${table}:`, error)
      return 0
    }
  }

  // 🔧 MÉTODOS AUXILIARES
  private getSQLType(column: string): any {
    // Mapeo de tipos TypeScript a SQL Server
    const typeMapping: { [key: string]: any } = {
      id: sql.VarChar(50),
      nombre: sql.VarChar(100),
      apellido: sql.VarChar(100),
      telefono: sql.VarChar(20),
      email: sql.VarChar(150),
      direccion: sql.Text,
      motivo: sql.Text,
      estado: sql.VarChar(50),
      fecha_hora: sql.DateTime,
      created_at: sql.DateTime,
      updated_at: sql.DateTime,
      // Tipos por defecto
      'default': sql.NVarChar(sql.MAX)
    }
    
    return typeMapping[column] || typeMapping['default']
  }

  // 📊 MÉTODOS DE ESTADO Y DEPURACIÓN
  getConnectionStatus(): any {
    return {
      isConnected: this.isConnected,
      config: {
        host: this.config.host,
        database: this.config.database,
        user: this.config.user,
        port: this.config.port
      },
      connectionAttempts: this.connectionAttempts,
      poolActive: !!this.pool
    }
  }

  showConfig(): void {
    console.log('🔧 Configuración SQL Server 2008:')
    console.log('   Host:', this.config.host)
    console.log('   Database:', this.config.database)
    console.log('   User:', this.config.user)
    console.log('   Connected:', this.isConnected)
    console.log('   Connection Attempts:', this.config.user)
  }
}

// Instancia singleton
export const sqlServerService = new SQLServerService()
export default SQLServerService

// 📋 NOTA IMPORTANTE:
// Esta implementación REAL de SQL Server:
// ✅ Permite conexión real a SQL Server 2008
// ✅ Mantiene compatibilidad con GESDEN
// ✅ Soporta sincronización bidireccional
// ✅ Incluye reconexión automática
// ✅ Manejo de errores y recuperaciones
//
// GESDEN puede seguir usando SQL Server normalmente
// mientras la aplicación sincroniza en tiempo real