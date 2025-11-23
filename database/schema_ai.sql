-- =====================================================
-- ESQUEMA DE BASE DE DATOS - MÓDULO INTELIGENCIA ARTIFICIAL
-- Clínica Dental Rubio García
-- =====================================================

-- Tabla para conversaciones con IA
CREATE TABLE IF NOT EXISTS ai_conversaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    usuario_id UUID,
    usuario_tipo VARCHAR(20) CHECK (usuario_tipo IN ('paciente', 'staff', 'admin')) NOT NULL,
    contexto_pagina VARCHAR(100),
    estado VARCHAR(20) CHECK (estado IN ('activa', 'pausada', 'finalizada')) DEFAULT 'activa',
    modelo_ia VARCHAR(50) DEFAULT 'llama3',
    temperatura DECIMAL(3,2) DEFAULT 0.7,
    tokens_usados INTEGER DEFAULT 0,
    duracion_segundos INTEGER,
    satisfaccion_usuario INTEGER CHECK (satisfaccion_usuario BETWEEN 1 AND 5),
    feedback_usuario TEXT,
    tema_principal VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finalizada_at TIMESTAMP WITH TIME ZONE
);

-- Tabla para mensajes de IA
CREATE TABLE IF NOT EXISTS ai_mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id UUID REFERENCES ai_conversaciones(id) ON DELETE CASCADE,
    rol VARCHAR(20) CHECK (rol IN ('user', 'assistant', 'system')) NOT NULL,
    contenido TEXT NOT NULL,
    tokens_input INTEGER,
    tokens_output INTEGER,
    tiempo_procesamiento_ms INTEGER,
    confianza_modelo DECIMAL(3,2),
    modelo_usado VARCHAR(50) DEFAULT 'llama3',
    metadata JSONB DEFAULT '{}',
    editado BOOLEAN DEFAULT FALSE,
    fecha_mensaje TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para análisis de texto con IA
CREATE TABLE IF NOT EXISTS ai_analisis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_analisis VARCHAR(50) CHECK (tipo_analisis IN ('sentimiento', 'urgencia', 'categoria', 'resumen', 'traduccion')) NOT NULL,
    texto_original TEXT NOT NULL,
    resultado_analisis JSONB NOT NULL,
    confianza DECIMAL(3,2),
    modelo_ia VARCHAR(50) DEFAULT 'llama3',
    parametros JSONB DEFAULT '{}',
    fuente VARCHAR(50), -- 'whatsapp', 'email', 'chat', 'documento'
    fuente_id VARCHAR(255), -- ID del elemento analizado
    usuario_analista UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para plantillas de prompts de IA
CREATE TABLE IF NOT EXISTS ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    prompt_sistema TEXT NOT NULL,
    prompt_usuario TEXT,
    variables JSONB DEFAULT '[]',
    modelo_recomendado VARCHAR(50) DEFAULT 'llama3',
    temperatura DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 500,
    uso_contador INTEGER DEFAULT 0,
    activa BOOLEAN DEFAULT TRUE,
    descripcion TEXT,
    tags TEXT[],
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para recomendaciones de tratamiento con IA
CREATE TABLE IF NOT EXISTS ai_recomendaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    sintomas TEXT NOT NULL,
    historico_paciente JSONB,
    diagnostico_probable TEXT,
    tratamientos_recomendados TEXT[],
    nivel_urgencia VARCHAR(20) CHECK (nivel_urgencia IN ('bajo', 'medio', 'alto')) DEFAULT 'medio',
    proximos_pasos TEXT[],
    confianza_modelo DECIMAL(3,2),
    revisado_por_medico BOOLEAN DEFAULT FALSE,
    medico_revisor UUID,
    comentarios_medico TEXT,
    fecha_revision TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para documentos generados con IA
