-- =====================================================
-- ESQUEMA DE BASE DE DATOS - MÓDULO CONTABILIDAD
-- Sistema Rubio García Dental - Verifactu Compliance 2025-2026
-- =====================================================

-- TABLA: asientos_contables
CREATE TABLE IF NOT EXISTS asientos_contables (
    id SERIAL PRIMARY KEY,
    numero_asiento VARCHAR(20) UNIQUE NOT NULL,
    fecha_asiento DATE NOT NULL DEFAULT CURRENT_DATE,
    descripcion TEXT NOT NULL,
    tipo_asiento VARCHAR(20) NOT NULL CHECK (tipo_asiento IN ('diario', 'ingresos', 'gastos', 'iva', 'amortizacion', 'cierre')),
    cuenta_contable VARCHAR(10) NOT NULL,
    debe DECIMAL(12,2) DEFAULT 0.00,
    haber DECIMAL(12,2) DEFAULT 0.00,
    concepto TEXT,
    referencia_documento VARCHAR(50),
    paciente_id INTEGER,
    factura_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: plan_contable
CREATE TABLE IF NOT EXISTS plan_contable (
    id SERIAL PRIMARY KEY,
    codigo_cuenta VARCHAR(10) UNIQUE NOT NULL,
    nombre_cuenta VARCHAR(100) NOT NULL,
    tipo_cuenta VARCHAR(20) NOT NULL CHECK (tipo_cuenta IN ('activo', 'pasivo', 'ingresos', 'gastos', 'patrimonio')),
    subcuenta VARCHAR(50),
    saldo_inicial DECIMAL(12,2) DEFAULT 0.00,
    saldo_actual DECIMAL(12,2) DEFAULT 0.00,
    es_analitica BOOLEAN DEFAULT false,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: ivas_retenciones
CREATE TABLE IF NOT EXISTS ivas_retenciones (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('iva', 'irpf', 'ingreso', 'gasto')),
    base_imponible DECIMAL(12,2) NOT NULL,
    porcentaje DECIMAL(5,2) NOT NULL,
    cuota DECIMAL(12,2) NOT NULL,
    fecha_presentacion DATE,
    ejercicio INTEGER,
    periodo VARCHAR(7), -- YYYY-TT
    trimestre INTEGER CHECK (trimestre BETWEEN 1 AND 4),
    liquidado BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: arqueo_cajas
CREATE TABLE IF NOT EXISTS arqueo_cajas (
    id SERIAL PRIMARY KEY,
    fecha_arqueo DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_arqueo TIME NOT NULL DEFAULT CURRENT_TIME,
    caja VARCHAR(20) NOT NULL DEFAULT 'principal',
    saldo_teorico DECIMAL(12,2) NOT NULL,
    saldo_real DECIMAL(12,2) NOT NULL,
    diferencia DECIMAL(12,2) GENERATED ALWAYS AS (saldo_real - saldo_teorico) STORED,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'verificado', 'descuadre')),
    observaciones TEXT,
    usuario_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: detalle_arqueo_cajas
CREATE TABLE IF NOT EXISTS detalle_arqueo_cajas (
    id SERIAL PRIMARY KEY,
    arqueo_id INTEGER NOT NULL REFERENCES arqueo_cajas(id) ON DELETE CASCADE,
    tipo_medio VARCHAR(20) NOT NULL CHECK (tipo_medio IN ('efectivo', 'tarjeta', 'transferencia', 'cheque')),
    denominacion VARCHAR(50) NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 0,
    valor_unitario DECIMAL(8,2) NOT NULL,
    importe_total DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * valor_unitario) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: informes_financieros
CREATE TABLE IF NOT EXISTS informes_financieros (
    id SERIAL PRIMARY KEY,
    tipo_informe VARCHAR(30) NOT NULL CHECK (tipo_informe IN ('balance_situacion', 'pyg', 'flujo_efectivo', 'iva_trimestral')),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    ejercicio INTEGER NOT NULL,
    periodo VARCHAR(7),
    datos_json JSONB NOT NULL,
    formato VARCHAR(10) DEFAULT 'json' CHECK (formato IN ('json', 'pdf', 'excel')),
    generado_por VARCHAR(100) DEFAULT 'sistema',
    estado VARCHAR(20) DEFAULT 'generado' CHECK (estado IN ('generado', 'revisado', 'archivado')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: conciliaciones_bancarias
CREATE TABLE IF NOT EXISTS conciliaciones_bancarias (
    id SERIAL PRIMARY KEY,
    cuenta_bancaria VARCHAR(50) NOT NULL,
    fecha_conciliacion DATE NOT NULL DEFAULT CURRENT_DATE,
    saldo_banco DECIMAL(12,2) NOT NULL,
    saldo_contable DECIMAL(12,2) NOT NULL,
    diferencia DECIMAL(12,2) GENERATED ALWAYS AS (saldo_banco - saldo_contable) STORED,
    pendiente_registro INTEGER DEFAULT 0,
    notas TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'conciliado', 'descuadre')),
    usuario_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: detalle_conciliacion
CREATE TABLE IF NOT EXISTS detalle_conciliacion (
    id SERIAL PRIMARY KEY,
    conciliacion_id INTEGER NOT NULL REFERENCES conciliaciones_bancarias(id) ON DELETE CASCADE,
    fecha_movimiento DATE NOT NULL,
    concepto TEXT NOT NULL,
    debe DECIMAL(12,2) DEFAULT 0.00,
    haber DECIMAL(12,2) DEFAULT 0.00,
    saldo DECIMAL(12,2) GENERATED ALWAYS AS (debe - haber) STORED,
    conciliado BOOLEAN DEFAULT false,
    tipo_movimiento VARCHAR(20) DEFAULT 'banco' CHECK (tipo_movimiento IN ('banco', 'contable')),
    referencia VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para asientos_contables
CREATE INDEX idx_asientos_fecha ON asientos_contables(fecha_asiento);
CREATE INDEX idx_asientos_numero ON asientos_contables(numero_asiento);
CREATE INDEX idx_asientos_tipo ON asientos_contables(tipo_asiento);
CREATE INDEX idx_asientos_cuenta ON asientos_contables(cuenta_contable);
CREATE INDEX idx_asientos_paciente ON asientos_contables(paciente_id);
CREATE INDEX idx_asientos_factura ON asientos_contables(factura_id);

-- Índices para plan_contable
CREATE INDEX idx_plan_contable_codigo ON plan_contable(codigo_cuenta);
CREATE INDEX idx_plan_contable_tipo ON plan_contable(tipo_cuenta);
CREATE INDEX idx_plan_contable_activa ON plan_contable(activa);

-- Índices para arqueo_cajas
CREATE INDEX idx_arqueo_fecha ON arqueo_cajas(fecha_arqueo);
CREATE INDEX idx_arqueo_estado ON arqueo_cajas(estado);

-- Índices para informes_financieros
CREATE INDEX idx_informes_tipo ON informes_financieros(tipo_informe);
CREATE INDEX idx_informes_ejercicio ON informes_financieros(ejercicio);
CREATE INDEX idx_informes_periodo ON informes_financieros(periodo);

-- =====================================================
-- VISTAS OPTIMIZADAS
-- =====================================================

-- Vista: Balance de Situación
CREATE OR REPLACE VIEW v_balance_situacion AS
SELECT 
    pc.codigo_cuenta,
    pc.nombre_cuenta,
    pc.tipo_cuenta,
    SUM(ac.debe) - SUM(ac.haber) as saldo_actual
FROM plan_contable pc
LEFT JOIN asientos_contables ac ON pc.codigo_cuenta = ac.cuenta_contable
WHERE pc.activa = true
    AND pc.tipo_cuenta IN ('activo', 'pasivo', 'patrimonio')
GROUP BY pc.codigo_cuenta, pc.nombre_cuenta, pc.tipo_cuenta
ORDER BY pc.codigo_cuenta;

-- Vista: Cuenta de Pérdidas y Ganancias
CREATE OR REPLACE VIEW v_cuenta_pyg AS
SELECT 
    pc.codigo_cuenta,
    pc.nombre_cuenta,
    pc.tipo_cuenta,
    SUM(ac.debe) as total_debe,
    SUM(ac.haber) as total_haber,
    SUM(ac.haber) - SUM(ac.debe) as resultado
FROM plan_contable pc
LEFT JOIN asientos_contables ac ON pc.codigo_cuenta = ac.cuenta_contable
WHERE pc.activa = true
    AND pc.tipo_cuenta IN ('ingresos', 'gastos')
GROUP BY pc.codigo_cuenta, pc.nombre_cuenta, pc.tipo_cuenta
ORDER BY pc.codigo_cuenta;

-- Vista: Resumen IVA
CREATE OR REPLACE VIEW v_resumen_iva AS
SELECT 
    ejercicio,
    periodo,
    tipo,
    SUM(base_imponible) as total_base,
    SUM(cuota) as total_cuota,
    COUNT(*) as num_operaciones
FROM ivas_retenciones
GROUP BY ejercicio, periodo, tipo
ORDER BY ejercicio DESC, periodo DESC;

-- Vista: Caja Diaria
CREATE OR REPLACE VIEW v_caja_diaria AS
SELECT 
    ac.fecha_asiento,
    SUM(CASE WHEN pc.tipo_cuenta = 'activo' THEN ac.haber - ac.debe ELSE 0 END) as ingresos,
    SUM(CASE WHEN pc.tipo_cuenta = 'gastos' THEN ac.debe - ac.haber ELSE 0 END) as gastos,
    SUM(ac.haber) - SUM(ac.debe) as saldo_diario
FROM asientos_contables ac
JOIN plan_contable pc ON ac.cuenta_contable = pc.codigo_cuenta
WHERE ac.fecha_asiento >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ac.fecha_asiento
ORDER BY ac.fecha_asiento DESC;

-- =====================================================
-- FUNCIONES Y PROCEDIMIENTOS
-- =====================================================

-- Función: Calcular saldo de cuenta contable
CREATE OR REPLACE FUNCTION fn_saldo_cuenta_contable(cuenta_codigo VARCHAR(10))
RETURNS DECIMAL(12,2) AS $$
DECLARE
    saldo DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(debe) - SUM(haber), 0)
    INTO saldo
    FROM asientos_contables
    WHERE cuenta_contable = cuenta_codigo;
    
    RETURN saldo;
END;
$$ LANGUAGE plpgsql;

-- Función: Generar número de asiento automático
CREATE OR REPLACE FUNCTION fn_generar_numero_asiento()
RETURNS VARCHAR(20) AS $$
DECLARE
    año INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    numero INTEGER;
    secuencia VARCHAR(20);
BEGIN
    SELECT COALESCE(MAX(
        CASE 
            WHEN numero_asiento ~ '^[A-Z]{2}' || año::TEXT || '[0-9]{6}$' 
            THEN CAST(SUBSTRING(numero_asiento FROM 9) AS INTEGER)
            ELSE 0 
        END
    ), 0) + 1
    INTO numero
    FROM asientos_contables
    WHERE fecha_asiento >= DATE(año || '-01-01')
      AND fecha_asiento <= DATE(año || '-12-31');
    
    secuencia := 'AS' || año::TEXT || LPAD(numero::TEXT, 6, '0');
    
    RETURN secuencia;
END;
$$ LANGUAGE plpgsql;

-- Función: Calcular resultado del ejercicio
CREATE OR REPLACE FUNCTION fn_resultado_ejercicio(año_ejercicio INTEGER)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    ingresos DECIMAL(12,2);
    gastos DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(CASE WHEN ac.haber > ac.debe THEN ac.haber - ac.debe ELSE 0 END), 0)
    INTO ingresos
    FROM asientos_contables ac
    JOIN plan_contable pc ON ac.cuenta_contable = pc.codigo_cuenta
    WHERE EXTRACT(YEAR FROM ac.fecha_asiento) = año_ejercicio
      AND pc.tipo_cuenta = 'ingresos';
    
    SELECT COALESCE(SUM(CASE WHEN ac.debe > ac.haber THEN ac.debe - ac.haber ELSE 0 END), 0)
    INTO gastos
    FROM asientos_contables ac
    JOIN plan_contable pc ON ac.cuenta_contable = pc.codigo_cuenta
    WHERE EXTRACT(YEAR FROM ac.fecha_asiento) = año_ejercicio
      AND pc.tipo_cuenta = 'gastos';
    
    RETURN ingresos - gastos;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS PARA AUTOMATIZACIÓN
-- =====================================================

-- Trigger: Actualizar saldo cuenta contable
CREATE OR REPLACE FUNCTION tr_actualizar_saldo_cuenta()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar saldo en plan_contable
    UPDATE plan_contable 
    SET saldo_actual = fn_saldo_cuenta_contable(codigo_cuenta)
    WHERE codigo_cuenta IN (
        SELECT DISTINCT cuenta_contable 
        FROM asientos_contables 
        WHERE id = NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_saldo_cuenta
    AFTER INSERT OR UPDATE ON asientos_contables
    FOR EACH ROW EXECUTE FUNCTION tr_actualizar_saldo_cuenta();

-- Trigger: Validar equilibrio de asientos
CREATE OR REPLACE FUNCTION tr_validar_equilibrio_asiento()
RETURNS TRIGGER AS $$
DECLARE
    total_debe DECIMAL(12,2);
    total_haber DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(debe), 0), COALESCE(SUM(haber), 0)
    INTO total_debe, total_haber
    FROM asientos_contables
    WHERE numero_asiento = NEW.numero_asiento;
    
    IF total_debe != total_haber THEN
        RAISE EXCEPTION 'El asiento % no está equilibrado. Debe: %, Haber: %', 
            NEW.numero_asiento, total_debe, total_haber;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_equilibrio_asiento
    BEFORE INSERT OR UPDATE ON asientos_contables
    FOR EACH ROW EXECUTE FUNCTION tr_validar_equilibrio_asiento();

-- =====================================================
-- DATOS INICIALES DEL PLAN CONTABLE
-- =====================================================

INSERT INTO plan_contable (codigo_cuenta, nombre_cuenta, tipo_cuenta, saldo_inicial) VALUES
-- ACTIVO
('1000000', 'Capital Social', 'patrimonio', 0.00),
('1010000', 'Resultados Anteriores', 'patrimonio', 0.00),
('1020000', 'Resultado del Ejercicio', 'patrimonio', 0.00),

-- ACTIVO
('2000000', 'Inmovilizado Intangible', 'activo', 0.00),
('2100000', 'Equipos Informáticos', 'activo', 0.00),
('2110000', 'Mobiliario', 'activo', 0.00),
('2120000', 'Equipos Médicos', 'activo', 0.00),
('2130000', 'Utillaje', 'activo', 0.00),
('2140000', 'Otras Instalaciones', 'activo', 0.00),
('2150000', 'Amortización Acumulada', 'activo', 0.00),

-- ACTIVO CORRIENTE
('3000000', 'Existencias', 'activo', 0.00),
('3100000', 'Materias Primas', 'activo', 0.00),
('3200000', 'Productos en Curso', 'activo', 0.00),
('3300000', 'Productos Terminados', 'activo', 0.00),

('4000000', 'Deudores', 'activo', 0.00),
('4100000', 'Pacientes', 'activo', 0.00),
('4110000', 'Otros Deudores', 'activo', 0.00),
('4120000', 'Hacienda Pública IVA Soportado', 'activo', 0.00),

('5000000', 'Tesorería', 'activo', 0.00),
('5100000', 'Caja', 'activo', 0.00),
('5200000', 'Bancos', 'activo', 0.00),
('5300000', 'Cuentas Corrientes', 'activo', 0.00),

('6000000', 'Acreedores', 'pasivo', 0.00),
('6100000', 'Proveedores', 'pasivo', 0.00),
('6200000', 'Hacienda Pública IVA Repercutido', 'pasivo', 0.00),
('6300000', 'Hacienda Pública IRPF', 'pasivo', 0.00),
('6400000', 'Seguridad Social', 'pasivo', 0.00),
('6500000', 'Hacienda Pública Otros Tributos', 'pasivo', 0.00),

-- INGRESOS
('7000000', 'Ventas', 'ingresos', 0.00),
('7100000', 'Servicios Odontológicos', 'ingresos', 0.00),
('7200000', 'Servicios Estéticos', 'ingresos', 0.00),
('7300000', 'Venta Material', 'ingresos', 0.00),
('7400000', 'Otros Ingresos', 'ingresos', 0.00),

-- GASTOS
('8000000', 'Compras', 'gastos', 0.00),
('8100000', 'Material Dental', 'gastos', 0.00),
('8200000', 'Material Estética', 'gastos', 0.00),
('8300000', 'Suministros', 'gastos', 0.00),
('8400000', 'Servicios Profesionales', 'gastos', 0.00),

('9000000', 'Gastos de Personal', 'gastos', 0.00),
('9100000', 'Sueldos y Salarios', 'gastos', 0.00),
('9200000', 'Seguridad Social', 'gastos', 0.00),
('9300000', 'Otros Gastos Personal', 'gastos', 0.00),

('9500000', 'Gastos Generales', 'gastos', 0.00),
('9600000', 'Alquileres', 'gastos', 0.00),
('9700000', 'Suministros', 'gastos', 0.00),
('9800000', 'Mantenimiento', 'gastos', 0.00),
('9900000', 'Amortizaciones', 'gastos', 0.00)
ON CONFLICT (codigo_cuenta) DO NOTHING;

-- =====================================================
-- PERMISOS Y SECURITY
-- =====================================================

-- Comentarios para documentación
COMMENT ON TABLE asientos_contables IS 'Registro de todos los movimientos contables del sistema';
COMMENT ON TABLE plan_contable IS 'Catálogo de cuentas contables con saldos actualizados';
COMMENT ON TABLE arqueo_cajas IS 'Control diario del efectivo en caja';
COMMENT ON TABLE informes_financieros IS 'Informes generados del sistema contable';

-- =====================================================
-- FIN DEL ESQUEMA CONTABILIDAD
-- =====================================================