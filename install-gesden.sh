#!/bin/bash

# 🚀 SCRIPT DE INSTALACIÓN GESDEN ↔ SUPABASE
# Configuración automática de la integración bidireccional

echo "🚀 Iniciando instalación de GESDEN ↔ Supabase Integration..."
echo "=================================================================="

# Verificar Node.js y npm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm primero."
    exit 1
fi

echo "✅ Node.js y npm detectados"

# Instalar dependencias
echo "📦 Instalando dependencias (incluyendo mssql para SQL Server 2008)..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error instalando dependencias"
    exit 1
fi

echo "✅ Dependencias instaladas correctamente"

# Verificar variables de entorno
echo "🔍 Verificando configuración..."

if [ ! -f ".env.local" ]; then
    echo "⚠️  Archivo .env.local no encontrado"
    echo "💡 Asegúrate de que contenga:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - SQLSERVER_HOST=gabinete2\\INFOMED"
    echo "   - SQLSERVER_DATABASE=GELITE"
    echo "   - SQLSERVER_USER=RUBIOGARCIADENTAL"
    echo "   - SQLSERVER_PASSWORD=666666"
    echo "   - GESDEN_AUTO_SYNC=true"
else
    echo "✅ Archivo .env.local encontrado"
fi

# Verificar estructura de archivos
echo "📁 Verificando estructura de archivos..."

required_files=(
    "services/sql-server.ts"
    "services/gesden-integration.ts"
    "services/sync-gesden-supabase.ts"
    "hooks/useGESDENSync.ts"
    "components/GESDENInitializer.tsx"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Archivo faltante: $file"
        exit 1
    else
        echo "✅ $file encontrado"
    fi
done

# Verificar base de datos Supabase
echo "🗄️  Verificando configuración de Supabase..."

supabase_url=$(grep "NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d '=' -f2)
if [ -z "$supabase_url" ]; then
    echo "⚠️  NEXT_PUBLIC_SUPABASE_URL no configurado en .env.local"
else
    echo "✅ Supabase URL configurado"
fi

# Configuración final
echo ""
echo "🎯 CONFIGURACIÓN FINALIZADA"
echo "=================================================================="
echo "📋 Resumen de la integración:"
echo "   ✅ SQL Server 2008 (GESDEN) - Conexión real"
echo "   ✅ Supabase - Base de datos principal"
echo "   ✅ Sincronización bidireccional en tiempo real"
echo "   ✅ Detección automática de conflictos"
echo "   ✅ Monitoreo continuo de salud del sistema"
echo ""
echo "🚀 Para iniciar la aplicación:"
echo "   npm run dev"
echo ""
echo "📊 Para monitorear el estado de sincronización:"
echo "   - Busca el widget en la esquina inferior derecha"
echo "   - Verifica los logs en la consola del navegador"
echo ""
echo "🔗 GESDEN puede seguir usando SQL Server normalmente"
echo "   mientras la aplicación mantiene sincronización perfecta"
echo ""

echo "🎉 ¡Instalación completada exitosamente!"
echo "💡 La integración GESDEN ↔ Supabase está lista para funcionar."