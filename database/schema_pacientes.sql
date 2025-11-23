-- Script SQL para crear las tablas del módulo Pacientes en Supabase
-- Fecha: 2025-11-23
-- Descripción: Configuración completa de base de datos para el módulo de pacientes

-- =============================================
-- TABLA USUARIOS
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- =============================================
-- TABLA DOCTORES
-- =============================================
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  numero_colegiado VARCHAR(100) UNIQUE NOT NULL,
  especialidades TEXT[] DEFAULT ARRAY[]::TEXT[],
  horarios JSONB DEFAULT '[]'::JSONB,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA PACIENTES (PRINCIPAL)
-- =============================================
CREATE TABLE IF NOT EXISTS public.pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_paciente VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  dni VARCHAR(9) UNIQUE NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  telefono_fijo VARCHAR(20),
  telefono_movil VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  direccion TEXT NOT NULL,
  alergias TEXT,
  enfermedades TEXT,
  medicamentos TEXT,
  preferencias_comunicacion TEXT DEFAULT '',
  consentimiento_lopd VARCHAR(20) NOT NULL DEFAULT 'sin_firmar' CHECK (consentimiento_lopd IN ('firmado', 'sin_firmar')),
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pacientes_updated_at 
    BEFORE UPDATE ON public.pacientes 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- TABLA CITAS
-- =============================================
CREATE TABLE IF NOT EXISTS public.citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  tratamiento VARCHAR(255) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio', 'emergencia')),
  notas TEXT,
  proxima_cita BOOLEAN DEFAULT false,
  documentos_firmados TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_citas_updated_at 
    BEFORE UPDATE ON public.citas 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- TABLA CONTACTOS
-- =============================================
CREATE TABLE IF NOT EXISTS public.contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('paciente', 'prospecto', 'referencia')),
  origen VARCHAR(20) NOT NULL CHECK (origen IN ('citas', 'whatsapp', 'manual')),
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  ultima_interaccion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notas TEXT
);

-- =============================================
-- TABLA FACTURAS
-- =============================================
CREATE TABLE IF NOT EXISTS public.facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_factura VARCHAR(50) UNIQUE NOT NULL,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  citas UUID[] DEFAULT ARRAY[]::UUID[],
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  iva DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'emitida', 'pagada', 'cancelada')),
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  metodo_pago VARCHAR(50),
  qr_code TEXT,
  verifactu_compliance BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_facturas_updated_at 
    BEFORE UPDATE ON public.facturas 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- TABLA MENSAJES WHATSAPP
-- =============================================
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefono VARCHAR(20) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrante', 'saliente')),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'entregado', 'leido', 'urgente')),
  fecha_envio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  requiere_respuesta BOOLEAN DEFAULT false,
  resumen_urgencia TEXT
);

-- =============================================
-- TABLA PLANTILLAS DE DOCUMENTOS
-- =============================================
CREATE TABLE IF NOT EXISTS public.documentos_plantilla (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('consentimiento', 'presupuesto', 'factura', 'recordatorio', 'primera_visita')),
  contenido TEXT NOT NULL,
  comandos TEXT[] DEFAULT ARRAY[]::TEXT[],
  parametros JSONB DEFAULT '[]'::JSONB,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA AUTOMATIZACIONES
-- =============================================
CREATE TABLE IF NOT EXISTS public.automatizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('mensaje_masivo', 'recordatorio', 'confirmacion', 'cancelacion')),
  documento_id UUID REFERENCES public.documentos_plantilla(id) ON DELETE SET NULL,
  trigger JSONB NOT NULL,
  condiciones JSONB DEFAULT '[]'::JSONB,
  mensaje TEXT NOT NULL,
  activa BOOLEAN DEFAULT true,
  ejecuciones INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =============================================

-- Índices para pacientes
CREATE INDEX IF NOT EXISTS idx_pacientes_dni ON public.pacientes(dni);
CREATE INDEX IF NOT EXISTS idx_pacientes_numero ON public.pacientes(numero_paciente);
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre ON public.pacientes(nombre, apellido);
CREATE INDEX IF NOT EXISTS idx_pacientes_telefono ON public.pacientes(telefono_movil);
CREATE INDEX IF NOT EXISTS idx_pacientes_email ON public.pacientes(email);
CREATE INDEX IF NOT EXISTS idx_pacientes_estado ON public.pacientes(estado);
CREATE INDEX IF NOT EXISTS idx_pacientes_fecha_registro ON public.pacientes(fecha_registro);

-- Índices para citas
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON public.citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_doctor ON public.citas(doctor_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON public.citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON public.citas(estado);

-- Índices para contactos
CREATE INDEX IF NOT EXISTS idx_contactos_telefono ON public.contactos(telefono);
CREATE INDEX IF NOT EXISTS idx_contactos_email ON public.contactos(email);
CREATE INDEX IF NOT EXISTS idx_contactos_tipo ON public.contactos(tipo);
CREATE INDEX IF NOT EXISTS idx_contactos_paciente ON public.contactos(paciente_id);

-- Índices para mensajes
CREATE INDEX IF NOT EXISTS idx_whatsapp_telefono ON public.whatsapp_messages(telefono);
CREATE INDEX IF NOT EXISTS idx_whatsapp_paciente ON public.whatsapp_messages(paciente_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_fecha ON public.whatsapp_messages(fecha_envio);
CREATE INDEX IF NOT EXISTS idx_whatsapp_estado ON public.whatsapp_messages(estado);

-- =============================================
-- FUNCIONES ÚTILES
-- =============================================

-- Función para generar número de paciente único
CREATE OR REPLACE FUNCTION generar_numero_paciente()
RETURNS TEXT AS $$
DECLARE
    contador INTEGER;
    numero TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_paciente FROM 4) AS INTEGER)), 0) + 1 
    INTO contador 
    FROM public.pacientes 
    WHERE numero_paciente ~ '^PAC[0-9]+$';
    
    numero := 'PAC' || LPAD(contador::TEXT, 6, '0');
    RETURN numero;
