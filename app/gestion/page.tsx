'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Download,
  Upload,
  Send,
  QrCode,
  Building,
  User,
  FileCheck,
  CreditCard,
  Mail,
  RefreshCw
} from 'lucide-react';
import { facturacionService } from '@/services/facturacion';

const GestionPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [configuracion, setConfiguracion] = useState<any>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [stats, config] = await Promise.all([
        facturacionService.obtenerDashboard(),
        facturacionService.obtenerConfiguracion()
      ]);
      setEstadisticas(stats);
      setConfiguracion(config);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: BarChart3,
      description: 'Resumen general de gestión'
    },
    {
      id: 'facturas',
      name: 'Facturas Verifactu',
      icon: FileText,
      description: 'Gestión completa de facturas'
    },
    {
      id: 'paz-saldos',
      name: 'Paz y Saldos',
      icon: CreditCard,
      description: 'Resumen de cobros pendientes'
    },
    {
      id: 'estadisticas',
      name: 'Estadísticas',
      icon: TrendingUp,
      description: 'Análisis de facturación'
    },
    {
      id: 'configuracion',
      name: 'Configuración',
      icon: Settings,
      description: 'Ajustes del sistema'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando módulo de gestión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del módulo */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Módulo de Gestión</h1>
              <p className="text-gray-600">Sistema integral de gestión clínica y administrativa</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Verifactu Activo
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de navegación */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Navegación</h3>
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                        activeTab === item.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Resumen del Módulo de Gestión</h2>
                  
                  {/* Métricas principales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-600 text-sm font-medium">Facturas Activas</p>
                          <p className="text-2xl font-bold text-blue-900">{estadisticas?.facturas_mes?.total || 0}</p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 text-sm font-medium">Facturado Este Mes</p>
                          <p className="text-2xl font-bold text-green-900">€{estadisticas?.facturas_mes?.importe?.toFixed(2) || '0.00'}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-600 text-sm font-medium">Pendientes</p>
                          <p className="text-2xl font-bold text-yellow-900">{estadisticas?.pendientes?.cantidad || 0}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-600" />
                      </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-red-600 text-sm font-medium">Vencidas</p>
                          <p className="text-2xl font-bold text-red-900">{estadisticas?.vencidas?.cantidad || 0}</p>
                        </div>
                        <XCircle className="w-8 h-8 text-red-600" />
                      </div>
                    </div>
                  </div>

                  {/* Estado del sistema */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Estado del Sistema</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700">Verifactu: Conectado</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700">Base de datos: Operativa</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        <span className="text-gray-700">AEAT: Modo desarrollo</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700">Configuración: Completa</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accesos rápidos */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Accesos Rápidos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('facturas')}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                    >
                      <FileText className="w-8 h-8 text-blue-600 mb-2" />
                      <h4 className="font-medium text-gray-900">Gestionar Facturas</h4>
                      <p className="text-sm text-gray-600">Crear y administrar facturas Verifactu</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('paz-saldos')}
                      className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left"
                    >
                      <CreditCard className="w-8 h-8 text-green-600 mb-2" />
                      <h4 className="font-medium text-gray-900">Paz y Saldos</h4>
                      <p className="text-sm text-gray-600">Control de cobros pendientes</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('configuracion')}
                      className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                    >
                      <Settings className="w-8 h-8 text-purple-600 mb-2" />
                      <h4 className="font-medium text-gray-900">Configuración</h4>
                      <p className="text-sm text-gray-600">Ajustes del sistema</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'facturas' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Gestión de Facturas</h2>
                  <button
                    onClick={() => window.location.href = '/gestion/facturas'}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Abrir Módulo
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <FileText className="w-8 h-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold text-blue-900">Facturas Verifactu</h3>
                    <p className="text-sm text-blue-700 mt-1">Sistema completo de facturación según normativa española</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <QrCode className="w-8 h-8 text-green-600 mb-2" />
                    <h3 className="font-semibold text-green-900">Códigos QR</h3>
                    <p className="text-sm text-green-700 mt-1">Generación automática de códigos de verificación</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <Send className="w-8 h-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold text-purple-900">Integración AEAT</h3>
                    <p className="text-sm text-purple-700 mt-1">Envío automático a la Agencia Tributaria</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'paz-saldos' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Paz y Saldos</h2>
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Módulo en desarrollo</p>
                  <p className="text-sm text-gray-500 mt-2">Control de cobros pendientes y resúmenes de cliente</p>
                </div>
              </div>
            )}

            {activeTab === 'estadisticas' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Estadísticas y Reportes</h2>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Módulo en desarrollo</p>
                  <p className="text-sm text-gray-500 mt-2">Análisis detallado de facturación y rendimiento</p>
                </div>
              </div>
            )}

            {activeTab === 'configuracion' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuración del Sistema</h2>
                  
                  {configuracion ? (
                    <div className="space-y-6">
                      {/* Datos fiscales */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Datos Fiscales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">NIF Fiscal</label>
                            <p className="text-gray-900">{configuracion.nif_fiscal}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Empresa</label>
                            <p className="text-gray-900">{configuracion.nombre_empresa}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <p className="text-gray-900">{configuracion.telefono || 'No configurado'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <p className="text-gray-900">{configuracion.email || 'No configurado'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Configuración Verifactu */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Configuración Verifactu</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Facturación</label>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {configuracion.tipo_facturacion || 'verifactu'}
                            </span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">IVA General</label>
                            <p className="text-gray-900">{configuracion.iva_general || 21}%</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">IVA Reducido</label>
                            <p className="text-gray-900">{configuracion.iva_reducido || 10}%</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">IRPF General</label>
                            <p className="text-gray-900">{configuracion.irpf_general || 19}%</p>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Acciones</h3>
                        <div className="flex flex-wrap gap-3">
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Exportar Configuración
                          </button>
                          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Importar Configuración
                          </button>
                          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Configurar AEAT
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                      <p className="text-gray-600">Configuración no disponible</p>
                      <p className="text-sm text-gray-500 mt-2">Complete la configuración inicial del sistema</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionPage;