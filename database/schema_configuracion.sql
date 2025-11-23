-- ===============================================
-- MÓDULO CONFIGURACIÓN - ESQUEMA DE BASE DE DATOS
-- Sistema de Gestión Integral - Rubio García Dental
-- ===============================================

-- Tabla de configuración general de la clínica
CREATE TABLE configuracion_clinica (
    id SERIAL PRIMARY KEY,
    nombre_clinica VARCHAR(200) NOT NULL DEFAULT 'Clínica Dental',
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    cif_nif VARCHAR(15),
    logo_url VARCHAR(500),
    horario_apertura TIME,
    horario_cierre TIME,
    dias_laborales INTEGER[] DEFAULT '{1,2,3,4,5}', -- 1=Lunes, 7=Domingo
    zona_horaria VARCHAR(50) DEFAULT 'Europe/Madrid',
    moneda_defecto VARCHAR(3) DEFAULT 'EUR',
    idioma_defecto VARCHAR(5) DEFAULT 'es-ES',
    configuracion_visual JSONB DEFAULT '{}',
    configuracion_notificaciones JSONB DEFAULT '{}',
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de servicios externos
CREATE TABLE configuracion_servicios (
    id SERIAL PRIMARY KEY,
    servicio VARCHAR(100) NOT NULL, -- 'whatsapp', 'ia', 'email', 'verifactu', 'supabase', 'sql_server'
    sub_servicio VARCHAR(100), -- 'baileys', 'ollama', 'gmail', 'aeat', 'auth', 'database'
    configuracion JSONB NOT NULL DEFAULT '{}',
    credenciales JSONB DEFAULT '{}', -- Encriptadas
    estado VARCHAR(20) DEFAULT 'inactivo', -- 'activo', 'inactivo', 'error', 'configurando'
    ultima_conexion TIMESTAMP WITH TIME ZONE,
    ultima_verificacion TIMESTAMP WITH TIME ZONE,
    pruebas_realizadas JSONB DEFAULT '{}',
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de usuarios del sistema
CREATE TABLE usuarios_sistema (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(200),
    rol VARCHAR(50) NOT NULL, -- 'admin', 'medico', 'recepcionista', 'contable'
    departamento VARCHAR(100),
    telefono VARCHAR(20),
    especialidad VARCHAR(100),
    numero_colegiado VARCHAR(20),
    configuracion_personal JSONB DEFAULT '{}',
    permisos JSONB DEFAULT '{}',
    avatar_url VARCHAR(500),
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado BOOLEAN DEFAULT false,
    fecha_bloqueo TIMESTAMP WITH TIME ZONE,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de roles y permisos
CREATE TABLE roles_permisos (
    id SERIAL PRIMARY KEY,
    rol VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    permisos JSONB NOT NULL DEFAULT '{}', -- Permisos por módulo
    restricciones JSONB DEFAULT '{}',
    configuraciones_rol JSONB DEFAULT '{}',
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de automatizaciones
CREATE TABLE configuracion_automatizaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'recordatorio', 'urgencia', 'facturacion', 'seguimiento'
    modulo_origen VARCHAR(50), -- 'agenda', 'pacientes', 'whatsapp', 'gestion'
    configuracion JSONB NOT NULL DEFAULT '{}',
    condiciones JSONB DEFAULT '{}',
    acciones JSONB NOT NULL DEFAULT '{}',
    programacion JSONB DEFAULT '{}', -- Cron, horarios, etc
    activo BOOLEAN DEFAULT true,
    pruebas_automatizadas JSONB DEFAULT '{}',
    estadisticas_uso JSONB DEFAULT '{}',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de Verifactu/AEAT
CREATE TABLE configuracion_verifactu (
    id SERIAL PRIMARY KEY,
    serie_facturas VARCHAR(10) DEFAULT 'F',
    prefijo_facturas VARCHAR(10) DEFAULT '',
    numero_actual INTEGER DEFAULT 0,
    serie_rectificativas VARCHAR(10) DEFAULT 'R',
    prefijo_rectificativas VARCHAR(10) DEFAULT 'R',
    numero_rect_actual INTEGER DEFAULT 0,
    configuracion_aeat JSONB NOT NULL DEFAULT '{}',
    certificados JSONB DEFAULT '{}',
    entorno VARCHAR(20) DEFAULT 'produccion', -- 'produccion', 'pruebas'
    envio_automatico BOOLEAN DEFAULT false,
    configuracion_envio JSONB DEFAULT '{}',
    ultima_transmision TIMESTAMP WITH TIME ZONE,
    estadisticas_envio JSONB DEFAULT '{}',
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de backup y mantenimiento
CREATE TABLE configuracion_backup (
    id SERIAL PRIMARY KEY,
    tipo_backup VARCHAR(50) NOT NULL, -- 'diario', 'semanal', 'mensual'
    configuracion JSONB NOT NULL DEFAULT '{}',
    programacion_cron VARCHAR(100),
    destino_almacenamiento JSONB DEFAULT '{}',
    configuracion_compresion JSONB DEFAULT '{}',
    retencion_dias INTEGER DEFAULT 30,
    ultima_ejecucion TIMESTAMP WITH TIME ZONE,
    proxima_ejecucion TIMESTAMP WITH TIME ZONE,
    estadisticas_backups JSONB DEFAULT '{}',
    pruebas_restauracion JSONB DEFAULT '{}',
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de logs de configuración (para auditoría)
CREATE TABLE logs_configuracion (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios_sistema(id),
    accion VARCHAR(100) NOT NULL, -- 'crear', 'actualizar', 'eliminar', 'activar', 'desactivar'
    modulo VARCHAR(50) NOT NULL,
    elemento_afectado VARCHAR(100),
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    ip_origen INET,
    user_agent TEXT,
    fecha_accion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de integraciones externas
CREATE TABLE configuracion_integraciones (
    id SERIAL PRIMARY KEY,
    integracion VARCHAR(100) NOT NULL, -- 'gmail', 'google_calendar', 'stripe', 'paypal'
    configuracion JSONB NOT NULL DEFAULT '{}',
    credenciales JSONB DEFAULT '{}',
    scopes_permisos TEXT[],
    tokens JSONB DEFAULT '{}',
    fecha_expiracion_tokens TIMESTAMP WITH TIME ZONE,
    estado_conexion VARCHAR(20) DEFAULT 'desconectado',
    ultima_sincronizacion TIMESTAMP WITH TIME ZONE,
    estadisticas_uso JSONB DEFAULT '{}',
    configuracion_webhooks JSONB DEFAULT '{}',
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- VISTAS OPTIMIZADAS
-- ===============================================

-- Vista para estado general de configuraciones
CREATE VIEW v_estado_configuraciones AS
SELECT 
    'clinica' as tipo,
    nombre_clinica as descripcion,
    CASE WHEN activa THEN 'activo' ELSE 'inactivo' END as estado,
    fecha_actualizacion
FROM configuracion_clinica
WHERE activa = true

UNION ALL

SELECT 
    'servicio' as tipo,
    CONCAT(servicio, CASE WHEN sub_servicio IS NOT NULL THEN ' - ' || sub_servicio END) as descripcion,
    estado,
    fecha_actualizacion
FROM configuracion_servicios
WHERE activo = true

UNION ALL

SELECT 
    'automatizacion' as tipo,
    nombre as descripcion,
    CASE WHEN activo THEN 'activo' ELSE 'inactivo' END as estado,
    fecha_actualizacion
FROM configuracion_automatizaciones
WHERE activo = true

UNION ALL

SELECT 
    'verifactu' as tipo,
    'Sistema de Facturación Electrónica' as descripcion,
    CASE WHEN activo THEN 'activo' ELSE 'inactivo' END as estado,
    fecha_actualizacion
FROM configuracion_verifactu
WHERE activo = true;

-- Vista para usuarios activos del sistema
CREATE VIEW v_usuarios_activos AS
SELECT 
    u.id,
    u.email,
    u.nombre,
    u.apellidos,
    u.rol,
    u.departamento,
    u.especialidad,
    u.ultimo_acceso,
    u.activo,
    rp.descripcion as descripcion_rol,
    rp.permisos,
    fecha_creacion
FROM usuarios_sistema u
LEFT JOIN roles_permisos rp ON u.rol = rp.rol
WHERE u.activo = true
ORDER BY u.apellidos, u.nombre;

-- Vista para configuración de servicios críticos
CREATE VIEW v_servicios_criticos AS
SELECT 
    s.id,
    s.servicio,
    s.sub_servicio,
    s.estado,
    s.ultima_conexion,
    s.ultima_verificacion,
    CASE 
        WHEN s.ultima_conexion > NOW() - INTERVAL '1 hour' THEN 'conectado'
        WHEN s.ultima_conexion > NOW() - INTERVAL '24 hours' THEN 'inactivo_reciente'
        ELSE 'desconectado'
    END as estado_conexion
FROM configuracion_servicios s
WHERE s.activo = true 
AND s.servicio IN ('supabase', 'sql_server', 'whatsapp', 'ia')
ORDER BY s.servicio, s.sub_servicio;

-- ===============================================
-- FUNCIONES DE UTILIDAD
-- ===============================================

-- Función para obtener configuración de servicio
CREATE OR REPLACE FUNCTION fn_obtener_configuracion_servicio(p_servicio VARCHAR, p_sub_servicio VARCHAR DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    config_result JSON;
BEGIN
    SELECT configuracion INTO config_result
    FROM configuracion_servicios 
    WHERE servicio = p_servicio 
    AND (p_sub_servicio IS NULL OR sub_servicio = p_sub_servicio)
    AND activo = true
    LIMIT 1;
    
    RETURN COALESCE(config_result, '{}');
END;
$$ LANGUAGE plpgsql;

-- Función para verificar conectividad de servicios
CREATE OR REPLACE FUNCTION fn_verificar_servicio(p_servicio VARCHAR, p_sub_servicio VARCHAR DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    last_connection TIMESTAMP;
    is_connected BOOLEAN := false;
BEGIN
    SELECT ultima_conexion INTO last_connection
    FROM configuracion_servicios 
    WHERE servicio = p_servicio 
    AND (p_sub_servicio IS NULL OR sub_servicio = p_sub_servicio)
    AND activo = true
    LIMIT 1;
    
    -- Consideramos conectado si hubo conexión en las últimas 2 horas
    IF last_connection IS NOT NULL AND last_connection > NOW() - INTERVAL '2 hours' THEN
        is_connected := true;
    END IF;
    
    -- Actualizar timestamp de verificación
    UPDATE configuracion_servicios 
    SET ultima_verificacion = NOW()
    WHERE servicio = p_servicio 
    AND (p_sub_servicio IS NULL OR sub_servicio = p_sub_servicio)
    AND activo = true;
    
    RETURN is_connected;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener permisos de usuario
CREATE OR REPLACE FUNCTION fn_obtener_permisos_usuario(p_usuario_id INTEGER)
RETURNS JSON AS $$
DECLARE
    permisos_result JSON;
BEGIN
    SELECT COALESCE(rp.permisos, '{}') INTO permisos_result
    FROM usuarios_sistema u
    JOIN roles_permisos rp ON u.rol = rp.rol
    WHERE u.id = p_usuario_id 
    AND u.activo = true 
    AND rp.activo = true;
    
    RETURN permisos_result;
END;
$$ LANGUAGE plpgsql;

-- Función para logging de cambios de configuración
CREATE OR REPLACE FUNCTION fn_log_configuracion(
    p_usuario_id INTEGER,
    p_accion VARCHAR,
    p_modulo VARCHAR,
    p_elemento VARCHAR,
    p_anteriores JSON DEFAULT NULL,
    p_nuevos JSON DEFAULT NULL,
    p_ip INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    log_id INTEGER;
BEGIN
    INSERT INTO logs_configuracion (
        usuario_id, accion, modulo, elemento_afectado,
        valores_anteriores, valores_nuevos, ip_origen, user_agent
    ) VALUES (
        p_usuario_id, p_accion, p_modulo, p_elemento,
        p_anteriores, p_nuevos, p_ip, p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- TRIGGERS AUTOMÁTICOS
-- ===============================================

-- Trigger para actualizar timestamp en configuración_clinica
CREATE TRIGGER trigger_configuracion_clinica_updated
    BEFORE UPDATE ON configuracion_clinica
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_timestamp();

-- Trigger para actualizar timestamp en configuracion_servicios
CREATE TRIGGER trigger_configuracion_servicios_updated
    BEFORE UPDATE ON configuracion_servicios
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_timestamp();

-- Trigger para actualizar timestamp en usuarios_sistema
CREATE TRIGGER trigger_usuarios_sistema_updated
    BEFORE UPDATE ON usuarios_sistema
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_timestamp();

-- Trigger para registrar cambios en configuración crítica
CREATE TRIGGER trigger_log_configuracion_critica
    AFTER INSERT OR UPDATE OR DELETE ON configuracion_servicios
    FOR EACH ROW
    EXECUTE FUNCTION fn_log_configuracion_automatico();

-- ===============================================
-- DATOS INICIALES
-- ===============================================

-- Insertar configuración básica de la clínica
INSERT INTO configuracion_clinica (
    nombre_clinica, direccion, telefono, email, cif_nif
) VALUES (
    'Clínica Dental Rubio García',
    'Calle Ejemplo, 123, 28001 Madrid',
    '+34 91 123 45 67',
    'info@rubiogardia-dental.com',
    'B12345678'
);

-- Insertar servicios básicos del sistema
INSERT INTO configuracion_servicios (servicio, sub_servicio, estado, configuracion) VALUES
('supabase', 'auth', 'activo', '{"url": "https://yztiavcffuwdhkhhxypb.supabase.co"}'),
('supabase', 'database', 'activo', '{"url": "https://yztiavcffuwdhkhhxypb.supabase.co", "schema": "public"}'),
('sql_server', 'database', 'activo', '{"server": "gabinete2\\INFOMED", "database": "GELITE"}'),
('whatsapp', 'baileys', 'inactivo', '{"host": "http://192.168.1.34:3001", "timeout": 30000}'),
('ia', 'ollama', 'inactivo', '{"url": "http://localhost:11434", "model": "llama2"}'),
('verifactu', 'aeat', 'configurando', '{"env": "pruebas", "version": "1.0"}');

-- Insertar roles del sistema
INSERT INTO roles_permisos (rol, descripcion, permisos) VALUES
('admin', 'Administrador del sistema con acceso completo', '{"*": {"read": true, "write": true, "delete": true}}'),
('medico', 'Personal médico con acceso a historia clínica y pacientes', '{"pacientes": {"read": true, "write": true}, "historia_clinica": {"read": true, "write": true}, "agenda": {"read": true, "write": true}}'),
('recepcionista', 'Personal de recepción con acceso a agenda y pacientes', '{"agenda": {"read": true, "write": true}, "pacientes": {"read": true, "write": true}, "whatsapp": {"read": true, "write": true}}'),
('contable', 'Personal contable con acceso a facturación y contabilidad', '{"gestion": {"read": true, "write": true}, "contabilidad": {"read": true, "write": true}}');

-- Insertar usuario administrador por defecto
INSERT INTO usuarios_sistema (email, nombre, apellidos, rol, departamento) VALUES
('admin@rubiogarcia-dental.com', 'Administrador', 'Sistema', 'admin', 'Administración');

-- Insertar configuración de automatizaciones básicas
INSERT INTO configuracion_automatizaciones (nombre, tipo, modulo_origen, configuracion, acciones) VALUES
('Recordatorio Citas', 'recordatorio', 'agenda', '{"horas_antes": 24, "canales": ["whatsapp", "email"]}', '{"enviar_mensaje": true, "incluir_detalles": true}'),
('Detección Urgencias', 'urgencia', 'whatsapp', '{"palabras_clave": ["urgente", "dolor", "emergencia"], "nivel_minimo": 3}', '{"notificar_medico": true, "crear_cita_urgente": true}'),
('Recordatorio Facturas', 'facturacion', 'gestion', '{"dias_vencimiento": 15, "envios": ["3dias", "1dia", "vencida"]}', '{"enviar_recordatorio": true, "generar_alerta": true}');

-- Insertar configuración de Verifactu básica
INSERT INTO configuracion_verifactu (serie_facturas, numero_actual, configuracion_aeat, entorno) VALUES
('F', 0, '{"format": "UBL", "version": "1.0", "emisor": "Clinica Dental"}', 'pruebas');

-- Crear índices para optimización
CREATE INDEX idx_configuracion_servicios_estado ON configuracion_servicios(estado);
CREATE INDEX idx_configuracion_servicios_activo ON configuracion_servicios(activo);
CREATE INDEX idx_usuarios_sistema_email ON usuarios_sistema(email);
CREATE INDEX idx_usuarios_sistema_rol ON usuarios_sistema(rol);
CREATE INDEX idx_usuarios_sistema_activo ON usuarios_sistema(activo);
CREATE INDEX idx_logs_configuracion_fecha ON logs_configuracion(fecha_accion);
CREATE INDEX idx_logs_configuracion_usuario ON logs_configuracion(usuario_id);
CREATE INDEX idx_automatizaciones_tipo ON configuracion_automatizaciones(tipo);
CREATE INDEX idx_automatizaciones_activo ON configuracion_automatizaciones(activo);