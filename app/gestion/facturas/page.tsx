'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Send,
  Eye,
  Edit,
  Trash2,
  QrCode,
  FileCheck,
  Clock,
  Euro,
  Calendar,
  User,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { facturacionService } from '@/services/facturacion';
import DetalleFactura from '@/components/facturas/DetalleFactura';

interface Factura {
  id: number;
  numero_operacion: string;
  numero_serie: string;
  fecha_expedicion: string;
  fecha_vencimiento?: string;
  nombre_receptor: string;
  nif_emisor: string;
  nombre_emisor: string;
  subtotal: number;
  total_iva: number;
  total_irpf: number;
  importe_total: number;
  estado: string;
  estado_calculado: string;
  tipo_factura: string;
  pendiente_cobro: number;
  codigo_qr_url?: string;
  xml_verifactu?: string;
}

const FacturasPage = () => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('todos');
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [facturaDetalleId, setFacturaDetalleId] = useState<number | null>(null);
  const [estadisticas, setEstadisticas] = useState<any>(null);

  // Estados para formulario de creación
  const [nuevaFactura, setNuevaFactura] = useState({
    fecha_expedicion: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    nif_emisor: '12345678Z',
    nombre_emisor: 'Rubio García Dental',
    tipo_receptor: 'cliente' as const,
    nif_receptor: '',
    nombre_receptor: '',
    observaciones: '',
    concepto_descripcion: '',
    tipo_factura: 'F1' as const,
    subtotal: 0,
    total_iva: 0,
    total_irpf: 0,
    importe_total: 0
  });

  useEffect(() => {
    cargarFacturas();
    cargarEstadisticas();
  }, []);

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      const filtros: any = {};
      
      if (filtroEstado !== 'todos') filtros.estado = filtroEstado;
      if (filtroFecha === 'este_mes') {
        const inicio = new Date();
        inicio.setDate(1);
        filtros.fecha_desde = inicio.toISOString().split('T')[0];
        
        const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);
        filtros.fecha_hasta = fin.toISOString().split('T')[0];
      }

      const resultado = await facturacionService.listarFacturas(filtros);
      setFacturas(resultado.data);
    } catch (error) {
      console.error('Error cargando facturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const stats = await facturacionService.obtenerDashboard();
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const crearFactura = async () => {
    try {
      const factura = await facturacionService.crearFactura({
        ...nuevaFactura,
        numero_serie: '001', // Se generará automáticamente
        numero_operacion: '', // Se generará automáticamente
        estado: 'borrador',
        estado_verifactu: 'pendiente'
      });

      console.log('Factura creada:', factura);
      setMostrarCrear(false);
      cargarFacturas();
      cargarEstadisticas();

      // Reset form
      setNuevaFactura({
        fecha_expedicion: new Date().toISOString().split('T')[0],
        fecha_vencimiento: '',
        nif_emisor: '12345678Z',
        nombre_emisor: 'Rubio García Dental',
        tipo_receptor: 'cliente',
        nif_receptor: '',
        nombre_receptor: '',
        observaciones: '',
        concepto_descripcion: '',
        tipo_factura: 'F1',
        subtotal: 0,
        total_iva: 0,
        total_irpf: 0,
        importe_total: 0
      });
    } catch (error) {
      console.error('Error creando factura:', error);
    }
  };

  const enviarAEAT = async (facturaId: number) => {
    try {
      await facturacionService.enviarAeat(facturaId);
      cargarFacturas();
      cargarEstadisticas();
    } catch (error) {
      console.error('Error enviando a AEAT:', error);
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pagada':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'vencida':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pendiente':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'borrador':
        return <Edit className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pagada':
        return 'bg-green-100 text-green-800';
      case 'vencida':
        return 'bg-red-100 text-red-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'borrador':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const facturasFiltradas = facturas.filter(factura => {
    const coincideBusqueda = factura.numero_operacion.toLowerCase().includes(busqueda.toLowerCase()) ||
                           factura.nombre_receptor?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === 'todos' || factura.estado_calculado === filtroEstado;
    
    return coincideBusqueda && coincideEstado;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Sistema de Facturación Verifactu
              </h1>
              <p className="text-gray-600 mt-2">
                Gestión completa de facturas según normativa española 2025-2026
              </p>
            </div>
            <button
              onClick={() => setMostrarCrear(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nueva Factura
            </button>
          </div>
        </div>

        {/* Dashboard de estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Facturas Este Mes</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.facturas_mes.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Importe Facturado</p>
                  <p className="text-2xl font-bold text-gray-900">€{estadisticas.facturas_mes.importe.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Euro className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.pendientes.cantidad}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vencidas</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.vencidas.cantidad}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por número de factura o cliente..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  cargarFacturas();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los estados</option>
                <option value="borrador">Borrador</option>
                <option value="pendiente">Pendiente</option>
                <option value="pagada">Pagada</option>
                <option value="vencida">Vencida</option>
                <option value="anulada">Anulada</option>
              </select>
              
              <select
                value={filtroFecha}
                onChange={(e) => {
                  setFiltroFecha(e.target.value);
                  cargarFacturas();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todas las fechas</option>
                <option value="este_mes">Este mes</option>
                <option value="ultimos_3_meses">Últimos 3 meses</option>
                <option value="este_año">Este año</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de facturas */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Facturas ({facturasFiltradas.length})
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Cargando facturas...</p>
            </div>
          ) : facturasFiltradas.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron facturas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Factura
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Importe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verifactu
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {facturasFiltradas.map((factura) => (
                    <tr key={factura.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {factura.numero_operacion}
                          </div>
                          <div className="text-sm text-gray-500">
                            Serie: {factura.numero_serie}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {factura.nombre_receptor || 'Sin cliente'}
                          </div>
                          {factura.nif_emisor && (
                            <div className="text-sm text-gray-500">
                              {factura.nif_emisor}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(factura.fecha_expedicion).toLocaleDateString('es-ES')}
                        </div>
                        {factura.fecha_vencimiento && (
                          <div className="text-sm text-gray-500">
                            Vence: {new Date(factura.fecha_vencimiento).toLocaleDateString('es-ES')}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          €{factura.importe_total.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          IVA: €{factura.total_iva.toFixed(2)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(factura.estado_calculado)}`}>
                          {getEstadoIcon(factura.estado_calculado)}
                          <span className="ml-1 capitalize">{factura.estado_calculado}</span>
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {factura.xml_verifactu && (
                            <FileCheck className="w-4 h-4 text-green-500" />
                          )}
                          {factura.codigo_qr_url && (
                            <QrCode className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setFacturaDetalleId(factura.id);
                              setMostrarDetalle(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => enviarAEAT(factura.id)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Enviar a AEAT"
                            disabled={factura.estado === 'borrador'}
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Descargar PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal para crear nueva factura */}
        {mostrarCrear && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Crear Nueva Factura
                </h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Expedición
                    </label>
                    <input
                      type="date"
                      value={nuevaFactura.fecha_expedicion}
                      onChange={(e) => setNuevaFactura(prev => ({ ...prev, fecha_expedicion: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Vencimiento
                    </label>
                    <input
                      type="date"
                      value={nuevaFactura.fecha_vencimiento}
                      onChange={(e) => setNuevaFactura(prev => ({ ...prev, fecha_vencimiento: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Factura
                  </label>
                  <select
                    value={nuevaFactura.tipo_factura}
                    onChange={(e) => setNuevaFactura(prev => ({ ...prev, tipo_factura: e.target.value as 'F1' | 'F2' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="F1">Factura Ordinaria (F1)</option>
                    <option value="F2">Factura Simplificada (F2)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Receptor
                    </label>
                    <select
                      value={nuevaFactura.tipo_receptor}
                      onChange={(e) => setNuevaFactura(prev => ({ ...prev, tipo_receptor: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="cliente">Cliente</option>
                      <option value="empresa">Empresa</option>
                      <option value="particular">Particular</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NIF Receptor (opcional)
                    </label>
                    <input
                      type="text"
                      value={nuevaFactura.nif_receptor}
                      onChange={(e) => setNuevaFactura(prev => ({ ...prev, nif_receptor: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="12345678Z"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre/Empresa Receptora
                  </label>
                  <input
                    type="text"
                    value={nuevaFactura.nombre_receptor}
                    onChange={(e) => setNuevaFactura(prev => ({ ...prev, nombre_receptor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre del cliente o empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Concepto/Descripción de la Operación
                  </label>
                  <textarea
                    value={nuevaFactura.concepto_descripcion}
                    onChange={(e) => setNuevaFactura(prev => ({ ...prev, concepto_descripcion: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descripción de los servicios o productos facturados"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={nuevaFactura.observaciones}
                    onChange={(e) => setNuevaFactura(prev => ({ ...prev, observaciones: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Notas adicionales (opcional)"
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setMostrarCrear(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearFactura}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Crear Factura
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Componente de detalle de factura */}
        {mostrarDetalle && facturaDetalleId && (
          <DetalleFactura
            facturaId={facturaDetalleId}
            onClose={() => {
              setMostrarDetalle(false);
              setFacturaDetalleId(null);
            }}
            onUpdate={() => {
              cargarFacturas();
              cargarEstadisticas();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default FacturasPage;