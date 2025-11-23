'use client';

// ===============================================
// MÓDULO USUARIOS - INTERFAZ COMPLETA
// Sistema de Gestión Integral - Rubio García Dental
// ===============================================

import React, { useState, useEffect } from 'react';
import ConfiguracionService, { UsuarioSistema, RolPermisos } from '../../../services/configuracion';
import {
    UserGroupIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ShieldCheckIcon,
    UserIcon,
    EyeIcon,
    EyeSlashIcon,
    KeyIcon,
    CalendarIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface UsuariosEstado {
    usuarios: UsuarioSistema[];
    roles: RolPermisos[];
    cargando: boolean;
    error: string | null;
    seccionActiva: string;
    usuarioSeleccionado: UsuarioSistema | null;
    mostrarModal: boolean;
    mostrarPassword: boolean;
    filtros: {
        rol: string;
        estado: string;
        busqueda: string;
    };
}

const UsuariosPage: React.FC = () => {
    const [estado, setEstado] = useState<UsuariosEstado>({
        usuarios: [],
        roles: [],
        cargando: true,
        error: null,
        seccionActiva: 'usuarios',
        usuarioSeleccionado: null,
        mostrarModal: false,
        mostrarPassword: false,
        filtros: {
            rol: '',
            estado: '',
            busqueda: ''
        }
    });

    const [configuracionService] = useState(new ConfiguracionService());

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setEstado(prev => ({ ...prev, cargando: true, error: null }));

            const [usuarios, roles] = await Promise.all([
                configuracionService.getUsuariosActivos(),
                configuracionService.getRolesPermisos()
            ]);

            setEstado(prev => ({
                ...prev,
                usuarios,
                roles,
                cargando: false
            }));
        } catch (error) {
            console.error('Error cargando datos de usuarios:', error);
            setEstado(prev => ({
                ...prev,
                error: 'Error cargando los usuarios',
                cargando: false
            }));
        }
    };

    // ===============================================
    // GESTIÓN DE USUARIOS
    // ===============================================

    const crearUsuario = async () => {
        const nuevoUsuario = {
            email: 'nuevo@rubiogarcia-dental.com',
            nombre: 'Nuevo',
            apellidos: 'Usuario',
            rol: 'medico' as const,
            departamento: 'Clínica',
            telefono: '+34 123 456 789',
            especialidad: 'Odontología General',
            configuracion_personal: {},
            permisos: {},
            activo: true
        };

        try {
            const exito = await configuracionService.createUsuario(nuevoUsuario);
            if (exito) {
                alert('Usuario creado exitosamente');
                await cargarDatos();
            }
        } catch (error) {
            console.error('Error creando usuario:', error);
        }
    };

    const toggleUsuario = async (id: number, activo: boolean) => {
        try {
            const exito = await configuracionService.updateUsuario(id, { activo });
            if (exito) {
                setEstado(prev => ({
                    ...prev,
                    usuarios: prev.usuarios.map(usuario =>
                        usuario.id === id ? { ...usuario, activo } : usuario
                    )
                }));
            }
        } catch (error) {
            console.error('Error toggling usuario:', error);
        }
    };

    const eliminarUsuario = async (id: number) => {
        if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            try {
                const exito = await configuracionService.deleteUsuario(id);
                if (exito) {
                    await cargarDatos();
                }
            } catch (error) {
                console.error('Error eliminando usuario:', error);
            }
        }
    };

    // ===============================================
    // FILTROS Y BÚSQUEDA
    // ===============================================

    const usuariosFiltrados = estado.usuarios.filter(usuario => {
        const cumpleRol = !estado.filtros.rol || usuario.rol === estado.filtros.rol;
        const cumpleEstado = !estado.filtros.estado || 
            (estado.filtros.estado === 'activo' && usuario.activo) ||
            (estado.filtros.estado === 'inactivo' && !usuario.activo);
        const cumpleBusqueda = !estado.filtros.busqueda ||
            usuario.nombre.toLowerCase().includes(estado.filtros.busqueda.toLowerCase()) ||
            usuario.apellidos?.toLowerCase().includes(estado.filtros.busqueda.toLowerCase()) ||
            usuario.email.toLowerCase().includes(estado.filtros.busqueda.toLowerCase());

        return cumpleRol && cumpleEstado && cumpleBusqueda;
    });

    // ===============================================
    // RENDERIZADO DE SECCIONES
    // ===============================================

    const renderUsuarios = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    Gestión de Usuarios
                </h2>
                <button
                    onClick={crearUsuario}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="h-5 w-5 mr-2 inline" />
                    Nuevo Usuario
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Filtros de Búsqueda
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Búsqueda
                        </label>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, apellido o email..."
                            value={estado.filtros.busqueda}
                            onChange={(e) => setEstado(prev => ({
                                ...prev,
                                filtros: { ...prev.filtros, busqueda: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rol
                        </label>
                        <select
                            value={estado.filtros.rol}
                            onChange={(e) => setEstado(prev => ({
                                ...prev,
                                filtros: { ...prev.filtros, rol: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todos los roles</option>
                            <option value="admin">Administrador</option>
                            <option value="medico">Médico</option>
                            <option value="recepcionista">Recepcionista</option>
                            <option value="contable">Contable</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estado
                        </label>
                        <select
                            value={estado.filtros.estado}
                            onChange={(e) => setEstado(prev => ({
                                ...prev,
                                filtros: { ...prev.filtros, estado: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todos</option>
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => setEstado(prev => ({
                                ...prev,
                                filtros: { rol: '', estado: '', busqueda: '' }
                            }))}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabla de Usuarios */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                                    Especialidad
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
                            {usuariosFiltrados.map((usuario) => (
                                <tr key={usuario.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                    <UserIcon className="h-5 w-5 text-gray-600" />
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
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            usuario.rol === 'admin' ? 'bg-red-100 text-red-800' :
                                            usuario.rol === 'medico' ? 'bg-blue-100 text-blue-800' :
                                            usuario.rol === 'recepcionista' ? 'bg-green-100 text-green-800' :
                                            'bg-purple-100 text-purple-800'
                                        }`}>
                                            {usuario.rol === 'admin' ? '👑 Admin' :
                                             usuario.rol === 'medico' ? '👨‍⚕️ Médico' :
                                             usuario.rol === 'recepcionista' ? '📋 Recepción' :
                                             '💰 Contable'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {usuario.departamento || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {usuario.especialidad || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {usuario.ultimo_acceso ? (
                                            <div className="flex items-center">
                                                <CalendarIcon className="h-4 w-4 mr-1" />
                                                {new Date(usuario.ultimo_acceso).toLocaleDateString()}
                                            </div>
                                        ) : (
                                            'Nunca'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            usuario.activo
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {usuario.activo ? (
                                                <><CheckCircleIcon className="h-3 w-3 mr-1" /> Activo</>
                                            ) : (
                                                <><XCircleIcon className="h-3 w-3 mr-1" /> Inactivo</>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => setEstado(prev => ({
                                                ...prev,
                                                usuarioSeleccionado: usuario,
                                                mostrarModal: true
                                            }))}
                                            className="text-blue-600 hover:text-blue-900"
                                            title="Ver detalles"
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                        </button>
                                        <button className="text-yellow-600 hover:text-yellow-900" title="Editar">
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button className="text-green-600 hover:text-green-900" title="Resetear contraseña">
                                            <KeyIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => toggleUsuario(usuario.id, !usuario.activo)}
                                            className={`${usuario.activo ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                            title={usuario.activo ? 'Desactivar' : 'Activar'}
                                        >
                                            {usuario.activo ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                        </button>
                                        <button
                                            onClick={() => eliminarUsuario(usuario.id)}
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

            {usuariosFiltrados.length === 0 && (
                <div className="text-center py-12">
                    <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        No se encontraron usuarios que coincidan con los filtros aplicados.
                    </p>
                </div>
            )}
        </div>
    );

    const renderRoles = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    Gestión de Roles y Permisos
                </h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Nuevo Rol
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {estado.roles.map((rol) => (
                    <div key={rol.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <ShieldCheckIcon className="h-6 w-6 text-blue-600 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                                    {rol.rol}
                                </h3>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                rol.rol === 'admin' ? 'bg-red-100 text-red-800' :
                                rol.rol === 'medico' ? 'bg-blue-100 text-blue-800' :
                                rol.rol === 'recepcionista' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                            }`}>
                                {rol.rol === 'admin' ? '👑 Admin' :
                                 rol.rol === 'medico' ? '👨‍⚕️ Médico' :
                                 rol.rol === 'recepcionista' ? '📋 Recepción' :
                                 '💰 Contable'}
                            </span>
                        </div>

                        {rol.descripcion && (
                            <p className="text-sm text-gray-600 mb-4">
                                {rol.descripcion}
                            </p>
                        )}

                        <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                                Permisos:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {Object.keys(rol.permisos || {}).map((modulo) => (
                                    <span key={modulo} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                                        {modulo}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <button className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                                Editar
                            </button>
                            <button className="flex-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                                Duplicar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderEstadisticas = () => {
        const usuariosPorRol = estado.usuarios.reduce((acc, usuario) => {
            acc[usuario.rol] = (acc[usuario.rol] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const usuariosActivos = estado.usuarios.filter(u => u.activo).length;
        const usuariosInactivos = estado.usuarios.filter(u => !u.activo).length;

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    Estadísticas de Usuarios
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <UserGroupIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Total Usuarios</h3>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {estado.usuarios.length}
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
                                <h3 className="text-sm font-medium text-gray-500">Activos</h3>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {usuariosActivos}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <XCircleIcon className="h-8 w-8 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Inactivos</h3>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {usuariosInactivos}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-500">Roles</h3>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {estado.roles.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                        Distribución por Rol
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(usuariosPorRol).map(([rol, cantidad]) => (
                            <div key={rol} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mr-3 ${
                                        rol === 'admin' ? 'bg-red-100 text-red-800' :
                                        rol === 'medico' ? 'bg-blue-100 text-blue-800' :
                                        rol === 'recepcionista' ? 'bg-green-100 text-green-800' :
                                        'bg-purple-100 text-purple-800'
                                    }`}>
                                        {rol === 'admin' ? '👑 Admin' :
                                         rol === 'medico' ? '👨‍⚕️ Médico' :
                                         rol === 'recepcionista' ? '📋 Recepción' :
                                         '💰 Contable'}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-600">
                                    {cantidad} usuario{cantidad !== 1 ? 's' : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
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
        { id: 'usuarios', nombre: 'Usuarios', icono: UserGroupIcon },
        { id: 'roles', nombre: 'Roles y Permisos', icono: ShieldCheckIcon },
        { id: 'estadisticas', nombre: 'Estadísticas', icono: UserIcon }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        👥 Gestión de Usuarios
                    </h1>
                    <p className="text-gray-600">
                        Administra usuarios, roles y permisos del sistema
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
                        {estado.seccionActiva === 'usuarios' && renderUsuarios()}
                        {estado.seccionActiva === 'roles' && renderRoles()}
                        {estado.seccionActiva === 'estadisticas' && renderEstadisticas()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsuariosPage;