'use client';

// ===============================================
// MÓDULO AUTOMATIZACIONES - INTERFAZ COMPLETA
// Sistema de Gestión Integral - Rubio García Dental
// ===============================================

import React, { useState, useEffect } from 'react';
import AutomatizacionesService, { AutomatizacionFlow, ExecutionLog, AutomatizacionTemplate } from '../../../services/automatizaciones';
import {
    CogIcon,
    PlayIcon,
    PauseIcon,
    DocumentDuplicateIcon,
    TrashIcon,
    PlusIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    ChartBarIcon,
    CommandLineIcon
} from '@heroicons/react/24/outline';

interface AutomatizacionesEstado {
    automatizaciones: AutomatizacionFlow[];
    templates: AutomatizacionTemplate[];
    logs: ExecutionLog[];
    estadisticas: {
        total_automatizaciones: number;
        automatizaciones_activas: number;
        ejecuciones_hoy: number;
        ejecuciones_exitosas_hoy: number;
        error_rate: number;
    };
    cargando: boolean;
    error: string | null;
    seccionActiva: string;
    automatizacionSeleccionada: AutomatizacionFlow | null;
}

const AutomatizacionesPage: React.FC = () => {
    const [estado, setEstado] = useState<AutomatizacionesEstado>({
        automatizaciones: [],
        templates: [],
        logs: [],
        estadisticas: {
            total_automatizaciones: 0,
            automatizaciones_activas: 0,
            ejecuciones_hoy: 0,
            ejecuciones_exitosas_hoy: 0,
            error_rate: 0
        },
        cargando: true,
        error: null,
        seccionActiva: 'dashboard',
        automatizacionSeleccionada: null
    });

    const [automatizacionesService] = useState(new AutomatizacionesService());

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setEstado(prev => ({ ...prev, cargando: true, error: null }));

            const [automatizaciones, templates, logs, estadisticas] = await Promise.all([
                automatizacionesService.getAutomatizaciones(),
                automatizacionesService.getAutomatizacionTemplates(),
                automatizacionesService.getExecutionLogs(undefined, 20),
                automatizacionesService.getAutomatizacionesStats()
            ]);

            setEstado(prev => ({
                ...prev,
                automatizaciones,
                templates,
                logs,
                estadisticas,
                cargando: false
            }));
        } catch (error) {
            console.error('Error cargando automatizaciones:', error);
            setEstado(prev => ({
                ...prev,
                error: 'Error cargando las automatizaciones',
                cargando: false
            }));
        }
    };

    // ===============================================
    // GESTIÓN DE AUTOMATIZACIONES
    // ===============================================

    const toggleAutomatizacion = async (id: string, activo: boolean) => {
        try {
            const exito = await automatizacionesService.toggleAutomatizacion(id, activo);
            if (exito) {
                setEstado(prev => ({
                    ...prev,
                    automatizaciones: prev.automatizaciones.map(auto =>
                        auto.id === id ? { ...auto, activo } : auto
                    )
                }));
            }
        } catch (error) {
            console.error('Error toggling automatización:', error);
        }
    };

    const ejecutarAutomatizacion = async (automatizacion: AutomatizacionFlow) => {
        try {
            const log = await automatizacionesService.executeAutomatizacion(automatizacion.id, {
                trigger_manual: true,
                timestamp: new Date().toISOString()
            });
            
            console.log('Ejecución de automatización:', log);
            await cargarDatos(); // Recargar para ver logs actualizados
        } catch (error) {
            console.error('Error ejecutando automatización:', error);
        }
    };

    const crearDesdeTemplate = async (template: AutomatizacionTemplate) => {
        try {
            const parametrosEjemplo = {
                nombre_clinica: 'Clínica Dental Rubio García',
                email_contacto: 'info@rubiogarcia-dental.com'
            };

            const nuevaAutomatizacionId = await automatizacionesService.createFromTemplate(
                template.id,
                parametrosEjemplo
            );

            if (nuevaAutomatizacionId) {
                alert('Automatización creada exitosamente desde la plantilla');
                await cargarDatos();
            }
        } catch (error) {
            console.error('Error creando desde template:', error);
        }
    };

    // ===============================================
    // RENDERIZADO DE SECCIONES
    // ===============================================

    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CogIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Total</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {estado.estadisticas.total_automatizaciones}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <PlayIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Activas</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {estado.estadisticas.automatizaciones_activas}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ClockIcon className="h-8 w-8 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Hoy</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {estado.estadisticas.ejecuciones_hoy}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Exitosas</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {estado.estadisticas.ejecuciones_exitosas_hoy}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Errores</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {estado.estadisticas.error_rate}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Automatizaciones Principales */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Automatizaciones Activas
                    </h3>
                    <button
                        onClick={() => setEstado(prev => ({ ...prev, seccionActiva: 'automatizaciones' }))}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                        Ver todas
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {estado.automatizaciones.filter(a => a.activo).slice(0, 6).map((automatizacion) => (
                        <div key={automatizacion.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-medium text-gray-900">
                                        {automatizacion.nombre}
                                    </h4>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            automatizacion.tipo === 'triggers' ? 'bg-blue-100 text-blue-800' :
                                            automatizacion.tipo === 'conditional' ? 'bg-purple-100 text-purple-800' :
                                            automatizacion.tipo === 'scheduled' ? 'bg-green-100 text-green-800' :
                                            'bg-orange-100 text-orange-800'
                                        }`}>
                                            {automatizacion.tipo}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">
                                {automatizacion.descripcion}
                            </p>

                            <div className="text-xs text-gray-500 mb-4">
                                <div>Ejecuciones: {automatizacion.estadisticas.ejecuciones_totales}</div>
                                <div>Última: {automatizacion.estadisticas.ultima_ejecucion ? 
                                    new Date(automatizacion.estadisticas.ultima_ejecucion).toLocaleString() : 'Nunca'
                                }</div>
                            </div>

                            <div className="flex space-x-2">
                                <button
                                    onClick={() => ejecutarAutomatizacion(automatizacion)}
                                    className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                >
                                    Ejecutar
                                </button>
                                <button
                                    onClick={() => toggleAutomatizacion(automatizacion.id, false)}
                                    className="flex-1 px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                                >
                                    Pausar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Logs Recientes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Ejecuciones Recientes
                </h3>

                <div className="space-y-3">
                    {estado.logs.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                            <div className="flex-shrink-0">
                                {log.estado === 'exitoso' ? (
                                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                                ) : log.estado === 'fallido' ? (
                                    <XCircleIcon className="h-6 w-6 text-red-500" />
                                ) : (
                                    <ClockIcon className="h-6 w-6 text-yellow-500" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {log.detalles}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {new Date(log.fecha_ejecucion).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex-shrink-0">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    log.estado === 'exitoso' ? 'bg-green-100 text-green-800' :
                                    log.estado === 'fallido' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {log.estado}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderAutomatizaciones = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    Gestión de Automatizaciones
                </h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <PlusIcon className="h-5 w-5 mr-2 inline" />
                    Nueva Automatización
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nombre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ejecuciones
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Última Ejecución
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {estado.automatizaciones.map((automatizacion) => (
                                <tr key={automatizacion.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {automatizacion.nombre}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {automatizacion.descripcion}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            automatizacion.tipo === 'triggers' ? 'bg-blue-100 text-blue-800' :
                                            automatizacion.tipo === 'conditional' ? 'bg-purple-100 text-purple-800' :
                                            automatizacion.tipo === 'scheduled' ? 'bg-green-100 text-green-800' :
                                            'bg-orange-100 text-orange-800'
                                        }`}>
                                            {automatizacion.tipo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={automatizacion.activo}
                                                onChange={(e) => toggleAutomatizacion(automatizacion.id, e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {automatizacion.estadisticas.ejecuciones_totales}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {automatizacion.estadisticas.ultima_ejecucion ? 
                                            new Date(automatizacion.estadisticas.ultima_ejecucion).toLocaleString() : 
                                            'Nunca'
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => ejecutarAutomatizacion(automatizacion)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            <PlayIcon className="h-4 w-4" />
                                        </button>
                                        <button className="text-green-600 hover:text-green-900">
                                            <DocumentDuplicateIcon className="h-4 w-4" />
                                        </button>
                                        <button className="text-red-600 hover:text-red-900">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderTemplates = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    Plantillas de Automatización
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {estado.templates.map((template) => (
                    <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {template.nombre}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                template.categoria === 'cita' ? 'bg-blue-100 text-blue-800' :
                                template.categoria === 'paciente' ? 'bg-green-100 text-green-800' :
                                template.categoria === 'facturacion' ? 'bg-purple-100 text-purple-800' :
                                template.categoria === 'comunicacion' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {template.categoria}
                            </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">
                            {template.descripcion}
                        </p>

                        <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                                Parámetros Requeridos:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {template.parametro_configuracion.map((param, index) => (
                                    <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                                        {param}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <button
                            onClick={() => crearDesdeTemplate(template)}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Usar Plantilla
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderLogs = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    Logs de Ejecución
                </h2>
                <button
                    onClick={cargarDatos}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Actualizar
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Automatización
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Duración
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Detalles
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {estado.logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {log.automatizacion_id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(log.fecha_ejecucion).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            log.estado === 'exitoso' ? 'bg-green-100 text-green-800' :
                                            log.estado === 'fallido' ? 'bg-red-100 text-red-800' :
                                            log.estado === 'en_progreso' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {log.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {log.tiempo_ejecucion}ms
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div className="max-w-xs truncate">
                                            {log.detalles}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    // ===============================================
    // RENDERIZADO PRINCIPAL
    // ===============================================

    if (estado.cargando) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (estado.error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Error de Carga</h3>
                    <p className="mt-1 text-sm text-gray-500">{estado.error}</p>
                    <button
                        onClick={cargarDatos}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const secciones = [
        { id: 'dashboard', nombre: 'Dashboard', icono: ChartBarIcon },
        { id: 'automatizaciones', nombre: 'Automatizaciones', icono: CogIcon },
        { id: 'templates', nombre: 'Plantillas', icono: DocumentDuplicateIcon },
        { id: 'logs', nombre: 'Logs', icono: CommandLineIcon }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🤖 Automatizaciones IA
                    </h1>
                    <p className="text-gray-600">
                        Diseña y gestiona flujos de automatización inteligente
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <div className="lg:w-64">
                        <nav className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <ul className="space-y-2">
                                {secciones.map((seccion) => (
                                    <li key={seccion.id}>
                                        <button
                                            onClick={() => setEstado(prev => ({ ...prev, seccionActiva: seccion.id }))}
                                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                                                estado.seccionActiva === seccion.id
                                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <seccion.icono className="h-6 w-6" />
                                            <span className="font-medium">{seccion.nombre}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {estado.seccionActiva === 'dashboard' && renderDashboard()}
                        {estado.seccionActiva === 'automatizaciones' && renderAutomatizaciones()}
                        {estado.seccionActiva === 'templates' && renderTemplates()}
                        {estado.seccionActiva === 'logs' && renderLogs()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutomatizacionesPage;