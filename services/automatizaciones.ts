// ===============================================
// SERVICIO DE AUTOMATIZACIONES - MÓDULO COMPLETO
// Sistema de Gestión Integral - Rubio García Dental
// ===============================================

import { createClient } from '@supabase/supabase-js';

export interface AutomatizacionFlow {
    id: string;
    nombre: string;
    tipo: 'triggers' | 'conditional' | 'scheduled' | 'ai_driven';
    descripcion: string;
    configuracion: {
        condiciones: FlowCondition[];
        acciones: FlowAction[];
        programacion?: CronSchedule;
        ai_triggers?: AITrigger[];
    };
    activo: boolean;
    estadisticas: {
        ejecuciones_totales: number;
        ejecuciones_exitosas: number;
        ultima_ejecucion?: string;
        tiempo_promedio: number;
    };
    logs: ExecutionLog[];
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface FlowCondition {
    id: string;
    tipo: 'time' | 'event' | 'data' | 'ai_analysis';
    campo: string;
    operador: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'starts_with' | 'ends_with';
    valor: any;
    conector?: 'AND' | 'OR';
}

export interface FlowAction {
    id: string;
    tipo: 'email' | 'whatsapp' | 'sms' | 'notification' | 'database' | 'ai_response' | 'webhook';
    modulo_origen: string;
    configuracion: {
        destino?: string;
        plantilla?: string;
        parametros?: Record<string, any>;
        delay?: number;
        retry_attempts?: number;
    };
}

export interface CronSchedule {
    expresion: string; // "0 9 * * *" para todos los días a las 9 AM
    zona_horaria: string;
    proxima_ejecucion: string;
}

export interface AITrigger {
    tipo: 'sentiment' | 'urgency' | 'keywords' | 'pattern';
    valor: any;
    umbral: number;
    contexto: string;
}

export interface ExecutionLog {
    id: string;
    automatizacion_id: string;
    fecha_ejecucion: string;
    estado: 'exitoso' | 'fallido' | 'en_progreso' | 'cancelado';
    detalles: string;
    datos_entrada: any;
    datos_salida: any;
    tiempo_ejecucion: number;
    acciones_ejecutadas: string[];
}

export interface AutomatizacionTemplate {
    id: string;
    nombre: string;
    categoria: 'cita' | 'paciente' | 'facturacion' | 'comunicacion' | 'ia';
    descripcion: string;
    configuracion: AutomatizacionFlow['configuracion'];
    parametro_configuracion: string[];
    ejemplo_uso: string;
}

class AutomatizacionesService {
    private supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ===============================================
    // GESTIÓN DE AUTOMATIZACIONES
    // ===============================================

    async getAutomatizaciones(): Promise<AutomatizacionFlow[]> {
        const { data, error } = await this.supabase
            .from('automatizaciones_flows')
            .select('*')
            .order('fecha_actualizacion', { ascending: false });

        if (error) {
            console.error('Error obteniendo automatizaciones:', error);
            return [];
        }

        return data || [];
    }

    async getAutomatizacion(id: string): Promise<AutomatizacionFlow | null> {
        const { data, error } = await this.supabase
            .from('automatizaciones_flows')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error obteniendo automatización:', error);
            return null;
        }

        return data;
    }

    async createAutomatizacion(automatizacion: Omit<AutomatizacionFlow, 'id' | 'estadisticas' | 'logs' | 'fecha_creacion' | 'fecha_actualizacion'>): Promise<string | null> {
        const automatizacionData = {
            ...automatizacion,
            estadisticas: {
                ejecuciones_totales: 0,
                ejecuciones_exitosas: 0,
                tiempo_promedio: 0
            },
            logs: [],
            fecha_creacion: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString()
        };

        const { data, error } = await this.supabase
            .from('automatizaciones_flows')
            .insert([automatizacionData])
            .select('id')
            .single();

        if (error) {
            console.error('Error creando automatización:', error);
            return null;
        }

        return data.id;
    }

    async updateAutomatizacion(id: string, updates: Partial<AutomatizacionFlow>): Promise<boolean> {
        const { error } = await this.supabase
            .from('automatizaciones_flows')
            .update({
                ...updates,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error actualizando automatización:', error);
            return false;
        }

        return true;
    }

    async deleteAutomatizacion(id: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('automatizaciones_flows')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error eliminando automatización:', error);
            return false;
        }

        return true;
    }