END;
$$ LANGUAGE plpgsql;

-- Función para buscar pacientes
CREATE OR REPLACE FUNCTION buscar_pacientes(
    busqueda TEXT DEFAULT NULL,
    estado_filtro TEXT DEFAULT NULL,
    fecha_desde DATE DEFAULT NULL,
    fecha_hasta DATE DEFAULT NULL,
    offset_pagina INTEGER DEFAULT 0,
    limite_pagina INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    numero_paciente VARCHAR(50),
    nombre VARCHAR(255),
    apellido VARCHAR(255),
    dni VARCHAR(9),
    fecha_nacimiento DATE,
    telefono_fijo VARCHAR(20),
    telefono_movil VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    alergias TEXT,
    enfermedades TEXT,
    medicamentos TEXT,
    preferencias_comunicacion TEXT,
    consentimiento_lopd VARCHAR(20),
    estado VARCHAR(20),
    fecha_registro DATE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.numero_paciente, p.nombre, p.apellido, p.dni, p.fecha_nacimiento,
        p.telefono_fijo, p.telefono_movil, p.email, p.direccion, p.alergias,
        p.enfermedades, p.medicamentos, p.preferencias_comunicacion, 
        p.consentimiento_lopd, p.estado, p.fecha_registro, p.created_at, p.updated_at
    FROM public.pacientes p
    WHERE 
        (busqueda IS NULL OR 
         p.nombre ILIKE '%' || busqueda || '%' OR
         p.apellido ILIKE '%' || busqueda || '%' OR
         p.dni ILIKE '%' || busqueda || '%' OR
         p.telefono_movil ILIKE '%' || busqueda || '%' OR
         p.email ILIKE '%' || busqueda || '%' OR
         p.numero_paciente ILIKE '%' || busqueda || '%')
    AND (estado_filtro IS NULL OR p.estado = estado_filtro)
    AND (fecha_desde IS NULL OR p.fecha_registro >= fecha_desde)
    AND (fecha_hasta IS NULL OR p.fecha_registro <= fecha_hasta)
    ORDER BY p.fecha_registro DESC
    LIMIT limite_pagina OFFSET offset_pagina;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_plantilla ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automatizaciones ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir acceso completo a usuarios autenticados)
CREATE POLICY "Users can view all data" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view all data" ON public.doctors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view all data" ON public.pacientes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view all data" ON public.citas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view all data" ON public.contactos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view all data" ON public.facturas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view all data" ON public.whatsapp_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view all data" ON public.documentos_plantilla FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view all data" ON public.automatizaciones FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas de inserción/actualización (solo usuarios autenticados)
CREATE POLICY "Users can insert data" ON public.pacientes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update data" ON public.pacientes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert data" ON public.citas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update data" ON public.citas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert data" ON public.contactos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update data" ON public.contactos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert data" ON public.whatsapp_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update data" ON public.whatsapp_messages FOR UPDATE USING (auth.role() = 'authenticated');

-- =============================================
-- DATOS INICIALES (OPCIONAL)
-- =============================================

-- Insertar doctores por defecto si no existen
INSERT INTO public.doctors (nombre, apellido, numero_colegiado, especialidades, horarios, estado)
SELECT * FROM (VALUES
    ('Mario', 'Rubio García', 'COLEG-001', ARRAY['Implantología', 'Periodoncia', 'Estética Dental'], 
     '[{"dia_semana": 3, "hora_inicio": "10:00", "hora_fin": "14:00", "activo": true}, {"dia_semana": 3, "hora_inicio": "16:00", "hora_fin": "20:00", "activo": true}]'::JSONB, 'activo'),
    ('Virginia', 'Tresgallo', 'COLEG-002', ARRAY['Ortodoncia', 'Ortopedia Dentofacial'], 
     '[{"dia_semana": 1, "hora_inicio": "10:00", "hora_fin": "14:00", "activo": true}, {"dia_semana": 1, "hora_inicio": "16:00", "hora_fin": "20:00", "activo": true}]'::JSONB, 'activo'),
    ('Irene', 'García', 'COLEG-003', ARRAY['Endodoncia', 'Odontología General'], 
     '[{"dia_semana": 2, "hora_inicio": "10:00", "hora_fin": "14:00", "activo": true}, {"dia_semana": 2, "hora_inicio": "16:00", "hora_fin": "20:00", "activo": true}]'::JSONB, 'activo'),
    ('Juan Antonio', 'Manzanedo', 'TC-001', ARRAY['Higiene Dental', 'Blanqueamiento'], 
     '[{"dia_semana": 4, "hora_inicio": "10:00", "hora_fin": "14:00", "activo": true}]'::JSONB, 'activo')
) AS v(nombre, apellido, numero_colegiado, especialidades, horarios, estado)
WHERE NOT EXISTS (
    SELECT 1 FROM public.doctors d WHERE d.numero_colegiado = v.numero_colegiado
);

-- =============================================
-- COMENTARIOS
-- =============================================

COMMENT ON TABLE public.pacientes IS 'Tabla principal de pacientes con información personal, médica y de contacto';
COMMENT ON TABLE public.citas IS 'Tabla de citas médicas con estados y seguimiento';
COMMENT ON TABLE public.contactos IS 'Tabla de contactos relacionados con pacientes y WhatsApp';
COMMENT ON FUNCTION generar_numero_paciente() IS 'Genera números de paciente únicos con formato PAC000001';
COMMENT ON FUNCTION buscar_pacientes IS 'Función para búsqueda avanzada de pacientes con filtros';