# 🦷 Rubio García Dental - Sistema de Gestión

**Versión:** 2.1 - GESDEN ↔ Supabase Integration  
**Tecnología:** Next.js 14, TypeScript, Supabase, Baileys, AI, SQL Server 2008

## 🔄 GESDEN INTEGRATION

### **SINCRONIZACIÓN BIDIRECCIONAL EN TIEMPO REAL**
- **GESDEN sin modificaciones**: Continúa usando SQL Server 2008 normalmente
- **Supabase como base principal**: Aplicación moderna en la nube
- **Sincronización al segundo**: Cambios reflejados inmediatamente
- **Espejo perfecto**: Ambas bases mantienen datos idénticos
- **Cero downtime**: Sin interrupciones en GESDEN

### **FUNCIONALIDADES AVANZADAS**
- **Change Data Capture (CDC)**: Detección automática de cambios
- **Supabase Real-time**: WebSockets para sincronización instantánea
- **Gestión de conflictos**: 4 estrategias de resolución automática
- **Auto-reconexión**: Recuperación automática de conexiones
- **Monitoreo 24/7**: Health checks y estadísticas en tiempo real

## 🚀 Características Principales

### 👥 Gestión de Pacientes
- **CRUD completo** con validaciones avanzadas
- **Búsqueda inteligente** con filtros múltiples
- **Historial médico** completo
- **Seguimiento automático** de pacientes

### 📅 Sistema de Citas
- **Calendario integrado** con disponibilidad
- **Gestión de doctores** y especialidades
- **Estados de cita** (programada, completada, cancelada, etc.)
- **Notificaciones automáticas** WhatsApp

### 💬 WhatsApp Integrado
- **Bot con AI** conversacional 24/7
- **Conexión directa Baileys** (sin worker externo)
- **Respuestas contextuales** personalizadas
- **Triage automático** de urgencias

### 🤖 Inteligencia Artificial
- **Ollama LLM** integrado
- **Respuestas médicas** contextualizadas
- **Análisis de sentimientos** en conversaciones
- **Sugerencias de tratamientos** automáticas

### 📊 Dashboard en Tiempo Real
- **Métricas actualizadas** cada 5 minutos
- **Citas de hoy** y próximas
- **Alertas urgentes** WhatsApp
- **Estadísticas de negocio**

## 🛠️ Instalación y Configuración

### 1. Clonar e Instalar
```bash
git clone <repository>
cd rubio-garcia-dental
npm install
```

### 2. Configurar Variables de Entorno GESDEN
Copia `.env.example` a `.env.local` y completa:

```env
# SQL Server 2008 - GESDEN
SQLSERVER_HOST=gabinete2\INFOMED
SQLSERVER_DATABASE=GELITE
SQLSERVER_USER=RUBIOGARCIADENTAL
SQLSERVER_PASSWORD=666666
SQLSERVER_PORT=1433

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://yztiavcffuwdhkhhxypb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_key

# GESDEN-Supabase Sync
GESDEN_AUTO_SYNC=true
GESDEN_SYNC_INTERVAL=5000
GESDEN_CONFLICT_RESOLUTION=timestamp

# WhatsApp Baileys
BAILEYS_SESSION_PATH=./whatsapp_auth
WHATSAPP_AUTO_CONNECT=false
WHATSAPP_DEBUG=true

# AI/Ollama
LLM_HOST=http://localhost:11434
AI_ENABLED=true

# Google Mail
NEXT_PUBLIC_GOOGLE_MAIL_CLIENT_ID=tu_client_id
GOOGLE_MAIL_CLIENT_SECRET=tu_client_secret
GOOGLE_MAIL_REFRESH_TOKEN=tu_refresh_token

# Admin
ADMIN_EMAIL=admin@rubiogarciadental.com
```

### 3. Verificación Automática GESDEN
```bash
# Verificar que todo esté configurado correctamente
./verify-gesden.sh

# O instalar con script automático
./install-gesden.sh
```

### 4. Iniciar Desarrollo
```bash
npm run dev
```

La integración GESDEN ↔ Supabase se activará automáticamente. 
Verás un widget en la esquina inferior derecha mostrando el estado de sincronización.

### 📊 Monitoreo de Sincronización
- **Widget visible**: Estado en tiempo real en la aplicación
- **Logs de consola**: Detalles de sincronización
- **Health checks**: Verificación automática cada 10 segundos
- **Auto-reconexión**: Recuperación automática de errores

## 🌐 Deployment

### Vercel (Recomendado)
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod
```

## 📁 Estructura del Proyecto

```
rubio-garcia-dental/
├── components/          # Componentes React
│   ├── Dashboard.tsx
│   ├── WhatsAppChat.tsx
│   └── ...
├── services/           # Servicios Supabase
│   ├── supabase-pacientes.ts
│   ├── supabase-citas.ts
│   ├── supabase-whatsapp.ts
│   └── supabase-ai.ts
├── pages/api/          # APIs Next.js
│   ├── pacientes/
│   ├── citas/
│   └── whatsapp/
├── database/           # Esquemas SQL
│   └── schema_pacientes.sql
└── types/              # Tipos TypeScript
```

## 🔧 APIs Principales

### Pacientes
- `GET /api/pacientes` - Buscar pacientes
- `POST /api/pacientes` - Crear paciente
- `PUT /api/pacientes/[id]` - Actualizar paciente
- `DELETE /api/pacientes/[id]` - Eliminar paciente

### Citas  
- `GET /api/citas` - Buscar citas
- `POST /api/citas` - Crear cita
- `GET /api/citas/hoy` - Citas de hoy
- `GET /api/citas/proximas` - Próximas citas

### WhatsApp
- `GET /api/whatsapp/connect` - Estado conexión
- `POST /api/whatsapp/send-message` - Enviar mensaje
- `POST /api/whatsapp/webhook` - Webhook mensajes

## 🤖 WhatsApp Bot

### Configuración
1. Ejecuta la aplicación
2. Ve a la sección WhatsApp
3. Escanea el QR code con tu WhatsApp
4. ¡El bot estará activo!

### Características
- **Respuestas automáticas** 24/7
- **Detección de urgencias** dental
- **Agenda de citas** por WhatsApp
- **Información de servicios** 
- **Recordatorios** automáticos

## 🔐 Seguridad

- **Row Level Security** en Supabase
- **JWT Authentication**  
- **HTTPS obligatorio**
- **Rate limiting** en APIs
- **Validaciones** de entrada
- **Sanitización** de datos

## 📊 Monitoreo

- **Supabase Dashboard** - Métricas DB
- **Vercel Analytics** - Performance web
- **Error Tracking** - Logs centralizados
- **Health Checks** - APIs monitoring

## 🆘 Soporte

Para soporte técnico o nuevas funcionalidades:
- Revisa `MIGRACION_COMPLETADA.md` para detalles de migración
- Consulta `REPORTE_FINAL_MIGRACION.md` para información completa
- Logs de aplicación en Supabase Dashboard

## 📄 Licencia

Desarrollado específicamente para Rubio García Dental.
Todos los derechos reservados.

---
**🦷 Rubio García Dental v2.0 - Sistema de Gestión Dental 100% Cloud-Native**
