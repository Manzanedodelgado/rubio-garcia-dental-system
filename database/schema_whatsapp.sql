-- =====================================================
-- ESQUEMA DE BASE DE DATOS - MÓDULO WHATSAPP
-- Clínica Dental Rubio García
-- =====================================================

-- Tabla para mensajes de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telefono VARCHAR(20) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(10) CHECK (tipo IN ('entrante', 'saliente')) NOT NULL,
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'enviado', 'entregado', 'leido', 'urgente')) DEFAULT 'pendiente',
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL,
    requiere_respuesta BOOLEAN DEFAULT FALSE,
    resumen_urgencia TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para contactos de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_contactos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telefono VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255),
    apellido VARCHAR(255),
    email VARCHAR(255),
    tipo VARCHAR(20) CHECK (tipo IN ('paciente', 'prospecto', 'referencia')) DEFAULT 'prospecto',
    origen VARCHAR(20) CHECK (origen IN ('whatsapp', 'citas', 'manual', 'invitacion')) DEFAULT 'whatsapp',
    paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL,
    ultima_interaccion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notas TEXT,
    conversacion_id UUID,
    etiquetas TEXT[],
    activo BOOLEAN DEFAULT TRUE,
    bloqueado BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE,
    last_typing TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para conversaciones de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_conversaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contacto_id UUID REFERENCES whatsapp_contactos(id) ON DELETE CASCADE,
    telefono VARCHAR(20) NOT NULL,
    titulo VARCHAR(255),
    ultima_actividad TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mensajes_no_leidos INTEGER DEFAULT 0,
    estado VARCHAR(20) CHECK (estado IN ('activa', 'pausada', 'archivada')) DEFAULT 'activa',
    color VARCHAR(7) DEFAULT '#25D366', -- Color de WhatsApp
    emoji VARCHAR(10),
    archivada_en TIMESTAMP WITH TIME ZONE,
    creada_por VARCHAR(100) DEFAULT 'sistema',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para plantillas de mensajes
CREATE TABLE IF NOT EXISTS whatsapp_plantillas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    contenido TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    activa BOOLEAN DEFAULT TRUE,
    uso_contador INTEGER DEFAULT 0,
    descripcion TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para automatizaciones de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_automatizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('recordatorio', 'seguimiento', 'bienvenida', 'urgencia', 'confirmacion')) NOT NULL,
    trigger_condicion JSONB NOT NULL,
    respuesta_automatica TEXT NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    prioridad INTEGER DEFAULT 1,
    delay_minutos INTEGER DEFAULT 0,
    max_uso_dia INTEGER,
    uso_hoy INTEGER DEFAULT 0,
    ultima_ejecucion TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para configuración de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_principal VARCHAR(20) NOT NULL,
    nombre_business VARCHAR(255),
    descripcion TEXT,
    direccion TEXT,
    email VARCHAR(255),
    website VARCHAR(255),
    industria VARCHAR(100),
    horario_atencion JSONB DEFAULT '{}',
    mensaje_bienvenida TEXT,
    mensaje_ausencia TEXT,
    respuesta_rapida TEXT,
    qr_code_url TEXT,
    api_url VARCHAR(500),
    webhook_url VARCHAR(500),
    token_acceso VARCHAR(500),
    estado_conexion VARCHAR(20) DEFAULT 'desconectado',
    ultima_sincronizacion TIMESTAMP WITH TIME ZONE,
    configurado_por VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para logs de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(50) NOT NULL,
    nivel VARCHAR(20) CHECK (nivel IN ('info', 'warning', 'error', 'debug')) DEFAULT 'info',
    mensaje TEXT NOT NULL,
    telefono VARCHAR(20),
    datos_extra JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    procesado BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- VISTAS OPTIMIZADAS
-- =====================================================

-- Vista para mensajes urgentes
CREATE OR REPLACE VIEW v_whatsapp_mensajes_urgentes AS
SELECT 
    m.id,
    m.telefono,
    m.mensaje,
    m.fecha_envio,
    m.resumen_urgencia,
    c.nombre,
    c.apellido,
    c.paciente_id,
    p.numero_paciente
FROM whatsapp_messages m
LEFT JOIN whatsapp_contactos c ON m.telefono = c.telefono
LEFT JOIN pacientes p ON c.paciente_id = p.id
WHERE m.estado = 'urgente' 
    OR m.requiere_respuesta = TRUE
ORDER BY m.fecha_envio DESC;

-- Vista para conversaciones activas
CREATE OR REPLACE VIEW v_whatsapp_conversaciones_activas AS
SELECT 
    c.id,
    c.telefono,
    c.nombre,
    c.apellido,
    c.tipo,
    c.ultima_interaccion,
    c.conversacion_id,
    conv.mensajes_no_leidos,
    conv.estado,
    conv.color,
    conv.emoji,
    -- Último mensaje
    m.mensaje as ultimo_mensaje,
    m.fecha_envio as fecha_ultimo_mensaje,
    m.tipo as tipo_ultimo_mensaje,
    p.numero_paciente
