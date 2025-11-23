/**
 * PÁGINA DE GESTIÓN DE APP
 * Configuración y gestión avanzada de la aplicación
 * Autor: MiniMax Agent
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  CogIcon,
  ServerIcon,
  CodeBracketIcon,
  ShieldCheckIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface EstadoApp {
  version: string;
  entorno: 'desarrollo' | 'staging' | 'produccion';
  estado: 'operativo' | 'mantenimiento' | 'error';
  uptime: string;
  ultima_actualizacion: string;
  servicios: ServicioEstado[];
}

interface ServicioEstado {
  nombre: string;
  estado: 'operativo' | 'degradado' | 'caido';
  respuesta_promedio: number;
  ultima_verificacion: string;
}

interface ConfiguracionApp {
  app_name: string;
  app_version: string;
  debug_mode: boolean;
  log_level: 'error' | 'warn' | 'info' | 'debug';
  max_file_upload: number;
  session_timeout: number;
  cache_ttl: number;
  api_rate_limit: number;
}

interface AccionSistema {
  id: string;
  tipo: 'backup' | 'deploy' | 'migracion' | 'limpieza';
  descripcion: string;
  estado: 'pendiente' | 'ejecutando' | 'completado' | 'error';
  inicio?: string;
  fin?: string;
  progreso?: number;
  logs?: string[];
}

export default function GestionAppPage() {
  const [estadoApp, setEstadoApp] = useState<EstadoApp | null>(null);
  const [configuracion, setConfiguracion] = useState<ConfiguracionApp | null>(null);
  const [acciones, setAcciones] = useState<AccionSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfigEditor, setShowConfigEditor] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Simular carga de datos
      const estadoSimulado: EstadoApp = {
        version: '2.1.0',
        entorno: 'produccion',
        estado: 'operativo',
        uptime: '15 días, 8 horas',
        ultima_actualizacion: '2025-11-20T14:30:00Z',
        servicios: [
          { nombre: 'Base de Datos', estado: 'operativo', respuesta_promedio: 45, ultima_verificacion: '2025-11-23T13:00:00Z' },
          { nombre: 'API Principal', estado: 'operativo', respuesta_promedio: 120, ultima_verificacion: '2025-11-23T13:00:00Z' },
          { nombre: 'WhatsApp Worker', estado: 'degradado', respuesta_promedio: 580, ultima_verificacion: '2025-11-23T13:00:00Z' },
          { nombre: 'Gmail API', estado: 'operativo', respuesta_promedio: 95, ultima_verificacion: '2025-11-23T13:00:00Z' },
          { nombre: 'Ollama AI', estado: 'operativo', respuesta_promedio: 340, ultima_verificacion: '2025-11-23T13:00:00Z' }
        ]
      };

      const configSimulada: ConfiguracionApp = {
        app_name: 'Rubio García Dental',
        app_version: '2.1.0',
        debug_mode: false,
        log_level: 'info',
        max_file_upload: 10,
        session_timeout: 24,
        cache_ttl: 3600,
        api_rate_limit: 1000
      };

      const accionesSimuladas: AccionSistema[] = [
        {
          id: '1',
          tipo: 'backup',
          descripcion: 'Backup automático nocturno',
          estado: 'completado',
          inicio: '2025-11-23T02:00:00Z',
          fin: '2025-11-23T02:15:00Z',
          progreso: 100,
          logs: ['Iniciando backup...', 'Comprimiendo archivos...', 'Subiendo a almacenamiento...', 'Backup completado']
        },
        {
          id: '2',
          tipo: 'deploy',
          descripcion: 'Deploy versión 2.1.0',
          estado: 'ejecutando',
          inicio: '2025-11-23T13:05:00Z',
          progreso: 65,
          logs: ['Verificando dependencias...', 'Compilando aplicación...', 'Desplegando servicios...', 'Probando conectividad...']
        }
      ];

      setEstadoApp(estadoSimulado);
      setConfiguracion(configSimulada);
      setAcciones(accionesSimuladas);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const ejecutarAccion = async (tipo: AccionSistema['tipo']) => {
    const nuevaAccion: AccionSistema = {
      id: Date.now().toString(),
      tipo,
      descripcion: `Ejecución manual: ${tipo}`,
      estado: 'ejecutando',
      inicio: new Date().toISOString(),
      progreso: 0,
      logs: ['Iniciando acción...']
    };

    setAcciones(prev => [nuevaAccion, ...prev]);

    // Simular ejecución
    setTimeout(() => {
      setAcciones(prev => prev.map(acc => 
        acc.id === nuevaAccion.id 
          ? { 
              ...acc, 
              estado: 'completado' as const, 
              fin: new Date().toISOString(),
              progreso: 100,
              logs: [...(acc.logs || []), 'Acción completada exitosamente']
            }
          : acc
      ));
    }, 3000);
  };

  const cambiarEstadoApp = async (nuevoEstado: EstadoApp['estado']) => {
    if (nuevoEstado === 'mantenimiento') {
      if (!confirm('¿Estás seguro de que quieres poner la aplicación en modo mantenimiento?')) {
        return;
      }
    }

    setEstadoApp(prev => prev ? { ...prev, estado: nuevoEstado } : null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-lg"></div>
            ))}
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Aplicación</h1>
          <p className="text-gray-600">Administración avanzada y configuración del sistema</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowConfigEditor(!showConfigEditor)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <CogIcon className="w-5 h-5" />
            <span>Editor Configuración</span>
          </button>
          
          <button
            onClick={cargarDatos}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Estado General */}
      {estadoApp && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Estado del Sistema</h2>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                estadoApp.estado === 'operativo' ? 'bg-green-100 text-green-800' :
                estadoApp.estado === 'mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {estadoApp.estado}
              </span>
              
              <div className="flex items-center space-x-1">
                <div className={`w-3 h-3 rounded-full ${
                  estadoApp.estado === 'operativo' ? 'bg-green-500' :
                  estadoApp.estado === 'mantenimiento' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">Uptime: {estadoApp.uptime}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{estadoApp.version}</div>
              <div className="text-sm text-gray-600">Versión Actual</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{estadoApp.entorno}</div>
              <div className="text-sm text-gray-600">Entorno</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {estadoApp.servicios.filter(s => s.estado === 'operativo').length}/{estadoApp.servicios.length}
              </div>
              <div className="text-sm text-gray-600">Servicios Operativos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(estadoApp.servicios.reduce((sum, s) => sum + s.respuesta_promedio, 0) / estadoApp.servicios.length)}ms
              </div>
              <div className="text-sm text-gray-600">Respuesta Promedio</div>
            </div>
          </div>
        </div>
      )}

      {/* Servicios */}
      {estadoApp && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Estado de Servicios</h3>
          </div>
          
          <div className="p-6 space-y-4">
            {estadoApp.servicios.map((servicio, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    servicio.estado === 'operativo' ? 'bg-green-500' :
                    servicio.estado === 'degradado' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  
                  <div>
                    <div className="font-medium text-gray-900">{servicio.nombre}</div>
                    <div className="text-sm text-gray-600">
                      Última verificación: {new Date(servicio.ultima_verificacion).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{servicio.respuesta_promedio}ms</div>
                    <div className="text-xs text-gray-500">Tiempo respuesta</div>
                  </div>
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    servicio.estado === 'operativo' ? 'bg-green-100 text-green-800' :
                    servicio.estado === 'degradado' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {servicio.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acciones del Sistema */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Acciones del Sistema</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => ejecutarAccion('backup')}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Backup Manual
                </button>
                <button
                  onClick={() => ejecutarAccion('limpieza')}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Limpiar Cache
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {acciones.map((accion) => (
                <div key={accion.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {accion.estado === 'ejecutando' ? (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : accion.estado === 'completado' ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      ) : (
                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
                      )}
                      
                      <span className="font-medium text-gray-900">{accion.descripcion}</span>
                    </div>
                    
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      accion.estado === 'completado' ? 'bg-green-100 text-green-800' :
                      accion.estado === 'ejecutando' ? 'bg-blue-100 text-blue-800' :
                      accion.estado === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {accion.estado}
                    </span>
                  </div>
                  
                  {accion.progreso !== undefined && (
                    <div className="mb-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${accion.progreso}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{accion.progreso}% completado</div>
                    </div>
                  )}
                  
                  {accion.inicio && (
                    <div className="text-xs text-gray-500">
                      Iniciado: {new Date(accion.inicio).toLocaleString()}
                      {accion.fin && ` - Terminado: ${new Date(accion.fin).toLocaleString()}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Configuración Actual */}
        {configuracion && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Configuración Actual</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre App</label>
                  <div className="text-sm text-gray-900">{configuracion.app_name}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Versión</label>
                  <div className="text-sm text-gray-900">{configuracion.app_version}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Debug Mode</label>
                  <div className={`text-sm ${configuracion.debug_mode ? 'text-red-600' : 'text-green-600'}`}>
                    {configuracion.debug_mode ? 'Activado' : 'Desactivado'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Log</label>
                  <div className="text-sm text-gray-900">{configuracion.log_level}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeout Sesión</label>
                  <div className="text-sm text-gray-900">{configuracion.session_timeout}h</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit API</label>
                  <div className="text-sm text-gray-900">{configuracion.api_rate_limit}/min</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controles de Emergencia */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4">Controles de Emergencia</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => cambiarEstadoApp('mantenimiento')}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
          >
            <ClockIcon className="w-5 h-5" />
            <span>Modo Mantenimiento</span>
          </button>
          
          <button
            onClick={() => ejecutarAccion('deploy')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <CloudArrowUpIcon className="w-5 h-5" />
            <span>Deploy Urgente</span>
          </button>
          
          <button
            onClick={() => window.open('/api/health', '_blank')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <ShieldCheckIcon className="w-5 h-5" />
            <span>Health Check</span>
          </button>
        </div>
      </div>
    </div>
  );
}