CREATE TABLE IF NOT EXISTS ai_documentos_generados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plantilla_prompt_id UUID REFERENCES ai_prompts(id),
    tipo_documento VARCHAR(50) CHECK (tipo_documento IN ('consentimiento', 'presupuesto', 'informe', 'explicacion', 'recordatorio')) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    contenido_generado TEXT NOT NULL,
    variables_usadas JSONB NOT NULL,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL,
    medico_id UUID,
    estado VARCHAR(20) CHECK (estado IN ('borrador', 'revisado', 'aprobado', 'enviado', 'descartado')) DEFAULT 'borrador',
    version INTEGER DEFAULT 1,
    palabras_clave TEXT[],
    aprobado_por UUID,
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para configuración de IA
CREATE TABLE IF NOT EXISTS ai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modelo_principal VARCHAR(50) DEFAULT 'llama3',
    modelo_backup VARCHAR(50) DEFAULT 'codellama',
    api_endpoint VARCHAR(500) NOT NULL,
    api_key VARCHAR(500),
    temperatura_default DECIMAL(3,2) DEFAULT 0.7,
    max_tokens_default INTEGER DEFAULT 500,
    timeout_segundos INTEGER DEFAULT 30,
    enable_analisis_automatico BOOLEAN DEFAULT TRUE,
    enable_recomendaciones BOOLEAN DEFAULT TRUE,
    enable_generacion_documentos BOOLEAN DEFAULT TRUE,
    idiomas_soportados TEXT[] DEFAULT ARRAY['es', 'en'],
    limites_uso_diarios JSONB DEFAULT '{"conversaciones": 1000, "analisis": 500, "documentos": 100}',
    configurado_por VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para métricas y estadísticas de IA
CREATE TABLE IF NOT EXISTS ai_metricas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE DEFAULT CURRENT_DATE,
    conversaciones_totales INTEGER DEFAULT 0,
    mensajes_procesados INTEGER DEFAULT 0,
    tokens_consumidos INTEGER DEFAULT 0,
    tiempo_responsa_promedio_ms INTEGER DEFAULT 0,
    precision_analisis DECIMAL(5,2), -- Porcentaje de aciertos en análisis
    satisfaccion_promedio DECIMAL(3,2),
    errores_totales INTEGER DEFAULT 0,
    uso_por_categoria JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para entrenamiento y mejora de IA
CREATE TABLE IF NOT EXISTS ai_entrenamiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria VARCHAR(50) NOT NULL,
    prompt_original TEXT NOT NULL,
    respuesta_original TEXT NOT NULL,
    respuesta_mejorada TEXT NOT NULL,
    mejora_detalles TEXT,
    validado_por_medico BOOLEAN DEFAULT FALSE,
    medico_validador UUID,
    fecha_validacion TIMESTAMP WITH TIME ZONE,
    usado_entramiento BOOLEAN DEFAULT FALSE,
    accuracy_score DECIMAL(3,2),
    feedback_medico TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VISTAS OPTIMIZADAS
-- =====================================================

-- Vista para conversaciones activas con estadísticas
CREATE OR REPLACE VIEW v_ai_conversaciones_activas AS
SELECT 
    c.id,
    c.session_id,
    c.usuario_tipo,
    c.contexto_pagina,
    c.modelo_ia,
    c.tema_principal,
    c.tokens_usados,
    c.duracion_segundos,
    c.satisfaccion_usuario,
    c.created_at,
    -- Conteo de mensajes
    (SELECT COUNT(*) FROM ai_mensajes WHERE conversacion_id = c.id) as total_mensajes,
    (SELECT COUNT(*) FROM ai_mensajes WHERE conversacion_id = c.id AND rol = 'user') as mensajes_usuario,
    (SELECT COUNT(*) FROM ai_mensajes WHERE conversacion_id = c.id AND rol = 'assistant') as mensajes_ia,
    -- Tiempo de procesamiento promedio
    ROUND(AVG(m.tiempo_procesamiento_ms), 2) as tiempo_procesamiento_promedio_ms,
    -- Última actividad
    (SELECT MAX(fecha_mensaje) FROM ai_mensajes WHERE conversacion_id = c.id) as ultima_actividad
FROM ai_conversaciones c
LEFT JOIN ai_mensajes m ON c.id = m.conversacion_id
WHERE c.estado = 'activa'
GROUP BY c.id, c.session_id, c.usuario_tipo, c.contexto_pagina, c.modelo_ia, c.tema_principal, c.tokens_usados, c.duracion_segundos, c.satisfaccion_usuario, c.created_at
ORDER BY c.created_at DESC;

-- Vista para análisis de sentiment de pacientes
CREATE OR REPLACE VIEW v_ai_sentiment_pacientes AS
SELECT 
    a.id,
    a.texto_original,
    a.resultado_analisis->>'sentiment' as sentiment,
    a.resultado_analisis->>'confidence' as confidence,
    a.resultado_analisis->>'emotions' as emotions,
    a.fuente,
    a.fuente_id,
    a.created_at,
    p.numero_paciente,
    p.nombre,
    p.apellido
FROM ai_analisis a
LEFT JOIN pacientes p ON a.fuente_id = p.id
WHERE a.tipo_analisis = 'sentiment'
ORDER BY a.created_at DESC;