    async toggleAutomatizacion(id: string, activo: boolean): Promise<boolean> {
        const { error } = await this.supabase
            .from('automatizaciones_flows')
            .update({
                activo,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error toggling automatización:', error);
            return false;
        }

        return true;
    }

    // ===============================================
    // EJECUCIÓN DE AUTOMATIZACIONES
    // ===============================================

    async executeAutomatizacion(id: string, datos_entrada: any): Promise<ExecutionLog> {
        const automatizacion = await this.getAutomatizacion(id);
        if (!automatizacion || !automatizacion.activo) {
            throw new Error('Automatización no encontrada o inactiva');
        }

        const startTime = Date.now();
        const log: Omit<ExecutionLog, 'id'> = {
            automatizacion_id: id,
            fecha_ejecucion: new Date().toISOString(),
            estado: 'en_progreso',
            detalles: 'Ejecución iniciada',
            datos_entrada,
            datos_salida: {},
            tiempo_ejecucion: 0,
            acciones_ejecutadas: []
        };

        try {
            // Evaluar condiciones
            const condicionesCumplidas = await this.evaluateConditions(
                automatizacion.configuracion.condiciones,
                datos_entrada
            );

            if (!condicionesCumplidas) {
                log.estado = 'cancelado';
                log.detalles = 'Condiciones no cumplidas';
                log.tiempo_ejecucion = Date.now() - startTime;
                
                await this.saveExecutionLog(log);
                return log as ExecutionLog;
            }

            log.detalles = 'Condiciones cumplidas, ejecutando acciones';

            // Ejecutar acciones
            const resultadosAcciones = await this.executeActions(
                automatizacion.configuracion.acciones,
                datos_entrada
            );

            log.acciones_ejecutadas = resultadosAcciones.map(r => r.tipo);
            log.datos_salida = resultadosAcciones;
            log.estado = 'exitoso';
            log.detalles = `Automatización ejecutada exitosamente (${resultadosAcciones.length} acciones)`;

            // Actualizar estadísticas
            await this.updateAutomatizacionStats(id, true, Date.now() - startTime);

        } catch (error) {
            log.estado = 'fallido';
            log.detalles = `Error en ejecución: ${error.message}`;
            log.datos_salida = { error: error.message };
            
            // Actualizar estadísticas
            await this.updateAutomatizacionStats(id, false, Date.now() - startTime);
        }

        log.tiempo_ejecucion = Date.now() - startTime;
        await this.saveExecutionLog(log);
        
        return log as ExecutionLog;
    }

    private async evaluateConditions(condiciones: FlowCondition[], datos: any): Promise<boolean> {
        if (condiciones.length === 0) return true;

        let resultado: boolean = true;
        let conector: 'AND' | 'OR' = 'AND';

        for (const condicion of condiciones) {
            let cumple: boolean;

            switch (condicion.tipo) {
                case 'data':
                    const valorCampo = this.getNestedValue(datos, condicion.campo);
                    cumple = this.evaluateComparison(valorCampo, condicion.operador, condicion.valor);
                    break;
                
                case 'time':
                    const ahora = new Date();
                    const hora = ahora.getHours();
                    cumple = this.evaluateComparison(hora, condicion.operador, condicion.valor);
                    break;
                
                case 'ai_analysis':
                    // Integrar con servicio de IA
                    cumple = await this.evaluateAICondition(condicion, datos);
                    break;
                
                default:
                    cumple = false;
            }

            if (conector === 'AND') {
                resultado = resultado && cumple;
            } else {
                resultado = resultado || cumple;
            }

            conector = condicion.conector || 'AND';
        }

        return resultado;
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((acc, key) => acc?.[key], obj);
    }

    private evaluateComparison(valor: any, operador: string, valorEsperado: any): boolean {
        switch (operador) {
            case '=': return valor === valorEsperado;
            case '!=': return valor !== valorEsperado;
            case '>': return Number(valor) > Number(valorEsperado);
            case '<': return Number(valor) < Number(valorEsperado);
            case '>=': return Number(valor) >= Number(valorEsperado);
            case '<=': return Number(valor) <= Number(valorEsperado);
            case 'contains': return String(valor).includes(String(valorEsperado));
            case 'starts_with': return String(valor).startsWith(String(valorEsperado));
            case 'ends_with': return String(valor).endsWith(String(valorEsperado));
            default: return false;
        }
    }

    private async evaluateAICondition(condicion: FlowCondition, datos: any): Promise<boolean> {
        // Implementar evaluación con IA
        try {
            if (condicion.campo === 'sentiment') {
                const sentiment = await this.analyzeSentiment(datos.texto || '');
                return this.evaluateComparison(sentiment, condicion.operador, condicion.valor);
            }
            return false;
        } catch (error) {
            console.error('Error evaluando condición de IA:', error);
            return false;
        }
    }

    private async analyzeSentiment(text: string): Promise<number> {
        // Simular análisis de sentimientos
        const positiveWords = ['bueno', 'excelente', 'perfecto', 'satisfecho'];
        const negativeWords = ['malo', 'terrible', 'dolor', 'urgente'];
        
        const words = text.toLowerCase().split(' ');
        let score = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) score += 1;
            if (negativeWords.includes(word)) score -= 1;
        });
        
        return score;
    }

    private async executeActions(acciones: FlowAction[], datos: any): Promise<any[]> {
        const resultados = [];

        for (const accion of acciones) {
            try {
                const resultado = await this.executeAction(accion, datos);
                resultados.push({
                    tipo: accion.tipo,
                    exito: true,
                    resultado,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                resultados.push({
                    tipo: accion.tipo,
                    exito: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        return resultados;
    }

    private async executeAction(accion: FlowAction, datos: any): Promise<any> {
        switch (accion.tipo) {
            case 'email':
                return await this.executeEmailAction(accion, datos);
            
            case 'whatsapp':
                return await this.executeWhatsAppAction(accion, datos);
            
            case 'notification':
                return await this.executeNotificationAction(accion, datos);
            
            case 'database':
                return await this.executeDatabaseAction(accion, datos);
            
            case 'ai_response':
                return await this.executeAIResponseAction(accion, datos);
            
            default:
                throw new Error(`Tipo de acción no implementado: ${accion.tipo}`);
        }
    }

    private async executeEmailAction(accion: FlowAction, datos: any): Promise<any> {
        // Integrar con servicio de email
        console.log('Ejecutando acción de email:', accion.configuracion);
        return { tipo: 'email', estado: 'enviado' };
    }

    private async executeWhatsAppAction(accion: FlowAction, datos: any): Promise<any> {
        // Integrar con servicio de WhatsApp
        console.log('Ejecutando acción de WhatsApp:', accion.configuracion);
        return { tipo: 'whatsapp', estado: 'enviado' };
    }

    private async executeNotificationAction(accion: FlowAction, datos: any): Promise<any> {
        // Enviar notificación interna
        console.log('Ejecutando acción de notificación:', accion.configuracion);
        return { tipo: 'notification', estado: 'enviado' };
    }

    private async executeDatabaseAction(accion: FlowAction, datos: any): Promise<any> {
        // Ejecutar acción en base de datos
        console.log('Ejecutando acción de base de datos:', accion.configuracion);
        return { tipo: 'database', estado: 'ejecutado' };
    }

    private async executeAIResponseAction(accion: FlowAction, datos: any): Promise<any> {
        // Generar respuesta con IA
        console.log('Ejecutando acción de respuesta IA:', accion.configuracion);
        return { tipo: 'ai_response', estado: 'generado' };
    }

    private async saveExecutionLog(log: Omit<ExecutionLog, 'id'>): Promise<string> {
        const { data, error } = await this.supabase
            .from('automatizaciones_logs')
            .insert([{
                ...log,
                fecha_actualizacion: new Date().toISOString()
            }])
            .select('id')
            .single();

        if (error) {
            console.error('Error guardando log de ejecución:', error);
            return '';
        }

        return data.id;
    }

    private async updateAutomatizacionStats(id: string, exito: boolean, tiempo: number): Promise<void> {
        const automatizacion = await this.getAutomatizacion(id);
        if (!automatizacion) return;

        const stats = automatizacion.estadisticas;
        const nuevasStats = {
            ejecuciones_totales: stats.ejecuciones_totales + 1,
            ejecuciones_exitosas: stats.ejecuciones_exitosas + (exito ? 1 : 0),
            ultima_ejecucion: new Date().toISOString(),
            tiempo_promedio: (stats.tiempo_promedio + tiempo) / 2
        };

        await this.supabase
            .from('automatizaciones_flows')
            .update({
                estadisticas: nuevasStats,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('id', id);
    }

    // ===============================================
    // PLANTILLAS DE AUTOMATIZACIÓN
    // ===============================================

    async getAutomatizacionTemplates(): Promise<AutomatizacionTemplate[]> {
        const { data, error } = await this.supabase
            .from('automatizaciones_templates')
            .select('*')
            .order('categoria, nombre');

        if (error) {
            console.error('Error obteniendo templates de automatización:', error);
            return [];
        }

        return data || [];
    }

    async createFromTemplate(templateId: string, parametros: Record<string, any>): Promise<string | null> {
        const { data, error } = await this.supabase
            .from('automatizaciones_templates')
            .select('*')
            .eq('id', templateId)
            .single();

        if (error) {
            console.error('Error obteniendo template:', error);
            return null;
        }

        // Reemplazar parámetros en la configuración
        const configuracion = this.replaceParameters(data.configuracion, parametros);

        const nuevaAutomatizacion: Omit<AutomatizacionFlow, 'id' | 'estadisticas' | 'logs' | 'fecha_creacion' | 'fecha_actualizacion'> = {
            nombre: `${data.nombre} - ${new Date().toLocaleDateString()}`,
            tipo: data.configuracion.triggers ? 'triggers' : 'conditional',
            descripcion: data.descripcion,
            configuracion,
            activo: false
        };

        return await this.createAutomatizacion(nuevaAutomatizacion);
    }

    private replaceParameters(config: any, params: Record<string, any>): any {
        const strConfig = JSON.stringify(config);
        let result = strConfig;
        
        Object.entries(params).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            result = result.replace(new RegExp(placeholder, 'g'), String(value));
        });
        
        return JSON.parse(result);
    }

    // ===============================================
    // MONITOREO Y LOGS
    // ===============================================

    async getExecutionLogs(automatizacionId?: string, limit: number = 50): Promise<ExecutionLog[]> {
        let query = this.supabase
            .from('automatizaciones_logs')
            .select('*')
            .order('fecha_ejecucion', { ascending: false })
            .limit(limit);

        if (automatizacionId) {
            query = query.eq('automatizacion_id', automatizacionId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error obteniendo logs de ejecución:', error);
            return [];
        }

        return data || [];
    }

    async getAutomatizacionesStats(): Promise<{
        total_automatizaciones: number;
        automatizaciones_activas: number;
        ejecuciones_hoy: number;
        ejecuciones_exitosas_hoy: number;
        error_rate: number;
    }> {
        try {
            const hoy = new Date().toISOString().split('T')[0];
            
            const [automatizaciones, logs] = await Promise.all([
                this.supabase
                    .from('automatizaciones_flows')
                    .select('activo'),
                
                this.supabase
                    .from('automatizaciones_logs')
                    .select('estado')
                    .eq('fecha_ejecucion', hoy)
            ]);

            const totalAutomatizaciones = automatizaciones.data?.length || 0;
            const automatizacionesActivas = automatizaciones.data?.filter(a => a.activo).length || 0;
            const ejecucionesHoy = logs.data?.length || 0;
            const ejecucionesExitosasHoy = logs.data?.filter(l => l.estado === 'exitoso').length || 0;
            const errorRate = ejecucionesHoy > 0 ? (ejecucionesHoy - ejecucionesExitosasHoy) / ejecucionesHoy : 0;

            return {
                total_automatizaciones: totalAutomatizaciones,
                automatizaciones_activas: automatizacionesActivas,
                ejecuciones_hoy: ejecucionesHoy,
                ejecuciones_exitosas_hoy: ejecucionesExitosasHoy,
                error_rate: Math.round(errorRate * 100)
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas de automatizaciones:', error);
            return {
                total_automatizaciones: 0,
                automatizaciones_activas: 0,
                ejecuciones_hoy: 0,
                ejecuciones_exitosas_hoy: 0,
                error_rate: 0
            };
        }
    }
}

export default AutomatizacionesService;