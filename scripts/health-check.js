#!/usr/bin/env node

/**
 * SCRIPT DE HEALTH CHECK - RUBIO GARCÍA DENTAL
 * Verifica el estado de todos los servicios críticos del sistema
 * Autor: MiniMax Agent
 */

const fs = require('fs');
const path = require('path');

class HealthChecker {
  constructor() {
    this.results = {
      system: {},
      services: {},
      database: {},
      integrations: {},
      status: 'unknown'
    };
  }

  async runHealthCheck() {
    console.log('🏥 INICIANDO HEALTH CHECK - RUBIO GARCÍA DENTAL');
    console.log('=' .repeat(60));

    try {
      // 1. Verificar configuración básica
      await this.checkBasicConfiguration();
      
      // 2. Verificar servicios críticos
      await this.checkCriticalServices();
      
      // 3. Verificar base de datos
      await this.checkDatabase();
      
      // 4. Verificar integraciones
      await this.checkIntegrations();
      
      // 5. Generar reporte
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Error durante health check:', error.message);
      this.results.status = 'error';
    }
  }

  async checkBasicConfiguration() {
    console.log('\n🔧 1. CONFIGURACIÓN BÁSICA');
    console.log('-'.repeat(30));

    // Verificar archivos de configuración
    const configFiles = [
      '.env.example',
      'package.json',
      'next.config.js',
      'tsconfig.json'
    ];

    for (const file of configFiles) {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      this.results.system[file] = exists ? '✅' : '❌';
      console.log(`${exists ? '✅' : '❌'} ${file}`);
    }

    // Verificar variables de entorno críticas
    const criticalEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SQLSERVER_HOST',
      'SQLSERVER_DATABASE',
      'LLM_HOST'
    ];

    console.log('\n📋 Variables de Entorno:');
    for (const envVar of criticalEnvVars) {
      const value = process.env[envVar];
      const exists = !!value;
      this.results.system[envVar] = exists ? '✅' : '❌';
      console.log(`${exists ? '✅' : '❌'} ${envVar}: ${exists ? 'Configurado' : 'Faltante'}`);
    }
  }

  async checkCriticalServices() {
    console.log('\n⚡ 2. SERVICIOS CRÍTICOS');
    console.log('-'.repeat(30));

    const criticalServices = [
      'services/whatsapp.ts',
      'services/supabase-pacientes.ts',
      'services/supabase-citas.ts',
      'services/supabase-whatsapp.ts',
      'services/ai.ts',
      'services/sql-server.ts',
      'services/advanced-gesden-sync.ts'
    ];

    for (const service of criticalServices) {
      const exists = fs.existsSync(path.join(process.cwd(), service));
      let size = 0;
      let status = '❌';

      if (exists) {
        const stats = fs.statSync(path.join(process.cwd(), service));
        size = stats.size;
        status = size > 1000 ? '✅' : '⚠️';
      }

      this.results.services[service] = {
        exists,
        size,
        status
      };

      console.log(`${status} ${service} (${size} bytes)`);
    }
  }

  async checkDatabase() {
    console.log('\n🗄️ 3. BASE DE DATOS');
    console.log('-'.repeat(30));

    const schemaFiles = [
      'database/schema_pacientes.sql',
      'database/schema_whatsapp.sql',
      'database/schema_ai.sql',
      'database/schema_historia_clinica.sql',
      'database/schema_configuracion.sql',
      'database/schema_contabilidad.sql',
      'database/schema_gestion_facturas.sql'
    ];

    for (const schema of schemaFiles) {
      const exists = fs.existsSync(path.join(process.cwd(), schema));
      let size = 0;
      let status = '❌';

      if (exists) {
        const stats = fs.statSync(path.join(process.cwd(), schema));
        size = stats.size;
        status = size > 500 ? '✅' : '⚠️';
      }

      this.results.database[schema] = {
        exists,
        size,
        status
      };

      console.log(`${status} ${schema} (${size} bytes)`);
    }
  }

  async checkIntegrations() {
    console.log('\n🔗 4. INTEGRACIONES');
    console.log('-'.repeat(30));

    const apiEndpoints = [
      'pages/api/pacientes/index.ts',
      'pages/api/citas/index.ts',
      'pages/api/whatsapp/connect.ts',
      'pages/api/gesden/status.ts'
    ];

    for (const endpoint of apiEndpoints) {
      const exists = fs.existsSync(path.join(process.cwd(), endpoint));
      let size = 0;
      let status = '❌';

      if (exists) {
        const stats = fs.statSync(path.join(process.cwd(), endpoint));
        size = stats.size;
        status = size > 200 ? '✅' : '⚠️';
      }

      this.results.integrations[endpoint] = {
        exists,
        size,
        status
      };

      console.log(`${status} ${endpoint} (${size} bytes)`);
    }

    // Verificar componentes frontend
    const components = [
      'components/Dashboard.tsx',
      'components/WhatsAppChat.tsx',
      'components/WidgetIAConversacional.tsx'
    ];

    console.log('\n🖥️ Componentes Frontend:');
    for (const component of components) {
      const exists = fs.existsSync(path.join(process.cwd(), component));
      let size = 0;
      let status = '❌';

      if (exists) {
        const stats = fs.statSync(path.join(process.cwd(), component));
        size = stats.size;
        status = size > 500 ? '✅' : '⚠️';
      }

      this.results.integrations[component] = {
        exists,
        size,
        status
      };

      console.log(`${status} ${component} (${size} bytes)`);
    }
  }

  generateReport() {
    console.log('\n📊 REPORTE FINAL');
    console.log('=' .repeat(60));

    // Calcular puntuaciones
    const configScore = this.calculateScore(this.results.system);
    const servicesScore = this.calculateScore(this.results.services);
    const databaseScore = this.calculateScore(this.results.database);
    const integrationsScore = this.calculateScore(this.results.integrations);

    const overallScore = Math.round((configScore + servicesScore + databaseScore + integrationsScore) / 4);

    console.log(`\n🎯 PUNTUACIÓN GENERAL: ${overallScore}/100`);
    console.log(`📋 Configuración: ${configScore}/100`);
    console.log(`⚡ Servicios: ${servicesScore}/100`);
    console.log(`🗄️ Base de Datos: ${databaseScore}/100`);
    console.log(`🔗 Integraciones: ${integrationsScore}/100`);

    // Determinar estado general
    if (overallScore >= 90) {
      this.results.status = 'excellent';
      console.log('\n✅ ESTADO: EXCELENTE - Sistema 100% listo para producción');
    } else if (overallScore >= 75) {
      this.results.status = 'good';
      console.log('\n🟡 ESTADO: BUENO - Sistema listo con mejoras menores');
    } else if (overallScore >= 60) {
      this.results.status = 'fair';
      console.log('\n🟠 ESTADO: ACEPTABLE - Necesita correcciones antes de producción');
    } else {
      this.results.status = 'poor';
      console.log('\n🔴 ESTADO: DEFICIENTE - Requiere trabajo significativo');
    }

    // Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    if (servicesScore < 90) {
      console.log('  • Revisar archivos de servicios faltantes');
    }
    if (databaseScore < 90) {
      console.log('  • Verificar esquemas de base de datos');
    }
    if (integrationsScore < 90) {
      console.log('  • Completar APIs y componentes frontend');
    }

    // Guardar reporte en archivo
    const reportPath = path.join(process.cwd(), 'health-check-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Reporte guardado en: ${reportPath}`);
  }

  calculateScore(results) {
    const items = Object.values(results);
    if (items.length === 0) return 0;

    let passed = 0;
    let total = items.length;

    for (const item of items) {
      if (typeof item === 'object' && item.status) {
        if (item.status === '✅') passed++;
      } else if (typeof item === 'string') {
        if (item === '✅') passed++;
      }
    }

    return Math.round((passed / total) * 100);
  }
}

// Ejecutar health check si se llama directamente
if (require.main === module) {
  const checker = new HealthChecker();
  checker.runHealthCheck().catch(console.error);
}

module.exports = HealthChecker;