-- Vista para métricas diarias de IA
CREATE OR REPLACE VIEW v_ai_metricas_diarias AS
SELECT 
    fecha,
    conversaciones_totales,
    mensajes_procesados,
    tokens_consumidos,
    tiempo_responsa_promedio_ms,
    precision_analisis,
    satisfaccion_promedio,
    errores_totales,
    uso_por_categoria,
    created_at
FROM ai_metricas
ORDER BY fecha DESC;

-- =====================================================
-- FUNCIONES ESPECIALIZADAS
-- =====================================================

-- Función para generar session ID único
CREATE OR REPLACE FUNCTION fn_generar_session_id()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'AI';
    timestamp_part TEXT := TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
    random_part TEXT := SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
BEGIN
    RETURN prefix || '_' || timestamp_part || '_' || random_part;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular tokens aproximados
CREATE OR REPLACE FUNCTION fn_calcular_tokens(texto TEXT)
RETURNS INTEGER AS $$
BEGIN
    -- Estimación aproximada: 1 token ≈ 4 caracteres en español
    RETURN CEIL(LENGTH(texto) / 4);
END;
$$ LANGUAGE plpgsql;

-- Función para obtener recomendaciones de IA
CREATE OR REPLACE FUNCTION fn_obtener_recomendaciones_ia(paciente_uuid UUID, sintomas_texto TEXT)
RETURNS TABLE (
    diagnostico TEXT,
    tratamientos TEXT[],
    urgencia VARCHAR(20),
    pasos TEXT[],
    confianza DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.diagnostico_probable as diagnostico,
        r.tratamientos_recomendados,
        r.nivel_urgencia,
        r.proximos_pasos,
        r.confianza_modelo
    FROM ai_recomendaciones r
    WHERE r.paciente_id = paciente_uuid
        AND r.created_at >= NOW() - INTERVAL '30 days'
    ORDER BY r.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Trigger para generar session ID automáticamente
CREATE TRIGGER trg_ai_session_id
    BEFORE INSERT ON ai_conversaciones
    FOR EACH ROW
    WHEN (NEW.session_id IS NULL)
    EXECUTE FUNCTION fn_generar_session_id();

-- Trigger para actualizar tokens automáticamente
CREATE TRIGGER trg_ai_actualizar_tokens
    AFTER INSERT ON ai_mensajes
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_tokens_conversacion();

-- Trigger para actualizar timestamps
CREATE TRIGGER trg_ai_conversaciones_update_timestamps
    BEFORE UPDATE ON ai_conversaciones
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trg_ai_prompts_update_timestamps
    BEFORE UPDATE ON ai_prompts
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trg_ai_documentos_update_timestamps
    BEFORE UPDATE ON ai_documentos_generados
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at_column();

-- =====================================================
-- FUNCIONES DE APOYO
-- =====================================================

-- Función para actualizar tokens de conversación
CREATE OR REPLACE FUNCTION fn_actualizar_tokens_conversacion()
RETURNS TRIGGER AS $$
DECLARE
    total_tokens INTEGER;
    total_input INTEGER;
    total_output INTEGER;
BEGIN
    -- Calcular totales de tokens
    SELECT 
        COALESCE(SUM(tokens_input), 0) + COALESCE(SUM(tokens_output), 0) as total,
        COALESCE(SUM(tokens_input), 0) as total_input,
        COALESCE(SUM(tokens_output), 0) as total_output
    INTO total_tokens, total_input, total_output
    FROM ai_mensajes 
    WHERE conversacion_id = NEW.conversacion_id;
    
    -- Actualizar conversación
    UPDATE ai_conversaciones 
    SET tokens_usados = total_tokens
    WHERE id = NEW.conversacion_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar configuración de IA por defecto
INSERT INTO ai_config (
    modelo_principal,
    modelo_backup,
    api_endpoint,
    configurado_por
) VALUES (
    'llama3',
    'codellama',
    'http://192.168.1.34:11434',
    'sistema'
) ON CONFLICT DO NOTHING;

-- Insertar prompts predefinidos
INSERT INTO ai_prompts (nombre, categoria, prompt_sistema, prompt_usuario, variables, modelo_recomendado, created_by) VALUES
('Asistente Dental Básico', 'asistencia', 
'Eres el asistente inteligente de la Clínica Dental Rubio García. Responde de manera profesional, amigable y precisa.',
'Usuario: {{mensaje}}\nResponde como asistente dental profesional.',
'["mensaje"]', 'llama3', 'sistema'),
('Análisis de Urgencia', 'analisis',
'Eres un sistema de análisis de urgencia médica dental. Evalúa la urgencia de los síntomas y proporciona recomendaciones.',
'Síntomas: {{sintomas}}\nPaciente: {{paciente}}\nEvalúa la urgencia (bajo/medio/alto) y proporciona explicación.',
'["sintomas", "paciente"]', 'llama3', 'sistema'),
('Generación de Consentimiento', 'documentos',
'Eres especializado en generar consentimientos informados para tratamientos dentales.',
'Genera un consentimiento para: {{tratamiento}}\nPaciente: {{paciente}}\nIncluye riesgos, beneficios y alternativas.',
'["tratamiento", "paciente"]', 'llama3', 'sistema'),
('Seguimiento Post-tratamiento', 'seguimiento',
'Eres el sistema de seguimiento post-tratamiento. Proporciona cuidados y señales de alerta.',
'Tratamiento: {{tratamiento}}\nDías post-tratamiento: {{dias}}\nProporciona cuidados y signos de alerta.',
'["tratamiento", "dias"]', 'llama3', 'sistema'),
('Explicación de Tratamientos', 'educacion',
'Eres especializado en explicar tratamientos dentales de forma comprensible para pacientes.',
'Explica el tratamiento: {{tratamiento}}\nPara paciente: {{nivel_comprension}}\nUsa lenguaje claro y accesible.',
'["tratamiento", "nivel_comprension"]', 'llama3', 'sistema');

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ai_conversaciones_usuario ON ai_conversaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversaciones_session ON ai_conversaciones(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversaciones_fecha ON ai_conversaciones(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversaciones_estado ON ai_conversaciones(estado);
CREATE INDEX IF NOT EXISTS idx_ai_mensajes_conversacion ON ai_mensajes(conversacion_id);
CREATE INDEX IF NOT EXISTS idx_ai_mensajes_rol ON ai_mensajes(rol);
CREATE INDEX IF NOT EXISTS idx_ai_mensajes_fecha ON ai_mensajes(fecha_mensaje);
CREATE INDEX IF NOT EXISTS idx_ai_analisis_tipo ON ai_analisis(tipo_analisis);
CREATE INDEX IF NOT EXISTS idx_ai_analisis_fuente ON ai_analisis(fuente, fuente_id);
CREATE INDEX IF NOT EXISTS idx_ai_analisis_fecha ON ai_analisis(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_recomendaciones_paciente ON ai_recomendaciones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_ai_recomendaciones_fecha ON ai_recomendaciones(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_documentos_paciente ON ai_documentos_generados(paciente_id);
CREATE INDEX IF NOT EXISTS idx_ai_documentos_tipo ON ai_documentos_generados(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_ai_metricas_fecha ON ai_metricas(fecha);

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE ai_conversaciones IS 'Conversaciones con IA incluyendo contexto y métricas';
COMMENT ON TABLE ai_mensajes IS 'Mensajes individuales de las conversaciones con tokens y metadata';
COMMENT ON TABLE ai_analisis IS 'Análisis de texto (sentiment, urgencia, categorización)';
COMMENT ON TABLE ai_prompts IS 'Plantillas de prompts reutilizables para diferentes casos de uso';
COMMENT ON TABLE ai_recomendaciones IS 'Recomendaciones de tratamiento generadas por IA';
COMMENT ON TABLE ai_documentos_generados IS 'Documentos generados automáticamente con IA';
COMMENT ON TABLE ai_config IS 'Configuración general del sistema de IA';
COMMENT ON TABLE ai_metricas IS 'Métricas diarias de uso y rendimiento del sistema IA';
COMMENT ON TABLE ai_entrenamiento IS 'Datos para mejora continua de los modelos IA';

COMMENT ON COLUMN ai_mensajes.tokens_input IS 'Número de tokens del mensaje de entrada';
COMMENT ON COLUMN ai_mensajes.tokens_output IS 'Número de tokens de la respuesta generada';
COMMENT ON COLUMN ai_mensajes.tiempo_procesamiento_ms IS 'Tiempo en milisegundos para generar la respuesta';
COMMENT ON COLUMN ai_analisis.resultado_analisis IS 'JSON con el resultado del análisis realizado';
COMMENT ON COLUMN ai_recomendaciones.confianza_modelo IS 'Nivel de confianza de la IA en su recomendación (0-1)';
COMMENT ON COLUMN ai_documentos_generados.variables_usadas IS 'JSON con las variables utilizadas para generar el documento';
COMMENT ON COLUMN ai_metricas.uso_por_categoria IS 'JSON con breakdown de uso por categoría de análisis';
COMMENT ON COLUMN ai_entrenamiento.accuracy_score IS 'Puntuación de precisión del modelo entrenado';