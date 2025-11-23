'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Edit,
  Trash2,
  Save,
  X,
  QrCode,
  FileCheck,
  Download,
  Send,
  Euro,
  Calculator,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { facturacionService } from '@/services/facturacion';

interface DetalleFactura {
  id?: number;
  linea: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  tipo_iva: number;
  tipo_irpf: number;
  base_imponible: number;
  cuota_iva: number;
  total_linea: number;
}

interface FacturaCompleta {
  id: number;
  numero_operacion: string;
  numero_serie: string;
  fecha_expedicion: string;
  fecha_vencimiento?: string;
  nif_emisor: string;
  nombre_emisor: string;
  nif_receptor?: string;
  nombre_receptor?: string;
  concepto_descripcion: string;
  subtotal: number;
  total_iva: number;
  total_irpf: number;
  importe_total: number;
  estado: string;
  tipo_factura: string;
  observaciones?: string;
  codigo_qr_url?: string;
  xml_verifactu?: string;
  estado_verifactu: string;
  detalles: DetalleFactura[];
}

const DetalleFactura = ({ 
  facturaId, 
  onClose, 
  onUpdate 
}: { 
  facturaId: number;
  onClose: () => void;
  onUpdate: () => void;
}) => {
  const [factura, setFactura] = useState<FacturaCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [nuevaLinea, setNuevaLinea] = useState<DetalleFactura>({
    linea: 1,
    descripcion: '',
    cantidad: 1,
    precio_unitario: 0,
    descuento_porcentaje: 0,
    tipo_iva: 21.00,
    tipo_irpf: 0,
    base_imponible: 0,
    cuota_iva: 0,
    total_linea: 0
  });

  useEffect(() => {
    cargarFactura();
  }, [facturaId]);

  const cargarFactura = async () => {
    try {
      setLoading(true);
      const data = await facturacionService.obtenerFactura(facturaId);
      setFactura(data as any);
    } catch (error) {
      console.error('Error cargando factura:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarLinea = async () => {
    try {
      await facturacionService.agregarLineaDetalle({
        factura_id: facturaId,
        ...nuevaLinea
      });
      
      setNuevaLinea({
        linea: 1,
        descripcion: '',
        cantidad: 1,
        precio_unitario: 0,
        descuento_porcentaje: 0,
        tipo_iva: 21.00,
        tipo_irpf: 0,
        base_imponible: 0,
        cuota_iva: 0,
        total_linea: 0
      });
      
      cargarFactura();
      onUpdate();
    } catch (error) {
      console.error('Error agregando línea:', error);
    }
  };

  const eliminarLinea = async (lineaId: number) => {
    try {
      await facturacionService.eliminarLineaDetalle(lineaId);
      cargarFactura();
      onUpdate();
    } catch (error) {
      console.error('Error eliminando línea:', error);
    }
  };

  const calcularTotales = (linea: DetalleFactura) => {
    const precioSinDescuento = linea.cantidad * linea.precio_unitario;
    const descuento_importe = precioSinDescuento * (linea.descuento_porcentaje / 100);
    const base_imponible = precioSinDescuento - descuento_importe;
    const cuota_iva = base_imponible * (linea.tipo_iva / 100);
    const cuota_irpf = base_imponible * (linea.tipo_irpf / 100);
    const total_linea = base_imponible + cuota_iva - cuota_irpf;

    return {
      base_imponible,
      cuota_iva,
      total_linea
    };
  };

  const generarXml = async () => {
    try {
      await facturacionService.generarXmlVerifactu(facturaId);
      cargarFactura();
    } catch (error) {
      console.error('Error generando XML:', error);
    }
  };

  const generarQr = async () => {
    try {
      await facturacionService.generarCodigoQr(facturaId);
      cargarFactura();
    } catch (error) {
      console.error('Error generando QR:', error);
    }
  };

  const enviarAEAT = async () => {
    try {
      await facturacionService.enviarAeat(facturaId);
      cargarFactura();
      onUpdate();
    } catch (error) {
      console.error('Error enviando a AEAT:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando factura...</p>
        </div>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <p className="text-red-600">Error cargando la factura</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                Factura {factura.numero_operacion}
              </h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-600">
                  {new Date(factura.fecha_expedicion).toLocaleDateString('es-ES')}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  factura.estado === 'pagada' ? 'bg-green-100 text-green-800' :
                  factura.estado === 'vencida' ? 'bg-red-100 text-red-800' :
                  factura.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {factura.estado}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  factura.estado_verifactu === 'enviado' ? 'bg-green-100 text-green-800' :
                  factura.estado_verifactu === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  Verifactu: {factura.estado_verifactu}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Información de la factura */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Datos del Emisor</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{factura.nombre_emisor}</p>
                  <p className="text-gray-600">NIF: {factura.nif_emisor}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Datos del Receptor</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{factura.nombre_receptor || 'Sin especificar'}</p>
                  {factura.nif_receptor && (
                    <p className="text-gray-600">NIF: {factura.nif_receptor}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Detalles</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><span className="text-gray-600">Concepto:</span> {factura.concepto_descripcion}</p>
                  <p><span className="text-gray-600">Tipo:</span> {factura.tipo_factura}</p>
                  {factura.observaciones && (
                    <p><span className="text-gray-600">Observaciones:</span> {factura.observaciones}</p>
                  )}
                </div>
              </div>

              {/* Totales */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Totales</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>€{factura.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA:</span>
                    <span>€{factura.total_iva.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IRPF:</span>
                    <span>-€{factura.total_irpf.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>€{factura.importe_total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones Verifactu */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Acciones Verifactu</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={generarXml}
                disabled={!factura.xml_verifactu || factura.estado_verifactu === 'enviado'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <FileCheck className="w-4 h-4" />
                {factura.xml_verifactu ? 'Regenerar XML' : 'Generar XML'}
              </button>
              
              <button
                onClick={generarQr}
                disabled={!factura.xml_verifactu || !factura.codigo_qr_url}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <QrCode className="w-4 h-4" />
                {factura.codigo_qr_url ? 'Regenerar QR' : 'Generar QR'}
              </button>
              
              <button
                onClick={enviarAEAT}
                disabled={!factura.xml_verifactu || factura.estado_verifactu === 'enviado'}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Enviar a AEAT
              </button>
            </div>

            {/* Estado Verifactu */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {factura.estado_verifactu === 'enviado' && (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-700">Factura enviada a AEAT</span>
                  </>
                )}
                {factura.estado_verifactu === 'pendiente' && factura.xml_verifactu && (
                  <>
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="text-yellow-700">XML generado, pendiente envío</span>
                  </>
                )}
                {!factura.xml_verifactu && (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">XML no generado</span>
                  </>
                )}
              </div>
              
              {/* QR Code */}
              {factura.codigo_qr_url && (
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Código QR de Verificación</h4>
                  <div className="text-sm text-gray-600 mb-2">
                    URL: {factura.codigo_qr_url}
                  </div>
                  {/* Aquí se mostraría el QR real usando una librería QR */}
                  <div className="w-32 h-32 bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-xs">QR Code</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Líneas de detalle */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Líneas de Detalle</h3>
              <button
                onClick={() => setEditando(!editando)}
                className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:text-blue-800"
              >
                <Edit className="w-4 h-4" />
                {editando ? 'Ver solo' : 'Editar'}
              </button>
            </div>

            {editando && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Agregar Nueva Línea</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <input
                      type="text"
                      value={nuevaLinea.descripcion}
                      onChange={(e) => setNuevaLinea(prev => ({ ...prev, descripcion: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descripción del producto/servicio"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                    <input
                      type="number"
                      step="0.01"
                      value={nuevaLinea.cantidad}
                      onChange={(e) => setNuevaLinea(prev => ({ 
                        ...prev, 
                        cantidad: parseFloat(e.target.value) || 0,
                        ...calcularTotales({ ...prev, cantidad: parseFloat(e.target.value) || 0 })
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unit.</label>
                    <input
                      type="number"
                      step="0.01"
                      value={nuevaLinea.precio_unitario}
                      onChange={(e) => setNuevaLinea(prev => ({ 
                        ...prev, 
                        precio_unitario: parseFloat(e.target.value) || 0,
                        ...calcularTotales({ ...prev, precio_unitario: parseFloat(e.target.value) || 0 })
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IVA (%)</label>
                    <select
                      value={nuevaLinea.tipo_iva}
                      onChange={(e) => setNuevaLinea(prev => ({ 
                        ...prev, 
                        tipo_iva: parseFloat(e.target.value),
                        ...calcularTotales({ ...prev, tipo_iva: parseFloat(e.target.value) })
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={0}>0%</option>
                      <option value={4}>4%</option>
                      <option value={10}>10%</option>
                      <option value={21}>21%</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IRPF (%)</label>
                    <select
                      value={nuevaLinea.tipo_irpf}
                      onChange={(e) => setNuevaLinea(prev => ({ 
                        ...prev, 
                        tipo_irpf: parseFloat(e.target.value),
                        ...calcularTotales({ ...prev, tipo_irpf: parseFloat(e.target.value) })
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={0}>0%</option>
                      <option value={19}>19%</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      max="100"
                      value={nuevaLinea.descuento_porcentaje}
                      onChange={(e) => setNuevaLinea(prev => ({ 
                        ...prev, 
                        descuento_porcentaje: parseFloat(e.target.value) || 0,
                        ...calcularTotales({ ...prev, descuento_porcentaje: parseFloat(e.target.value) || 0 })
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={agregarLinea}
                      disabled={!nuevaLinea.descripcion}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de líneas */}
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Línea</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Descripción</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Cantidad</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Precio Unit.</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">IVA</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                    {editando && <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {factura.detalles?.map((detalle) => (
                    <tr key={detalle.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{detalle.linea}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{detalle.descripcion}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{detalle.cantidad}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">€{detalle.precio_unitario.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">€{detalle.cuota_iva.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">€{detalle.total_linea.toFixed(2)}</td>
                      {editando && (
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => eliminarLinea(detalle.id!)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleFactura;