/**
 * PÁGINA DE GESTIÓN DE TABLAS
 * Administración y configuración de tablas del sistema
 * Autor: MiniMax Agent
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  TableCellsIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Tabla {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'sistema' | 'negocio' | 'configuracion' | 'log';
  registros: number;
  tamaño_mb: number;
  ultima_modificacion: string;
  estado: 'activa' | 'inactiva' | 'bloqueada';
  relaciones: RelaciónTabla[];
  índices: ÍndiceTabla[];
  triggers: TriggerTabla[];
}

interface RelaciónTabla {
  tabla_destino: string;
  tipo_relacion: 'uno_a_uno' | 'uno_a_muchos' | 'muchos_a_muchos';
  campo_origen: string;
  campo_destino: string;
}

interface ÍndiceTabla {
  nombre: string;
  tipo: 'primario' | 'único' | 'compuesto' | 'texto_completo';
  campos: string[];
  tamaño_mb: number;
  uso: number; // Porcentaje de uso
}

interface TriggerTabla {
  nombre: string;
  evento: 'INSERT' | 'UPDATE' | 'DELETE';
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD_OF';
  función: string;
  activo: boolean;
}

export default function TablasPage() {
  const [tablas, setTablas] = useState<Tabla[]>([]);
  const [selectedTabla, setSelectedTabla] = useState<Tabla | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTablaBuilder, setShowTablaBuilder] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarTablas();
  }, []);

  const cargarTablas = async () => {
    try {
      setLoading(true);
      
      // Simular carga de tablas
      const tablasSimuladas: Tabla[] = [
        {
          id: '1',
          nombre: 'usuarios',
          descripcion: 'Tabla principal de usuarios del sistema',
          tipo: 'sistema',
          registros: 45,
          tamaño_mb: 2.3,
          ultima_modificacion: '2025-11-22T10:30:00Z',
          estado: 'activa',
          relaciones: [
            { tabla_destino: 'roles', tipo_relacion: 'muchos_a_muchos', campo_origen: 'id', campo_destino: 'user_id' }
          ],
          índices: [
            { nombre: 'idx_usuarios_email', tipo: 'único', campos: ['email'], tamaño_mb: 0.1, uso: 95 },
            { nombre: 'idx_usuarios_activo', tipo: 'compuesto', campos: ['activo'], tamaño_mb: 0.05, uso: 78 }
          ],
          triggers: [
            { nombre: 'trigger_usuario_created', evento: 'INSERT', timing: 'AFTER', función: 'log_user_creation', activo: true }
          ]
        },
        {
          id: '2',
          nombre: 'pacientes',
          descripcion: 'Información de pacientes de la clínica',
          tipo: 'negocio',
          registros: 1250,
          tamaño_mb: 45.7,
          ultima_modificacion: '2025-11-23T08:15:00Z',
          estado: 'activa',
          relaciones: [
            { tabla_destino: 'citas', tipo_relacion: 'uno_a_muchos', campo_origen: 'id', campo_destino: 'paciente_id' },
            { tabla_destino: 'facturas', tipo_relacion: 'uno_a_muchos', campo_origen: 'id', campo_destino: 'cliente_id' }
          ],
          índices: [
            { nombre: 'idx_pacientes_dni', tipo: 'único', campos: ['dni'], tamaño_mb: 0.3, uso: 88 },
            { nombre: 'idx_pacientes_telefono', tipo: 'compuesto', campos: ['telefono'], tamaño_mb: 0.2, uso: 65 },
            { nombre: 'idx_pacientes_nombre', tipo: 'texto_completo', campos: ['nombre', 'apellido'], tamaño_mb: 1.8, uso: 92 }
          ],
          triggers: [
            { nombre: 'trigger_paciente_updated', evento: 'UPDATE', timing: 'AFTER', función: 'audit_patient_change', activo: true },
            { nombre: 'trigger_new_patient_welcome', evento: 'INSERT', timing: 'AFTER', función: 'send_welcome_message', activo: true }
          ]
        },
        {
          id: '3',
          nombre: 'citas',
          descripcion: 'Agenda de citas y tratamientos',
          tipo: 'negocio',
          registros: 890,
          tamaño_mb: 12.4,
          ultima_modificacion: '2025-11-23T12:45:00Z',
          estado: 'activa',
          relaciones: [
            { tabla_destino: 'pacientes', tipo_relacion: 'muchos_a_uno', campo_origen: 'paciente_id', campo_destino: 'id' },
            { tabla_destino: 'tratamientos', tipo_relacion: 'muchos_a_uno', campo_origen: 'tipo_tratamiento', campo_destino: 'id' }
          ],
          índices: [
            { nombre: 'idx_citas_fecha', tipo: 'compuesto', campos: ['fecha', 'hora_inicio'], tamaño_mb: 0.8, uso: 96 },
            { nombre: 'idx_citas_paciente', tipo: 'compuesto', campos: ['paciente_id'], tamaño_mb: 0.4, uso: 82 }
          ],
          triggers: [
            { nombre: 'trigger_cita_reminder', evento: 'INSERT', timing: 'AFTER', función: 'schedule_reminder', activo: true }
          ]
        },
        {
          id: '4',
          nombre: 'config_verifactu',
          descripcion: 'Configuración del sistema Verifactu',
          tipo: 'configuracion',
          registros: 1,
          tamaño_mb: 0.01,
          ultima_modificacion: '2025-11-20T16:00:00Z',
          estado: 'activa',
          relaciones: [],
          índices: [
            { nombre: 'idx_config_primary', tipo: 'primario', campos: ['id'], tamaño_mb: 0.001, uso: 100 }
          ],
          triggers: []
        },
        {
          id: '5',
          nombre: 'logs_sistema',
          descripcion: 'Registro de actividades del sistema',
          tipo: 'log',
          registros: 15420,
          tamaño_mb: 156.8,
          ultima_modificacion: '2025-11-23T13:00:00Z',
          estado: 'activa',
          relaciones: [
            { tabla_destino: 'usuarios', tipo_relacion: 'muchos_a_uno', campo_origen: 'user_id', campo_destino: 'id' }
          ],
          índices: [
            { nombre: 'idx_logs_fecha', tipo: 'compuesto', campos: ['fecha'], tamaño_mb: 12.3, uso: 97 },
            { nombre: 'idx_logs_nivel', tipo: 'compuesto', campos: ['nivel'], tamaño_mb: 8.9, uso: 45 }
          ],
          triggers: [
            { nombre: 'trigger_cleanup_old_logs', evento: 'INSERT', timing: 'AFTER', función: 'cleanup_expired_logs', activo: true }
          ]
        }
      ];

      setTablas(tablasSimuladas);
    } catch (error) {
      console.error('Error cargando tablas:', error);
    } finally {
      setLoading(false);
    }
  };

  const crearNuevaTabla = () => {
    setSelectedTabla(null);
    setShowTablaBuilder(true);
  };

  const verDetalleTabla = (tabla: Tabla) => {
    setSelectedTabla(tabla);
  };

  const optimizarTabla = async (tablaId: string) => {
    try {
      alert(`Optimizando tabla ${tablaId}...`);
      // Simular optimización
      setTimeout(() => {
        alert('Optimización completada');
      }, 2000);
    } catch (error) {
      console.error('Error optimizando tabla:', error);
    }
  };

  const exportarDatos = async (tablaId: string) => {
    try {
      const tabla = tablas.find(t => t.id === tablaId);
      if (tabla) {
        alert(`Exportando datos de la tabla ${tabla.nombre}...`);
      }
    } catch (error) {
      console.error('Error exportando datos:', error);
    }
  };

  const eliminarTabla = async (tablaId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta tabla? Esta acción no se puede deshacer.')) {
      try {
        setTablas(prev => prev.filter(t => t.id !== tablaId));
      } catch (error) {
        console.error('Error eliminando tabla:', error);
      }
    }
  };

  const tablasFiltradas = tablas.filter(tabla => {
    const cumpleFiltroTipo = filtroTipo === 'todos' || tabla.tipo === filtroTipo;
    const cumpleBusqueda = busqueda === '' || 
      tabla.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      tabla.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    
    return cumpleFiltroTipo && cumpleBusqueda;
  });

  const estadisticasGenerales = {
    total_tablas: tablas.length,
    total_registros: tablas.reduce((sum, t) => sum + t.registros, 0),
    tamaño_total: tablas.reduce((sum, t) => sum + t.tamaño_mb, 0),
    tablas_activas: tablas.filter(t => t.estado === 'activa').length
  };

  if (showTablaBuilder) {
    return (
      <div className="h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-lg border border-gray-200 h-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedTabla ? `Editar Tabla: ${selectedTabla.nombre}` : 'Crear Nueva Tabla'}
            </h2>
            <button
              onClick={() => setShowTablaBuilder(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Volver a Tablas
            </button>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-2" />
              <div className="text-sm text-yellow-800">
                <strong>Nota:</strong> La creación y modificación de tablas debe realizarse con precaución. 
                Siempre hacer backup antes de cambios estructurales importantes.
              </div>
            </div>
          </div>
          
          <div className="text-center text-gray-500 py-12">
            <TableCellsIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">Constructor de Tablas</p>
            <p className="text-sm">Esta funcionalidad estará disponible en la versión 2.2</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Tablas</h1>
          <p className="text-gray-600">Administración y configuración de tablas del sistema</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={cargarTablas}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span>Actualizar</span>
          </button>
          
          <button
            onClick={crearNuevaTabla}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Nueva Tabla</span>
          </button>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TableCellsIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Tablas</p>
              <p className="text-2xl font-semibold text-gray-900">{estadisticasGenerales.total_tablas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Registros</p>
              <p className="text-2xl font-semibold text-gray-900">
                {estadisticasGenerales.total_registros.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tamaño Total</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(estadisticasGenerales.tamaño_total)} MB
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tablas Activas</p>
              <p className="text-2xl font-semibold text-gray-900">{estadisticasGenerales.tablas_activas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por tipo</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="todos">Todos los tipos</option>
                <option value="sistema">Sistema</option>
                <option value="negocio">Negocio</option>
                <option value="configuracion">Configuración</option>
                <option value="log">Log</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input
                type="text"
                placeholder="Nombre o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
              />
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Mostrando {tablasFiltradas.length} de {tablas.length} tablas
          </div>
        </div>
      </div>

      {/* Lista de Tablas */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tablas del Sistema</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {tablasFiltradas.map((tabla) => (
              <div key={tabla.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{tabla.nombre}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tabla.tipo === 'sistema' ? 'bg-blue-100 text-blue-800' :
                        tabla.tipo === 'negocio' ? 'bg-green-100 text-green-800' :
                        tabla.tipo === 'configuracion' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {tabla.tipo}
                      </span>
                      
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tabla.estado === 'activa' ? 'bg-green-100 text-green-800' :
                        tabla.estado === 'inactiva' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tabla.estado}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{tabla.descripcion}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Registros:</span> {tabla.registros.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Tamaño:</span> {tabla.tamaño_mb} MB
                      </div>
                      <div>
                        <span className="font-medium">Relaciones:</span> {tabla.relaciones.length}
                      </div>
                      <div>
                        <span className="font-medium">Índices:</span> {tabla.índices.length}
                      </div>
                      <div>
                        <span className="font-medium">Triggers:</span> {tabla.triggers.length}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Última modificación: {new Date(tabla.ultima_modificacion).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => verDetalleTabla(tabla)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Ver detalles"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => optimizarTabla(tabla.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Optimizar tabla"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => exportarDatos(tabla.id)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                      title="Exportar datos"
                    >
                      <DocumentArrowDownIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                      title="Editar tabla"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => eliminarTabla(tabla.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Eliminar tabla"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Detalle de Tabla */}
      {selectedTabla && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Detalles: {selectedTabla.nombre}</h2>
              <button
                onClick={() => setSelectedTabla(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Información General */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Información General</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <div className="text-sm text-gray-900">{selectedTabla.nombre}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <div className="text-sm text-gray-900">{selectedTabla.tipo}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registros</label>
                    <div className="text-sm text-gray-900">{selectedTabla.registros.toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tamaño</label>
                    <div className="text-sm text-gray-900">{selectedTabla.tamaño_mb} MB</div>
                  </div>
                </div>
              </div>

              {/* Índices */}
              {selectedTabla.índices.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Índices</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campos</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedTabla.índices.map((indice, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-sm text-gray-900">{indice.nombre}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{indice.tipo}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{indice.campos.join(', ')}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${indice.uso}%` }}
                                  ></div>
                                </div>
                                {indice.uso}%
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Relaciones */}
              {selectedTabla.relaciones.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Relaciones</h3>
                  <div className="space-y-2">
                    {selectedTabla.relaciones.map((relacion, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-900">
                          {selectedTabla.nombre}.{relacion.campo_origen}
                        </div>
                        <div className="text-sm text-gray-500">
                          {relacion.tipo_relacion.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-900">
                          {relacion.tabla_destino}.{relacion.campo_destino}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Triggers */}
              {selectedTabla.triggers.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Triggers</h3>
                  <div className="space-y-2">
                    {selectedTabla.triggers.map((trigger, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{trigger.nombre}</div>
                          <div className="text-sm text-gray-500">
                            {trigger.timing} {trigger.evento} → {trigger.función}
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          trigger.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {trigger.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}