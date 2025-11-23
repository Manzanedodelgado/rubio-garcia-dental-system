// =====================================================
// SERVICIO DE CONTABILIDAD - SISTEMA RUBIO GARCÍA DENTAL
// Gestión Contable Completa con Verifactu Integration
// =====================================================

import { supabase } from '@/lib/supabase'

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

export interface AsientoContable {
  id?: number
  numero_asiento: string
  fecha_asiento: string
  descripcion: string
  tipo_asiento: 'diario' | 'ingresos' | 'gastos' | 'iva' | 'amortizacion' | 'cierre'
  cuenta_contable: string
  debe: number
  haber: number
  concepto?: string
  referencia_documento?: string
  paciente_id?: number
  factura_id?: number
  created_at?: string
  updated_at?: string
}

export interface CuentaContable {
  id?: number
  codigo_cuenta: string
  nombre_cuenta: string
  tipo_cuenta: 'activo' | 'pasivo' | 'ingresos' | 'gastos' | 'patrimonio'
  subcuenta?: string
  saldo_inicial: number
  saldo_actual: number
  es_analitica: boolean
  activa: boolean
  created_at?: string
}

export interface ArqueoCaja {
  id?: number
  fecha_arqueo: string
  hora_arqueo: string
  caja: string
  saldo_teorico: number
  saldo_real: number
  diferencia: number
  estado: 'pendiente' | 'verificado' | 'descuadre'
  observaciones?: string
  usuario_id?: number
  created_at?: string
  detalle_arqueo?: DetalleArqueoCaja[]
}

export interface DetalleArqueoCaja {
  id?: number
  arqueo_id: number
  tipo_medio: 'efectivo' | 'tarjeta' | 'transferencia' | 'cheque'
  denominacion: string
  cantidad: number
  valor_unitario: number
  importe_total: number
  created_at?: string
}

export interface IVARetencion {
  id?: number
  tipo: 'iva' | 'irpf' | 'ingreso' | 'gasto'
  base_imponible: number
  porcentaje: number
  cuota: number
  fecha_presentacion?: string
  ejercicio: number
  periodo?: string
  trimestre?: 1 | 2 | 3 | 4
  liquidado: boolean
  created_at?: string
}

export interface InformeFinanciero {
  id?: number
  tipo_informe: 'balance_situacion' | 'pyg' | 'flujo_efectivo' | 'iva_trimestral'
  fecha_inicio: string
  fecha_fin: string
  ejercicio: number
  periodo?: string
  datos_json: any
  formato: 'json' | 'pdf' | 'excel'
  generado_por: string
  estado: 'generado' | 'revisado' | 'archivado'
  created_at?: string
}

export interface BalanceSituacion {
  codigo_cuenta: string
  nombre_cuenta: string
  tipo_cuenta: string
  saldo_actual: number
}

export interface CuentaPYG {
  codigo_cuenta: string
  nombre_cuenta: string
  tipo_cuenta: string
  total_debe: number
  total_haber: number
  resultado: number
}

export interface ResumenIVA {
  ejercicio: number
  periodo: string
  tipo: string
  total_base: number
  total_cuota: number
  num_operaciones: number
}

export interface CajaDiaria {
  fecha_asiento: string
  ingresos: number
  gastos: number
  saldo_diario: number
}

// =====================================================
// CLASE CONTABILIDAD SERVICE
// =====================================================

export class ContabilidadService {

  // =====================================================
  // GESTIÓN DE ASIENTOS CONTABLES
  // =====================================================