FROM whatsapp_contactos c
LEFT JOIN whatsapp_conversaciones conv ON c.conversacion_id = conv.id
LEFT JOIN LATERAL (
    SELECT mensaje, fecha_envio, tipo 
    FROM whatsapp_messages 
    WHERE telefono = c.telefono 
    ORDER BY fecha_envio DESC 
    LIMIT 1
) m ON TRUE
LEFT JOIN pacientes p ON c.paciente_id = p.id
WHERE c.activo = TRUE 
    AND conv.estado = 'activa'
ORDER BY c.ultima_interaccion DESC;

-- Vista para estadísticas de WhatsApp
CREATE OR REPLACE VIEW v_whatsapp_estadisticas AS
SELECT 
    -- Mensajes del día
    (SELECT COUNT(*) FROM whatsapp_messages WHERE DATE(fecha_envio) = CURRENT_DATE) as mensajes_hoy,
    (SELECT COUNT(*) FROM whatsapp_messages WHERE DATE(fecha_envio) = CURRENT_DATE AND tipo = 'entrante') as mensajes_recibidos_hoy,
    (SELECT COUNT(*) FROM whatsapp_messages WHERE DATE(fecha_envio) = CURRENT_DATE AND tipo = 'saliente') as mensajes_enviados_hoy,
    (SELECT COUNT(*) FROM whatsapp_messages WHERE DATE(fecha_envio) = CURRENT_DATE AND estado = 'urgente') as mensajes_urgentes_hoy,
    
    -- Contactos
    (SELECT COUNT(*) FROM whatsapp_contactos WHERE activo = TRUE) as contactos_activos,
    (SELECT COUNT(*) FROM whatsapp_contactos WHERE tipo = 'paciente' AND activo = TRUE) as pacientes_whatsapp,
    
    -- Automatizaciones
    (SELECT COUNT(*) FROM whatsapp_automatizaciones WHERE activa = TRUE) as automatizaciones_activas,
    
    -- Tiempo de respuesta promedio (últimas 24h)
    ROUND(
        EXTRACT(EPOCH FROM (MIN(respuesta.fecha_envio) - MIN(mensaje.fecha_envio)) / 60), 2
    ) as tiempo_respuesta_promedio_minutos
FROM whatsapp_messages mensaje
LEFT JOIN whatsapp_messages respuesta ON respuesta.telefono = mensaje.telefono 
    AND respuesta.tipo = 'saliente' 
    AND respuesta.fecha_envio > mensaje.fecha_envio
WHERE mensaje.fecha_envio >= NOW() - INTERVAL '24 hours'
LIMIT 1;

-- =====================================================
-- FUNCIONES ESPECIALIZADAS
-- =====================================================

-- Función para actualizar timestamp de conversación
CREATE OR REPLACE FUNCTION fn_actualizar_conversacion()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar última actividad del contacto
    UPDATE whatsapp_contactos 
    SET ultima_interaccion = NEW.fecha_envio,
        updated_at = NEW.fecha_envio
    WHERE telefono = NEW.telefono;
    
    -- Actualizar conversación si existe
    UPDATE whatsapp_conversaciones 
    SET ultima_actividad = NEW.fecha_envio,
        updated_at = NEW.fecha_envio
    WHERE telefono = NEW.telefono;
    
    -- Incrementar contador de mensajes no leídos si es entrante
    IF NEW.tipo = 'entrante' THEN
        UPDATE whatsapp_conversaciones 
        SET mensajes_no_leidos = mensajes_no_leidos + 1
        WHERE telefono = NEW.telefono;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para generar número de conversación
CREATE OR REPLACE FUNCTION fn_generar_conversacion_id()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'CHAT';
    date_part TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
    sequence_part TEXT;
    max_seq INTEGER;
BEGIN
    -- Obtener el número máximo para hoy
    SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 10) AS INTEGER)), 0) + 1
    INTO max_seq
    FROM whatsapp_conversaciones 
    WHERE id LIKE prefix || date_part || '%';
    
    sequence_part := LPAD(max_seq::TEXT, 4, '0');
    
    RETURN prefix || date_part || sequence_part;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Trigger para actualizar conversación cuando llega mensaje
CREATE TRIGGER trg_whatsapp_mensaje_conversacion
    AFTER INSERT ON whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_conversacion();

-- Trigger para actualizar timestamps
CREATE TRIGGER trg_whatsapp_update_timestamps
    BEFORE UPDATE ON whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at_column();

-- Trigger para actualizar timestamps en contactos
CREATE TRIGGER trg_whatsapp_contactos_update_timestamps
    BEFORE UPDATE ON whatsapp_contactos
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at_column();

