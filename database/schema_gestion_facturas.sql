-- ============================================================================
-- ESQUEMA DE BASE DE DATOS - MÓDULO DE GESTIÓN - FACTURAS VERIFACTU
-- Sistema de Facturación Integrado con normativa española 2025-2026
-- Compatible con Supabase PostgreSQL y SQL Server 2008
-- Autor: MiniMax Agent
-- Fecha: 2025-11-23
-- ============================================================================

-- ============================================================================
-- TABLA: facturas
-- ============================================================================
CREATE TABLE facturas (
    id SERIAL PRIMARY KEY,
    numero_serie VARCHAR(60) NOT NULL, -- Máx 60 caracteres ASCII (32-126)
    numero_operacion VARCHAR(20) UNIQUE NOT NULL, -- Auto-generado: 2025.1-001-1-001
    fecha_expedicion DATE NOT NULL, -- Formato: YYYY-MM-DD
    fecha_vencimiento DATE,
    
    -- DATOS DEL EMISOR
    nif_emisor VARCHAR(9) NOT NULL, -- 9 caracteres exactos
    nombre_emisor VARCHAR(255) NOT NULL,
    direccion_emisor TEXT,
    telefono_emisor VARCHAR(20),
    email_emisor VARCHAR(255),
    
    -- DATOS DEL RECEPTOR  
    tipo_receptor VARCHAR(10) DEFAULT 'cliente', -- cliente, empresa, particular
    nif_receptor VARCHAR(9), -- Null para facturas simplificadas
    nombre_receptor VARCHAR(255),
    apellidos_receptor VARCHAR(255),
    direccion_receptor TEXT,
    telefono_receptor VARCHAR(20),
    email_receptor VARCHAR(255),
    
    -- IMPORTES
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_iva DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_irpf DECIMAL(12,2) NOT NULL DEFAULT 0,
    descuento_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    importe_total DECIMAL(12,2) NOT NULL, -- Máx 12 dígitos antes, 2 después
    
    -- VERIFACTU - DATOS XML
    xml_verifactu TEXT, -- Registro XML completo
    hash_verifactu VARCHAR(64), -- Huella del registro anterior
    codigo_qr_url TEXT, -- URL completa del QR para verificación
    codigo_verificacion VARCHAR(30), -- Código seguro de verificación
    
    -- ESTADOS Y SEGUIMIENTO
    estado VARCHAR(20) DEFAULT 'borrador', -- borrador, pendiente, emitida, pagada, vencida, anulada
    estado_verifactu VARCHAR(20) DEFAULT 'pendiente', -- pendiente, enviado, validado, rechazado
    tipo_factura VARCHAR(3) DEFAULT 'F1', -- F1: factura ordinaria, F2: simplificada
    tipo_operacion VARCHAR(50) DEFAULT 'Venta',
    
    -- DATOS ADICIONALES
    observaciones TEXT,
    concepto_descripcion TEXT NOT NULL, -- Descripción de la operación
    
    -- INTEGRACIONES
    paz_saldo_id INTEGER, -- Referencia a paz_saldos
    paciente_id INTEGER REFERENCES pacientes(id),
    plan_tratamiento_id INTEGER REFERENCES planes_tratamiento(id),
    
    -- METADATOS
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID,
    
    -- CONSTRAINTS
    CONSTRAINT chk_nif_emisor CHECK (nif_emisor ~ '^[0-9]{8}[A-Z]|^[XYZ][0-9]{7}[A-Z]$'),
    CONSTRAINT chk_nif_receptor CHECK (nif_receptor IS NULL OR (nif_receptor ~ '^[0-9]{8}[A-Z]|^[XYZ][0-9]{7}[A-Z]$')),
    CONSTRAINT chk_importe_total CHECK (importe_total >= 0),
    CONSTRAINT chk_fecha_vencimiento CHECK (fecha_vencimiento IS NULL OR fecha_vencimiento >= fecha_expedicion),
    CONSTRAINT chk_numero_serie CHECK (LENGTH(numero_serie) <= 60),
    
    UNIQUE(numero_operacion, nif_emisor) -- Evita duplicados por emisor
);

-- Índices para optimización
CREATE INDEX idx_facturas_numero ON facturas(numero_operacion);
CREATE INDEX idx_facturas_nif_emisor ON facturas(nif_emisor);
CREATE INDEX idx_facturas_fecha ON facturas(fecha_expedicion);
CREATE INDEX idx_facturas_estado ON facturas(estado);
CREATE INDEX idx_facturas_paciente ON facturas(paciente_id);
CREATE INDEX idx_facturas_verifactu ON facturas(estado_verifactu);

-- ============================================================================
-- TABLA: detalle_facturas
-- ============================================================================
CREATE TABLE detalle_facturas (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    
    -- PRODUCTO/SERVICIO
    linea INTEGER NOT NULL,
    codigo_producto VARCHAR(50),
    descripcion TEXT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(12,2) NOT NULL,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
    descuento_importe DECIMAL(12,2) DEFAULT 0,
    
    -- IMPUESTOS
    tipo_iva DECIMAL(4,2) NOT NULL DEFAULT 21.00, -- 0.00, 4.00, 10.00, 21.00
    base_imponible DECIMAL(12,2) NOT NULL,
    cuota_iva DECIMAL(12,2) NOT NULL,
    tipo_irpf DECIMAL(4,2) DEFAULT 0.00, -- Porcentaje de retención IRPF
    cuota_irpf DECIMAL(12,2) DEFAULT 0,
    
    -- TOTALES
    total_linea DECIMAL(12,2) NOT NULL,
    
    -- VERIFACTU
    descripcion_operacion TEXT, -- Campo específico para XML
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_precio_unitario CHECK (precio_unitario >= 0),
    CONSTRAINT chk_descuento CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
    CONSTRAINT chk_base_imponible CHECK (base_imponible >= 0),
    CONSTRAINT chk_cuota_iva CHECK (cuota_iva >= 0),
    CONSTRAINT chk_total_linea CHECK (total_linea >= 0),
    
    UNIQUE(factura_id, linea)
);

-- Índices
CREATE INDEX idx_detalle_facturas_factura ON detalle_facturas(factura_id);

-- ============================================================================
-- TABLA: paz_saldos
-- ============================================================================
CREATE TABLE paz_saldos (
    id SERIAL PRIMARY KEY,
    numero_paz_saldo VARCHAR(20) UNIQUE NOT NULL, -- PS-2025-001
    fecha_paz DATE NOT NULL,
    tipo VARCHAR(20) DEFAULT 'completo', -- completo, parcial
    
    -- PERÍODO APLICADO
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE NOT NULL,
    
    -- RESUMEN FINANCIERO
    total_facturas DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_pagado DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_pendiente DECIMAL(12,2) NOT NULL DEFAULT 0,
    saldo_anterior DECIMAL(12,2) NOT NULL DEFAULT 0,
    saldo_final DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- ESTADO
    estado VARCHAR(20) DEFAULT 'borrador', -- borrador, emitido, pagado, anulado
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_periodo CHECK (fecha_hasta >= fecha_desde),
    CONSTRAINT chk_saldos CHECK (saldo_final = saldo_anterior + total_facturas - total_pagado)
);

-- Índices
CREATE INDEX idx_paz_saldos_numero ON paz_saldos(numero_paz_saldo);
CREATE INDEX idx_paz_saldos_fecha ON paz_saldos(fecha_paz);
CREATE INDEX idx_paz_saldos_estado ON paz_saldos(estado);