  /**
   * Crear un nuevo asiento contable
   */
  async crearAsiento(asiento: Omit<AsientoContable, 'id' | 'numero_asiento' | 'created_at' | 'updated_at'>): Promise<AsientoContable> {
    try {
      // Generar número de asiento automático
      const numero_asiento = await this.generarNumeroAsiento()
      
      const nuevoAsiento = {
        ...asiento,
        numero_asiento,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('asientos_contables')
        .insert([nuevoAsiento])
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error creando asiento contable:', error)
      throw new Error(`Error al crear asiento contable: ${error.message}`)
    }
  }

  /**
   * Obtener asientos contables con filtros
   */
  async obtenerAsientos(filtros: {
    fecha_inicio?: string
    fecha_fin?: string
    tipo_asiento?: string
    cuenta_contable?: string
    limite?: number
  } = {}): Promise<AsientoContable[]> {
    try {
      let query = supabase
        .from('asientos_contables')
        .select('*')

      // Aplicar filtros
      if (filtros.fecha_inicio) {
        query = query.gte('fecha_asiento', filtros.fecha_inicio)
      }
      if (filtros.fecha_fin) {
        query = query.lte('fecha_asiento', filtros.fecha_fin)
      }
      if (filtros.tipo_asiento) {
        query = query.eq('tipo_asiento', filtros.tipo_asiento)
      }
      if (filtros.cuenta_contable) {
        query = query.eq('cuenta_contable', filtros.cuenta_contable)
      }

      // Ordenar por fecha y número de asiento
      query = query.order('fecha_asiento', { ascending: false })
                   .order('numero_asiento', { ascending: false })

      // Aplicar límite si se especifica
      if (filtros.limite) {
        query = query.limit(filtros.limite)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error obteniendo asientos contables:', error)
      throw new Error(`Error al obtener asientos contables: ${error.message}`)
    }
  }

  /**
   * Actualizar un asiento contable
   */
  async actualizarAsiento(id: number, asiento: Partial<AsientoContable>): Promise<AsientoContable> {
    try {
      const { data, error } = await supabase
        .from('asientos_contables')
        .update({
          ...asiento,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error actualizando asiento contable:', error)
      throw new Error(`Error al actualizar asiento contable: ${error.message}`)
    }
  }

  /**
   * Eliminar un asiento contable
   */
  async eliminarAsiento(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('asientos_contables')
        .delete()
        .eq('id', id)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Error eliminando asiento contable:', error)
      throw new Error(`Error al eliminar asiento contable: ${error.message}`)
    }
  }

  // =====================================================
  // GESTIÓN DEL PLAN CONTABLE
  // =====================================================

  /**
   * Obtener todas las cuentas contables
   */
  async obtenerPlanContable(): Promise<CuentaContable[]> {
    try {
      const { data, error } = await supabase
        .from('plan_contable')
        .select('*')
        .eq('activa', true)
        .order('codigo_cuenta')

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error obteniendo plan contable:', error)
      throw new Error(`Error al obtener plan contable: ${error.message}`)
    }
  }

  /**
   * Obtener saldo de una cuenta específica
   */
  async obtenerSaldoCuenta(codigo_cuenta: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('fn_saldo_cuenta_contable', { cuenta_codigo: codigo_cuenta })

      if (error) throw error

      return data || 0
    } catch (error) {
      console.error('Error obteniendo saldo de cuenta:', error)
      throw new Error(`Error al obtener saldo de cuenta: ${error.message}`)
    }
  }

  // =====================================================
  // GESTIÓN DE ARQUEO DE CAJAS
  // =====================================================

  /**
   * Crear un arqueo de caja
   */
  async crearArqueoCaja(arqueo: Omit<ArqueoCaja, 'id' | 'diferencia' | 'created_at'>): Promise<ArqueoCaja> {
    try {
      const nuevoArqueo = {
        ...arqueo,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('arqueo_cajas')
        .insert([nuevoArqueo])
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error creando arqueo de caja:', error)
      throw new Error(`Error al crear arqueo de caja: ${error.message}`)
    }
  }

  /**
   * Obtener arqueos de caja
   */
  async obtenerArqueosCaja(filtros: {
    fecha_inicio?: string
    fecha_fin?: string
    caja?: string
    estado?: string
  } = {}): Promise<ArqueoCaja[]> {
    try {
      let query = supabase
        .from('arqueo_cajas')
        .select('*')

      // Aplicar filtros
      if (filtros.fecha_inicio) {
        query = query.gte('fecha_arqueo', filtros.fecha_inicio)
      }
      if (filtros.fecha_fin) {
        query = query.lte('fecha_arqueo', filtros.fecha_fin)
      }
      if (filtros.caja) {
        query = query.eq('caja', filtros.caja)
      }
      if (filtros.estado) {
        query = query.eq('estado', filtros.estado)
      }

      const { data, error } = await query.order('fecha_arqueo', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error obteniendo arqueos de caja:', error)
      throw new Error(`Error al obtener arqueos de caja: ${error.message}`)
    }
  }

  // =====================================================
  // GESTIÓN DE IVA Y RETENCIONES
  // =====================================================

  /**
   * Registrar operación de IVA/Retención
   */
  async registrarIVARetencion(iva: Omit<IVARetencion, 'id' | 'created_at'>): Promise<IVARetencion> {
    try {
      const nuevoIVA = {
        ...iva,
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('ivas_retenciones')
        .insert([nuevoIVA])
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error registrando IVA/Retención:', error)
      throw new Error(`Error al registrar IVA/Retención: ${error.message}`)
    }
  }

  /**
   * Obtener resumen de IVA por periodo
   */
  async obtenerResumenIVA(ejercicio?: number): Promise<ResumenIVA[]> {
    try {
      let query = supabase
        .from('v_resumen_iva')
        .select('*')

      if (ejercicio) {
        query = query.eq('ejercicio', ejercicio)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error obteniendo resumen IVA:', error)
      throw new Error(`Error al obtener resumen IVA: ${error.message}`)
    }
  }

  // =====================================================
  // INFORMES FINANCIEROS
  // =====================================================

  /**
   * Generar Balance de Situación
   */
  async generarBalanceSituacion(fecha_inicio: string, fecha_fin: string): Promise<BalanceSituacion[]> {
    try {
      const { data, error } = await supabase
        .from('v_balance_situacion')
        .select('*')

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error generando Balance de Situación:', error)
      throw new Error(`Error al generar Balance de Situación: ${error.message}`)
    }
  }

  /**
   * Generar Cuenta de Pérdidas y Ganancias
   */
  async generarCuentaPYG(fecha_inicio: string, fecha_fin: string): Promise<CuentaPYG[]> {
    try {
      const { data, error } = await supabase
        .from('v_cuenta_pyg')
        .select('*')

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error generando Cuenta P&G:', error)
      throw new Error(`Error al generar Cuenta P&G: ${error.message}`)
    }
  }

  /**
   * Obtener caja diaria
   */
  async obtenerCajaDiaria(fecha?: string): Promise<CajaDiaria[]> {
    try {
      let query = supabase
        .from('v_caja_diaria')
        .select('*')

      if (fecha) {
        query = query.eq('fecha_asiento', fecha)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error obteniendo caja diaria:', error)
      throw new Error(`Error al obtener caja diaria: ${error.message}`)
    }
  }

  /**
   * Calcular resultado del ejercicio
   */
  async calcularResultadoEjercicio(año_ejercicio: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('fn_resultado_ejercicio', { año_ejercicio })

      if (error) throw error

      return data || 0
    } catch (error) {
      console.error('Error calculando resultado del ejercicio:', error)
      throw new Error(`Error al calcular resultado del ejercicio: ${error.message}`)
    }
  }

  // =====================================================
  // INTEGRACIÓN CON FACTURACIÓN VERIFACTU
  // =====================================================

  /**
   * Crear asiento contable desde factura
   */
  async crearAsientoDesdeFactura(factura_id: number, datos_factura: any): Promise<AsientoContable> {
    try {
      const fecha_factura = new Date(datos_factura.fecha_emision).toISOString().split('T')[0]
      const numero_factura = datos_factura.numero_factura || `F${new Date().getFullYear()}-${factura_id.toString().padStart(6, '0')}`
      const total_factura = datos_factura.total || 0
      const base_imponible = datos_factura.subtotal || 0
      const iva_cuota = datos_factura.total_iva || 0

      // Crear asiento principal: Paciente -> Ingresos por Ventas
      const asiento_principal = await this.crearAsiento({
        fecha_asiento: fecha_factura,
        descripcion: `Factura ${numero_factura} - ${datos_factura.paciente_nombre || 'Cliente'}`,
        tipo_asiento: 'ingresos',
        cuenta_contable: '4100000', // Pacientes
        debe: total_factura,
        haber: 0,
        concepto: `Venta a ${datos_factura.paciente_nombre || 'Cliente'}`,
        referencia_documento: `FACT-${numero_factura}`,
        factura_id: factura_id
      })

      // Crear asiento complementario: Ingresos -> IVA
      const asiento_ingresos = await this.crearAsiento({
        fecha_asiento: fecha_factura,
        descripcion: `Factura ${numero_factura} - Registro de ingresos`,
        tipo_asiento: 'ingresos',
        cuenta_contable: '7100000', // Servicios Odontológicos
        debe: 0,
        haber: base_imponible,
        concepto: `Ingresos por servicios odontológicos`,
        referencia_documento: `FACT-${numero_factura}`,
        factura_id: factura_id
      })

      // Crear asiento de IVA
      if (iva_cuota > 0) {
        const asiento_iva = await this.crearAsiento({
          fecha_asiento: fecha_factura,
          descripcion: `Factura ${numero_factura} - IVA Repercutido`,
          tipo_asiento: 'iva',
          cuenta_contable: '6200000', // Hacienda Pública IVA Repercutido
          debe: 0,
          haber: iva_cuota,
          concepto: `IVA Repercutido - ${datos_factura.porcentaje_iva || 21}%`,
          referencia_documento: `FACT-${numero_factura}`,
          factura_id: factura_id
        })
      }

      return asiento_principal
    } catch (error) {
      console.error('Error creando asiento desde factura:', error)
      throw new Error(`Error al crear asiento desde factura: ${error.message}`)
    }
  }

  /**
   * Crear asiento de cobro de factura
   */
  async crearAsientoCobroFactura(factura_id: number, importe_cobrado: number, medio_pago: string): Promise<AsientoContable> {
    try {
      const fecha_cobro = new Date().toISOString().split('T')[0]
      
      // Determinar cuenta contable según medio de pago
      let cuenta_ingresos = '5200000' // Banco por defecto
      if (medio_pago === 'efectivo') {
        cuenta_ingresos = '5100000' // Caja
      } else if (medio_pago === 'tarjeta') {
        cuenta_ingresos = '5200000' // Banco
      } else if (medio_pago === 'transferencia') {
        cuenta_ingresos = '5300000' // Cuenta Corriente
      }

      const asiento_cobro = await this.crearAsiento({
        fecha_asiento: fecha_cobro,
        descripcion: `Cobro factura ${factura_id} - ${medio_pago.toUpperCase()}`,
        tipo_asiento: 'ingresos',
        cuenta_contable: cuenta_ingresos,
        debe: importe_cobrado,
        haber: 0,
        concepto: `Cobro por ${medio_pago}`,
        referencia_documento: `COBRO-${factura_id}`,
        factura_id: factura_id
      })

      // Crear contrapartida: Pacientes -> Cuenta de Ingreso
      const asiento_contra = await this.crearAsiento({
        fecha_asiento: fecha_cobro,
        descripcion: `Cobro factura ${factura_id} - Baja deudor`,
        tipo_asiento: 'ingresos',
        cuenta_contable: '4100000', // Pacientes
        debe: 0,
        haber: importe_cobrado,
        concepto: `Cobro recibido por ${medio_pago}`,
        referencia_documento: `COBRO-${factura_id}`,
        factura_id: factura_id
      })

      return asiento_cobro
    } catch (error) {
      console.error('Error creando asiento de cobro:', error)
      throw new Error(`Error al crear asiento de cobro: ${error.message}`)
    }
  }

  // =====================================================
  // UTILIDADES Y FUNCIONES AUXILIARES
  // =====================================================

  /**
   * Generar número de asiento automático
   */
  private async generarNumeroAsiento(): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('fn_generar_numero_asiento')

      if (error) throw error

      return data || `AS${new Date().getFullYear()}000001`
    } catch (error) {
      console.error('Error generando número de asiento:', error)
      // Fallback con timestamp
      return `AS${new Date().getFullYear()}${Date.now().toString().slice(-6)}`
    }
  }

  /**
   * Obtener estadísticas contables
   */
  async obtenerEstadisticasContables(fecha_inicio?: string, fecha_fin?: string): Promise<{
    total_ingresos: number
    total_gastos: number
    resultado_ejercicio: number
    numero_asientos: number
    caja_diaria: number
  }> {
    try {
      const ahora = new Date()
      const año_actual = ahora.getFullYear()

      const asientos = await this.obtenerAsientos({
        fecha_inicio: fecha_inicio || `${año_actual}-01-01`,
        fecha_fin: fecha_fin || ahora.toISOString().split('T')[0]
      })

      let total_ingresos = 0
      let total_gastos = 0

      for (const asiento of asientos) {
        if (asiento.tipo_asiento === 'ingresos') {
          total_ingresos += asiento.haber - asiento.debe
        } else if (asiento.tipo_asiento === 'gastos') {
          total_gastos += asiento.debe - asiento.haber
        }
      }

      const resultado_ejercicio = total_ingresos - total_gastos
      
      // Obtener caja diaria de hoy
      const caja_diaria_data = await this.obtenerCajaDiaria(ahora.toISOString().split('T')[0])
      const caja_diaria = caja_diaria_data.length > 0 ? caja_diaria_data[0].saldo_diario : 0

      return {
        total_ingresos,
        total_gastos,
        resultado_ejercicio,
        numero_asientos: asientos.length,
        caja_diaria
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas contables:', error)
      return {
        total_ingresos: 0,
        total_gastos: 0,
        resultado_ejercicio: 0,
        numero_asientos: 0,
        caja_diaria: 0
      }
    }
  }

  /**
   * Exportar datos contables
   */
  async exportarContabilidad(formato: 'json' | 'csv', filtros: any = {}): Promise<string> {
    try {
      const asientos = await this.obtenerAsientos(filtros)

      if (formato === 'json') {
        return JSON.stringify(asientos, null, 2)
      }

      // Generar CSV
      const headers = ['Numero', 'Fecha', 'Descripcion', 'Tipo', 'Cuenta', 'Debe', 'Haber', 'Concepto', 'Referencia']
      const csvRows = [headers.join(',')]

      for (const asiento of asientos) {
        const row = [
          asiento.numero_asiento,
          asiento.fecha_asiento,
          `"${asiento.descripcion}"`,
          asiento.tipo_asiento,
          asiento.cuenta_contable,
          asiento.debe.toFixed(2),
          asiento.haber.toFixed(2),
          `"${asiento.concepto || ''}"`,
          `"${asiento.referencia_documento || ''}"`
        ]
        csvRows.push(row.join(','))
      }

      return csvRows.join('\n')
    } catch (error) {
      console.error('Error exportando contabilidad:', error)
      throw new Error(`Error al exportar contabilidad: ${error.message}`)
    }
  }
}

// =====================================================
// EXPORTAR INSTANCIA DEL SERVICIO
// =====================================================

export const contabilidadService = new ContabilidadService()

// =====================================================
// EXPORTACIONES ADICIONALES PARA COMPATIBILIDAD
// =====================================================

export default contabilidadService
