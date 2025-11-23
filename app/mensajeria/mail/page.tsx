'use client';

// ===============================================
// MÓDULO EMAIL - INTERFAZ COMPLETA
// Sistema de Gestión Integral - Rubio García Dental
// ===============================================

import React, { useState, useEffect } from 'react';
import EmailService, { EmailConfig, EmailMessage, EmailTemplate, EmailStatistics } from '../../../services/email';
import {
    EnvelopeIcon,
    PaperAirplaneIcon,
    InboxIcon,
    DocumentTextIcon,
    CogIcon,
    ChartBarIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface EmailEstado {
    config: EmailConfig | null;
    messages: EmailMessage[];
    templates: EmailTemplate[];
    statistics: EmailStatistics;
    cargando: boolean;
    error: string | null;
    seccionActiva: string;
}

const EmailPage: React.FC = () => {
    const [estado, setEstado] = useState<EmailEstado>({
        config: null,
        messages: [],
        templates: [],
        statistics: {
            total_enviados: 0,
            total_recibidos: 0,
            enviados_hoy: 0,
            recibidos_hoy: 0,
            errores_envio: 0,
            mensajes_pendientes: 0
        },
        cargando: true,
        error: null,
        seccionActiva: 'dashboard'
    });

    const [emailService] = useState(new EmailService());

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setEstado(prev => ({ ...prev, cargando: true, error: null }));

            const [config, messages, templates, statistics] = await Promise.all([
                emailService.getEmailConfig(),
                emailService.getEmailMessages(20),
                emailService.getEmailTemplates(),
                emailService.getEmailStatistics()
            ]);

            setEstado(prev => ({
                ...prev,
                config,
                messages,
                templates,
                statistics,
                cargando: false
            }));
        } catch (error) {
            console.error('Error cargando datos de email:', error);
            setEstado(prev => ({
                ...prev,
                error: 'Error cargando la configuración de email',
                cargando: false
            }));
        }
    };

    // ===============================================
    // RENDERIZADO DE SECCIONES
    // ===============================================

    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <PaperAirplaneIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Enviados Hoy</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {estado.statistics.enviados_hoy}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <InboxIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Recibidos Hoy</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {estado.statistics.recibidos_hoy}
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
                            <h3 className="text-sm font-medium text-gray-500">Pendientes</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {estado.statistics.mensajes_pendientes}
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
                                {estado.statistics.errores_envio}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mensajes Recientes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Mensajes Recientes
                    </h3>
                    <button
                        onClick={() => setEstado(prev => ({ ...prev, seccionActiva: 'mensajes' }))}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                        Ver todos
                    </button>
                </div>

                <div className="space-y-4">
                    {estado.messages.slice(0, 5).map((message) => (
                        <div key={message.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex-shrink-0">
                                <EnvelopeIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {message.asunto}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Para: {message.email_destino.join(', ')}
                                </p>
                            </div>
                            <div className="flex-shrink-0">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    message.estado_envio === 'enviado' ? 'bg-green-100 text-green-800' :
                                    message.estado_envio === 'error' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {message.estado_envio === 'enviado' ? (
                                        <><CheckCircleIcon className="h-3 w-3 mr-1" /> Enviado</>
                                    ) : message.estado_envio === 'error' ? (
                                        <><XCircleIcon className="h-3 w-3 mr-1" /> Error</>
                                    ) : (
                                        <><ClockIcon className="h-3 w-3 mr-1" /> Pendiente</>
                                    )}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderMensajes = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Mensajes</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Nuevo Mensaje
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Asunto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Destinatarios
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {estado.messages.map((message) => (
                                <tr key={message.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {message.asunto}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {message.email_destino.join(', ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                            {message.tipo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            message.estado_envio === 'enviado' ? 'bg-green-100 text-green-800' :
                                            message.estado_envio === 'error' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {message.estado_envio}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(message.fecha_creacion).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderPlantillas = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Plantillas de Email</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Nueva Plantilla
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {estado.templates.map((template) => (
                    <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {template.nombre}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                template.tipo === 'recordatorio' ? 'bg-blue-100 text-blue-800' :
                                template.tipo === 'urgencia' ? 'bg-red-100 text-red-800' :
                                template.tipo === 'factura' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {template.tipo}
                            </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                            {template.cuerpo.substring(0, 150)}...
                        </p>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                Usada {template.usado_count} veces
                            </span>
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                Editar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderConfiguracion = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Configuración de Email</h2>

            {estado.config ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Proveedor de Email
                            </label>
                            <select
                                defaultValue={estado.config.proveedor}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="gmail">Gmail</option>
                                <option value="outlook">Outlook</option>
                                <option value="yahoo">Yahoo</option>
                                <option value="custom">Personalizado</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estado de Conexión
                            </label>
                            <div className="flex items-center">
                                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                    estado.config.estado === 'conectado' ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                                <span className="text-sm text-gray-900 capitalize">
                                    {estado.config.estado}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Remitente
                            </label>
                            <input
                                type="email"
                                defaultValue={estado.config.configuracion.usuario}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Servidor SMTP
                            </label>
                            <input
                                type="text"
                                defaultValue={estado.config.configuracion.host}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Notificaciones Automáticas</h4>
                        <div className="space-y-3">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    defaultChecked={estado.config.configuracion_notificaciones.recordatorios}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-900">Recordatorios de citas</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    defaultChecked={estado.config.configuracion_notificaciones.urgencias}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-900">Notificaciones de urgencia</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    defaultChecked={estado.config.configuracion_notificaciones.facturacion}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-900">Facturas y pagos</span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 flex space-x-3">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Probar Conexión
                        </button>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            Guardar Configuración
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3" />
                        <div>
                            <h3 className="text-lg font-medium text-yellow-800">
                                Configuración Requerida
                            </h3>
                            <p className="text-yellow-700">
                                No se ha configurado ningún proveedor de email. Configure la integración antes de continuar.
                            </p>
                        </div>
                    </div>
                </div>
            )}
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
        { id: 'mensajes', nombre: 'Mensajes', icono: EnvelopeIcon },
        { id: 'plantillas', nombre: 'Plantillas', icono: DocumentTextIcon },
        { id: 'configuracion', nombre: 'Configuración', icono: CogIcon }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        📧 Centro de Email
                    </h1>
                    <p className="text-gray-600">
                        Gestiona la comunicación por email y automatizaciones
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
                        {estado.seccionActiva === 'mensajes' && renderMensajes()}
                        {estado.seccionActiva === 'plantillas' && renderPlantillas()}
                        {estado.seccionActiva === 'configuracion' && renderConfiguracion()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailPage;