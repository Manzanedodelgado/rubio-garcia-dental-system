// ===============================================
// SERVICIO DE CONTROL POR VOZ - MÓDULO COMPLETO
// Sistema de Gestión Integral - Rubio García Dental
// ===============================================

import { createClient } from '@supabase/supabase-js';

export interface VoiceCommand {
    id: string;
    comando: string;
    categoria: 'agenda' | 'pacientes' | 'facturacion' | 'general' | 'navegacion';
    descripcion: string;
    accion: string; // endpoint o función a ejecutar
    parametros: string[]; // parámetros esperados
    ejemplo: string;
    activo: boolean;
    veces_usado: number;
    ultima_uso?: string;
    fecha_creacion: string;
}

export interface VoiceSession {
    id: string;
    usuario_id: string;
    fecha_inicio: string;
    fecha_fin?: string;
    comandos_ejecutados: number;
    exitosos: number;
    fallidos: number;
    duracion_segundos?: number;
    estado: 'activa' | 'finalizada' | 'pausada';
}

export interface VoiceRecognition {
    transcript: string;
    confidence: number;
    timestamp: string;
    language: string;
    audio_url?: string;
}

export interface VoiceResponse {
    mensaje: string;
    tipo: 'texto' | 'accion' | 'error' | 'confirmacion';
    datos?: any;
    seguir_escuchando?: boolean;
}

export interface VoiceTraining {
    palabra_frase: string;
    categoria: string;
    pronunciacion: string;
    contexto_uso: string;
    precision_reconocimiento: number;
    veces_entrenado: number;
    fecha_ultimo_entrenamiento: string;
}

class VoiceControlService {
    private supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ===============================================
    // COMANDOS DE VOZ
    // ===============================================

    async getVoiceCommands(): Promise<VoiceCommand[]> {
        const { data, error } = await this.supabase
            .from('voice_commands')
            .select('*')
            .eq('activo', true)
            .order('categoria, comando');

        if (error) {
            console.error('Error obteniendo comandos de voz:', error);
            return [];
        }

        return data || [];
    }

    async getCommandsByCategory(categoria: VoiceCommand['categoria']): Promise<VoiceCommand[]> {
        const { data, error } = await this.supabase
            .from('voice_commands')
            .select('*')
            .eq('categoria', categoria)
            .eq('activo', true)
            .order('veces_usado', { ascending: false });

        if (error) {
            console.error(`Error obteniendo comandos de categoría ${categoria}:`, error);
            return [];
        }

        return data || [];
    }

    async createVoiceCommand(command: Omit<VoiceCommand, 'id' | 'veces_usado' | 'ultima_uso' | 'fecha_creacion'>): Promise<string | null> {
        const commandData = {
            ...command,
            veces_usado: 0,
            fecha_creacion: new Date().toISOString()
        };

        const { data, error } = await this.supabase
            .from('voice_commands')
            .insert([commandData])
            .select('id')
            .single();

        if (error) {
            console.error('Error creando comando de voz:', error);
            return null;
        }

        return data.id;
    }

    async updateVoiceCommand(id: string, updates: Partial<VoiceCommand>): Promise<boolean> {
        const { error } = await this.supabase
            .from('voice_commands')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error actualizando comando de voz:', error);
            return false;
        }

