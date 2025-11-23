'use client'

import React, { useState, useEffect } from 'react'
import { 
  Server, 
  Database, 
  Sync, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  Settings,
  BarChart3,
  Wifi,
  WifiOff,
  RefreshCw,
  Play,
  Pause,
  Monitor
} from 'lucide-react'

interface GESDENDashboardProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical' | 'offline'
  components: {
    sqlserver: ComponentStatus
    supabase: ComponentStatus
    sync_engine: ComponentStatus
    websocket: ComponentStatus
    cdc: ComponentStatus
  }
  metrics: SystemMetrics
  lastUpdate: Date
}

interface ComponentStatus {
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error'
  latency: number
  lastSuccess: Date | null
  errorCount: number
  details?: string
}

interface SystemMetrics {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  conflicts: number
  avgLatency: number
  uptime: number
  activeAlerts: number
}

interface Alert {
  id: string
  type: 'error' | 'warning' | 'info' | 'critical'
  source: string
  message: string
  timestamp: Date
  acknowledged: boolean
  resolved: boolean
}

export function GESDENDashboard({ 
  className = '', 
  autoRefresh = true, 
  refreshInterval = 30000 
}: GESDENDashboardProps) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'metrics' | 'alerts' | 'config'>('overview')

  useEffect(() => {
    // Cargar datos iniciales
    fetchSystemStatus()
    fetchAlerts()

    // Configurar auto-refresh
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchSystemStatus, refreshInterval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const fetchSystemStatus = async () => {
    try {
      setIsRefreshing(true)
      
      // Simular llamadas API (en producción usar servicios reales)
      const response = await fetch('/api/gesden/status')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setSystemStatus(data)
      
    } catch (error) {
      console.error('Error fetching system status:', error)
      // Mantener estado anterior en caso de error
    } finally {
      setIsRefreshing(false)
    }
  }

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/gesden/alerts')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  const forceSync = async () => {
    try {
      const response = await fetch('/api/gesden/force-sync', { method: 'POST' })
      if (response.ok) {
        await fetchSystemStatus()
        alert('Sincronización forzada iniciada')
      }
    } catch (error) {
      console.error('Error forcing sync:', error)
      alert('Error iniciando sincronización forzada')
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/gesden/alerts/${alertId}/acknowledge`, { method: 'POST' })
      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        ))
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/gesden/alerts/${alertId}/resolve`, { method: 'POST' })
      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, resolved: true } : alert
        ))
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'warning':
      case 'reconnecting':
        return 'text-yellow-600 bg-yellow-100'
      case 'critical':
      case 'disconnected':
      case 'error':
      case 'offline':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'active':
        return <CheckCircle className="w-4 h-4" />
      case 'warning':
      case 'reconnecting':
        return <AlertTriangle className="w-4 h-4" />
      case 'critical':
      case 'disconnected':
      case 'error':
      case 'offline':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (!systemStatus) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando dashboard GESDEN...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              🔄 GESDEN ↔ Supabase Dashboard
            </h2>
            <p className="text-gray-600 mt-1">
              Estado general: 
              <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(systemStatus.overall)}`}>
                {systemStatus.overall.toUpperCase()}
              </span>
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchSystemStatus}
              disabled={isRefreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            
            <button
              onClick={forceSync}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Sync className="w-4 h-4 mr-2" />
              Sync Manual
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          Última actualización: {systemStatus.lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Resumen', icon: <Monitor className="w-4 h-4" /> },
            { id: 'metrics', label: 'Métricas', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'alerts', label: 'Alertas', icon: <AlertTriangle className="w-4 h-4" /> },
            { id: 'config', label: 'Configuración', icon: <Settings className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center py-4 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {selectedTab === 'overview' && (
          <OverviewTab status={systemStatus} />
        )}
        
        {selectedTab === 'metrics' && (
          <MetricsTab metrics={systemStatus.metrics} />
        )}
        
        {selectedTab === 'alerts' && (
          <AlertsTab 
            alerts={alerts} 
            onAcknowledge={acknowledgeAlert}
            onResolve={resolveAlert}
          />
        )}
        
        {selectedTab === 'config' && (
          <ConfigTab />
        )}
      </div>
    </div>
  )
}

// Componente de Resumen
function OverviewTab({ status }: { status: SystemStatus }) {
  return (
    <div className="space-y-6">
      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatusCard
          title="SQL Server 2008"
          status={status.components.sqlserver.status}
          latency={status.components.sqlserver.latency}
          details="GESDEN Connection"
        />
        <StatusCard
          title="Supabase"
          status={status.components.supabase.status}
          latency={status.components.supabase.latency}
          details="Cloud Database"
        />
        <StatusCard
          title="Sync Engine"
          status={status.components.sync_engine.status}
          latency={0}
          details="Real-time Sync"
        />
        <StatusCard
          title="WebSocket"
          status={status.components.websocket.status}
          latency={0}
          details="Real-time Channel"
        />
        <StatusCard
          title="CDC"
          status={status.components.cdc.status}
          latency={0}
          details="Change Data Capture"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Operaciones Totales"
          value={status.metrics.totalOperations.toLocaleString()}
          icon={<Activity className="w-5 h-5" />}
        />
        <StatCard
          title="Éxito Rate"
          value={`${((status.metrics.successfulOperations / status.metrics.totalOperations) * 100).toFixed(1)}%`}
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatCard
          title="Conflictos"
          value={status.metrics.conflicts.toString()}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard
          title="Alertas Activas"
          value={status.metrics.activeAlerts.toString()}
          icon={<Bell className="w-5 h-5" />}
        />
      </div>
    </div>
  )
}

// Componente de Métricas
function MetricsTab({ metrics }: { metrics: SystemMetrics }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Success Rate Chart */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Tasa de Éxito</h3>
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - metrics.successfulOperations / metrics.totalOperations)}`}
                className="text-green-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">
                {((metrics.successfulOperations / metrics.totalOperations) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Operations Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Desglose de Operaciones</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Exitosas</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(metrics.successfulOperations / metrics.totalOperations) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{metrics.successfulOperations}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fallidas</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(metrics.failedOperations / metrics.totalOperations) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{metrics.failedOperations}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de Alertas
function AlertsTab({ alerts, onAcknowledge, onResolve }: {
  alerts: Alert[]
  onAcknowledge: (id: string) => void
  onResolve: (id: string) => void
}) {
  const activeAlerts = alerts.filter(alert => !alert.resolved)
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Alertas Activas ({activeAlerts.length})</h3>
      </div>
      
      {activeAlerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <p>No hay alertas activas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeAlerts.map(alert => (
            <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${
                    alert.type === 'critical' ? 'bg-red-100' :
                    alert.type === 'error' ? 'bg-red-100' :
                    alert.type === 'warning' ? 'bg-yellow-100' :
                    'bg-blue-100'
                  }`}>
                    {getStatusIcon(alert.type === 'error' ? 'error' : 'warning')}
                  </div>
                  <div>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm text-gray-500">
                      {alert.source} • {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!alert.acknowledged && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Reconocer
                    </button>
                  )}
                  <button
                    onClick={() => onResolve(alert.id)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Resolver
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Componente de Configuración
function ConfigTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Configuración de Sincronización</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConfigField label="Auto Sync" value="Habilitado" />
          <ConfigField label="Intervalo Sync" value="5 segundos" />
          <ConfigField label="Resolución de Conflictos" value="Timestamp" />
          <ConfigField label="CDC Status" value="Activo" />
          <ConfigField label="Reconnection" value="Automática" />
          <ConfigField label="Monitoring" value="24/7" />
        </div>
      </div>
    </div>
  )
}

// Componentes auxiliares
function StatusCard({ title, status, latency, details }: {
  title: string
  status: string
  latency: number
  details: string
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className={`flex items-center px-2 py-1 rounded-full text-xs ${
          status === 'connected' || status === 'active' ? 'bg-green-100 text-green-700' :
          status === 'warning' || status === 'reconnecting' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {getStatusIcon(status)}
          <span className="ml-1 capitalize">{status}</span>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        {details}
      </div>
      {latency > 0 && (
        <div className="text-xs text-gray-400 mt-1">
          Latencia: {latency}ms
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon }: {
  title: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  )
}

function ConfigField({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm">
        {value}
      </div>
    </div>
  )
}

// Helper function (moved outside component)
function getStatusIcon(status: string) {
  switch (status) {
    case 'connected':
    case 'active':
      return <CheckCircle className="w-4 h-4" />
    case 'warning':
    case 'reconnecting':
      return <AlertTriangle className="w-4 h-4" />
    case 'disconnected':
    case 'error':
      return <XCircle className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

// Import missing icon
function Bell({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

export default GESDENDashboard