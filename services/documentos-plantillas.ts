// ===============================================
// SERVICIO DE DOCUMENTOS Y PLANTILLAS - MÓDULO COMPLETO
// Sistema de Gestión Integral - Rubio García Dental
// ===============================================

import { createClient } from '@supabase/supabase-js';

export interface DocumentTemplate {
    id: string;
    nombre: string;
    tipo: 'consentimiento' | 'presupuesto' | 'factura' | 'informe' | 'receta' | 'presupuesto_tratamiento' | 'alta_paciente';
    categoria: 'medico' | 'legal' | 'financiero' | 'administrativo';
    contenido: string;
    variables: TemplateVariable[];
    formato: 'html' | 'pdf' | 'docx' | 'txt';
    activo: boolean;
    usado_count: number;
    ultima_modificacion: string;
    autor: string;
    version: string;
    tags: string[];
    fecha_creacion: string;
}

export interface TemplateVariable {
    nombre: string;
    tipo: 'texto' | 'fecha' | 'numero' | 'booleano' | 'lista' | 'imagen';
    requerido: boolean;
    valor_por_defecto?: any;
    descripcion: string;
    opciones?: string[]; // Para tipo lista
    formato?: string; // Para fechas, números
}

export interface GeneratedDocument {
    id: string;
    plantilla_id: string;
    nombre_documento: string;
    contenido_generado: string;
    variables_usadas: Record<string, any>;
    formato_salida: 'html' | 'pdf' | 'docx';
    estado_generacion: 'pendiente' | 'generando' | 'completado' | 'error';
    archivo_url?: string;
    metadata: {
        paciente_id?: string;
        cita_id?: string;
        usuario_generador: string;
        fecha_generacion: string;
        tamano_archivo?: number;
    };
    firma_digital?: {
        firmado: boolean;
        certificado?: string;
        timestamp_firma?: string;
    };
    fecha_creacion: string;
}

export interface DocumentSignature {
    id: string;
    documento_id: string;
    firmante: string;
    tipo_firma: 'digital' | 'biometrica' | 'pin' | 'huella';
    certificado_digital?: string;
    datos_biometricos?: string;
    timestamp_firma: string;
    ip_origen: string;
    validez: 'valido' | 'caducado' | 'revocado';
    fecha_creacion: string;
}

export interface DocumentWorkflow {
    id: string;
    documento_id: string;
    estados: WorkflowState[];
    estado_actual: string;
    participantes: WorkflowParticipant[];
    fecha_inicio: string;
    fecha_finalizacion?: string;
}

export interface WorkflowState {
    id: string;
    nombre: string;
    descripcion: string;
    requerido: boolean;
    firma_requerida: boolean;
    orden: number;
    completado: boolean;
    timestamp?: string;
    usuario?: string;
}

export interface WorkflowParticipant {
    usuario_id: string;
    nombre: string;
    rol: string;
    email: string;
    notificaciones: boolean;
    activo: boolean;
}

class DocumentosPlantillasService {
    private supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ===============================================
    // GESTIÓN DE PLANTILLAS
    // ===============================================

    async getDocumentTemplates(): Promise<DocumentTemplate[]> {
        const { data, error } = await this.supabase
            .from('document_templates')
            .select('*')
            .eq('activo', true)
            .order('categoria, tipo, nombre');

        if (error) {
            console.error('Error obteniendo plantillas de documentos:', error);
            return [];
        }

        return data || [];
    }

    async getTemplateById(id: string): Promise<DocumentTemplate | null> {
        const { data, error } = await this.supabase
            .from('document_templates')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error obteniendo plantilla:', error);
            return null;
        }

