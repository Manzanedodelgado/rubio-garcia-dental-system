'use client';

// ===============================================
// MÓDULO DOCUMENTOS Y PLANTILLAS - INTERFAZ COMPLETA
// Sistema de Gestión Integral - Rubio García Dental
// ===============================================

import React, { useState, useEffect } from 'react';
import DocumentosPlantillasService, { DocumentTemplate, GeneratedDocument, DocumentStatistics } from '../../../services/documentos-plantillas';
import {
    DocumentTextIcon,
    PlusIcon,
    PencilIcon,
    DocumentDuplicateIcon,
    TrashIcon,
    EyeIcon,
    DownloadIcon,
    DocumentSignatureIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DocumentosEstado {
    templates: DocumentTemplate[];
    documents: GeneratedDocument[];
    statistics: DocumentStatistics;
    cargando: boolean;
    error: string | null;
    seccionActiva: string;
    templateSeleccionado: DocumentTemplate | null;
    documentSeleccionado: GeneratedDocument | null;
    mostrarEditor: boolean;
}

const DocumentosPlantillasPage: React.FC = () => {
    const [estado, setEstado] = useState<DocumentosEstado>({
        templates: [],
        documents: [],
        statistics: {
            total_plantillas: 0,
            plantillas_por_tipo: {},
            documentos_generados_hoy: 0,
            documentos_firmados: 0,
            plantillas_mas_usadas: []
        },
        cargando: true,
        error: null,
        seccionActiva: 'dashboard',
        templateSeleccionado: null,
        documentSeleccionado: null,
        mostrarEditor: false
    });

    const [documentosService] = useState(new DocumentosPlantillasService());

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setEstado(prev => ({ ...prev, cargando: true, error: null }));

            const [templates, documents, statistics] = await Promise.all([
                documentosService.getDocumentTemplates(),
                documentosService.getGeneratedDocuments({ limit: 20 }),
                documentosService.getDocumentStatistics()
            ]);

            setEstado(prev => ({
                ...prev,
                templates,
                documents,
                statistics,
                cargando: false
            }));
        } catch (error) {
            console.error('Error cargando datos de documentos:', error);
            setEstado(prev => ({
                ...prev,
                error: 'Error cargando los documentos y plantillas',
                cargando: false
            }));
        }
    };

    // ===============================================
    // GESTIÓN DE PLANTILLAS
    // ===============================================

    const crearTemplate = async () => {
        // Simular creación de nueva plantilla
        const nuevoTemplate = {
            nombre: 'Nueva Plantilla',
            tipo: 'consentimiento' as const,
            categoria: 'medico' as const,
            contenido: '<h1>{{titulo}}</h1><p>{{contenido}}</p>',
            variables: [
                { nombre: 'titulo', tipo: 'texto' as const, requerido: true, descripcion: 'Título del documento' },
                { nombre: 'contenido', tipo: 'texto' as const, requerido: true, descripcion: 'Contenido principal' }
            ],
            formato: 'html' as const,
            activo: true,
            autor: 'Usuario',
            version: '1.0',
            tags: ['nueva']
        };

        try {
            const templateId = await documentosService.createDocumentTemplate(nuevoTemplate);
            if (templateId) {
                alert('Plantilla creada exitosamente');
                await cargarDatos();
            }
        } catch (error) {
            console.error('Error creando plantilla:', error);
        }
    };

    const duplicarTemplate = async (template: DocumentTemplate) => {
        try {
            const nuevoNombre = `${template.nombre} - Copia`;
            const templateId = await documentosService.duplicateTemplate(template.id, nuevoNombre);
            
            if (templateId) {
                alert('Plantilla duplicada exitosamente');
                await cargarDatos();
            }
        } catch (error) {
            console.error('Error duplicando plantilla:', error);
        }
    };

    const eliminarTemplate = async (templateId: string) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
            try {
                const exito = await documentosService.deleteDocumentTemplate(templateId);
                if (exito) {
                    await cargarDatos();
                }
            } catch (error) {
                console.error('Error eliminando plantilla:', error);
            }
        }
    };

    // ===============================================
    // GENERACIÓN DE DOCUMENTOS
    // ===============================================

    const generarDocumento = async (template: DocumentTemplate) => {
        // Ejemplo de variables para generar documento
        const variablesEjemplo = {
            nombre_paciente: 'Juan Pérez',
            fecha_actual: new Date().toLocaleDateString('es-ES'),
            dni_paciente: '12345678A',
            descripcion_tratamiento: 'Limpieza dental general',
            riesgos_beneficios: 'El tratamiento es seguro y beneficios para la salud oral',
            alternativas_tratamiento: 'Opciones de tratamiento alternativas disponibles'
        };

        try {
            const documentId = await documentosService.generateDocument(
                template.id,
                variablesEjemplo,
                {
                    paciente_id: '123',
                    usuario_generador: 'current_user'
                }
            );

            if (documentId) {
                alert('Documento generado exitosamente');
                await cargarDatos();
            }
        } catch (error) {
            console.error('Error generando documento:', error);
        }
    };

    const firmarDocumento = async (document: GeneratedDocument) => {
        try {
            const signatureId = await documentosService.signDocument(document.id, {
                firmante: 'Dr. Mario Rubio',
                tipo_firma: 'digital',
                ip_origen: '192.168.1.100'
            });

            if (signatureId) {
                alert('Documento firmado exitosamente');
                await cargarDatos();
            }
        } catch (error) {
            console.error('Error firmando documento:', error);
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
                            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Plantillas</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {estado.statistics.total_plantillas}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <DocumentSignatureIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Generados Hoy</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {estado.statistics.documentos_generados_hoy}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Firmados</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {estado.statistics.documentos_firmados}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ChartBarIcon className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Tipos</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {Object.keys(estado.statistics.plantillas_por_tipo).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plantillas Más Usadas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Plantillas Más Utilizadas
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {estado.statistics.plantillas_mas_usadas.map((template) => (
                        <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">
                                    {template.nombre}
                                </h4>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    template.tipo === 'consentimiento' ? 'bg-blue-100 text-blue-800' :
                                    template.tipo === 'presupuesto_tratamiento' ? 'bg-green-100 text-green-800' :
                                    template.tipo === 'factura' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {template.tipo.replace('_', ' ')}
                                </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">
                                Usada {template.usado_count} veces
                            </p>

                            <div className="flex space-x-2">
                                <button
                                    onClick={() => generarDocumento(template)}
                                    className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                >
                                    Generar
                                </button>
                                <button
                                    onClick={() => duplicarTemplate(template)}
                                    className="flex-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                >
                                    Duplicar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Documentos Recientes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Documentos Recientes
                </h3>

                <div className="space-y-4">
                    {estado.documents.slice(0, 5).map((document) => (
                        <div key={document.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex-shrink-0">
                                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {document.nombre_documento}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Generado: {new Date(document.fecha_creacion).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex-shrink-0 flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    document.estado_generacion === 'completado' ? 'bg-green-100 text-green-800' :
                                    document.estado_generacion === 'generando' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {document.estado_generacion}
                                </span>
                                {document.firma_digital?.firmado && (
                                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderPlantillas = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    Gestión de Plantillas
                </h2>
                <button
                    onClick={crearTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="h-5 w-5 mr-2 inline" />
                    Nueva Plantilla
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
                                    Categoría
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usos
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Última Modificación
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {estado.templates.map((template) => (
                                <tr key={template.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {template.nombre}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {template.version} - {template.autor}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            template.tipo === 'consentimiento' ? 'bg-blue-100 text-blue-800' :
                                            template.tipo === 'presupuesto_tratamiento' ? 'bg-green-100 text-green-800' :
                                            template.tipo === 'factura' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {template.tipo.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                        {template.categoria}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {template.usado_count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(template.ultima_modificacion).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => generarDocumento(template)}
                                            className="text-green-600 hover:text-green-900"
                                            title="Generar documento"
                                        >
                                            <DocumentTextIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => duplicarTemplate(template)}
                                            className="text-blue-600 hover:text-blue-900"
                                            title="Duplicar"
                                        >
                                            <DocumentDuplicateIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setEstado(prev => ({ ...prev, templateSeleccionado: template, mostrarEditor: true }))}
                                            className="text-yellow-600 hover:text-yellow-900"
                                            title="Editar"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => eliminarTemplate(template.id)}
                                            className="text-red-600 hover:text-red-900"
                                            title="Eliminar"
                                        >
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

    const renderDocumentos = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    Documentos Generados
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
                                    Documento
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Paciente
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {estado.documents.map((document) => (
                                <tr key={document.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {document.nombre_documento}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {document.formato_salida.toUpperCase()}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        Plantilla ID: {document.plantilla_id.substring(0, 8)}...
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                document.estado_generacion === 'completado' ? 'bg-green-100 text-green-800' :
                                                document.estado_generacion === 'generando' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {document.estado_generacion}
                                            </span>
                                            {document.firma_digital?.firmado && (
                                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {document.metadata.paciente_id || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(document.fecha_creacion).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button className="text-blue-600 hover:text-blue-900" title="Ver">
                                            <EyeIcon className="h-4 w-4" />
                                        </button>
                                        <button className="text-green-600 hover:text-green-900" title="Descargar">
                                            <DownloadIcon className="h-4 w-4" />
                                        </button>
                                        {!document.firma_digital?.firmado && (
                                            <button
                                                onClick={() => firmarDocumento(document)}
                                                className="text-purple-600 hover:text-purple-900"
                                                title="Firmar"
                                            >
                                                <DocumentSignatureIcon className="h-4 w-4" />
                                            </button>
                                        )}
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
                    <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
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
        { id: 'plantillas', nombre: 'Plantillas', icono: DocumentTextIcon },
        { id: 'documentos', nombre: 'Documentos', icono: DocumentSignatureIcon }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        📄 Documentos y Plantillas
                    </h1>
                    <p className="text-gray-600">
                        Crea, gestiona y personaliza documentos automáticos con IA
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
                        {estado.seccionActiva === 'plantillas' && renderPlantillas()}
                        {estado.seccionActiva === 'documentos' && renderDocumentos()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentosPlantillasPage;