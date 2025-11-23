'use client';

// ===============================================
// MÓDULO DE CONFIGURACIÓN - INTERFAZ COMPLETA
// Sistema de Gestión Integral - Rubio García Dental
// ===============================================

import React, { useState, useEffect } from 'react';
import ConfiguracionService, {
    ClinicaConfig,
    ServicioConfig,
    UsuarioSistema,
    AutomatizacionConfig,
    VerifactuConfig,
    EstadoConfiguracion,
    RolPermisos
} from '../../../services/configuracion';

interface ConfiguracionEstado {
    clinica: ClinicaConfig | null;
    servicios: ServicioConfig[];
    usuarios: UsuarioSistema[];
    automatizaciones: AutomatizacionConfig[];
    verifactu: VerifactuConfig | null;
    estado_sistema: EstadoConfiguracion[];
    roles: RolPermisos[];
    cargando: boolean;
    error: string | null;
}

const ConfiguracionPage: React.FC = () => {
    const [estado, setEstado] = useState<ConfiguracionEstado>({
        clinica: null,
        servicios: [],
        usuarios: [],
        automatizaciones: [],
        verifactu: null,
        estado_sistema: [],
        roles: [],
        cargando: true,
        error: null
    });

    const [seccionActiva, setSeccionActiva] = useState<string>('general');
    const [configuracionService] = useState(new ConfiguracionService());

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setEstado(prev => ({ ...prev, cargando: true, error: null }));

            const [
                estadoGeneral,
                verifactuConfig,
                rolesPermisos
            ] = await Promise.all([
                configuracionService.getEstadoGeneral(),
                configuracionService.getConfiguracionVerifactu(),
                configuracionService.getRolesPermisos()
            ]);

            setEstado(prev => ({
                ...prev,
                ...estadoGeneral,
                verifactu: verifactuConfig,
                roles: rolesPermisos,
                cargando: false
            }));
        } catch (error) {
            console.error('Error cargando configuración:', error);
            setEstado(prev => ({
                ...prev,
                error: 'Error cargando la configuración del sistema',
                cargando: false
            }));
        }
    };

    // ===============================================
    // RENDERIZADO DE SECCIONES
    // ===============================================

    const renderSeccionGeneral = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Configuración General de la Clínica
                </h3>
                
                {estado.clinica && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre de la Clínica
                            </label>
                            <input
                                type="text"
                                defaultValue={estado.clinica.nombre_clinica}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                CIF/NIF
                            </label>
                            <input
                                type="text"
                                defaultValue={estado.clinica.cif_nif}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Teléfono
                            </label>
                            <input
                                type="text"
                                defaultValue={estado.clinica.telefono}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                defaultValue={estado.clinica.email}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Dirección
                            </label>
                            <textarea
                                defaultValue={estado.clinica.direccion}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Horario de Apertura
                            </label>
                            <input
                                type="time"
                                defaultValue={estado.clinica.horario_apertura}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Horario de Cierre
                            </label>
                            <input
                                type="time"
                                defaultValue={estado.clinica.horario_cierre}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Zona Horaria
                            </label>
                            <select
                                defaultValue={estado.clinica.zona_horaria}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="Europe/Madrid">Europa/Madrid (UTC+1)</option>
                                <option value="Europe/London">Europa/Londres (UTC+0)</option>
                                <option value="America/New_York">América/Nueva_York (UTC-5)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Moneda
                            </label>
                            <select
                                defaultValue={estado.clinica.moneda_defecto}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="EUR">EUR - Euro</option>
                                <option value="USD">USD - Dólar</option>
                                <option value="GBP">GBP - Libra</option>
                            </select>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={cargarDatos}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );

    const renderSeccionServicios = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Configuración de Servicios
                    </h3>
                    <button
                        onClick={cargarDatos}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                        Actualizar Estado
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {estado.servicios.map((servicio) => (
                        <div
                            key={servicio.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-medium text-gray-900">
                                        {servicio.servicio}
                                        {servicio.sub_servicio && (
                                            <span className="text-sm text-gray-500">
                                                {' '}({servicio.sub_servicio})
                                            </span>
                                        )}
                                    </h4>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span
                                            className={`inline-block w-2 h-2 rounded-full ${
                                                servicio.estado === 'activo'
                                                    ? 'bg-green-500'
                                                    : servicio.estado === 'error'
                                                    ? 'bg-red-500'
                                                    : servicio.estado === 'configurando'
                                                    ? 'bg-yellow-500'
                                                    : 'bg-gray-400'
                                            }`}
                                        />
                                        <span className="text-sm text-gray-600 capitalize">
                                            {servicio.estado}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                {servicio.ultima_conexion && (
                                    <div className="text-gray-600">
                                        Última conexión: {new Date(servicio.ultima_conexion).toLocaleString()}
                                    </div>
                                )}
                                
                                {servicio.notas && (
                                    <div className="text-gray-600">
                                        {servicio.notas}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex space-x-2">
                                <button
                                    onClick={() => configurarServicio(servicio)}
                                    className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                >
                                    Configurar
                                </button>
                                <button
                                    onClick={() => verificarServicio(servicio)}
                                    className="flex-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                >
                                    Verificar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderSeccionUsuarios = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Gestión de Usuarios
                    </h3>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Nuevo Usuario
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usuario
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rol
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Departamento
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Último Acceso
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {estado.usuarios.map((usuario) => (
                                <tr key={usuario.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {usuario.nombre.charAt(0)}
                                                        {usuario.apellidos?.charAt(0)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {usuario.nombre} {usuario.apellidos}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {usuario.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                            {usuario.rol}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {usuario.departamento || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {usuario.ultimo_acceso
                                            ? new Date(usuario.ultimo_acceso).toLocaleString()
                                            : 'Nunca'
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            usuario.activo
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {usuario.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button className="text-blue-600 hover:text-blue-900">
                                            Editar
                                        </button>
                                        <button className="text-red-600 hover:text-red-900">
                                            {usuario.activo ? 'Desactivar' : 'Activar'}
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

    const renderSeccionAutomatizaciones = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Configuración de Automatizaciones
                    </h3>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Nueva Automatización
                    </button>
                </div>

                <div className="space-y-4">
                    {estado.automatizaciones.map((automatizacion) => (
                        <div
                            key={automatiz.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                        <h4 className="text-lg font-medium text-gray-900">
                                            {automatizacion.nombre}
                                        </h4>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                                            {automatizacion.tipo}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {automatizacion.modulo_origen}
                                        </span>
                                    </div>
                                    
                                    <div className="mt-2 text-sm text-gray-600">
                                        <strong>Configuración:</strong> {JSON.stringify(automatizacion.configuracion)}
                                    </div>
                                    
                                    <div className="mt-1 text-sm text-gray-600">
                                        <strong>Acciones:</strong> {JSON.stringify(automatizacion.acciones)}
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            automatizacion.activo
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {automatizacion.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                    
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={automatizacion.activo}
                                            onChange={() => toggleAutomatizacion(automatizacion.id, !automatizacion.activo)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderSeccionVerifactu = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Configuración Verifactu/AEAT
                </h3>
                
                {estado.verifactu && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Serie de Facturas
                            </label>
                            <input
                                type="text"
                                defaultValue={estado.verifactu.serie_facturas}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Prefijo Facturas
                            </label>
                            <input
                                type="text"
                                defaultValue={estado.verifactu.prefijo_facturas}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Número Actual
                            </label>
                            <input
                                type="number"
                                defaultValue={estado.verifactu.numero_actual}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Entorno
                            </label>
                            <select
                                defaultValue={estado.verifactu.entorno}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="pruebas">Pruebas</option>
                                <option value="produccion">Producción</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Envío Automático
                            </label>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    defaultChecked={estado.verifactu.envio_automatico}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                    Enviar facturas automáticamente a AEAT
                                </span>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Última Transmisión
                            </label>
                            <div className="text-sm text-gray-600">
                                {estado.verifactu.ultima_transmision
                                    ? new Date(estado.verifactu.ultima_transmision).toLocaleString()
                                    : 'No realizada'
                                }
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Probar Conexión AEAT
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        Guardar Configuración
                    </button>
                </div>
            </div>
        </div>
    );

    const renderSeccionEstado = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Estado General del Sistema
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {estado.estado_sistema.map((item, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900 capitalize">
                                        {item.tipo}
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {item.descripcion}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Actualizado: {new Date(item.fecha_actualizacion).toLocaleString()}
                                    </p>
                                </div>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        item.estado === 'activo' || item.estado === 'conectado'
                                            ? 'bg-green-100 text-green-800'
                                            : item.estado === 'error'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                >
                                    {item.estado}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Información del Sistema</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                        <div>Versión: 1.0.0</div>
                        <div>Base de datos: Supabase PostgreSQL</div>
                        <div>Última verificación: {new Date().toLocaleString()}</div>
                        <div>Estado general: {estado.error ? 'Con errores' : 'Operativo'}</div>
                    </div>
                </div>
            </div>
        </div>
    );

    // ===============================================
    // FUNCIONES DE UTILIDAD
    // ===============================================

    const configurarServicio = async (servicio: ServicioConfig) => {
        console.log('Configurando servicio:', servicio.servicio);
        // Implementar modal de configuración
    };

    const verificarServicio = async (servicio: ServicioConfig) => {
        try {
            const esValido = await configuracionService.verificarConectividadServicio(
                servicio.servicio,
                servicio.sub_servicio || undefined
            );
            
            if (esValido) {
                alert(`✅ Conexión exitosa con ${servicio.servicio}`);
            } else {
                alert(`❌ Error de conexión con ${servicio.servicio}`);
            }
            
            // Recargar estado
            cargarDatos();
        } catch (error) {
            console.error('Error verificando servicio:', error);
            alert('Error verificando el servicio');
        }
    };

    const toggleAutomatizacion = async (id: number, activo: boolean) => {
        try {
            const exito = await configuracionService.toggleAutomatizacion(id, activo);
            if (exito) {
                setEstado(prev => ({
                    ...prev,
                    automatizaciones: prev.automatizaciones.map(auto =>
                        auto.id === id ? { ...auto, activo } : auto
                    )
                }));
            }
        } catch (error) {
            console.error('Error toggling automatizacion:', error);
        }
    };

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
                    <div className="text-red-500 text-xl mb-4">❌ Error</div>
                    <p className="text-gray-600">{estado.error}</p>
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
        { id: 'general', nombre: 'General', icono: '🏥' },
        { id: 'servicios', nombre: 'Servicios', icono: '⚙️' },
        { id: 'usuarios', nombre: 'Usuarios', icono: '👥' },
        { id: 'automatizaciones', nombre: 'Automatizaciones', icono: '🤖' },
        { id: 'verifactu', nombre: 'Verifactu/AEAT', icono: '🧾' },
        { id: 'estado', nombre: 'Estado Sistema', icono: '📊' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Configuración del Sistema
                    </h1>
                    <p className="text-gray-600">
                        Administra la configuración global del sistema de gestión dental
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
                                            onClick={() => setSeccionActiva(seccion.id)}
                                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                                                seccionActiva === seccion.id
                                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span className="text-lg">{seccion.icono}</span>
                                            <span className="font-medium">{seccion.nombre}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {seccionActiva === 'general' && renderSeccionGeneral()}
                        {seccionActiva === 'servicios' && renderSeccionServicios()}
                        {seccionActiva === 'usuarios' && renderSeccionUsuarios()}
                        {seccionActiva === 'automatizaciones' && renderSeccionAutomatizaciones()}
                        {seccionActiva === 'verifactu' && renderSeccionVerifactu()}
                        {seccionActiva === 'estado' && renderSeccionEstado()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfiguracionPage;