import { NextApiRequest, NextApiResponse } from 'next'
import { gesdenMonitoringSystem } from '@/services/gesden-monitoring'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      return handleGetAlerts(req, res)
    } else if (req.method === 'POST') {
      const { alertId } = req.query
      
      if (alertId && req.url?.includes('/acknowledge')) {
        return handleAcknowledgeAlert(req, res, alertId as string)
      } else if (alertId && req.url?.includes('/resolve')) {
        return handleResolveAlert(req, res, alertId as string)
      } else {
        return res.status(400).json({ error: 'Invalid endpoint' })
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST'])
      return res.status(405).json({ error: 'Method not allowed' })
    }

  } catch (error: any) {
    console.error('Error in /api/gesden/alerts:', error)
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message
    })
  }
}

async function handleGetAlerts(req: NextApiRequest, res: NextApiResponse) {
  const { limit = 50, status = 'active', type } = req.query
  
  try {
    let alerts = gesdenMonitoringSystem.getAllAlerts(parseInt(limit as string))
    
    // Filtrar por estado
    if (status === 'active') {
      alerts = alerts.filter(alert => !alert.resolved)
    } else if (status === 'resolved') {
      alerts = alerts.filter(alert => alert.resolved)
    }
    
    // Filtrar por tipo
    if (type) {
      alerts = alerts.filter(alert => alert.type === type)
    }
    
    // Formatear alertas para la respuesta
    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      type: alert.type,
      source: alert.source,
      message: alert.message,
      timestamp: alert.timestamp.toISOString(),
      acknowledged: alert.acknowledged,
      resolved: alert.resolved,
      details: alert.details
    }))

    const response = {
      alerts: formattedAlerts,
      total: formattedAlerts.length,
      activeCount: alerts.filter(a => !a.resolved).length,
      criticalCount: alerts.filter(a => a.type === 'critical' && !a.resolved).length,
      timestamp: new Date().toISOString()
    }

    res.status(200).json(response)

  } catch (error: any) {
    console.error('Error fetching alerts:', error)
    res.status(500).json({ 
      error: 'Error obteniendo alertas',
      details: error.message
    })
  }
}

async function handleAcknowledgeAlert(req: NextApiRequest, res: NextApiResponse, alertId: string) {
  try {
    const success = gesdenMonitoringSystem.acknowledgeAlert(alertId)
    
    if (success) {
      res.status(200).json({ 
        message: 'Alerta reconocida exitosamente',
        alertId,
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(404).json({ 
        error: 'Alerta no encontrada',
        alertId
      })
    }

  } catch (error: any) {
    console.error('Error acknowledging alert:', error)
    res.status(500).json({ 
      error: 'Error reconociendo alerta',
      details: error.message
    })
  }
}

async function handleResolveAlert(req: NextApiRequest, res: NextApiResponse, alertId: string) {
  try {
    const success = gesdenMonitoringSystem.resolveAlert(alertId)
    
    if (success) {
      res.status(200).json({ 
        message: 'Alerta resuelta exitosamente',
        alertId,
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(404).json({ 
        error: 'Alerta no encontrada',
        alertId
      })
    }

  } catch (error: any) {
    console.error('Error resolving alert:', error)
    res.status(500).json({ 
      error: 'Error resolviendo alerta',
      details: error.message
    })
  }
}