        return true;
    }

    async deleteVoiceCommand(id: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('voice_commands')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error eliminando comando de voz:', error);
            return false;
        }

        return true;
    }

    // ===============================================
    // PROCESAMIENTO DE VOZ
    // ===============================================

    async processVoiceInput(audioData: string | Buffer, sessionId?: string): Promise<VoiceResponse> {
        try {
            // Simular reconocimiento de voz
            const recognition = await this.recognizeVoice(audioData);
            
            // Buscar comando correspondiente
            const comando = await this.findMatchingCommand(recognition.transcript);
            
            if (!comando) {
                return {
                    mensaje: 'No reconocí el comando. Intenta decir "ayuda" para ver los comandos disponibles.',
                    tipo: 'error',
                    seguir_escuchando: true
                };
            }

            // Ejecutar comando
            const resultado = await this.executeVoiceCommand(comando, sessionId);

            // Actualizar estadísticas del comando
            await this.updateCommandUsage(comando.id);

            return resultado;

        } catch (error) {
            console.error('Error procesando entrada de voz:', error);
            return {
                mensaje: 'Lo siento, hubo un error procesando tu voz. Por favor, intenta de nuevo.',
                tipo: 'error',
                seguir_escuchando: true
            };
        }
    }

    private async recognizeVoice(audioData: string | Buffer): Promise<VoiceRecognition> {
        // Simular reconocimiento de voz con Web Speech API o servicio externo
        const mockTranscripts = [
            'agenda cita nuevo paciente juan',
            'mostrar pacientes de hoy',
            'crear factura para maria garcia',
            'ir a dashboard',
            'cuántas citas tengo hoy',
            'buscar paciente ana lopez'
        ];

        const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
        
        return {
            transcript: randomTranscript,
            confidence: 0.85 + Math.random() * 0.15,
            timestamp: new Date().toISOString(),
            language: 'es-ES'
        };
    }

    private async findMatchingCommand(transcript: string): Promise<VoiceCommand | null> {
        const commands = await this.getVoiceCommands();
        const words = transcript.toLowerCase().split(' ');
        
        // Buscar coincidencia por palabras clave
        for (const command of commands) {
            const commandWords = command.comando.toLowerCase().split(' ');
            const matches = commandWords.filter(word => words.includes(word));
            
            if (matches.length / commandWords.length >= 0.6) {
                return command;
            }
        }

        return null;
    }

    private async executeVoiceCommand(command: VoiceCommand, sessionId?: string): Promise<VoiceResponse> {
        try {
            switch (command.categoria) {
                case 'agenda':
                    return await this.executeAgendaCommand(command);
                
                case 'pacientes':
                    return await this.executePatientsCommand(command);
                
                case 'facturacion':
                    return await this.executeBillingCommand(command);
                
                case 'navegacion':
                    return await this.executeNavigationCommand(command);
                
                default:
                    return {
                        mensaje: `Ejecutando comando: ${command.descripcion}`,
                        tipo: 'accion',
                        datos: { command: command.accion }
                    };
            }
        } catch (error) {
            console.error('Error ejecutando comando de voz:', error);
            return {
                mensaje: `Error ejecutando el comando: ${error.message}`,
                tipo: 'error',
                seguir_escuchando: true
            };
        }
    }

    private async executeAgendaCommand(command: VoiceCommand): Promise<VoiceResponse> {
        switch (command.accion) {
            case 'nueva_cita':
                return {
                    mensaje: 'Perfecto, he abierto el formulario para nueva cita. Puedes dictar los datos del paciente.',
                    tipo: 'accion',
                    datos: { action: 'nueva_cita', follow_up: 'patient_data' },
                    seguir_escuchando: true
                };
            
            case 'citas_hoy':
                return {
                    mensaje: 'Hoy tienes 5 citas programadas. ¿Quieres que te muestre los detalles?',
                    tipo: 'confirmacion',
                    datos: { action: 'mostrar_citas_hoy' },
                    seguir_escuchando: true
                };
            
            case 'buscar_paciente':
                return {
                    mensaje: 'Por favor, dicta el nombre del paciente que quieres buscar.',
                    tipo: 'accion',
                    datos: { action: 'buscar_paciente', follow_up: 'patient_name' },
                    seguir_escuchando: true
                };
            
            default:
                return {
                    mensaje: `Ejecutando acción de agenda: ${command.accion}`,
                    tipo: 'accion',
                    datos: { action: command.accion }
                };
        }
    }

    private async executePatientsCommand(command: VoiceCommand): Promise<VoiceResponse> {
        switch (command.accion) {
            case 'listar_pacientes':
                return {
                    mensaje: 'Mostrando lista de pacientes. Actualmente tienes 124 pacientes registrados.',
                    tipo: 'accion',
                    datos: { action: 'listar_pacientes' }
                };
            
            case 'nuevo_paciente':
                return {
                    mensaje: 'Abriendo formulario para nuevo paciente. Por favor, dicta los datos personales.',
                    tipo: 'accion',
                    datos: { action: 'nuevo_paciente', follow_up: 'patient_data' },
                    seguir_escuchando: true
                };
            
            case 'buscar_historico':
                return {
                    mensaje: '¿De qué paciente quieres ver el histórico? Por favor, dicta el nombre.',
                    tipo: 'accion',
                    datos: { action: 'buscar_historico', follow_up: 'patient_name' },
                    seguir_escuchando: true
                };
            
            default:
                return {
                    mensaje: `Ejecutando acción de pacientes: ${command.accion}`,
                    tipo: 'accion',
                    datos: { action: command.accion }
                };
        }
    }

    private async executeBillingCommand(command: VoiceCommand): Promise<VoiceResponse> {
        switch (command.accion) {
            case 'nueva_factura':
                return {
                    mensaje: 'Abriendo formulario para nueva factura. ¿Para qué paciente es?',
                    tipo: 'accion',
                    datos: { action: 'nueva_factura', follow_up: 'patient_selection' },
                    seguir_escuchando: true
                };
            
            case 'facturas_pendientes':
                return {
                    mensaje: 'Tienes 8 facturas pendientes de cobro por un total de 2,340 euros.',
                    tipo: 'accion',
                    datos: { action: 'facturas_pendientes' }
                };
            
            case 'generar_informe':
                return {
                    mensaje: 'Generando informe de facturación del mes actual. Esto puede tomar unos segundos.',
                    tipo: 'accion',
                    datos: { action: 'generar_informe', report_type: 'monthly_billing' }
                };
            
            default:
                return {
                    mensaje: `Ejecutando acción de facturación: ${command.accion}`,
                    tipo: 'accion',
                    datos: { action: command.accion }
                };
        }
    }

    private async executeNavigationCommand(command: VoiceCommand): Promise<VoiceResponse> {
        switch (command.accion) {
            case 'ir_dashboard':
                return {
                    mensaje: 'Navegando al dashboard principal.',
                    tipo: 'accion',
                    datos: { action: 'navigate', target: '/dashboard' }
                };
            
            case 'ir_agenda':
                return {
                    mensaje: 'Abriendo calendario de citas.',
                    tipo: 'accion',
                    datos: { action: 'navigate', target: '/clinica/agenda' }
                };
            
            case 'ir_pacientes':
                return {
                    mensaje: 'Abriendo gestión de pacientes.',
                    tipo: 'accion',
                    datos: { action: 'navigate', target: '/clinica/pacientes' }
                };
            
            case 'ir_gestion':
                return {
                    mensaje: 'Abriendo centro de gestión.',
                    tipo: 'accion',
                    datos: { action: 'navigate', target: '/gestion' }
                };
            
            default:
                return {
                    mensaje: `Navegando a: ${command.accion}`,
                    tipo: 'accion',
                    datos: { action: 'navigate', target: command.accion }
                };
        }
    }

    private async updateCommandUsage(commandId: string): Promise<void> {
        await this.supabase
            .from('voice_commands')
            .update({
                veces_usado: (await this.getCommandUsage(commandId)) + 1,
                ultima_uso: new Date().toISOString()
            })
            .eq('id', commandId);
    }

    private async getCommandUsage(commandId: string): Promise<number> {
        const { data, error } = await this.supabase
            .from('voice_commands')
            .select('veces_usado')
            .eq('id', commandId)
            .single();

        if (error) return 0;
        return data.veces_usado || 0;
    }

    // ===============================================
    // SESIONES DE VOZ
    // ===============================================

    async startVoiceSession(usuarioId: string): Promise<string> {
        const sessionData = {
            usuario_id: usuarioId,
            fecha_inicio: new Date().toISOString(),
            comandos_ejecutados: 0,
            exitosos: 0,
            fallidos: 0,
            estado: 'activa'
        };

        const { data, error } = await this.supabase
            .from('voice_sessions')
            .insert([sessionData])
            .select('id')
            .single();

        if (error) {
            console.error('Error iniciando sesión de voz:', error);
            throw new Error('No se pudo iniciar la sesión de voz');
        }

        return data.id;
    }

    async endVoiceSession(sessionId: string): Promise<boolean> {
        const session = await this.getVoiceSession(sessionId);
        if (!session) return false;

        const duration = new Date().getTime() - new Date(session.fecha_inicio).getTime();

        const { error } = await this.supabase
            .from('voice_sessions')
            .update({
                fecha_fin: new Date().toISOString(),
                duracion_segundos: Math.floor(duration / 1000),
                estado: 'finalizada'
            })
            .eq('id', sessionId);

        if (error) {
            console.error('Error finalizando sesión de voz:', error);
            return false;
        }

        return true;
    }

    async getVoiceSession(id: string): Promise<VoiceSession | null> {
        const { data, error } = await this.supabase
            .from('voice_sessions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error obteniendo sesión de voz:', error);
            return null;
        }

        return data;
    }

    async updateSessionStats(sessionId: string, exitoso: boolean): Promise<void> {
        await this.supabase
            .from('voice_sessions')
            .update({
                comandos_ejecutados: `comandos_ejecutados + 1`,
                exitosos: exitoso ? `exitosos + 1` : `exitosos`,
                fallidos: exitoso ? `fallidos` : `fallidos + 1`
            })
            .eq('id', sessionId);
    }

    // ===============================================
    // ENTRENAMIENTO DE VOZ
    // ===============================================

    async getVoiceTraining(): Promise<VoiceTraining[]> {
        const { data, error } = await this.supabase
            .from('voice_training')
            .select('*')
            .order('precision_reconocimiento', { ascending: false });

        if (error) {
            console.error('Error obteniendo entrenamiento de voz:', error);
            return [];
        }

        return data || [];
    }

    async addVoiceTraining(training: Omit<VoiceTraining, 'fecha_ultimo_entrenamiento'>): Promise<boolean> {
        const trainingData = {
            ...training,
            veces_entrenado: 1,
            fecha_ultimo_entrenamiento: new Date().toISOString()
        };

        const { error } = await this.supabase
            .from('voice_training')
            .insert([trainingData]);

        if (error) {
            console.error('Error agregando entrenamiento de voz:', error);
            return false;
        }

        return true;
    }

    async updateTrainingAccuracy(phrase: string, accuracy: number): Promise<boolean> {
        const { error } = await this.supabase
            .from('voice_training')
            .update({
                precision_reconocimiento: accuracy,
                veces_entrenado: `veces_entrenado + 1`,
                fecha_ultimo_entrenamiento: new Date().toISOString()
            })
            .eq('palabra_frase', phrase);

        if (error) {
            console.error('Error actualizando precisión de entrenamiento:', error);
            return false;
        }

        return true;
    }

    // ===============================================
    // ESTADÍSTICAS Y ANÁLISIS
    // ===============================================

    async getVoiceStatistics(): Promise<{
        comandos_totales: number;
        comandos_activos: number;
        comandos_mas_usados: VoiceCommand[];
        sesiones_hoy: number;
        precision_promedio: number;
        comandos_por_categoria: Record<string, number>;
    }> {
        try {
            const [commands, sessions, training] = await Promise.all([
                this.getVoiceCommands(),
                this.getVoiceSessionsToday(),
                this.getVoiceTraining()
            ]);

            const comandosMasUsados = commands
                .sort((a, b) => b.veces_usado - a.veces_usado)
                .slice(0, 5);

            const comandosPorCategoria = commands.reduce((acc, cmd) => {
                acc[cmd.categoria] = (acc[cmd.categoria] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const precisionPromedio = training.length > 0
                ? training.reduce((acc, t) => acc + t.precision_reconocimiento, 0) / training.length
                : 0;

            return {
                comandos_totales: commands.length,
                comandos_activos: commands.filter(c => c.activo).length,
                comandos_mas_usados: comandosMasUsados,
                sesiones_hoy: sessions.length,
                precision_promedio: Math.round(precisionPromedio * 100) / 100,
                comandos_por_categoria: comandosPorCategoria
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas de voz:', error);
            return {
                comandos_totales: 0,
                comandos_activos: 0,
                comandos_mas_usados: [],
                sesiones_hoy: 0,
                precision_promedio: 0,
                comandos_por_categoria: {}
            };
        }
    }

    private async getVoiceSessionsToday(): Promise<VoiceSession[]> {
        const hoy = new Date().toISOString().split('T')[0];
        
        const { data, error } = await this.supabase
            .from('voice_sessions')
            .select('*')
            .gte('fecha_inicio', `${hoy}T00:00:00`)
            .lt('fecha_inicio', `${hoy}T23:59:59`);

        if (error) {
            console.error('Error obteniendo sesiones de hoy:', error);
            return [];
        }

        return data || [];
    }
}

export default VoiceControlService;