'use client';

// ===============================================
// MÓDULO CONTROL POR VOZ - INTERFAZ COMPLETA
// Sistema de Gestión Integral - Rubio García Dental
// ===============================================

import React, { useState, useEffect } from 'react';
import VoiceControlService, { VoiceCommand, VoiceSession, VoiceStatistics, VoiceTraining } from '../../../services/control-voz';
import {
    MicrophoneIcon,
    SpeakerWaveIcon,
    PlayIcon,
    PauseIcon,
    StopIcon,
    CogIcon,
    ChartBarIcon,
    UserGroupIcon,
    AcademicCapIcon,
    CommandLineIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    LightBulbIcon
} from '@heroicons/react/24/outline';

interface VoiceEstado {
    commands: VoiceCommand[];
    sessions: VoiceSession[];
    statistics: VoiceStatistics;
    training: VoiceTraining[];
    cargando: boolean;
    error: string | null;
    seccionActiva: string;
    isListening: boolean;
    isProcessing: boolean;
    currentSession: VoiceSession | null;
    lastTranscript: string;
    lastResponse: string;
}

const ControlVozPage: React.FC = () => {
    const [estado, setEstado] = useState<VoiceEstado>({
        commands: [],
        sessions: [],
        statistics: {
            comandos_totales: 0,
            comandos_activos: 0,
            comandos_mas_usados: [],
            sesiones_hoy: 0,
            precision_promedio: 0,
            comandos_por_categoria: {}
        },
        training: [],
        cargando: true,
        error: null,
        seccionActiva: 'dashboard',
        isListening: false,
        isProcessing: false,
        currentSession: null,
        lastTranscript: '',
        lastResponse: ''
    });

    const [voiceService] = useState(new VoiceControlService());

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setEstado(prev => ({ ...prev, cargando: true, error: null }));

            const [commands, statistics, training] = await Promise.all([
                voiceService.getVoiceCommands(),
                voiceService.getVoiceStatistics(),
                voiceService.getVoiceTraining()
            ]);

            setEstado(prev => ({
                ...prev,
                commands,
                statistics,
                training,
                cargando: false
            }));
        } catch (error) {
            console.error('Error cargando datos de control de voz:', error);
            setEstado(prev => ({
                ...prev,
                error: 'Error cargando el control por voz',
                cargando: false
            }));
        }
    };

    // ===============================================
    // CONTROL DE VOZ
    // ===============================================

    const iniciarEscucha = async () => {
        try {
            // Iniciar sesión de voz
            const sessionId = await voiceService.startVoiceSession('current_user');
            setEstado(prev => ({
                ...prev,
                isListening: true,
                currentSession: {
                    id: sessionId,
                    usuario_id: 'current_user',
                    fecha_inicio: new Date().toISOString(),
                    comandos_ejecutados: 0,
                    exitosos: 0,
                    fallidos: 0,
                    estado: 'activa'
                }
            }));

            // Simular detección de voz
            console.log('🎤 Iniciando reconocimiento de voz...');
        } catch (error) {
            console.error('Error iniciando escucha:', error);
            alert('Error al iniciar el reconocimiento de voz');
        }
    };

    const detenerEscucha = async () => {
        try {
            if (estado.currentSession) {
                await voiceService.endVoiceSession(estado.currentSession.id);
            }
            
            setEstado(prev => ({
                ...prev,
                isListening: false,
                currentSession: null,
                lastTranscript: '',
                lastResponse: ''
            }));
            
            console.log('⏹️ Reconocimiento de voz detenido');
        } catch (error) {
            console.error('Error deteniendo escucha:', error);
        }
    };

    const procesarEntradaVoz = async (transcript: string) => {
        try {
            setEstado(prev => ({ ...prev, isProcessing: true, lastTranscript: transcript }));

            const response = await voiceService.processVoiceInput(transcript, estado.currentSession?.id);

            setEstado(prev => ({
                ...prev,
                isProcessing: false,
                lastResponse: response.mensaje
            }));

            // Reproducir respuesta
            await reproducirRespuesta(response.mensaje);

            console.log('🎤 Transcripción:', transcript);
            console.log('🤖 Respuesta IA:', response.mensaje);

        } catch (error) {
            console.error('Error procesando entrada de voz:', error);
            setEstado(prev => ({
                ...prev,
                isProcessing: false,
                lastResponse: 'Error procesando comando de voz'
            }));
        }
    };

    const reproducirRespuesta = async (texto: string) => {
        try {
            // Simular síntesis de voz
            console.log('🔊 Reproduciendo:', texto);
            // En una implementación real, usaríamos Web Speech API
        } catch (error) {
            console.error('Error reproduciendo respuesta:', error);
        }
    };

    const simularComandoVoz = () => {
        const comandosSimulados = [
            'agenda cita nuevo paciente juan',
            'mostrar pacientes de hoy',
            'crear factura para maria garcia',
            'ir a dashboard',
            'cuántas citas tengo hoy',
            'buscar paciente ana lopez'
        ];

        const comandoAleatorio = comandosSimulados[Math.floor(Math.random() * comandosSimulados.length)];
        procesarEntradaVoz(comandoAleatorio);
    };

    // ===============================================
    // GESTIÓN DE COMANDOS
    // ===============================================

    const crearComando = async () => {
        const nuevoComando = {
            comando: 'nuevo comando de voz',
            categoria: 'general' as const,
            descripcion: 'Descripción del comando',
            accion: 'accion_ejemplo',
            parametros: ['parametro1', 'parametro2'],
            ejemplo: 'Di: "nuevo comando de voz"',
            activo: true
        };

        try {
            const commandId = await voiceService.createVoiceCommand(nuevoComando);
            if (commandId) {
                alert('Comando de voz creado exitosamente');
                await cargarDatos();
            }
        } catch (error) {
            console.error('Error creando comando:', error);
        }
    };

    const toggleComando = async (id: string, activo: boolean) => {
        try {
            const exito = await voiceService.updateVoiceCommand(id, { activo });
            if (exito) {
                setEstado(prev => ({
                    ...prev,
                    commands: prev.commands.map(cmd =>
                        cmd.id === id ? { ...cmd, activo } : cmd
                    )
                }));
            }
        } catch (error) {
            console.error('Error toggling comando:', error);
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
                            <CommandLineIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Comandos</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {estado.statistics.comandos_activos}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <MicrophoneIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Sesiones Hoy</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {estado.statistics.sesiones_hoy}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <AcademicCapIcon className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Precisión</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {estado.statistics.precision_promedio}%
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <SpeakerWaveIcon className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Entrenamientos</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {estado.training.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <ChartBarIcon className="h-8 w-8 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Categorías</h3>
                            <p className="text-2xl font-semibold text-gray-900">
                                {Object.keys(estado.statistics.comandos_por_categoria).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Control de Voz en Tiempo Real */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Control de Voz en Tiempo Real
                </h3>

                <div className="flex items-center justify-center space-x-6 mb-6">
                    {!estado.isListening ? (
                        <button
                            onClick={iniciarEscucha}
                            className="flex items-center space-x-3 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <MicrophoneIcon className="h-6 w-6" />
                            <span>Iniciar Escucha</span>
                        </button>
                    ) : (
                        <button
                            onClick={detenerEscucha}
                            className="flex items-center space-x-3 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <StopIcon className="h-6 w-6" />
                            <span>Detener Escucha</span>
                        </button>
                    )}

                    <button
                        onClick={simularComandoVoz}
                        className="flex items-center space-x-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <PlayIcon className="h-6 w-6" />
                        <span>Simular Comando</span>
                    </button>
                </div>

                {/* Estado Visual */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="text-center">
                        {estado.isListening ? (
                            <div>
                                <div className="flex justify-center mb-4">
                                    <div className="relative">
                                        <div className="animate-pulse h-16 w-16 bg-green-500 rounded-full flex items-center justify-center">
                                            <MicrophoneIcon className="h-8 w-8 text-white" />
                                        </div>
                                        <div className="absolute -top-2 -right-2">
                                            <div className="animate-ping h-4 w-4 bg-red-500 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-green-600 font-medium">🎤 Escuchando...</p>
                            </div>
                        ) : estado.isProcessing ? (
                            <div>
                                <div className="flex justify-center mb-4">
                                    <div className="animate-spin h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center">
                                        <CommandLineIcon className="h-8 w-8 text-white" />
                                    </div>
                                </div>
                                <p className="text-blue-600 font-medium">🧠 Procesando...</p>
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-center mb-4">
                                    <div className="h-16 w-16 bg-gray-300 rounded-full flex items-center justify-center">
                                        <MicrophoneIcon className="h-8 w-8 text-gray-500" />
                                    </div>
                                </div>
                                <p className="text-gray-500 font-medium">⏸️ En espera</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Última Transcripción y Respuesta */}
                {(estado.lastTranscript || estado.lastResponse) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-blue-800 mb-2">
                                🎤 Última Transcripción:
                            </h4>
                            <p className="text-blue-700">{estado.lastTranscript || 'No hay transcripción'}</p>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-green-800 mb-2">
                                🤖 Respuesta IA:
                            </h4>
                            <p className="text-green-700">{estado.lastResponse || 'No hay respuesta'}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Comandos Más Usados */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Comandos Más Utilizados
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {estado.statistics.comandos_mas_usados.slice(0, 6).map((command) => (
                        <div key={command.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">
                                    {command.comando}
                                </h4>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    command.categoria === 'agenda' ? 'bg-blue-100 text-blue-800' :
                                    command.categoria === 'pacientes' ? 'bg-green-100 text-green-800' :
                                    command.categoria === 'facturacion' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {command.categoria}
                                </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">
                                {command.descripcion}
                            </p>

                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Usado {command.veces_usado} veces</span>
                                {command.activo ? (
                                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                ) : (
                                    <XCircleIcon className="h-4 w-4 text-red-500" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderComandos = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    Gestión de Comandos de Voz
                </h2>
                <button
                    onClick={crearComando}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Nuevo Comando
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Comando
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Categoría
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usos
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ejemplo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {estado.commands.map((command) => (
                                <tr key={command.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {command.comando}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {command.descripcion}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            command.categoria === 'agenda' ? 'bg-blue-100 text-blue-800' :
                                            command.categoria === 'pacientes' ? 'bg-green-100 text-green-800' :
                                            command.categoria === 'facturacion' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {command.categoria}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {command.veces_usado}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={command.activo}
                                                onChange={(e) => toggleComando(command.id, e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {command.ejemplo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button className="text-blue-600 hover:text-blue-900">
                                            Editar
                                        </button>
                                        <button className="text-green-600 hover:text-green-900">
                                            Probar
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

    const renderEntrenamiento = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    Entrenamiento de Voz
                </h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Agregar Entrenamiento
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-2 mb-6">
                    <LightBulbIcon className="h-6 w-6 text-yellow-500" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Mejora la Precisión del Reconocimiento
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {estado.training.map((training, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">
                                    {training.palabra_frase}
                                </h4>
                                <span className="text-sm text-gray-500">
                                    {training.categoria}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-gray-500">Pronunciación:</span>
                                    <span className="ml-2 text-gray-900">{training.pronunciacion}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Precisión:</span>
                                    <span className="ml-2 text-gray-900">{training.precision_reconocimiento}%</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Entrenamientos:</span>
                                    <span className="ml-2 text-gray-900">{training.veces_entrenado}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex space-x-2">
                                <button className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                                    Entrenar
                                </button>
                                <button className="flex-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                                    Editar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Consejos para Mejorar el Reconocimiento */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-yellow-800 mb-4">
                    💡 Consejos para Mejor Reconocimiento de Voz
                </h3>
                <ul className="space-y-2 text-yellow-700">
                    <li>• Habla claramente y a un volumen moderado</li>
                    <li>• Usa comandos simples y directos</li>
                    <li>• Evita ruidos de fondo durante el uso</li>
                    <li>• Entrena al sistema con tu voz personal</li>
                    <li>• Usa palabras clave específicas del sistema</li>
                </ul>
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
        { id: 'comandos', nombre: 'Comandos', icono: CommandLineIcon },
        { id: 'entrenamiento', nombre: 'Entrenamiento', icono: AcademicCapIcon }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🎤 Control por Voz IA
                    </h1>
                    <p className="text-gray-600">
                        Controla el sistema mediante comandos de voz inteligente
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
                        {estado.seccionActiva === 'comandos' && renderComandos()}
                        {estado.seccionActiva === 'entrenamiento' && renderEntrenamiento()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ControlVozPage;