-- ============================================================================
-- TABLA: detalle_paz_saldos
-- ============================================================================
CREATE TABLE detalle_paz_saldos (
    id SERIAL PRIMARY KEY,
    paz_saldo_id INTEGER NOT NULL REFERENCES paz_saldos(id) ON DELETE CASCADE,
    factura_id INTEGER NOT NULL REFERENCES facturas(id),
    
    tipo VARCHAR(20) NOT NULL, -- invoice, payment, adjustment
    descripcion TEXT,
    
    fecha_operacion DATE NOT NULL,
    importe DECIMAL(12,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_detalle_paz_saldos_paz ON detalle_paz_saldos(paz_saldo_id);
CREATE INDEX idx_detalle_paz_saldos_factura ON detalle_paz_saldos(factura_id);

-- ============================================================================
-- TABLA: cobros_facturas
-- ============================================================================
CREATE TABLE cobros_facturas (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    
    fecha_cobro DATE NOT NULL,
    metodo_pago VARCHAR(30) NOT NULL, -- efectivo, tarjeta, transferencia, bizum, stripe
    importe DECIMAL(12,2) NOT NULL,
    
    -- DATOS DEL PAGO
    referencia_pago VARCHAR(100),
    observaciones TEXT,
    
    -- INTEGRACIÓN STRIPE
    stripe_payment_intent_id VARCHAR(100),
    stripe_charge_id VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT chk_importe CHECK (importe > 0)
);

-- Índices
CREATE INDEX idx_cobros_facturas_factura ON cobros_facturas(factura_id);
CREATE INDEX idx_cobros_facturas_fecha ON cobros_facturas(fecha_cobro);
CREATE INDEX idx_cobros_stripe ON cobros_facturas(stripe_payment_intent_id);

-- ============================================================================
-- TABLA: numeracion_secuencias
-- ============================================================================
CREATE TABLE numeracion_secuencias (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(30) NOT NULL UNIQUE, -- factura, presupuesto, paz_saldo
    
    serie_actual VARCHAR(10) NOT NULL DEFAULT '001', -- 001, 002, etc.
    siguiente_numero INTEGER NOT NULL DEFAULT 1,
    año_actual INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    
    formato VARCHAR(50) NOT NULL DEFAULT '{año}.{serie}-{numero}', -- 2025.1-001-1
    
    -- CONFIGURACIÓN
    padding_ceros INTEGER DEFAULT 3, -- 001, 002, etc.
    activo BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar secuencias por defecto
INSERT INTO numeracion_secuencias (tipo, serie_actual, siguiente_numero, año_actual, formato) VALUES 
('factura', '001', 1, EXTRACT(YEAR FROM CURRENT_DATE), '{año}.{serie}-{numero}'),
('presupuesto', '001', 1, EXTRACT(YEAR FROM CURRENT_DATE), 'P-{año}-{serie}-{numero}'),
('paz_saldo', '001', 1, EXTRACT(YEAR FROM CURRENT_DATE), 'PS-{año}-{numero}');

-- ============================================================================
-- TABLA: configuracion_facturacion
-- ============================================================================
CREATE TABLE configuracion_facturacion (
    id SERIAL PRIMARY KEY,
    
    -- DATOS DEL EMISOR (AUTOCOMPLETADO)
    nif_fiscal VARCHAR(9) NOT NULL,
    nombre_empresa VARCHAR(255) NOT NULL,
    direccion_completa TEXT,
    telefono VARCHAR(20),
    email VARCHAR(255),
    web VARCHAR(255),
    
    -- CONFIGURACIÓN AEAT
    numero_inscripcion_iae VARCHAR(20),
    tipo_facturacion VARCHAR(20) DEFAULT 'verifactu', -- verifactu, electronica, tradicional
    
    -- CONFIGURACIÓN DE IMPUESTOS
    iva_general DECIMAL(4,2) DEFAULT 21.00,
    iva_reducido DECIMAL(4,2) DEFAULT 10.00,
    iva_super_reducido DECIMAL(4,2) DEFAULT 4.00,
    irpf_general DECIMAL(4,2) DEFAULT 19.00,
    
    -- CONFIGURACIÓN DE NUMERACIÓN
    serie_facturas VARCHAR(10) DEFAULT '001',
    sufijo_paz_saldos VARCHAR(10) DEFAULT 'PS',
    
    -- CONFIGURACIÓN DE PÁGINA
    logo_url VARCHAR(500),
    pie_pagina TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_config_fiscal UNIQUE(nif_fiscal)
);

-- ============================================================================
-- TABLA: facturas_rectificadas
-- ============================================================================
CREATE TABLE facturas_rectificadas (
    id SERIAL PRIMARY KEY,
    factura_original_id INTEGER NOT NULL REFERENCES facturas(id),
    factura_rectificada_id INTEGER REFERENCES facturas(id),
    
    motivo_rectificacion VARCHAR(100) NOT NULL,
    descripcion_rectificacion TEXT NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_facturas_diferentes CHECK (factura_original_id != factura_rectificada_id)
);

-- Índices
CREATE INDEX idx_facturas_rectificadas_original ON facturas_rectificadas(factura_original_id);
CREATE INDEX idx_facturas_rectificadas_rectificada ON facturas_rectificadas(factura_rectificada_id);

-- ============================================================================
-- TRIGGERS Y FUNCIONES
-- ============================================================================

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a tablas que lo necesiten
CREATE TRIGGER update_facturas_updated_at BEFORE UPDATE ON facturas
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_paz_saldos_updated_at BEFORE UPDATE ON paz_saldos
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_numeracion_updated_at BEFORE UPDATE ON numeracion_secuencias
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_configuracion_updated_at BEFORE UPDATE ON configuracion_facturacion
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista para facturas con información completa
CREATE OR REPLACE VIEW v_facturas_completas AS
SELECT 
    f.*,
    p.nombre as paciente_nombre,
    pt.descripcion as plan_tratamiento_descripcion,
    COUNT(df.id) as total_lineas,
    SUM(df.total_linea) as total_base,
    COALESCE(SUM(cf.importe), 0) as total_cobrado,
    f.importe_total - COALESCE(SUM(cf.importe), 0) as pendiente_cobro,
    
    -- Estado calculado
    CASE 
        WHEN f.estado = 'anulada' THEN 'anulada'
        WHEN f.importe_total - COALESCE(SUM(cf.importe), 0) <= 0 THEN 'pagada'
        WHEN f.fecha_vencimiento < CURRENT_DATE AND f.importe_total - COALESCE(SUM(cf.importe), 0) > 0 THEN 'vencida'
        WHEN f.estado = 'emitida' AND f.fecha_vencimiento >= CURRENT_DATE THEN 'pendiente'
        ELSE f.estado
    END as estado_calculado
    
FROM facturas f
LEFT JOIN pacientes p ON f.paciente_id = p.id
LEFT JOIN planes_tratamiento pt ON f.plan_tratamiento_id = pt.id
LEFT JOIN detalle_facturas df ON f.id = df.factura_id
LEFT JOIN cobros_facturas cf ON f.id = cf.factura_id
GROUP BY f.id, p.nombre, pt.descripcion;

-- Vista para estadísticas de facturación
CREATE OR REPLACE VIEW v_estadisticas_facturacion AS
SELECT 
    DATE_TRUNC('month', fecha_expedicion) as mes,
    COUNT(*) as total_facturas,
    SUM(importe_total) as importe_total,
    SUM(total_iva) as total_iva,
    COUNT(CASE WHEN estado_calculado = 'pagada' THEN 1 END) as facturas_pagadas,
    SUM(CASE WHEN estado_calculado = 'pagada' THEN importe_total ELSE 0 END) as importe_cobrado,
    SUM(CASE WHEN estado_calculado = 'vencida' THEN importe_total ELSE 0 END) as importe_vencido
FROM v_facturas_completas
WHERE fecha_expedicion >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', fecha_expedicion)
ORDER BY mes DESC;

-- ============================================================================
-- FUNCIONES DE UTILIDAD
-- ============================================================================

-- Función para generar siguiente número de serie
CREATE OR REPLACE FUNCTION generar_siguiente_numero(tipo_doc VARCHAR(30))
RETURNS TEXT AS $$
DECLARE
    año_actual INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    formato_pattern VARCHAR(50);
    serie VARCHAR(10);
    siguiente INTEGER;
    numero_final TEXT;
BEGIN
    -- Obtener configuración del tipo
    SELECT formato, serie_actual, siguiente_numero
    INTO formato_pattern, serie, siguiente
    FROM numeracion_secuencias 
    WHERE tipo = tipo_doc AND activo = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tipo de documento % no configurado', tipo_doc;
    END IF;
    
    -- Crear número final reemplazando placeholders
    numero_final := REPLACE(REPLACE(REPLACE(formato_pattern, 
        '{año}', año_actual::TEXT),
        '{serie}', LPAD(serie::TEXT, 3, '0')),
        '{numero}', LPAD(siguiente::TEXT, 3, '0'));
    
    -- Actualizar siguiente número
    UPDATE numeracion_secuencias 
    SET siguiente_numero = siguiente + 1 
    WHERE tipo = tipo_doc AND activo = true;
    
    RETURN numero_final;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular totales de factura
CREATE OR REPLACE FUNCTION calcular_totales_factura(factura_id_param INTEGER)
RETURNS TABLE (
    subtotal_total DECIMAL,
    total_iva DECIMAL,
    total_irpf DECIMAL,
    importe_total DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(df.base_imponible) as subtotal_total,
        SUM(df.cuota_iva) as total_iva,
        SUM(df.cuota_irpf) as total_irpf,
        SUM(df.total_linea) as importe_total
    FROM detalle_facturas df
    WHERE df.factura_id = factura_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DATOS DE CONFIGURACIÓN POR DEFECTO
-- ============================================================================

-- Configuración de facturación para Clínica Dental
INSERT INTO configuracion_facturacion (
    nif_fiscal, nombre_empresa, direccion_completa, telefono, email, web,
    numero_inscripcion_iae, tipo_facturacion
) VALUES (
    '12345678Z',
    'Rubio García Dental',
    'Calle Ejemplo, 123, 28001 Madrid',
    '+34 91 123 45 67',
    'info@rubrogarciadental.com',
    'www.rubrogarciadental.com',
    '1234567890A',
    'verifactu'
) ON CONFLICT (nif_fiscal) DO NOTHING;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE facturas IS 'Facturas Verifactu con numeración automática y integración AEAT';
COMMENT ON TABLE detalle_facturas IS 'Líneas detalladas de cada factura con IVA/IRPF';
COMMENT ON TABLE paz_saldos IS 'Paz y saldos para clientes con facturas múltiples';
COMMENT ON TABLE cobros_facturas IS 'Registro de cobros y pagos de facturas';
COMMENT ON TABLE numeracion_secuencias IS 'Control de numeración automática por tipo de documento';
COMMENT ON TABLE configuracion_facturacion IS 'Configuración fiscal y técnica de facturación';
COMMENT ON TABLE facturas_rectificadas IS 'Relación entre facturas originales y rectificadas';

COMMENT ON FUNCTION generar_siguiente_numero(VARCHAR) IS 'Genera siguiente número de serie para documentos';
COMMENT ON FUNCTION calcular_totales_factura(INTEGER) IS 'Calcula totales automáticamente por factura';

-- ============================================================================
-- FIN DEL ESQUEMA
-- ============================================================================