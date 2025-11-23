/**
 * PÁGINA DE FLOWS DE IA
 * Diseño de flujos condicionales de mensajes para Rubio García Dental
 * Autor: MiniMax Agent
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PlayIcon, 
  PauseIcon,
  TrashIcon,
  PencilIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';

interface Flow {
  id: string;
  nombre: string;
  descripcion: string;
  estado: 'activo' | 'inactivo' | 'pausado';
  trigger: string;
  condiciones: number;
  acciones: number;
  ejecuciones: number;
  ultima_ejecucion?: string;
  fecha_creacion: string;
}

interface NodoFlujo {
  id: string;
  tipo: 'trigger' | 'condicion' | 'accion' | 'delay' | 'end';
  titulo: string;
  descripcion: string;
  posicion: { x: number; y: number };
  configuracion: any;
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [showFlowBuilder, setShowFlowBuilder] = useState(false);
  const [nodosFlujo, setNodosFlujo] = useState<NodoFlujo[]>([]);

  useEffect(() => {
    cargarFlows();
  }, []);

  const cargarFlows = async () => {
    try {
      setLoading(true);
      // Simular carga de flows
      const flowsSimulados: Flow[] = [
        {
          id: '1',
          nombre: 'Bienvenida Paciente Nuevo',
          descripcion: 'Secuencia automática de bienvenida para nuevos pacientes',
          estado: 'activo',
          trigger: 'nuevo_paciente',
          condiciones: 2,
          acciones: 4,
          ejecuciones: 156,
          ultima_ejecucion: '2025-11-22T10:30:00Z',
          fecha_creacion: '2025-11-01T08:00:00Z'
        },
        {
          id: '2',
          nombre: 'Recordatorio de Cita',
          descripcion: 'Recordatorio automático 24h antes de la cita',
          estado: 'activo',
          trigger: 'recordatorio_cita',
          condiciones: 1,
          acciones: 3,
          ejecuciones: 89,
          ultima_ejecucion: '2025-11-22T18:00:00Z',
          fecha_creacion: '2025-11-05T12:00:00Z'
        },
        {
          id: '3',
          nombre: 'Seguimiento Post-Tratamiento',
          descripcion: 'Seguimiento automático después de tratamientos',
          estado: 'pausado',
          trigger: 'tratamiento_completado',
          condiciones: 3,
          acciones: 5,
          ejecuciones: 45,
          ultima_ejecucion: '2025-11-20T14:15:00Z',
          fecha_creacion: '2025-11-10T16:30:00Z'
        }
      ];
      setFlows(flowsSimulados);
    } catch (error) {
      console.error('Error cargando flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const crearFlow = () => {
    setSelectedFlow(null);
    setNodosFlujo([
      {
        id: 'trigger-1',
        tipo: 'trigger',
        titulo: 'Trigger Inicial',
        descripcion: 'Evento que inicia el flujo',
        posicion: { x: 100, y: 100 },
        configuracion: { tipo: 'nuevo_paciente' }
      }
    ]);
    setShowFlowBuilder(true);
  };

  const editarFlow = (flow: Flow) => {
    setSelectedFlow(flow);
    // Simular carga de nodos del flow
    const nodosSimulados: NodoFlujo[] = [
      {
        id: 'trigger-1',
        tipo: 'trigger',
        titulo: 'Nuevo Paciente',
        descripcion: 'Se registra un paciente nuevo',
        posicion: { x: 100, y: 100 },
        configuracion: { tipo: 'nuevo_paciente' }
      },
      {
        id: 'delay-1',
        tipo: 'delay',
        titulo: 'Esperar 5 minutos',
        descripcion: 'Delay antes de enviar mensaje',
        posicion: { x: 300, y: 100 },
        configuracion: { minutos: 5 }
      },
      {
        id: 'accion-1',
        tipo: 'accion',
        titulo: 'Enviar Bienvenida',
        descripcion: 'Mensaje de bienvenida al paciente',
        posicion: { x: 500, y: 100 },
        configuracion: { tipo: 'enviar_whatsapp', mensaje: '¡Bienvenido a Rubio García Dental!' }
      }
    ];
    setNodosFlujo(nodosSimulados);
    setShowFlowBuilder(true);
  };

  const toggleFlowStatus = async (flowId: string) => {
    try {
      setFlows(prev => prev.map(flow => 
        flow.id === flowId 
          ? { ...flow, estado: flow.estado === 'activo' ? 'pausado' : 'activo' as 'activo' | 'pausado' }
          : flow
      ));
    } catch (error) {
      console.error('Error toggling flow status:', error);
    }
  };

  const eliminarFlow = async (flowId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este flujo?')) {
      try {
        setFlows(prev => prev.filter(flow => flow.id !== flowId));
      } catch (error) {
        console.error('Error deleting flow:', error);
      }
    }
  };

  const ejecutarFlow = async (flowId: string) => {
    try {
      // Simular ejecución del flow
      alert(`Ejecutando flow ${flowId}...`);
    } catch (error) {
      console.error('Error executing flow:', error);
    }
  };

  if (showFlowBuilder) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header del Builder */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFlowBuilder(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Volver a Flows
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {selectedFlow ? `Editar: ${selectedFlow.nombre}` : 'Crear Nuevo Flow'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                <CodeBracketIcon className="w-4 h-4 mr-2 inline" />
                Vista Código
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Guardar Flow
              </button>
            </div>
          </div>
        </div>

        {/* Canvas del Flow */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-white">
            {/* Grid de fondo */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            
            {/* Nodos del Flow */}
            {nodosFlujo.map((nodo, index) => (
              <div
                key={nodo.id}
                className="absolute w-48 p-4 bg-white border-2 border-blue-200 rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow"
                style={{
                  left: nodo.posicion.x,
                  top: nodo.posicion.y,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    nodo.tipo === 'trigger' ? 'bg-green-500' :
                    nodo.tipo === 'condicion' ? 'bg-yellow-500' :
                    nodo.tipo === 'accion' ? 'bg-blue-500' :
                    nodo.tipo === 'delay' ? 'bg-purple-500' :
                    'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-500 uppercase font-medium">{nodo.tipo}</span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{nodo.titulo}</h3>
                <p className="text-sm text-gray-600">{nodo.descripcion}</p>
              </div>
            ))}

            {/* Conectores entre nodos */}
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
              {nodosFlujo.slice(0, -1).map((nodo, index) => {
                const siguienteNodo = nodosFlujo[index + 1];
                return (
                  <line
                    key={`line-${nodo.id}`}
                    x1={nodo.posicion.x + 192}
                    y1={nodo.posicion.y + 48}
                    x2={siguienteNodo.posicion.x}
                    y2={siguienteNodo.posicion.y + 48}
                    stroke="#3B82F6"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flows de IA</h1>
          <p className="text-gray-600">Diseña y gestiona flujos condicionales de mensajes automáticos</p>
        </div>
        <button
          onClick={crearFlow}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nuevo Flow</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <PlayIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Flows Activos</p>
              <p className="text-2xl font-semibold text-gray-900">
                {flows.filter(f => f.estado === 'activo').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Ejecuciones Hoy</p>
              <p className="text-2xl font-semibold text-gray-900">47</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tasa de Éxito</p>
              <p className="text-2xl font-semibold text-gray-900">96.8%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Flows en Cola</p>
              <p className="text-2xl font-semibold text-gray-900">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Flows */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Flows Configurados</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {flows.map((flow) => (
              <div key={flow.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{flow.nombre}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        flow.estado === 'activo' ? 'bg-green-100 text-green-800' :
                        flow.estado === 'pausado' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {flow.estado}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{flow.descripcion}</p>
                    
                    <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                      <span>Trigger: {flow.trigger}</span>
                      <span>{flow.condiciones} condiciones</span>
                      <span>{flow.acciones} acciones</span>
                      <span>{flow.ejecuciones} ejecuciones</span>
                      {flow.ultima_ejecucion && (
                        <span>Última ejecución: {new Date(flow.ultima_ejecucion).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => ejecutarFlow(flow.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Ejecutar Flow"
                    >
                      <PlayIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => toggleFlowStatus(flow.id)}
                      className={`p-2 rounded-lg ${
                        flow.estado === 'activo' 
                          ? 'text-yellow-600 hover:bg-yellow-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={flow.estado === 'activo' ? 'Pausar Flow' : 'Activar Flow'}
                    >
                      {flow.estado === 'activo' ? (
                        <PauseIcon className="w-5 h-5" />
                      ) : (
                        <PlayIcon className="w-5 h-5" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => editarFlow(flow)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Editar Flow"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => eliminarFlow(flow.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Eliminar Flow"
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
    </div>
  );
}