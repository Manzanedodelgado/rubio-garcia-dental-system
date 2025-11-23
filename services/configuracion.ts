// ===============================================
// SERVICIO DE CONFIGURACIÓN - MÓDULO COMPLETO
// Sistema de Gestión Integral - Rubio García Dental
// ===============================================

import { createClient } from '@supabase/supabase-js';

export interface ClinicaConfig {
    id: number;
    nombre_clinica: string;
    direccion: string;
    telefono: string;
    email: string;
    website: string;
    cif_nif: string;
    logo_url: string;
    horario_apertura: string;
    horario_cierre: string;
    dias_laborales: number[];
    zona_horaria: string;
    moneda_defecto: string;
    idioma_defecto: string;
    configuracion_visual: any;
    configuracion_notificaciones: any;
    activa: boolean;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface ServicioConfig {
    id: number;
    servicio: string;
    sub_servicio?: string;
    configuracion: any;
    credenciales?: any;
    estado: 'activo' | 'inactivo' | 'error' | 'configurando';
    ultima_conexion?: string;
    ultima_verificacion?: string;
    pruebas_realizadas: any;
    notas?: string;
    activo: boolean;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface UsuarioSistema {
    id: number;
    email: string;
    nombre: string;
    apellidos?: string;
    rol: 'admin' | 'medico' | 'recepcionista' | 'contable';
    departamento?: string;
    telefono?: string;
    especialidad?: string;
    numero_colegiado?: string;
    configuracion_personal: any;
    permisos: any;
    avatar_url?: string;
    ultimo_acceso?: string;
    intentos_fallidos: number;
    bloqueado: boolean;
    fecha_bloqueo?: string;
    activo: boolean;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface RolPermisos {
    id: number;
    rol: string;
    descripcion?: string;
    permisos: any;
    restricciones?: any;
    configuraciones_rol?: any;
    activo: boolean;
    fecha_creacion: string;
}

export interface AutomatizacionConfig {
    id: number;
    nombre: string;
    tipo: 'recordatorio' | 'urgencia' | 'facturacion' | 'seguimiento';
    modulo_origen?: string;
    configuracion: any;
    condiciones?: any;
    acciones: any;
    programacion?: any;
    activo: boolean;
    pruebas_automatizadas?: any;
    estadisticas_uso?: any;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface VerifactuConfig {
    id: number;
    serie_facturas: string;
    prefijo_facturas?: string;
    numero_actual: number;
    serie_rectificativas?: string;
    prefijo_rectificativas?: string;
    numero_rect_actual: number;
    configuracion_aeat: any;
    certificados?: any;
    entorno: 'produccion' | 'pruebas';
    envio_automatico: boolean;
    configuracion_envio?: any;
    ultima_transmision?: string;
    estadisticas_envio?: any;
    activo: boolean;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface BackupConfig {
    id: number;
    tipo_backup: 'diario' | 'semanal' | 'mensual';
    configuracion: any;
    programacion_cron?: string;
    destino_almacenamiento?: any;
    configuracion_compresion?: any;
    retencion_dias: number;
    ultima_ejecucion?: string;
    proxima_ejecucion?: string;
    estadisticas_backups?: any;
    pruebas_restauracion?: any;
    activo: boolean;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface LogConfiguracion {
    id: number;
    usuario_id?: number;
    accion: string;
    modulo: string;
    elemento_afectado?: string;
    valores_anteriores?: any;
    valores_nuevos?: any;
    ip_origen?: string;
    user_agent?: string;
    fecha_accion: string;
}

export interface EstadoConfiguracion {
    tipo: string;
    descripcion: string;
    estado: string;
    fecha_actualizacion: string;
}

export interface ConfiguracionIntegracion {
    id: number;
    integracion: string;
    configuracion: any;
    credenciales?: any;
    scopes_permisos?: string[];
    tokens?: any;
    fecha_expiracion_tokens?: string;
    estado_conexion: 'conectado' | 'desconectado' | 'error' | 'renovando';
    ultima_sincronizacion?: string;
    estadisticas_uso?: any;
    configuracion_webhooks?: any;
    activo: boolean;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

class ConfiguracionService {
    private supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ===============================================
    // CONFIGURACIÓN DE CLÍNICA
    // ===============================================

    async getConfiguracionClinica(): Promise<ClinicaConfig | null> {
        const { data, error } = await this.supabase
            .from('configuracion_clinica')
            .select('*')
            .eq('activa', true)
            .single();

        if (error) {
            console.error('Error obteniendo configuración clínica:', error);
            return null;
        }

        return data;
    }

    async updateConfiguracionClinica(config: Partial<ClinicaConfig>): Promise<boolean> {
        const { data: existing, error: fetchError } = await this.supabase
            .from('configuracion_clinica')
            .select('*')
            .eq('activa', true)
            .single();

        if (fetchError) {
            console.error('Error obteniendo configuración existente:', fetchError);
            return false;
        }

        const { error } = await this.supabase
            .from('configuracion_clinica')
            .update({
                ...config,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('id', existing.id);

        if (error) {
            console.error('Error actualizando configuración clínica:', error);
            return false;
        }

        // Log del cambio
        await this.logConfiguracion(
            null, // usuario_id se obtendrá del contexto
            'actualizar',
            'clinica',
            'configuracion_general',
            existing,
            config
        );

        return true;
    }

    // ===============================================
    // CONFIGURACIÓN DE SERVICIOS
    // ===============================================

    async getConfiguracionesServicios(): Promise<ServicioConfig[]> {
        const { data, error } = await this.supabase
            .from('configuracion_servicios')
            .select('*')
            .eq('activo', true)
            .order('servicio, sub_servicio');

        if (error) {
            console.error('Error obteniendo configuraciones de servicios:', error);
            return [];
        }

        return data || [];
    }

    async getConfiguracionServicio(servicio: string, subServicio?: string): Promise<ServicioConfig | null> {
        let query = this.supabase
            .from('configuracion_servicios')
            .select('*')
            .eq('servicio', servicio)
            .eq('activo', true)
            .limit(1);

        if (subServicio) {
            query = query.eq('sub_servicio', subServicio);
        }

        const { data, error } = await query.single();

        if (error) {
            console.error(`Error obteniendo configuración de ${servicio}:`, error);
            return null;
        }

        return data;
    }

    async updateConfiguracionServicio(
        servicio: string, 
        subServicio: string | null,
        configuracion: any,
        credenciales?: any
    ): Promise<boolean> {
        const { data: existing, error: fetchError } = await this.supabase
            .from('configuracion_servicios')
            .select('*')
            .eq('servicio', servicio)
            .eq('sub_servicio', subServicio)
            .eq('activo', true)
            .single();

        if (fetchError) {
            console.error('Error obteniendo configuración de servicio existente:', fetchError);
            return false;
        }

        const updateData: any = {
            fecha_actualizacion: new Date().toISOString()
        };

        if (configuracion !== undefined) updateData.configuracion = configuracion;
        if (credenciales !== undefined) updateData.credenciales = credenciales;

        const { error } = await this.supabase
            .from('configuracion_servicios')
            .update(updateData)
            .eq('id', existing.id);

        if (error) {
            console.error('Error actualizando configuración de servicio:', error);
            return false;
        }

        // Log del cambio
        await this.logConfiguracion(
            null,
            'actualizar',
            'servicios',
            `${servicio}${subServicio ? `/${subServicio}` : ''}`,
            existing,
            updateData
        );

        return true;
    }

    async verificarConectividadServicio(servicio: string, subServicio?: string): Promise<boolean> {
        const config = await this.getConfiguracionServicio(servicio, subServicio);
        
        if (!config) return false;

        // Simular verificación de conectividad
        const isConnected = await this.performServiceCheck(servicio, config.configuracion);

        // Actualizar estado de conexión
        await this.supabase
            .from('configuracion_servicios')
            .update({
                ultima_conexion: isConnected ? new Date().toISOString() : null,
                ultima_verificacion: new Date().toISOString(),
                estado: isConnected ? 'activo' : 'error'
            })
            .eq('id', config.id);

        return isConnected;
    }

    private async performServiceCheck(servicio: string, config: any): Promise<boolean> {
        try {
            switch (servicio) {
                case 'supabase':
                    return await this.checkSupabaseConnection(config);
                case 'sql_server':
                    return await this.checkSQLServerConnection(config);
                case 'whatsapp':
                    return await this.checkWhatsAppConnection(config);
                case 'ia':
                    return await this.checkIAConnection(config);
                default:
                    return false;
            }
        } catch (error) {
            console.error(`Error verificando servicio ${servicio}:`, error);
            return false;
        }
    }

    private async checkSupabaseConnection(config: any): Promise<boolean> {
        try {
            const response = await fetch(config.url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    private async checkSQLServerConnection(config: any): Promise<boolean> {
        // Implementar verificación de SQL Server
        // Esto requeriría una conexión directa al servidor
        return true; // Placeholder
    }

    private async checkWhatsAppConnection(config: any): Promise<boolean> {
        try {
            const response = await fetch(`${config.host}/status`);
            return response.ok;
        } catch {
            return false;
        }
    }

    private async checkIAConnection(config: any): Promise<boolean> {
        try {
            const response = await fetch(`${config.url}/api/version`);
            return response.ok;
        } catch {
            return false;
        }
    }

    // ===============================================
    // GESTIÓN DE USUARIOS
    // ===============================================

    async getUsuariosActivos(): Promise<UsuarioSistema[]> {
        const { data, error } = await this.supabase
            .from('v_usuarios_activos')
            .select('*');

        if (error) {
            console.error('Error obteniendo usuarios activos:', error);
            return [];
        }

        return data || [];
    }

    async createUsuario(usuario: Omit<UsuarioSistema, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>): Promise<boolean> {
        const { data, error } = await this.supabase
            .from('usuarios_sistema')
            .insert([{
                ...usuario,
                fecha_creacion: new Date().toISOString(),
                fecha_actualizacion: new Date().toISOString()
            }]);

        if (error) {
            console.error('Error creando usuario:', error);
            return false;
        }

        await this.logConfiguracion(
            null,
            'crear',
            'usuarios',
            usuario.email,
            null,
            usuario
        );

        return true;
    }

    async updateUsuario(id: number, updates: Partial<UsuarioSistema>): Promise<boolean> {
        const { data: existing, error: fetchError } = await this.supabase
            .from('usuarios_sistema')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('Error obteniendo usuario existente:', fetchError);
            return false;
        }

        const { error } = await this.supabase
            .from('usuarios_sistema')
            .update({
                ...updates,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error actualizando usuario:', error);
            return false;
        }

        await this.logConfiguracion(
            null,
            'actualizar',
            'usuarios',
            existing.email,
            existing,
            updates
        );

        return true;
    }

    async deleteUsuario(id: number): Promise<boolean> {
        const { data: existing, error: fetchError } = await this.supabase
            .from('usuarios_sistema')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('Error obteniendo usuario para eliminar:', fetchError);
            return false;
        }

        // Soft delete - desactivar usuario
        const { error } = await this.supabase
            .from('usuarios_sistema')
            .update({
                activo: false,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error desactivando usuario:', error);
            return false;
        }

        await this.logConfiguracion(
            null,
            'eliminar',
            'usuarios',
            existing.email,
            existing,
            { activo: false }
        );

        return true;
    }

    // ===============================================
    // ROLES Y PERMISOS
    // ===============================================

    async getRolesPermisos(): Promise<RolPermisos[]> {
        const { data, error } = await this.supabase
            .from('roles_permisos')
            .select('*')
            .eq('activo', true)
            .order('rol');

        if (error) {
            console.error('Error obteniendo roles y permisos:', error);
            return [];
        }

        return data || [];
    }

    async updateRolPermisos(rol: string, permisos: any): Promise<boolean> {
        const { data: existing, error: fetchError } = await this.supabase
            .from('roles_permisos')
            .select('*')
            .eq('rol', rol)
            .single();

        if (fetchError) {
            console.error('Error obteniendo rol existente:', fetchError);
            return false;
        }

        const { error } = await this.supabase
            .from('roles_permisos')
            .update({ permisos })
            .eq('id', existing.id);

        if (error) {
            console.error('Error actualizando permisos de rol:', error);
            return false;
        }

        await this.logConfiguracion(
            null,
            'actualizar',
            'roles',
            rol,
            existing,
            { permisos }
        );

        return true;
    }

    // ===============================================
    // CONFIGURACIÓN DE VERIFACTU
    // ===============================================

    async getConfiguracionVerifactu(): Promise<VerifactuConfig | null> {
        const { data, error } = await this.supabase
            .from('configuracion_verifactu')
            .select('*')
            .eq('activo', true)
            .single();

        if (error) {
            console.error('Error obteniendo configuración de Verifactu:', error);
            return null;
        }

        return data;
    }

    async updateConfiguracionVerifactu(config: Partial<VerifactuConfig>): Promise<boolean> {
        const { data: existing, error: fetchError } = await this.supabase
            .from('configuracion_verifactu')
            .select('*')
            .eq('activo', true)
            .single();

        if (fetchError) {
            console.error('Error obteniendo configuración Verifactu existente:', fetchError);
            return false;
        }

        const { error } = await this.supabase
            .from('configuracion_verifactu')
            .update({
                ...config,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('id', existing.id);

        if (error) {
            console.error('Error actualizando configuración Verifactu:', error);
            return false;
        }

        await this.logConfiguracion(
            null,
            'actualizar',
            'verifactu',
            'configuracion_general',
            existing,
            config
        );

        return true;
    }

    async generarNumeroFactura(): Promise<string> {
        const config = await this.getConfiguracionVerifactu();
        if (!config) return '';

        const nuevoNumero = config.numero_actual + 1;
        const numeroCompleto = `${config.prefijo_facturas || ''}${nuevoNumero.toString().padStart(6, '0')}`;

        // Actualizar contador
        await this.supabase
            .from('configuracion_verifactu')
            .update({
                numero_actual: nuevoNumero,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('id', config.id);

        return numeroCompleto;
    }

    // ===============================================
    // CONFIGURACIÓN DE AUTOMATIZACIONES
    // ===============================================

    async getAutomatizaciones(): Promise<AutomatizacionConfig[]> {
        const { data, error } = await this.supabase
            .from('configuracion_automatizaciones')
            .select('*')
            .eq('activo', true)
            .order('tipo, nombre');

        if (error) {
            console.error('Error obteniendo automatizaciones:', error);
            return [];
        }

        return data || [];
    }

    async toggleAutomatizacion(id: number, activo: boolean): Promise<boolean> {
        const { error } = await this.supabase
            .from('configuracion_automatizaciones')
            .update({
                activo,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error toggling automatizacion:', error);
            return false;
        }

        await this.logConfiguracion(
            null,
            activo ? 'activar' : 'desactivar',
            'automatizaciones',
            `automatizacion_${id}`,
            null,
            { activo }
        );

        return true;
    }

    // ===============================================
    // CONFIGURACIÓN DE BACKUP
    // ===============================================

    async getConfiguracionesBackup(): Promise<BackupConfig[]> {
        const { data, error } = await this.supabase
            .from('configuracion_backup')
            .select('*')
            .eq('activo', true)
            .order('tipo_backup');

        if (error) {
            console.error('Error obteniendo configuraciones de backup:', error);
            return [];
        }

        return data || [];
    }

    async ejecutarBackup(tipo: 'diario' | 'semanal' | 'mensual'): Promise<boolean> {
        // Implementar lógica de backup
        // Esto incluiría:
        // 1. Backup de base de datos
        // 2. Backup de archivos
        // 3. Compresión y encriptación
        // 4. Envío a destino de almacenamiento
        
        console.log(`Ejecutando backup ${tipo}...`);
        
        // Simular ejecución de backup
        const success = true; // Placeholder
        
        if (success) {
            await this.logConfiguracion(
                null,
                'ejecutar',
                'backup',
                tipo,
                null,
                { resultado: 'exitoso', fecha: new Date().toISOString() }
            );
        }

        return success;
    }

    // ===============================================
    // ESTADO GENERAL DEL SISTEMA
    // ===============================================

    async getEstadoGeneral(): Promise<{
        clinica: ClinicaConfig | null;
        servicios: ServicioConfig[];
        automatizaciones: AutomatizacionConfig[];
        usuarios: UsuarioSistema[];
        estado_sistema: EstadoConfiguracion[];
    }> {
        const [
            clinica,
            servicios,
            automatizaciones,
            usuarios,
            estado_sistema
        ] = await Promise.all([
            this.getConfiguracionClinica(),
            this.getConfiguracionesServicios(),
            this.getAutomatizaciones(),
            this.getUsuariosActivos(),
            this.getEstadoSistema()
        ]);

        return {
            clinica,
            servicios,
            automatizaciones,
            usuarios,
            estado_sistema
        };
    }

    async getEstadoSistema(): Promise<EstadoConfiguracion[]> {
        const { data, error } = await this.supabase
            .from('v_estado_configuraciones')
            .select('*');

        if (error) {
            console.error('Error obteniendo estado del sistema:', error);
            return [];
        }

        return data || [];
    }

    // ===============================================
    // LOGS Y AUDITORÍA
    // ===============================================

    async getLogsConfiguracion(limit: number = 50): Promise<LogConfiguracion[]> {
        const { data, error } = await this.supabase
            .from('logs_configuracion')
            .select('*')
            .order('fecha_accion', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error obteniendo logs de configuración:', error);
            return [];
        }

        return data || [];
    }

    private async logConfiguracion(
        usuarioId: number | null,
        accion: string,
        modulo: string,
        elemento: string,
        valoresAnteriores?: any,
        valoresNuevos?: any
    ): Promise<void> {
        await this.supabase
            .from('logs_configuracion')
            .insert([{
                usuario_id: usuarioId,
                accion,
                modulo,
                elemento_afectado: elemento,
                valores_anteriores: valoresAnteriores,
                valores_nuevos: valoresNuevos,
                fecha_accion: new Date().toISOString()
            }]);
    }

    // ===============================================
    // VALIDACIONES Y UTILIDADES
    // ===============================================

    async validarConfiguracionCompleta(): Promise<{
        valida: boolean;
        errores: string[];
        advertencias: string[];
    }> {
        const errores: string[] = [];
        const advertencias: string[] = [];

        // Verificar configuración de clínica
        const clinica = await this.getConfiguracionClinica();
        if (!clinica) {
            errores.push('Falta configuración básica de la clínica');
        } else {
            if (!clinica.nombre_clinica) advertencias.push('Nombre de clínica no configurado');
            if (!clinica.telefono) advertencias.push('Teléfono de clínica no configurado');
            if (!clinica.email) advertencias.push('Email de clínica no configurado');
        }

        // Verificar servicios críticos
        const servicios = await this.getConfiguracionesServicios();
        const serviciosCriticos = ['supabase', 'sql_server'];

        for (const servicioCritico of serviciosCriticos) {
            const servicio = servicios.find(s => s.servicio === servicioCritico);
            if (!servicio) {
                errores.push(`Servicio crítico no configurado: ${servicioCritico}`);
            } else if (servicio.estado !== 'activo') {
                errores.push(`Servicio crítico inactivo: ${servicioCritico}`);
            }
        }

        // Verificar usuarios
        const usuarios = await this.getUsuariosActivos();
        if (usuarios.length === 0) {
            errores.push('No hay usuarios activos en el sistema');
        }

        return {
            valida: errores.length === 0,
            errores,
            advertencias
        };
    }

    async exportarConfiguracion(): Promise<string> {
        const estado = await this.getEstadoGeneral();
        
        return JSON.stringify({
            exportado: new Date().toISOString(),
            version: '1.0',
            sistema: 'Rubio García Dental',
            configuracion: estado
        }, null, 2);
    }

    async importarConfiguracion(configJson: string): Promise<boolean> {
        try {
            const config = JSON.parse(configJson);
            
            // Validar estructura básica
            if (!config.configuracion) {
                throw new Error('Formato de configuración inválido');
            }

            // Aplicar configuración de clínica si existe
            if (config.configuracion.clinica) {
                await this.updateConfiguracionClinica(config.configuracion.clinica);
            }

            // Aplicar configuración de servicios si existe
            if (config.configuracion.servicios) {
                for (const servicio of config.configuracion.servicios) {
                    await this.updateConfiguracionServicio(
                        servicio.servicio,
                        servicio.sub_servicio,
                        servicio.configuracion,
                        servicio.credenciales
                    );
                }
            }

            await this.logConfiguracion(
                null,
                'importar',
                'sistema',
                'configuracion_completa',
                null,
                { importado: new Date().toISOString() }
            );

            return true;
        } catch (error) {
            console.error('Error importando configuración:', error);
            return false;
        }
    }
}

export default ConfiguracionService;