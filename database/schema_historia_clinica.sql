-- Schema para el Módulo de Historia Clínica
-- Rubio García Dental - Sistema de Gestión Integral

-- ==================== TABLA PRINCIPAL: HISTORIA_CLINICA ====================

CREATE TABLE IF NOT EXISTS historia_clinica (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_historia_clinica_paciente_id ON historia_clinica(paciente_id);

-- ==================== TABLA: PLANES_TRATAMIENTO ====================

CREATE TABLE IF NOT EXISTS planes_tratamiento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctores(id) ON DELETE RESTRICT,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    tratamientos TEXT[] DEFAULT '{}', -- Array de IDs de tratamientos
    estado VARCHAR(20) CHECK (estado IN ('planificacion', 'en_proceso', 'completado', 'cancelado')) DEFAULT 'planificacion',
    fecha_inicio DATE NOT NULL,
    fecha_estimada_fin DATE,
    fecha_real_fin DATE,
    costo_total DECIMAL(10,2) DEFAULT 0.00,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_planes_tratamiento_paciente_id ON planes_tratamiento(paciente_id);
CREATE INDEX IF NOT EXISTS idx_planes_tratamiento_doctor_id ON planes_tratamiento(doctor_id);
CREATE INDEX IF NOT EXISTS idx_planes_tratamiento_estado ON planes_tratamiento(estado);
CREATE INDEX IF NOT EXISTS idx_planes_tratamiento_fecha_inicio ON planes_tratamiento(fecha_inicio);

-- ==================== TABLA: ODONTOGRAMA ====================

CREATE TABLE IF NOT EXISTS odontograma (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_odontograma_paciente_id ON odontograma(paciente_id);

-- ==================== TABLA: DIENTES_ODONTOGRAMA ====================

CREATE TABLE IF NOT EXISTS dientes_odontograma (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    odontograma_id UUID REFERENCES odontograma(id) ON DELETE CASCADE,
    numero INTEGER CHECK (numero >= 1 AND numero <= 32) NOT NULL,
    estado VARCHAR(20) CHECK (estado IN ('sano', 'caries', 'obturado', 'corona', 'ausente', 'implante')) DEFAULT 'sano',
    tratamientos TEXT[] DEFAULT '{}',
    notas TEXT,
    fecha_ultimo_tratamiento DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dientes_odontograma_odontograma_id ON dientes_odontograma(odontograma_id);
CREATE INDEX IF NOT EXISTS idx_dientes_odontograma_numero ON dientes_odontograma(numero);
CREATE INDEX IF NOT EXISTS idx_dientes_odontograma_estado ON dientes_odontograma(estado);

-- Constraint único para evitar duplicados
ALTER TABLE dientes_odontograma ADD CONSTRAINT unique_diente_odontograma 
    UNIQUE (odontograma_id, numero);

-- ==================== TABLA: FOTOS_TRATAMIENTO ====================

CREATE TABLE IF NOT EXISTS fotos_tratamiento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    cita_id UUID REFERENCES citas(id) ON DELETE SET NULL,
    tratamiento_id VARCHAR(255), -- Puede referenciar tratamientos o ser genérico
    descripcion TEXT NOT NULL,
    url_foto TEXT NOT NULL, -- URL de Supabase Storage
    fecha_toma DATE NOT NULL,
    etiquetas TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fotos_tratamiento_paciente_id ON fotos_tratamiento(paciente_id);
CREATE INDEX IF NOT EXISTS idx_fotos_tratamiento_cita_id ON fotos_tratamiento(cita_id);
CREATE INDEX IF NOT EXISTS idx_fotos_tratamiento_fecha_toma ON fotos_tratamiento(fecha_toma);
CREATE INDEX IF NOT EXISTS idx_fotos_tratamiento_tratamiento_id ON fotos_tratamiento(tratamiento_id);

-- Búsqueda por etiquetas (GIN index para array)
CREATE INDEX IF NOT EXISTS idx_fotos_tratamiento_etiquetas ON fotos_tratamiento USING GIN(etiquetas);

-- ==================== TABLA: ALERTAS_MEDICAS ====================

CREATE TABLE IF NOT EXISTS alertas_medicas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    tipo VARCHAR(20) CHECK (tipo IN ('alergia', 'medicamento', 'procedimiento', 'nota')) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    nivel VARCHAR(20) CHECK (nivel IN ('info', 'advertencia', 'critico')) NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_alertas_medicas_paciente_id ON alertas_medicas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_alertas_medicas_activa ON alertas_medicas(activa);
CREATE INDEX IF NOT EXISTS idx_alertas_medicas_nivel ON alertas_medicas(nivel);
CREATE INDEX IF NOT EXISTS idx_alertas_medicas_tipo ON alertas_medicas(tipo);
CREATE INDEX IF NOT EXISTS idx_alertas_medicas_fecha_creacion ON alertas_medicas(fecha_creacion);

-- ==================== TABLA: DOCUMENTOS_FIRMADOS ====================

CREATE TABLE IF NOT EXISTS documentos_firmados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    tipo VARCHAR(20) CHECK (tipo IN ('consentimiento', 'lopd', 'tratamiento', 'presupuesto')) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    url_documento TEXT NOT NULL,
    fecha_firma DATE NOT NULL,
    metodo_firma VARCHAR(20) CHECK (metodo_firma IN ('digital', 'fisica', 'whatsapp')) NOT NULL,
    firma_validada BOOLEAN DEFAULT FALSE,
    hash_documento VARCHAR(255), -- Para validación criptográfica
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_documentos_firmados_paciente_id ON documentos_firmados(paciente_id);
CREATE INDEX IF NOT EXISTS idx_documentos_firmados_tipo ON documentos_firmados(tipo);
CREATE INDEX IF NOT EXISTS idx_documentos_firmados_metodo_firma ON documentos_firmados(metodo_firma);
CREATE INDEX IF NOT EXISTS idx_documentos_firmados_fecha_firma ON documentos_firmados(fecha_firma);
CREATE INDEX IF NOT EXISTS idx_documentos_firmados_firma_validada ON documentos_firmados(firma_validada);

-- ==================== TABLA: TRATAMIENTOS (Maestros) ====================

CREATE TABLE IF NOT EXISTS tratamientos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    precio_base DECIMAL(10,2) DEFAULT 0.00,
    duracion_estimada INTEGER, -- minutos
    requiere_anestesia BOOLEAN DEFAULT FALSE,
    requiere_documentos TEXT[] DEFAULT '{}',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tratamientos_codigo ON tratamientos(codigo);
CREATE INDEX IF NOT EXISTS idx_tratamientos_categoria ON tratamientos(categoria);
CREATE INDEX IF NOT EXISTS idx_tratamientos_activo ON tratamientos(activo);

-- ==================== TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA ====================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers a las tablas que tienen updated_at
CREATE TRIGGER update_historia_clinica_updated_at 
    BEFORE UPDATE ON historia_clinica 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planes_tratamiento_updated_at 
    BEFORE UPDATE ON planes_tratamiento 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dientes_odontograma_updated_at 
    BEFORE UPDATE ON dientes_odontograma 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tratamientos_updated_at 
    BEFORE UPDATE ON tratamientos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== TRIGGERS PARA INTEGRIDAD REFERENCIAL ====================

-- Trigger para actualizar ultima_actualizacion del odontograma cuando se modifica un diente
CREATE OR REPLACE FUNCTION update_odontograma_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE odontograma 
    SET ultima_actualizacion = NOW() 
    WHERE id = NEW.odontograma_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_odontograma_timestamp_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON dientes_odontograma 
    FOR EACH ROW EXECUTE FUNCTION update_odontograma_timestamp();

-- ==================== POLÍTICAS DE SEGURIDAD (RLS) ====================

-- Habilitar RLS en todas las tablas
ALTER TABLE historia_clinica ENABLE ROW LEVEL SECURITY;
ALTER TABLE planes_tratamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE odontograma ENABLE ROW LEVEL SECURITY;
ALTER TABLE dientes_odontograma ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_tratamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_medicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_firmados ENABLE ROW LEVEL SECURITY;
ALTER TABLE tratamientos ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (los usuarios solo pueden acceder a sus datos)
-- En producción, estas políticas deberían ser más restrictivas según el rol del usuario

CREATE POLICY "Historia clínica - acceso completo" ON historia_clinica
    FOR ALL USING (true);

CREATE POLICY "Planes tratamiento - acceso completo" ON planes_tratamiento
    FOR ALL USING (true);

CREATE POLICY "Odontograma - acceso completo" ON odontograma
    FOR ALL USING (true);

CREATE POLICY "Dientes odontograma - acceso completo" ON dientes_odontograma
    FOR ALL USING (true);

CREATE POLICY "Fotos tratamiento - acceso completo" ON fotos_tratamiento
    FOR ALL USING (true);

CREATE POLICY "Alertas médicas - acceso completo" ON alertas_medicas
    FOR ALL USING (true);

CREATE POLICY "Documentos firmados - acceso completo" ON documentos_firmados
    FOR ALL USING (true);

CREATE POLICY "Tratamientos - acceso completo" ON tratamientos
    FOR ALL USING (true);

-- ==================== DATOS INICIALES - TRATAMIENTOS ====================

INSERT INTO tratamientos (codigo, nombre, descripcion, categoria, precio_base, duracion_estimada, requiere_anestesia) VALUES
('LIMP001', 'Limpieza Dental', 'Limpieza y prophylaxis dental completa', 'Preventivo', 45.00, 45, false),
('EMPAS001', 'Empaste Simple', 'Empaste de caries simple en esmalte', 'Restaurador', 65.00, 30, false),
('EMPAS002', 'Empaste Complejo', 'Empaste de caries que afecta dentina', 'Restaurador', 85.00, 45, true),
('ENDO001', 'Endodoncia Unirradicular', 'Tratamiento de conducto en diente de una raíz', 'Endodoncia', 350.00, 90, true),
('ENDO002', 'Endodoncia Multirradicular', 'Tratamiento de conducto en diente de múltiples raíces', 'Endodoncia', 450.00, 120, true),
('CORO001', 'Corona Porcelana', 'Corona estética de porcelana sobre metal', 'Prótesis', 450.00, 60, true),
('CORO002', 'Corona Zirconio', 'Corona de zirconio estético', 'Prótesis', 650.00, 60, true),
('IMPL001', 'Implante Simple', 'Colocación de implante dental simple', 'Implantología', 1200.00, 45, true),
('IMPL002', 'Implante con Corona', 'Implante dental con corona incluida', 'Implantología', 1650.00, 90, true),
('EXTRA001', 'Extracción Simple', 'Extracción de diente simple', 'Cirugía', 75.00, 15, true),
('EXTRA002', 'Extracción Compleja', 'Extracción quirúrgica', 'Cirugía', 150.00, 30, true),
('BLAN001', 'Blanqueamiento', 'Blanqueamiento dental profesional', 'Estético', 200.00, 60, false),
('ORTO001', 'Consulta Ortodoncia', 'Primera consulta de ortodoncia', 'Ortodoncia', 50.00, 30, false),
('URGE001', 'Consulta Urgencia', 'Consulta de emergencia dental', 'Urgencia', 80.00, 20, false)
ON CONFLICT (codigo) DO NOTHING;

-- ==================== FUNCIONES DE UTILIDAD ====================

-- Función para obtener estadísticas de historia clínica de un paciente
CREATE OR REPLACE FUNCTION obtener_estadisticas_historia_clinica(p_paciente_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_planes', (SELECT COUNT(*) FROM planes_tratamiento WHERE paciente_id = p_paciente_id),
        'planes_activos', (SELECT COUNT(*) FROM planes_tratamiento WHERE paciente_id = p_paciente_id AND estado IN ('planificacion', 'en_proceso')),
        'planes_completados', (SELECT COUNT(*) FROM planes_tratamiento WHERE paciente_id = p_paciente_id AND estado = 'completado'),
        'total_fotos', (SELECT COUNT(*) FROM fotos_tratamiento WHERE paciente_id = p_paciente_id),
        'alertas_activas', (SELECT COUNT(*) FROM alertas_medicas WHERE paciente_id = p_paciente_id AND activa = true),
        'alertas_criticas', (SELECT COUNT(*) FROM alertas_medicas WHERE paciente_id = p_paciente_id AND nivel = 'critico' AND activa = true),
        'documentos_pendientes', (SELECT COUNT(*) FROM documentos_firmados WHERE paciente_id = p_paciente_id AND firma_validada = false),
        'dientes_tratados', (SELECT COUNT(DISTINCT numero) FROM dientes_odontograma d JOIN odontograma o ON d.odontograma_id = o.id WHERE o.paciente_id = p_paciente_id AND d.estado != 'sano'),
        'fecha_ultima_actualizacion', (SELECT ultima_actualizacion FROM odontograma WHERE paciente_id = p_paciente_id ORDER BY ultima_actualizacion DESC LIMIT 1)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para buscar en historia clínica completa
CREATE OR REPLACE FUNCTION buscar_historia_clinica(p_paciente_id UUID, p_query TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'planes', (SELECT json_agg(json_build_object('id', id, 'titulo', titulo, 'descripcion', descripcion, 'estado', estado)) FROM planes_tratamiento WHERE paciente_id = p_paciente_id AND (titulo ILIKE '%' || p_query || '%' OR descripcion ILIKE '%' || p_query || '%' OR notas ILIKE '%' || p_query || '%')),
        'fotos', (SELECT json_agg(json_build_object('id', id, 'descripcion', descripcion, 'fecha_toma', fecha_toma)) FROM fotos_tratamiento WHERE paciente_id = p_paciente_id AND (descripcion ILIKE '%' || p_query || '%' OR EXISTS(SELECT 1 FROM unnest(etiquetas) AS etiqueta WHERE etiqueta ILIKE '%' || p_query || '%'))),
        'alertas', (SELECT json_agg(json_build_object('id', id, 'titulo', titulo, 'descripcion', descripcion, 'nivel', nivel)) FROM alertas_medicas WHERE paciente_id = p_paciente_id AND (titulo ILIKE '%' || p_query || '%' OR descripcion ILIKE '%' || p_query || '%')),
        'documentos', (SELECT json_agg(json_build_object('id', id, 'titulo', titulo, 'tipo', tipo)) FROM documentos_firmados WHERE paciente_id = p_paciente_id AND (titulo ILIKE '%' || p_query || '%'))
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==================== VISTAS PARA REPORTES ====================

-- Vista para resumen de historia clínica por paciente
CREATE OR REPLACE VIEW vista_resumen_historia_clinica AS
SELECT 
    p.id as paciente_id,
    p.numero_paciente,
    p.nombre,
    p.apellido,
    p.dni,
    COUNT(DISTINCT hc.id) as tiene_historia_clinica,
    COUNT(DISTINCT pt.id) as total_planes_tratamiento,
    COUNT(DISTINCT CASE WHEN pt.estado IN ('planificacion', 'en_proceso') THEN pt.id END) as planes_activos,
    COUNT(DISTINCT ft.id) as total_fotografias,
    COUNT(DISTINCT am.id) as total_alertas,
    COUNT(DISTINCT CASE WHEN am.nivel = 'critico' AND am.activa THEN am.id END) as alertas_criticas,
    COUNT(DISTINCT df.id) as total_documentos,
    COUNT(DISTINCT CASE WHEN NOT df.firma_validada THEN df.id END) as documentos_pendientes,
    COUNT(DISTINCT CASE WHEN do.estado != 'sano' THEN do.numero END) as dientes_tratados,
    o.ultima_actualizacion as fecha_ultima_actualizacion_odontograma
FROM pacientes p
LEFT JOIN historia_clinica hc ON p.id = hc.paciente_id
LEFT JOIN planes_tratamiento pt ON p.id = pt.paciente_id
LEFT JOIN fotos_tratamiento ft ON p.id = ft.paciente_id
LEFT JOIN alertas_medicas am ON p.id = am.paciente_id AND am.activa = true
LEFT JOIN documentos_firmados df ON p.id = df.paciente_id
LEFT JOIN odontograma o ON p.id = o.paciente_id
LEFT JOIN dientes_odontograma do ON o.id = do.odontograma_id
GROUP BY p.id, p.numero_paciente, p.nombre, p.apellido, p.dni, o.ultima_actualizacion;

-- Vista para alertas críticas activas
CREATE OR REPLACE VIEW vista_alertas_criticas AS
SELECT 
    am.*,
    p.numero_paciente,
    p.nombre,
    p.apellido,
    p.telefono_movil,
    p.email
FROM alertas_medicas am
JOIN pacientes p ON am.paciente_id = p.id
WHERE am.activa = true AND am.nivel = 'critico'
ORDER BY am.fecha_creacion DESC;

-- Vista para documentos pendientes de validación
CREATE OR REPLACE VIEW vista_documentos_pendientes AS
SELECT 
    df.*,
    p.numero_paciente,
    p.nombre,
    p.apellido,
    p.telefono_movil,
    p.email
FROM documentos_firmados df
JOIN pacientes p ON df.paciente_id = p.id
WHERE df.firma_validada = false
ORDER BY df.fecha_firma DESC;

-- ==================== COMENTARIOS PARA DOCUMENTACIÓN ====================

COMMENT ON TABLE historia_clinica IS 'Tabla principal que agrupa toda la información de historia clínica de un paciente';
COMMENT ON TABLE planes_tratamiento IS 'Planes de tratamiento asignados a pacientes con seguimiento de estados';
COMMENT ON TABLE odontograma IS 'Representación digital del estado dental del paciente';
COMMENT ON TABLE dientes_odontograma IS 'Estado individual de cada diente del 1 al 32';
COMMENT ON TABLE fotos_tratamiento IS 'Fotografías de tratamientos realizadas con categorización por etiquetas';
COMMENT ON TABLE alertas_medicas IS 'Sistema de alertas médicas con niveles de severidad';
COMMENT ON TABLE documentos_firmados IS 'Documentos legales firmados por pacientes con métodos de firma';
COMMENT ON TABLE tratamientos IS 'Catálogo maestro de tratamientos disponibles en la clínica';

COMMENT ON FUNCTION obtener_estadisticas_historia_clinica(UUID) IS 'Obtiene estadísticas completas de la historia clínica de un paciente';
COMMENT ON FUNCTION buscar_historia_clinica(UUID, TEXT) IS 'Busca texto en toda la historia clínica de un paciente';

-- ==================== FIN DEL SCHEMA ====================