// ===============================================
// SERVICIO DE EMAIL - MÓDULO COMPLETO
// Sistema de Gestión Integral - Rubio García Dental
// ===============================================

import { createClient } from '@supabase/supabase-js';

export interface EmailConfig {
    id: number;
    proveedor: 'gmail' | 'outlook' | 'yahoo' | 'custom';
    configuracion: {
        host: string;
        puerto: number;
        secure: boolean;
        usuario: string;
    };
    credenciales: {
        client_id?: string;
        client_secret?: string;
        refresh_token?: string;
    };
    estado: 'conectado' | 'desconectado' | 'error' | 'configurando';
    ultima_conexion?: string;
    pruebas_realizadas: any;
    configuracion_notificaciones: {
        recordatorios: boolean;
        urgencias: boolean;
        facturacion: boolean;
        citas: boolean;
    };
    activo: boolean;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface EmailMessage {
    id: string;
    email_origen: string;
    email_destino: string[];
    asunto: string;
    cuerpo: string;
    tipo: 'recordatorio' | 'urgencia' | 'factura' | 'cita' | 'generico';
    plantillas_id?: string;
    adjuntos?: string[];
    estado_envio: 'pendiente' | 'enviando' | 'enviado' | 'error';
    fecha_envio?: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface EmailTemplate {
    id: string;
    nombre: string;
    tipo: 'recordatorio' | 'urgencia' | 'factura' | 'cita' | 'bienvenida' | 'despedida';
    asunto: string;
    cuerpo: string;
    variables: string[]; // {{nombre}}, {{fecha}}, etc.
    activo: boolean;
    usado_count: number;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface EmailStatistics {
    total_enviados: number;
    total_recibidos: number;
    enviados_hoy: number;
    recibidos_hoy: number;
    errores_envio: number;
    mensajes_pendientes: number;
}

class EmailService {
    private supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ===============================================
    // AYUDANTES OAUTH2 GMAIL
    // ===============================================

    /**
     * Intercambia refresh_token por access_token válido
     */
    private async getGmailAccessToken(refreshToken: string): Promise<string | null> {
        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_MAIL_CLIENT_ID || '',
                    client_secret: process.env.GOOGLE_MAIL_CLIENT_SECRET || '',
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token',
                }),
            });

            if (!response.ok) {
                console.error('❌ Error obteniendo access_token:', response.status, response.statusText);
                return null;
            }

