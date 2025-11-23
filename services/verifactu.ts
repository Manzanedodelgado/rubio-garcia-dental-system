/**
 * SERVICIO DE VERIFACTU
 * Sistema de facturación electrónica Verifactu para Rubio García Dental
 * Autor: MiniMax Agent
 */

import { supabase } from '../lib/supabase';

export interface FacturaVerifactu {
  id: string;
  numero_factura: string;
  serie_factura: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  cliente_id: string;
  subtotal: number;
  iva_total: number;
  total_factura: number;
  estado_envio: 'pendiente' | 'enviada' | 'aceptada' | 'rechazada' | 'error';
  verifactu_uuid?: string;
  verifactu_qr_code?: string;
  xml_factura?: string;
  respuesta_verifactu?: any;
  errores_envio?: string;
  fecha_envio?: string;
  fecha_creacion: string;
  // Datos del cliente
  cliente_nombre?: string;
  cliente_apellido?: string;
  cliente_dni?: string;
  cliente_telefono?: string;
  cliente_email?: string;
}

export interface NuevaFacturaVerifactu {
  cliente_id: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  items: ItemFacturaVerifactu[];
  observaciones?: string;
}

export interface ItemFacturaVerifactu {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  tipo_iva: number; // 0, 4, 10, 21
  descuento?: number;
}

export interface RespuestaVerifactu {
  success: boolean;
  uuid?: string;
  qr_code?: string;
  xml?: string;
  message?: string;
  errors?: string[];
  status?: 'accepted' | 'rejected' | 'pending';
}

export interface ConfiguracionVerifactu {
  empresa_nombre: string;
  empresa_razon_social: string;
  empresa_nif: string;
  empresa_direccion: string;
  empresa_ciudad: string;
  empresa_codigo_postal: string;
  empresa_provincia: string;
  empresa_telefono: string;
  empresa_email: string;
  serie_factura: string;
  tipo_factura: 'F1' | 'F2' | 'F3' | 'F4';
  regimen_iva: 'general' | 'recargo' | 'exento';
  verifactu_endpoint: string;
  verifactu_certificado?: string;
  verifactu_password?: string;
}

export class VerifactuService {
  private supabaseClient = supabase;