-- Trigger para actualizar timestamps en conversaciones
CREATE TRIGGER trg_whatsapp_conversaciones_update_timestamps
    BEFORE UPDATE ON whatsapp_conversaciones
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at_column();

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar configuración por defecto
INSERT INTO whatsapp_config (
    numero_principal,
    nombre_business,
    descripcion,
    industria,
    mensaje_bienvenida,
    respuesta_rapida,
    configurado_por
) VALUES (
    '34600000000', -- Número placeholder
    'Clínica Dental Rubio García',
    'Especialistas en Implantología y Estética de Vanguardia',
    'Salud y Belleza',
    '¡Hola! Gracias por contactar con Clínica Dental Rubio García. ¿En qué podemos ayudarte hoy?',
    'Gracias por tu mensaje. Te responderemos lo antes posible.',
    'sistema'
) ON CONFLICT DO NOTHING;

-- Insertar plantillas de mensajes por defecto
INSERT INTO whatsapp_plantillas (nombre, categoria, contenido, variables, created_by) VALUES
('Recordatorio de Cita', 'recordatorio', 
'¡Hola {{nombre}}! Te recordamos tu cita mañana:
📅 {{fecha}}
⏰ {{hora}}
👨‍⚕️ {{doctor}}
¿Podrías confirmar tu asistencia?', 
'["nombre", "fecha", "hora", "doctor"]', 'sistema'),
('Confirmación de Cita', 'confirmacion',
'¡Perfecto {{nombre}}! Tu cita ha sido confirmada:
📅 {{fecha}}
⏰ {{hora}}
📍 Clínica Dental Rubio García
¡Te esperamos!',
'["nombre", "fecha", "hora"]', 'sistema'),
('Seguimiento Post-tratamiento', 'seguimiento',
'Hola {{nombre}}, ¿cómo te encuentras después del tratamiento? ¿Tienes alguna duda o molestia?',
'["nombre"]', 'sistema'),
('Bienvenida Nuevo Paciente', 'bienvenida',
'¡Bienvenido/a {{nombre}} a Clínica Dental Rubio García! Somos especialistas en Implantología y Estética Dental. ¿Te gustaría programar tu primera consulta?',
'["nombre"]', 'sistema');

-- Insertar automatizaciones por defecto
INSERT INTO whatsapp_automatizaciones (nombre, tipo, trigger_condicion, respuesta_automatica, activa, created_by) VALUES
('Respuesta Automática Fuera de Horario', 'ausencia', 
'{"horario": {"inicio": "20:00", "fin": "10:00"}}',
'Gracias por tu mensaje. Fuera de nuestro horario de atención (L-J: 10:00-14:00 y 16:00-20:00, V: 10:00-14:00). Te responderemos lo antes posible. Para emergencias: 916 410 841', 
TRUE, 'sistema'),
('Recordatorio Urgente Dolor', 'urgencia',
'{"palabras_clave": ["dolor", "sangra", "sangrado", "urgente", "fiebre", "emergency"]}',
'Gracias por tu mensaje. Entendemos que puede ser urgente. Te contactaremos inmediatamente al teléfono 916 410 841 para atenderte.',
TRUE, 'sistema');

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_telefono ON whatsapp_messages(telefono);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_fecha ON whatsapp_messages(fecha_envio);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_estado ON whatsapp_messages(estado);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_urgente ON whatsapp_messages(estado) WHERE estado = 'urgente';
CREATE INDEX IF NOT EXISTS idx_whatsapp_contactos_telefono ON whatsapp_contactos(telefono);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contactos_paciente ON whatsapp_contactos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contactos_tipo ON whatsapp_contactos(tipo);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversaciones_contacto ON whatsapp_conversaciones(contacto_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversaciones_telefono ON whatsapp_conversaciones(telefono);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_tipo ON whatsapp_logs(tipo);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_timestamp ON whatsapp_logs(timestamp);

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE whatsapp_messages IS 'Mensajes de WhatsApp entrantes y salientes con análisis de urgencia';
COMMENT ON TABLE whatsapp_contactos IS 'Contactos de WhatsApp vinculados o no a pacientes registrados';
COMMENT ON TABLE whatsapp_conversaciones IS 'Conversaciones activas con estado y metadata';
COMMENT ON TABLE whatsapp_plantillas IS 'Plantillas de mensajes reutilizables con variables';
COMMENT ON TABLE whatsapp_automatizaciones IS 'Automatizaciones de respuesta y recordatorios';
COMMENT ON TABLE whatsapp_config IS 'Configuración general del módulo WhatsApp';
COMMENT ON TABLE whatsapp_logs IS 'Logs detallados para debugging y auditoría';

COMMENT ON COLUMN whatsapp_messages.resumen_urgencia IS 'Resumen generado por IA sobre la urgencia del mensaje';
COMMENT ON COLUMN whatsapp_messages.metadata IS 'Información adicional: adjunto, ubicación, etc.';
COMMENT ON COLUMN whatsapp_contactos.etiquetas IS 'Etiquetas personalizadas para clasificación';
COMMENT ON COLUMN whatsapp_automatizaciones.trigger_condicion IS 'JSON con condiciones para activar la automatización';
COMMENT ON COLUMN whatsapp_config.horario_atencion IS 'JSON con horarios detallados por día de la semana';