            const data = await response.json();
            return data.access_token || null;
        } catch (error) {
            console.error('❌ Excepción obteniendo access_token:', error);
            return null;
        }
    }

    /**
     * Envía email usando Gmail API
     */
    private async sendGmailEmail(accessToken: string, message: any): Promise<boolean> {
        try {
            const encodedMessage = btoa(message)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const response = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        raw: encodedMessage,
                    }),
                }
            );

            return response.ok;
        } catch (error) {
            console.error('❌ Error enviando email vía Gmail:', error);
            return false;
        }
    }

    // ===============================================
    // CONFIGURACIÓN DE EMAIL
    // ===============================================

    async getEmailConfig(): Promise<EmailConfig | null> {
        const { data, error } = await this.supabase
            .from('email_configuracion')
            .select('*')
            .eq('activo', true)
            .single();

        if (error) {
            console.error('Error obteniendo configuración de email:', error);
            return null;
        }

        return data;
    }

    async updateEmailConfig(config: Partial<EmailConfig>): Promise<boolean> {
        const { data: existing, error: fetchError } = await this.supabase
            .from('email_configuracion')
            .select('*')
            .eq('activo', true)
            .single();

        if (fetchError) {
            console.error('Error obteniendo configuración existente:', fetchError);
            return false;
        }

        const { error } = await this.supabase
            .from('email_configuracion')
            .update({
                ...config,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('id', existing.id);

        if (error) {
            console.error('Error actualizando configuración de email:', error);
            return false;
        }

        return true;
    }

    async testEmailConnection(): Promise<boolean> {
        try {
            const config = await this.getEmailConfig();
            if (!config) return false;

            // Simular prueba de conexión según el proveedor
            switch (config.proveedor) {
                case 'gmail':
                    return await this.testGmailConnection(config);
                case 'outlook':
                    return await this.testOutlookConnection(config);
                case 'custom':
                    return await this.testCustomConnection(config);
                default:
                    return false;
            }
        } catch (error) {
            console.error('Error probando conexión de email:', error);
            return false;
        }
    }

    private async testGmailConnection(config: EmailConfig): Promise<boolean> {
        try {
            // Intercambiar refresh_token por access_token válido
            const accessToken = await this.getGmailAccessToken(config.credenciales.refresh_token);
            if (!accessToken) {
                console.error('❌ No se pudo obtener access_token de Gmail');
                return false;
            }

            // Probar conexión con el access_token
            const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response.ok;
        } catch (error) {
            console.error('❌ Error probando conexión Gmail:', error);
            return false;
        }
    }

    private async testOutlookConnection(config: EmailConfig): Promise<boolean> {
        try {
            // Implementar autenticación OAuth2 con Outlook
            const response = await fetch('https://outlook.office.com/api/v1.0/me', {
                headers: {
                    'Authorization': `Bearer ${config.credenciales.refresh_token}`,
                },
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    private async testCustomConnection(config: EmailConfig): Promise<boolean> {
        try {
            // Implementar conexión SMTP personalizada
            return true; // Placeholder
        } catch {
            return false;
        }
    }

    // ===============================================
    // GESTIÓN DE MENSAJES
    // ===============================================

    async sendEmail(message: Omit<EmailMessage, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>): Promise<boolean> {
        try {
            // Obtener configuración de email
            const config = await this.getEmailConfig();
            if (!config) {
                console.error('❌ No se encontró configuración de email');
                return false;
            }

            // Guardar mensaje en base de datos primero
            const emailData = {
                ...message,
                fecha_creacion: new Date().toISOString(),
                fecha_actualizacion: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('email_mensajes')
                .insert([emailData]);

            if (error) {
                console.error('❌ Error guardando mensaje de email:', error);
                return false;
            }

            // Simular envío según el proveedor
            let sendSuccess = false;
            
            if (config.proveedor === 'gmail') {
                // Gmail API con OAuth2
                const accessToken = await this.getGmailAccessToken(config.credenciales.refresh_token || '');
                if (accessToken) {
                    const gmailMessage = {
                        to: message.email_destino,
                        subject: message.asunto,
                        from: message.email_origen,
                        body: message.cuerpo,
                    };
                    sendSuccess = await this.sendGmailEmail(accessToken, gmailMessage);
                }
            } else {
                // Otros proveedores o simulación
                console.log(`📧 Enviando email vía ${config.proveedor} (simulado)`);
                sendSuccess = true; // Simulación para otros proveedores
            }

            // Actualizar estado en base de datos
            await this.supabase
                .from('email_mensajes')
                .update({
                    estado_envio: sendSuccess ? 'enviado' : 'error',
                    fecha_envio: sendSuccess ? new Date().toISOString() : null,
                    fecha_actualizacion: new Date().toISOString()
                })
                .eq('id', data[0].id);

            return sendSuccess;
        } catch (error) {
            console.error('❌ Error enviando email:', error);
            return false;
        }
    }

    async getEmailMessages(limit: number = 50): Promise<EmailMessage[]> {
        const { data, error } = await this.supabase
            .from('email_mensajes')
            .select('*')
            .order('fecha_creacion', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error obteniendo mensajes de email:', error);
            return [];
        }

        return data || [];
    }

    async getEmailMessagesByType(tipo: EmailMessage['tipo'], limit: number = 20): Promise<EmailMessage[]> {
        const { data, error } = await this.supabase
            .from('email_mensajes')
            .select('*')
            .eq('tipo', tipo)
            .order('fecha_creacion', { ascending: false })
            .limit(limit);

        if (error) {
            console.error(`Error obteniendo mensajes de tipo ${tipo}:`, error);
            return [];
        }

        return data || [];
    }

    // ===============================================
    // PLANTILLAS DE EMAIL
    // ===============================================

    async getEmailTemplates(): Promise<EmailTemplate[]> {
        const { data, error } = await this.supabase
            .from('email_plantillas')
            .select('*')
            .eq('activo', true)
            .order('tipo, nombre');

        if (error) {
            console.error('Error obteniendo plantillas de email:', error);
            return [];
        }

        return data || [];
    }

    async getEmailTemplate(id: string): Promise<EmailTemplate | null> {
        const { data, error } = await this.supabase
            .from('email_plantillas')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error obteniendo plantilla de email:', error);
            return null;
        }

        return data;
    }

    async createEmailTemplate(template: Omit<EmailTemplate, 'id' | 'usado_count' | 'fecha_creacion' | 'fecha_actualizacion'>): Promise<string | null> {
        const templateData = {
            ...template,
            fecha_creacion: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString()
        };

        const { data, error } = await this.supabase
            .from('email_plantillas')
            .insert([templateData])
            .select('id')
            .single();

        if (error) {
            console.error('Error creando plantilla de email:', error);
            return null;
        }

        return data.id;
    }

    async updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<boolean> {
        const { error } = await this.supabase
            .from('email_plantillas')
            .update({
                ...updates,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error actualizando plantilla de email:', error);
            return false;
        }

        return true;
    }

    async generateEmailFromTemplate(templateId: string, variables: Record<string, string>): Promise<{
        asunto: string;
        cuerpo: string;
    } | null> {
        const template = await this.getEmailTemplate(templateId);
        if (!template) return null;

        let asunto = template.asunto;
        let cuerpo = template.cuerpo;

        // Reemplazar variables en el template
        Object.entries(variables).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            asunto = asunto.replace(new RegExp(placeholder, 'g'), value);
            cuerpo = cuerpo.replace(new RegExp(placeholder, 'g'), value);
        });

        // Incrementar contador de uso
        await this.supabase
            .from('email_plantillas')
            .update({
                usado_count: template.usado_count + 1
            })
            .eq('id', templateId);

        return { asunto, cuerpo };
    }

    // ===============================================
    // AUTOMATIZACIONES
    // ===============================================

    async sendAutomatedEmail(tipo: EmailMessage['tipo'], destinatarios: string[], variables: Record<string, string>): Promise<boolean> {
        try {
            // Buscar plantilla apropiada
            const templates = await this.getEmailTemplates();
            const template = templates.find(t => t.tipo === tipo);

            if (!template) {
                console.error(`No se encontró plantilla para tipo: ${tipo}`);
                return false;
            }

            // Generar contenido desde plantilla
            const emailContent = await this.generateEmailFromTemplate(template.id, variables);
            if (!emailContent) return false;

            // Enviar email
            const message: Omit<EmailMessage, 'id' | 'fecha_creacion' | 'fecha_actualizacion'> = {
                email_origen: 'info@rubiogarciadental.com',
                email_destino: destinatarios,
                asunto: emailContent.asunto,
                cuerpo: emailContent.cuerpo,
                tipo,
                plantillas_id: template.id,
                estado_envio: 'pendiente'
            };

            return await this.sendEmail(message);
        } catch (error) {
            console.error('Error enviando email automatizado:', error);
            return false;
        }
    }

    // ===============================================
    // ESTADÍSTICAS
    // ===============================================

    async getEmailStatistics(): Promise<EmailStatistics> {
        try {
            const hoy = new Date().toISOString().split('T')[0];

            const [enviadosHoy, recibidosHoy, erroresEnvio, mensajesPendientes, totalEnviados, totalRecibidos] = await Promise.all([
                this.supabase
                    .from('email_mensajes')
                    .select('id', { count: 'exact' })
                    .eq('fecha_envio', hoy),
                
                this.supabase
                    .from('email_mensajes_recibidos')
                    .select('id', { count: 'exact' })
                    .eq('fecha_recepcion', hoy),
                
                this.supabase
                    .from('email_mensajes')
                    .select('id', { count: 'exact' })
                    .eq('estado_envio', 'error'),
                
                this.supabase
                    .from('email_mensajes')
                    .select('id', { count: 'exact' })
                    .eq('estado_envio', 'pendiente'),
                
                this.supabase
                    .from('email_mensajes')
                    .select('id', { count: 'exact' })
                    .eq('estado_envio', 'enviado'),
                
                this.supabase
                    .from('email_mensajes_recibidos')
                    .select('id', { count: 'exact' })
            ]);

            return {
                total_enviados: totalEnviados.count || 0,
                total_recibidos: totalRecibidos.count || 0,
                enviados_hoy: enviadosHoy.count || 0,
                recibidos_hoy: recibidosHoy.count || 0,
                errores_envio: erroresEnvio.count || 0,
                mensajes_pendientes: mensajesPendientes.count || 0
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas de email:', error);
            return {
                total_enviados: 0,
                total_recibidos: 0,
                enviados_hoy: 0,
                recibidos_hoy: 0,
                errores_envio: 0,
                mensajes_pendientes: 0
            };
        }
    }

    // ===============================================
    // INTEGRACIÓN CON OTROS MÓDULOS
    // ===============================================

    async sendAppointmentReminder(appointment: any): Promise<boolean> {
        const variables = {
            nombre_paciente: appointment.paciente?.nombre || 'Paciente',
            fecha_cita: new Date(appointment.fecha_cita).toLocaleDateString(),
            hora_cita: appointment.hora_inicio,
            doctor: appointment.doctor?.nombre || 'Doctor',
            clinica: 'Clínica Dental Rubio García'
        };

        return await this.sendAutomatedEmail(
            'recordatorio',
            [appointment.paciente?.email].filter(Boolean),
            variables
        );
    }

    async sendUrgentNotification(urgency: any): Promise<boolean> {
        const variables = {
            tipo_urgencia: urgency.tipo,
            mensaje: urgency.mensaje,
            fecha: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString()
        };

        // Enviar a médicos y personal
        const destinatarios = [
            'dr.rubio@rubiogarciadental.com',
            'recepcion@rubiogarciadental.com'
        ];

        return await this.sendAutomatedEmail(
            'urgencia',
            destinatarios,
            variables
        );
    }

    async sendInvoiceEmail(invoice: any): Promise<boolean> {
        const variables = {
            nombre_paciente: invoice.paciente?.nombre || 'Paciente',
            numero_factura: invoice.numero_factura,
            importe_total: `${invoice.importe_total}€`,
            fecha_vencimiento: new Date(invoice.fecha_vencimiento).toLocaleDateString(),
            clinica: 'Clínica Dental Rubio García'
        };

        return await this.sendAutomatedEmail(
            'factura',
            [invoice.paciente?.email].filter(Boolean),
            variables
        );
    }
}

export default EmailService;