  /**
   * Crear nueva factura para Verifactu
   */
  async crearFactura(factura: NuevaFacturaVerifactu): Promise<{ factura: FacturaVerifactu | null; error: string | null }> {
    try {
      // Calcular totales
      const subtotal = factura.items.reduce((sum, item) => 
        sum + (item.cantidad * item.precio_unitario) - (item.descuento || 0), 0
      );
      
      const ivaTotal = factura.items.reduce((sum, item) => {
        const itemSubtotal = (item.cantidad * item.precio_unitario) - (item.descuento || 0);
        return sum + (itemSubtotal * (item.tipo_iva / 100));
      }, 0);

      const total = subtotal + ivaTotal;

      // Generar número de factura
      const numeroFactura = await this.generarNumeroFactura(factura.fecha_emision);

      // Obtener configuración de Verifactu
      const configuracion = await this.obtenerConfiguracion();

      // Crear registro de factura
      const { data, error } = await this.supabaseClient
        .from('facturas_verifactu')
        .insert({
          numero_factura: numeroFactura,
          serie_factura: configuracion.serie_factura,
          fecha_emision: factura.fecha_emision,
          fecha_vencimiento: factura.fecha_vencimiento,
          cliente_id: factura.cliente_id,
          subtotal,
          iva_total: ivaTotal,
          total_factura: total,
          estado_envio: 'pendiente'
        })
        .select(`
          *,
          clientes(nombre, apellido, dni, telefono, email)
        `)
        .single();

      if (error) {
        return { factura: null, error: error.message };
      }

      // Crear líneas de factura
      const lineasFactura = factura.items.map(item => ({
        factura_id: data.id,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        tipo_iva: item.tipo_iva,
        descuento: item.descuento || 0,
        subtotal: (item.cantidad * item.precio_unitario) - (item.descuento || 0),
        total_iva: ((item.cantidad * item.precio_unitario) - (item.descuento || 0)) * (item.tipo_iva / 100),
        total_linea: ((item.cantidad * item.precio_unitario) - (item.descuento || 0)) + 
                    (((item.cantidad * item.precio_unitario) - (item.descuento || 0)) * (item.tipo_iva / 100))
      }));

      const { error: lineasError } = await this.supabaseClient
        .from('facturas_lineas_verifactu')
        .insert(lineasFactura);

      if (lineasError) {
        return { factura: null, error: lineasError.message };
      }

      // Formatear factura con datos del cliente
      const facturaFormateada = {
        ...data,
        cliente_nombre: data.clientes?.nombre,
        cliente_apellido: data.clientes?.apellido,
        cliente_dni: data.clientes?.dni,
        cliente_telefono: data.clientes?.telefono,
        cliente_email: data.clientes?.email
      };

      return { factura: facturaFormateada as FacturaVerifactu, error: null };
    } catch (error) {
      return {
        factura: null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Enviar factura a Verifactu
   */
  async enviarVerifactu(facturaId: string): Promise<{ success: boolean; respuesta: RespuestaVerifactu | null; error?: string }> {
    try {
      // Obtener factura
      const { data: factura, error: facturaError } = await this.supabaseClient
        .from('facturas_verifactu')
        .select(`
          *,
          clientes(*),
          facturas_lineas_verifactu(*)
        `)
        .eq('id', facturaId)
        .single();

      if (facturaError || !factura) {
        return { success: false, respuesta: null, error: 'Factura no encontrada' };
      }

      // Obtener configuración
      const configuracion = await this.obtenerConfiguracion();

      // Preparar datos para Verifactu
      const datosVerifactu = {
        serie: factura.serie_factura,
        numero: factura.numero_factura,
        fecha: factura.fecha_emision,
        cliente: {
          nombre: factura.clientes.nombre,
          apellido: factura.clientes.apellido,
          nif: factura.clientes.dni,
          direccion: factura.clientes.direccion || '',
          ciudad: factura.clientes.ciudad || '',
          codigo_postal: factura.clientes.codigo_postal || '',
          provincia: factura.clientes.provincia || '',
          telefono: factura.clientes.telefono || '',
          email: factura.clientes.email || ''
        },
        lineas: factura.facturas_lineas_verifactu.map(linea => ({
          descripcion: linea.descripcion,
          cantidad: linea.cantidad,
          precio_unitario: linea.precio_unitario,
          tipo_iva: linea.tipo_iva,
          descuento: linea.descuento,
          subtotal: linea.subtotal,
          total_iva: linea.total_iva,
          total_linea: linea.total_linea
        })),
        totales: {
          subtotal: factura.subtotal,
          iva_total: factura.iva_total,
          total: factura.total_factura
        },
        empresa: {
          nombre: configuracion.empresa_nombre,
          razon_social: configuracion.empresa_razon_social,
          nif: configuracion.empresa_nif,
          direccion: configuracion.empresa_direccion,
          ciudad: configuracion.empresa_ciudad,
          codigo_postal: configuracion.empresa_codigo_postal,
          provincia: configuracion.empresa_provincia,
          telefono: configuracion.empresa_telefono,
          email: configuracion.empresa_email
        }
      };

      // Llamada simulada a Verifactu (en implementación real sería una llamada HTTP)
      const respuestaVerifactu = await this.llamarVerifactuAPI(datosVerifactu);

      // Actualizar factura con respuesta
      const { error: updateError } = await this.supabaseClient
        .from('facturas_verifactu')
        .update({
          estado_envio: respuestaVerifactu.success ? 'enviada' : 'error',
          verifactu_uuid: respuestaVerifactu.uuid,
          verifactu_qr_code: respuestaVerifactu.qr_code,
          xml_factura: respuestaVerifactu.xml,
          respuesta_verifactu: respuestaVerifactu,
          fecha_envio: new Date().toISOString(),
          errores_envio: respuestaVerifactu.success ? null : JSON.stringify(respuestaVerifactu.errors)
        })
        .eq('id', facturaId);

      if (updateError) {
        return { success: false, respuesta: null, error: updateError.message };
      }

      return { success: respuestaVerifactu.success, respuesta: respuestaVerifactu };
    } catch (error) {
      return {
        success: false,
        respuesta: null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener facturas
   */
  async obtenerFacturas(filtros: {
    fecha_inicio?: string;
    fecha_fin?: string;
    cliente_id?: string;
    estado?: string;
  } = {}): Promise<FacturaVerifactu[]> {
    try {
      let query = this.supabaseClient
        .from('facturas_verifactu')
        .select(`
          *,
          clientes(nombre, apellido, dni, telefono, email)
        `);

      if (filtros.fecha_inicio) {
        query = query.gte('fecha_emision', filtros.fecha_inicio);
      }

      if (filtros.fecha_fin) {
        query = query.lte('fecha_emision', filtros.fecha_fin);
      }

      if (filtros.cliente_id) {
        query = query.eq('cliente_id', filtros.cliente_id);
      }

      if (filtros.estado) {
        query = query.eq('estado_envio', filtros.estado);
      }

      const { data, error } = await query.order('fecha_emision', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data.map(factura => ({
        ...factura,
        cliente_nombre: factura.clientes?.nombre,
        cliente_apellido: factura.clientes?.apellido,
        cliente_dni: factura.clientes?.dni,
        cliente_telefono: factura.clientes?.telefono,
        cliente_email: factura.clientes?.email
      })) as FacturaVerifactu[];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener factura por ID
   */
  async obtenerFacturaPorId(id: string): Promise<FacturaVerifactu | null> {
    try {
      const { data, error } = await this.supabaseClient
        .from('facturas_verifactu')
        .select(`
          *,
          clientes(nombre, apellido, dni, telefono, email),
          facturas_lineas_verifactu(*)
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        ...data,
        cliente_nombre: data.clientes?.nombre,
        cliente_apellido: data.clientes?.apellido,
        cliente_dni: data.clientes?.dni,
        cliente_telefono: data.clientes?.telefono,
        cliente_email: data.clientes?.email
      } as FacturaVerifactu;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verificar estado de factura en Verifactu
   */
  async verificarEstadoVerifactu(facturaId: string): Promise<{ success: boolean; estado?: string; error?: string }> {
    try {
      const factura = await this.obtenerFacturaPorId(facturaId);
      if (!factura || !factura.verifactu_uuid) {
        return { success: false, error: 'Factura no encontrada o sin UUID de Verifactu' };
      }

      // Simular consulta de estado (en implementación real sería llamada HTTP)
      const estadoVerifactu = await this.consultarEstadoVerifactuAPI(factura.verifactu_uuid);

      // Actualizar estado
      const nuevoEstado = this.mapearEstadoVerifactu(estadoVerifactu.status);
      await this.supabaseClient
        .from('facturas_verifactu')
        .update({
          estado_envio: nuevoEstado,
          respuesta_verifactu: estadoVerifactu
        })
        .eq('id', facturaId);

      return { success: true, estado: nuevoEstado };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Generar PDF de factura
   */
  async generarPDFFactura(facturaId: string): Promise<{ pdf_url?: string; error?: string }> {
    try {
      const factura = await this.obtenerFacturaPorId(facturaId);
      if (!factura) {
        return { error: 'Factura no encontrada' };
      }

      // En implementación real, esto generaría un PDF real
      const pdfData = await this.generarPDFFacturaData(factura);
      
      // Simular guardado del PDF
      const pdfUrl = `/uploads/facturas/${factura.id}.pdf`;
      
      return { pdf_url: pdfUrl };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Error generando PDF'
      };
    }
  }

  /**
   * Enviar factura por email
   */
  async enviarFacturaPorEmail(facturaId: string, emailDestinatario?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const factura = await this.obtenerFacturaPorId(facturaId);
      if (!factura) {
        return { success: false, error: 'Factura no encontrada' };
      }

      const destinatario = emailDestinatario || factura.cliente_email;
      if (!destinatario) {
        return { success: false, error: 'No hay email de destinatario' };
      }

      // Generar PDF
      const pdfResult = await this.generarPDFFactura(facturaId);
      if (pdfResult.error) {
        return { success: false, error: pdfResult.error };
      }

      // Enviar email (implementación simulada)
      const emailService = await import('./email');
      const resultado = await emailService.emailService.enviarEmail({
        destinatario,
        asunto: `Factura ${factura.numero_factura}`,
        contenido: `
          Estimado/a ${factura.cliente_nombre} ${factura.cliente_apellido},
          
          Se adjunta la factura ${factura.numero_factura} por un total de ${factura.total_factura.toFixed(2)}€.
          
          Gracias por su confianza.
          
          Rubio García Dental
        `,
        adjuntos: pdfResult.pdf_url ? [pdfResult.pdf_url] : []
      });

      return { success: resultado.success, error: resultado.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error enviando email'
      };
    }
  }

  /**
   * Obtener configuración de Verifactu
   */
  private async obtenerConfiguracion(): Promise<ConfiguracionVerifactu> {
    try {
      const { data, error } = await this.supabaseClient
        .from('config_verifactu')
        .select('*')
        .single();

      if (error || !data) {
        throw new Error('Configuración de Verifactu no encontrada');
      }

      return data as ConfiguracionVerifactu;
    } catch (error) {
      // Valores por defecto si no hay configuración
      return {
        empresa_nombre: 'RUBIO GARCÍA DENTAL',
        empresa_razon_social: 'TRIDENTAL ODONTOLOGOS SLP',
        empresa_nif: 'B88393764',
        empresa_direccion: 'C/ MAYOR 19',
        empresa_ciudad: 'ALCORCON',
        empresa_codigo_postal: '28921',
        empresa_provincia: 'MADRID',
        empresa_telefono: '916410841',
        empresa_email: 'info@rubiogarciadental.com',
        serie_factura: 'A',
        tipo_factura: 'F1',
        regimen_iva: 'general',
        verifactu_endpoint: 'https://verifactu.agenciatributaria.es/api'
      };
    }
  }

  /**
   * Generar número de factura
   */
  private async generarNumeroFactura(fechaEmision: string): Promise<string> {
    const año = new Date(fechaEmision).getFullYear();
    const { data, error } = await this.supabaseClient
      .from('facturas_verifactu')
      .select('numero_factura')
      .like('numero_factura', `${año}%`)
      .order('numero_factura', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return `${año}0001`;
    }

    const ultimoNumero = parseInt(data[0].numero_factura.replace(año.toString(), ''));
    return `${año}${String(ultimoNumero + 1).padStart(4, '0')}`;
  }

  /**
   * Llamar a API de Verifactu (simulado)
   */
  private async llamarVerifactuAPI(datos: any): Promise<RespuestaVerifactu> {
    // Simulación de llamada a API de Verifactu
    try {
      // En implementación real, esto sería:
      // const response = await fetch(process.env.VERIFACTU_API_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/xml' },
      //   body: generarXML(datos)
      // });

      // Simulación de respuesta exitosa
      return {
        success: true,
        uuid: `uuid-${Date.now()}`,
        qr_code: `QR-${datos.numero}`,
        xml: `<xml>${datos.numero}</xml>`,
        status: 'accepted'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error enviando a Verifactu',
        errors: ['Error de conexión con Verifactu']
      };
    }
  }

  /**
   * Consultar estado en API de Verifactu (simulado)
   */
  private async consultarEstadoVerifactuAPI(uuid: string): Promise<any> {
    // Simulación de consulta de estado
    return {
      uuid,
      status: 'accepted',
      date: new Date().toISOString()
    };
  }

  /**
   * Mapear estado de Verifactu a estado interno
   */
  private mapearEstadoVerifactu(status: string): 'pendiente' | 'enviada' | 'aceptada' | 'rechazada' | 'error' {
    switch (status?.toLowerCase()) {
      case 'accepted': return 'aceptada';
      case 'rejected': return 'rechazada';
      case 'pending': return 'pendiente';
      default: return 'enviada';
    }
  }

  /**
   * Generar datos de PDF (simulado)
   */
  private async generarPDFFacturaData(factura: FacturaVerifactu): Promise<any> {
    // En implementación real, esto generaría PDF real
    return {
      html: `
        <div>
          <h1>Factura ${factura.numero_factura}</h1>
          <p>Total: ${factura.total_factura}€</p>
        </div>
      `
    };
  }

  /**
   * Obtener estadísticas de facturación
   */
  async obtenerEstadisticas(fechaInicio: string, fechaFin: string): Promise<{
    total_facturas: number;
    total_importe: number;
    facturas_enviadas: number;
    facturas_pendientes: number;
    facturas_rechazadas: number;
  }> {
    try {
      const { data, error } = await this.supabaseClient
        .from('facturas_verifactu')
        .select('total_factura, estado_envio')
        .gte('fecha_emision', fechaInicio)
        .lte('fecha_emision', fechaFin);

      if (error) {
        throw new Error(error.message);
      }

      const totalFacturas = data?.length || 0;
      const totalImporte = data?.reduce((sum, f) => sum + f.total_factura, 0) || 0;
      const enviadas = data?.filter(f => f.estado_envio === 'aceptada' || f.estado_envio === 'enviada').length || 0;
      const pendientes = data?.filter(f => f.estado_envio === 'pendiente').length || 0;
      const rechazadas = data?.filter(f => f.estado_envio === 'rechazada' || f.estado_envio === 'error').length || 0;

      return {
        total_facturas: totalFacturas,
        total_importe: totalImporte,
        facturas_enviadas: enviadas,
        facturas_pendientes: pendientes,
        facturas_rechazadas: rechazadas
      };
    } catch (error) {
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const verifactuService = new VerifactuService();
export default verifactuService;