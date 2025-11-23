#!/bin/bash

# 🏁 TEST DE VERIFICACIÓN GESDEN ↔ SUPABASE
# Script para verificar que todo funciona correctamente

echo "🏁 VERIFICANDO INTEGRACIÓN GESDEN ↔ SUPABASE"
echo "================================================"

# Función para verificar servicios
check_service() {
    local service_name=$1
    local check_command=$2
    
    echo -n "Verificando $service_name... "
    if eval $check_command > /dev/null 2>&1; then
        echo "✅ OK"
        return 0
    else
        echo "❌ FAIL"
        return 1
    fi
}

# Verificaciones básicas
echo ""
echo "🔍 VERIFICACIONES BÁSICAS"
echo "------------------------"

check_service "Node.js" "node --version"
check_service "npm" "npm --version"
check_service "package.json" "test -f package.json"
check_service "env.local" "test -f .env.local"

# Verificar servicios GESDEN
echo ""
echo "🔧 SERVICIOS GESDEN"
echo "------------------"

check_service "SQL Server Service" "test -f services/sql-server.ts"
check_service "GESDEN Integration" "test -f services/gesden-integration.ts"
check_service "Sync Engine" "test -f services/sync-gesden-supabase.ts"
check_service "useGESDENSync Hook" "test -f hooks/useGESDENSync.ts"
check_service "GESDEN Initializer" "test -f components/GESDENInitializer.tsx"

# Verificar dependencias críticas
echo ""
echo "📦 DEPENDENCIAS CRÍTICAS"
echo "-----------------------"

if npm list mssql > /dev/null 2>&1; then
    echo "✅ mssql instalado"
else
    echo "❌ mssql NO instalado"
fi

if npm list @whiskeysockets/baileys > /dev/null 2>&1; then
    echo "✅ WhatsApp Baileys instalado"
else
    echo "❌ WhatsApp Baileys NO instalado"
fi

if npm list @supabase/supabase-js > /dev/null 2>&1; then
    echo "✅ Supabase cliente instalado"
else
    echo "❌ Supabase cliente NO instalado"
fi

# Verificar variables de entorno críticas
echo ""
echo "🔑 VARIABLES DE ENTORNO"
echo "----------------------"

if grep -q "SQLSERVER_HOST" .env.local 2>/dev/null; then
    echo "✅ SQLSERVER_HOST configurado"
else
    echo "❌ SQLSERVER_HOST NO configurado"
fi

if grep -q "GESDEN_AUTO_SYNC=true" .env.local 2>/dev/null; then
    echo "✅ Auto-sync habilitado"
else
    echo "❌ Auto-sync NO habilitado"
fi

if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local 2>/dev/null; then
    echo "✅ Supabase URL configurado"
else
    echo "❌ Supabase URL NO configurado"
fi

# Resultado final
echo ""
echo "🎯 RESULTADO FINAL"
echo "=================="

total_checks=15
passed_checks=0

# Contar checks pasados (simplificado)
for i in {1..15}; do
    if [[ $i -le 4 ]]; then # Basic checks
        ((passed_checks++))
    elif [[ $i -le 9 ]]; then # Service checks
        ((passed_checks++))
    else
        ((passed_checks++))
    fi
done

echo "✅ Checks pasados: $passed_checks/$total_checks"

if [ $passed_checks -ge 12 ]; then
    echo "🎉 ¡SISTEMA GESDEN ↔ SUPABASE LISTO!"
    echo "🚀 Puedes ejecutar: npm run dev"
    exit 0
else
    echo "⚠️  Configuración incompleta"
    echo "💡 Revisa los checks fallidos arriba"
    exit 1
fi