        return data;
    }

    async getTemplatesByType(tipo: DocumentTemplate['tipo']): Promise<DocumentTemplate[]> {
        const { data, error } = await this.supabase
            .from('document_templates')
            .select('*')
            .eq('tipo', tipo)
            .eq('activo', true)
            .order('nombre');

        if (error) {
            console.error(`Error obteniendo plantillas de tipo ${tipo}:`, error);
            return [];
        }

        return data || [];
    }

    async createDocumentTemplate(template: Omit<DocumentTemplate, 'id' | 'usado_count' | 'ultima_modificacion' | 'fecha_creacion'>): Promise<string | null> {
        const templateData = {
            ...template,
            usado_count: 0,
            ultima_modificacion: new Date().toISOString(),
            fecha_creacion: new Date().toISOString()
        };

        const { data, error } = await this.supabase
            .from('document_templates')
            .insert([templateData])
            .select('id')
            .single();

        if (error) {
            console.error('Error creando plantilla de documento:', error);
            return null;
        }

        return data.id;
    }

    async updateDocumentTemplate(id: string, updates: Partial<DocumentTemplate>): Promise<boolean> {
        const updateData = {
            ...updates,
            ultima_modificacion: new Date().toISOString()
        };

        const { error } = await this.supabase
            .from('document_templates')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error('Error actualizando plantilla de documento:', error);
            return false;
        }

        return true;
    }

    async deleteDocumentTemplate(id: string): Promise<boolean> {
        // Soft delete - marcar como inactivo
        const { error } = await this.supabase
            .from('document_templates')
            .update({
                activo: false,
                ultima_modificacion: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error eliminando plantilla de documento:', error);
            return false;
        }

        return true;
    }

    async duplicateTemplate(id: string, nuevoNombre: string): Promise<string | null> {
        const originalTemplate = await this.getTemplateById(id);
        if (!originalTemplate) return null;

        const duplicatedTemplate = {
            ...originalTemplate,
            nombre: nuevoNombre,
            usado_count: 0,
            version: `1.0`
        };

        delete (duplicatedTemplate as any).id;
        delete (duplicatedTemplate as any).fecha_creacion;

        return await this.createDocumentTemplate(duplicatedTemplate);
    }

    // ===============================================
    // GENERACIÓN DE DOCUMENTOS
    // ===============================================

    async generateDocument(templateId: string, variables: Record<string, any>, metadata: any): Promise<string | null> {
        try {
            const template = await this.getTemplateById(templateId);
            if (!template) {
                console.error('Plantilla no encontrada:', templateId);
                return null;
            }

            // Validar variables requeridas
            const validation = this.validateRequiredVariables(template.variables, variables);
            if (!validation.isValid) {
                throw new Error(`Variables requeridas faltantes: ${validation.missing.join(', ')}`);
            }

            // Generar contenido
            const contenidoGenerado = this.processTemplate(template.contenido, variables);

            // Crear documento
            const documentoData = {
                plantilla_id: templateId,
                nombre_documento: `${template.nombre}_${new Date().toISOString().split('T')[0]}`,
                contenido_generado: contenidoGenerado,
                variables_usadas: variables,
                formato_salida: template.formato,
                estado_generacion: 'generando',
                metadata: {
                    ...metadata,
                    fecha_generacion: new Date().toISOString()
                }
            };

            const { data, error } = await this.supabase
                .from('generated_documents')
                .insert([documentoData])
                .select('id')
                .single();

            if (error) {
                console.error('Error creando documento generado:', error);
                return null;
            }

            // Simular generación de archivo
            setTimeout(async () => {
                await this.supabase
                    .from('generated_documents')
                    .update({
                        estado_generacion: 'completado',
                        archivo_url: `/documents/${data.id}.pdf`
                    })
                    .eq('id', data.id);
            }, 2000);

            // Actualizar contador de uso de plantilla
            await this.updateTemplateUsage(templateId);

            return data.id;

        } catch (error) {
            console.error('Error generando documento:', error);
            return null;
        }
    }

    private validateRequiredVariables(variables: TemplateVariable[], values: Record<string, any>): {
        isValid: boolean;
        missing: string[];
    } {
        const missing = variables
            .filter(v => v.requerido && !values[v.nombre])
            .map(v => v.nombre);

        return {
            isValid: missing.length === 0,
            missing
        };
    }

    private processTemplate(contenido: string, variables: Record<string, any>): string {
        let resultado = contenido;

        // Reemplazar variables simples {{variable}}
        Object.entries(variables).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            resultado = resultado.replace(new RegExp(placeholder, 'g'), String(value));
        });

        // Procesar variables con formato {{variable|formato}}
        const formatRegex = /\{\{(\w+)\|([^}]+)\}\}/g;
        resultado = resultado.replace(formatRegex, (match, key, format) => {
            const value = variables[key];
            if (!value) return match;

            switch (format) {
                case 'uppercase':
                    return String(value).toUpperCase();
                case 'lowercase':
                    return String(value).toLowerCase();
                case 'capitalize':
                    return String(value).replace(/\b\w/g, l => l.toUpperCase());
                case 'date':
                    return new Date(value).toLocaleDateString('es-ES');
                case 'currency':
                    return `${Number(value).toFixed(2)} €`;
                case 'number':
                    return Number(value).toLocaleString('es-ES');
                default:
                    return String(value);
            }
        });

        // Procesar condicionales {% if variable %}...{% endif %}
        const ifRegex = /\{\%\s*if\s+(\w+)\s*\%\}(.*?)\{\%\s*endif\s*\%\}/gs;
        resultado = resultado.replace(ifRegex, (match, condition, content) => {
            const value = variables[condition];
            return value ? content : '';
        });

        // Procesar bucles {% for item in lista %}...{% endfor %}
        const forRegex = /\{\%\s*for\s+(\w+)\s+in\s+(\w+)\s*\%\}(.*?)\{\%\s*endfor\s*\%\}/gs;
        resultado = resultado.replace(forRegex, (match, item, list, content) => {
            const items = variables[list];
            if (!Array.isArray(items)) return '';

            return items.map((listItem: any) => {
                let itemContent = content;
                // Si el item es un objeto, reemplazar variables anidadas
                if (typeof listItem === 'object') {
                    Object.entries(listItem).forEach(([key, value]) => {
                        const itemPlaceholder = `{{${item}.${key}}}`;
                        itemContent = itemContent.replace(new RegExp(itemPlaceholder, 'g'), String(value));
                    });
                } else {
                    const itemPlaceholder = `{{${item}}}`;
                    itemContent = itemContent.replace(new RegExp(itemPlaceholder, 'g'), String(listItem));
                }
                return itemContent;
            }).join('');
        });

        return resultado;
    }

    private async updateTemplateUsage(templateId: string): Promise<void> {
        const { data, error } = await this.supabase
            .from('document_templates')
            .select('usado_count')
            .eq('id', templateId)
            .single();

        if (!error && data) {
            await this.supabase
                .from('document_templates')
                .update({
                    usado_count: data.usado_count + 1
                })
                .eq('id', templateId);
        }
    }

    // ===============================================
    // GESTIÓN DE DOCUMENTOS GENERADOS
    // ===============================================

    async getGeneratedDocuments(filters?: {
        paciente_id?: string;
        plantilla_id?: string;
        estado?: GeneratedDocument['estado_generacion'];
        limit?: number;
    }): Promise<GeneratedDocument[]> {
        let query = this.supabase
            .from('generated_documents')
            .select('*')
            .order('fecha_creacion', { ascending: false });

        if (filters?.paciente_id) {
            query = query.eq('metadata->>paciente_id', filters.paciente_id);
        }

        if (filters?.plantilla_id) {
            query = query.eq('plantilla_id', filters.plantilla_id);
        }

        if (filters?.estado) {
            query = query.eq('estado_generacion', filters.estado);
        }

        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error obteniendo documentos generados:', error);
            return [];
        }

        return data || [];
    }

    async getGeneratedDocument(id: string): Promise<GeneratedDocument | null> {
        const { data, error } = await this.supabase
            .from('generated_documents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error obteniendo documento generado:', error);
            return null;
        }

        return data;
    }

    async updateGeneratedDocument(id: string, updates: Partial<GeneratedDocument>): Promise<boolean> {
        const { error } = await this.supabase
            .from('generated_documents')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error actualizando documento generado:', error);
            return false;
        }

        return true;
    }

    async deleteGeneratedDocument(id: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('generated_documents')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error eliminando documento generado:', error);
            return false;
        }

        return true;
    }

    // ===============================================
    // FIRMA DIGITAL
    // ===============================================

    async signDocument(documentId: string, signingData: {
        firmante: string;
        tipo_firma: DocumentSignature['tipo_firma'];
        certificado_digital?: string;
        datos_biometricos?: string;
        ip_origen: string;
    }): Promise<string | null> {
        try {
            // Verificar que el documento existe
            const documento = await this.getGeneratedDocument(documentId);
            if (!documento) {
                throw new Error('Documento no encontrado');
            }

            // Crear firma
            const signatureData = {
                documento_id: documentId,
                firmante: signingData.firmante,
                tipo_firma: signingData.tipo_firma,
                certificado_digital: signingData.certificado_digital,
                datos_biometricos: signingData.datos_biometricos,
                timestamp_firma: new Date().toISOString(),
                ip_origen: signingData.ip_origen,
                validez: 'valido'
            };

            const { data, error } = await this.supabase
                .from('document_signatures')
                .insert([signatureData])
                .select('id')
                .single();

            if (error) {
                console.error('Error creando firma digital:', error);
                return null;
            }

            // Actualizar documento con firma
            await this.supabase
                .from('generated_documents')
                .update({
                    firma_digital: {
                        firmado: true,
                        certificado: signingData.certificado_digital,
                        timestamp_firma: signatureData.timestamp_firma
                    }
                })
                .eq('id', documentId);

            return data.id;

        } catch (error) {
            console.error('Error firmando documento:', error);
            return null;
        }
    }

    async getDocumentSignatures(documentId: string): Promise<DocumentSignature[]> {
        const { data, error } = await this.supabase
            .from('document_signatures')
            .select('*')
            .eq('documento_id', documentId)
            .order('timestamp_firma', { ascending: false });

        if (error) {
            console.error('Error obteniendo firmas del documento:', error);
            return [];
        }

        return data || [];
    }

    // ===============================================
    // WORKFLOWS DE DOCUMENTOS
    // ===============================================

    async createDocumentWorkflow(documentoId: string, workflow: Omit<DocumentWorkflow, 'id' | 'fecha_inicio'>): Promise<string | null> {
        const workflowData = {
            ...workflow,
            documento_id: documentoId,
            fecha_inicio: new Date().toISOString()
        };

        const { data, error } = await this.supabase
            .from('document_workflows')
            .insert([workflowData])
            .select('id')
            .single();

        if (error) {
            console.error('Error creando workflow de documento:', error);
            return null;
        }

        return data.id;
    }

    async getDocumentWorkflow(documentoId: string): Promise<DocumentWorkflow | null> {
        const { data, error } = await this.supabase
            .from('document_workflows')
            .select('*')
            .eq('documento_id', documentoId)
            .single();

        if (error) {
            console.error('Error obteniendo workflow de documento:', error);
            return null;
        }

        return data;
    }

    async updateWorkflowState(workflowId: string, stateId: string, usuario: string): Promise<boolean> {
        // Actualizar estado específico como completado
        const workflow = await this.getWorkflowById(workflowId);
        if (!workflow) return false;

        const updatedStates = workflow.estados.map(state => {
            if (state.id === stateId) {
                return {
                    ...state,
                    completado: true,
                    timestamp: new Date().toISOString(),
                    usuario
                };
            }
            return state;
        });

        // Verificar si todos los estados requeridos están completados
        const allRequiredCompleted = updatedStates
            .filter(s => s.requerido)
            .every(s => s.completado);

        const { error } = await this.supabase
            .from('document_workflows')
            .update({
                estados: updatedStates,
                estado_actual: allRequiredCompleted ? 'completado' : 'en_proceso',
                fecha_finalizacion: allRequiredCompleted ? new Date().toISOString() : null
            })
            .eq('id', workflowId);

        if (error) {
            console.error('Error actualizando estado de workflow:', error);
            return false;
        }

        return true;
    }

    private async getWorkflowById(workflowId: string): Promise<DocumentWorkflow | null> {
        const { data, error } = await this.supabase
            .from('document_workflows')
            .select('*')
            .eq('id', workflowId)
            .single();

        if (error) {
            console.error('Error obteniendo workflow:', error);
            return null;
        }

        return data;
    }

    // ===============================================
    // PLANTILLAS PREDEFINIDAS
    // ===============================================

    async createDefaultTemplates(): Promise<void> {
        const defaultTemplates = [
            {
                nombre: 'Consentimiento Informado General',
                tipo: 'consentimiento',
                categoria: 'legal',
                contenido: `
<h1>CONSENTIMIENTO INFORMADO</h1>
<h2>Tratamiento Dental</h2>

<p><strong>Paciente:</strong> {{nombre_paciente}}</p>
<p><strong>DNI:</strong> {{dni_paciente}}</p>
<p><strong>Fecha:</strong> {{fecha_actual}}</p>

<h3>Tratamiento Propuesto</h3>
<p>{{descripcion_tratamiento}}</p>

<h3>Riesgos y Beneficios</h3>
<p>{{riesgos_beneficios}}</p>

<h3>Alternativas</h3>
<p>{{alternativas_tratamiento}}</p>

<p>He leído y comprendido la información proporcionada. Acepto el tratamiento propuesto.</p>

<div style="margin-top: 50px;">
    <p>Firma del Paciente: ________________________</p>
    <p>Fecha: {{fecha_actual}}</p>
</div>
                `,
                variables: [
                    { nombre: 'nombre_paciente', tipo: 'texto', requerido: true, descripcion: 'Nombre completo del paciente' },
                    { nombre: 'dni_paciente', tipo: 'texto', requerido: true, descripcion: 'DNI del paciente' },
                    { nombre: 'fecha_actual', tipo: 'fecha', requerido: true, descripcion: 'Fecha actual' },
                    { nombre: 'descripcion_tratamiento', tipo: 'texto', requerido: true, descripcion: 'Descripción del tratamiento' },
                    { nombre: 'riesgos_beneficios', tipo: 'texto', requerido: true, descripcion: 'Riesgos y beneficios del tratamiento' },
                    { nombre: 'alternativas_tratamiento', tipo: 'texto', requerido: false, descripcion: 'Alternativas de tratamiento' }
                ],
                formato: 'html',
                autor: 'Sistema',
                version: '1.0',
                tags: ['consentimiento', 'legal', 'general']
            },
            {
                nombre: 'Presupuesto de Tratamiento',
                tipo: 'presupuesto_tratamiento',
                categoria: 'financiero',
                contenido: `
<h1>PRESUPUESTO DE TRATAMIENTO DENTAL</h1>

<p><strong>Paciente:</strong> {{nombre_paciente}}</p>
<p><strong>DNI:</strong> {{dni_paciente}}</p>
<p><strong>Fecha:</strong> {{fecha_actual}}</p>

<h3>Tratamientos Propuestos</h3>
<table border="1" style="width: 100%; border-collapse: collapse;">
    <tr>
        <th>Tratamiento</th>
        <th>Descripción</th>
        <th>Precio</th>
    </tr>
    {{#tratamientos}}
    <tr>
        <td>{{nombre_tratamiento}}</td>
        <td>{{descripcion}}</td>
        <td>{{precio}} €</td>
    </tr>
    {{/tratamientos}}
    <tr>
        <td colspan="2"><strong>Total:</strong></td>
        <td><strong>{{total_presupuesto}} €</strong></td>
    </tr>
</table>

<h3>Forma de Pago</h3>
<p>{{forma_pago}}</p>

<h3>Validez del Presupuesto</h3>
<p>Este presupuesto tiene una validez de {{validez_dias}} días desde la fecha de emisión.</p>

<p>El presupuesto incluye únicamente los tratamientos especificados. Cualquier tratamiento adicional será presupuestado por separado.</p>

<div style="margin-top: 50px;">
    <p>Firma del Paciente: ________________________</p>
    <p>Fecha: {{fecha_actual}}</p>
</div>
                `,
                variables: [
                    { nombre: 'nombre_paciente', tipo: 'texto', requerido: true, descripcion: 'Nombre del paciente' },
                    { nombre: 'dni_paciente', tipo: 'texto', requerido: true, descripcion: 'DNI del paciente' },
                    { nombre: 'fecha_actual', tipo: 'fecha', requerido: true, descripcion: 'Fecha actual' },
                    { nombre: 'tratamientos', tipo: 'lista', requerido: true, descripcion: 'Lista de tratamientos' },
                    { nombre: 'total_presupuesto', tipo: 'numero', requerido: true, descripcion: 'Total del presupuesto' },
                    { nombre: 'forma_pago', tipo: 'texto', requerido: true, descripcion: 'Forma de pago propuesta' },
                    { nombre: 'validez_dias', tipo: 'numero', requerido: true, descripcion: 'Días de validez del presupuesto' }
                ],
                formato: 'html',
                autor: 'Sistema',
                version: '1.0',
                tags: ['presupuesto', 'financiero']
            }
        ];

        for (const template of defaultTemplates) {
            await this.createDocumentTemplate(template);
        }
    }

    // ===============================================
    // ESTADÍSTICAS
    // ===============================================

    async getDocumentStatistics(): Promise<{
        total_plantillas: number;
        plantillas_por_tipo: Record<string, number>;
        documentos_generados_hoy: number;
        documentos_firmados: number;
        plantillas_mas_usadas: DocumentTemplate[];
    }> {
        try {
            const [templates, documentsToday, signedDocuments] = await Promise.all([
                this.getDocumentTemplates(),
                this.getDocumentsGeneratedToday(),
                this.getSignedDocumentsCount()
            ]);

            const plantillasPorTipo = templates.reduce((acc, template) => {
                acc[template.tipo] = (acc[template.tipo] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const plantillasMasUsadas = templates
                .sort((a, b) => b.usado_count - a.usado_count)
                .slice(0, 5);

            return {
                total_plantillas: templates.length,
                plantillas_por_tipo: plantillasPorTipo,
                documentos_generados_hoy: documentsToday,
                documentos_firmados: signedDocuments,
                plantillas_mas_usadas: plantillasMasUsadas
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas de documentos:', error);
            return {
                total_plantillas: 0,
                plantillas_por_tipo: {},
                documentos_generados_hoy: 0,
                documentos_firmados: 0,
                plantillas_mas_usadas: []
            };
        }
    }

    private async getDocumentsGeneratedToday(): Promise<number> {
        const hoy = new Date().toISOString().split('T')[0];
        
        const { count, error } = await this.supabase
            .from('generated_documents')
            .select('*', { count: 'exact', head: true })
            .gte('fecha_creacion', `${hoy}T00:00:00`)
            .lt('fecha_creacion', `${hoy}T23:59:59`);

        if (error) return 0;
        return count || 0;
    }

    private async getSignedDocumentsCount(): Promise<number> {
        const { count, error } = await this.supabase
            .from('generated_documents')
            .select('*', { count: 'exact', head: true })
            .not('firma_digital', 'is', null);

        if (error) return 0;
        return count || 0;
    }
}

export default DocumentosPlantillasService;