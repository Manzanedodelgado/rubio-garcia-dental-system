"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { HistoriaClinicaService } from '@/services/historia-clinica'
import { PacientesService } from '@/services/pacientes'
import type { HistoriaClinica, Paciente, PlanTratamiento, AlertaMedica } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, FileText, Camera, Activity, Users } from 'lucide-react'

import PlanesTratamiento from '@/components/historia-clinica/PlanesTratamiento'
import OdontogramaInteractivo from '@/components/historia-clinica/OdontogramaInteractivo'
import HistorialFotografico from '@/components/historia-clinica/HistorialFotografico'
import SistemaAlertas from '@/components/historia-clinica/SistemaAlertas'
import DocumentosFirmados from '@/components/historia-clinica/DocumentosFirmados'

export default function HistoriaClinicaPage() {
  const searchParams = useSearchParams()
  const pacienteIdFromUrl = searchParams.get('paciente')
  
  const [pacienteId, setPacienteId] = useState<string>('')
  const [historia, setHistoria] = useState<HistoriaClinica | null>(null)
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('planes')

  useEffect(() => {
    if (pacienteIdFromUrl) {
      setPacienteId(pacienteIdFromUrl)
      cargarDatosPaciente(pacienteIdFromUrl)
    } else {
      setLoading(false)
      setError('No se especificó un paciente. Por favor selecciona un paciente desde la gestión de pacientes.')
    }
  }, [pacienteIdFromUrl])

  const cargarDatosPaciente = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const [pacienteData, historiaData, estadisticasData] = await Promise.all([
        PacientesService.getPaciente(id),
        HistoriaClinicaService.getHistoriaClinica(id),
        HistoriaClinicaService.getEstadisticasPaciente(id)
      ])

      if (pacienteData) {
        setPaciente(pacienteData)
      }

      if (historiaData) {
        setHistoria(historiaData)
      }

      if (estadisticasData) {
        setEstadisticas(estadisticasData)
      }

    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('Error al cargar los datos del paciente')
    } finally {
      setLoading(false)
    }
  }

  const cargarDatos = async () => {
    if (!pacienteId) return
    
    try {
      setLoading(true)
      setError(null)

      const [historiaData, estadisticasData] = await Promise.all([
        HistoriaClinicaService.getHistoriaClinica(pacienteId),
        HistoriaClinicaService.getEstadisticasPaciente(pacienteId)
      ])

      if (historiaData) {
        setHistoria(historiaData)
      }

      if (estadisticasData) {
        setEstadisticas(estadisticasData)
      }

    } catch (err) {
      console.error('Error cargando historia clínica:', err)
      setError('Error al cargar los datos de la historia clínica')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {pacienteIdFromUrl ? 'Cargando historia clínica...' : 'Esperando selección de paciente...'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
        <div className="mt-4 flex space-x-2">
          <button 
            onClick={() => window.location.href = '/clinica/pacientes'}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Ir a Pacientes
          </button>
          {pacienteId && (
            <button 
              onClick={cargarDatos}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header con información del paciente */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-navy-900">Historia Clínica</h1>
              {paciente && (
                <Badge className="bg-blue-100 text-blue-800">
                  {paciente.numero_paciente}
                </Badge>
              )}
            </div>
            {paciente ? (
              <div className="space-y-1">
                <p className="text-xl text-gray-900">
                  {paciente.nombre} {paciente.apellido}
                </p>
                <p className="text-gray-600">
                  DNI: {paciente.dni} • Tel: {paciente.telefono_movil}
                </p>
              </div>
            ) : (
              <p className="text-gray-600">
                Gestión integral de tratamientos, odontograma, fotografías y documentos
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.location.href = '/clinica/pacientes'}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Volver a Pacientes
            </button>
          </div>
        </div>
      </div>

      {/* Solo mostrar contenido si tenemos un paciente */}
      {paciente ? (
        <>
          {/* Estadísticas */}
          {estadisticas && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-navy-900">Resumen de Historia Clínica</h2>
                  <p className="text-gray-600">
                    Última actualización: {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-navy-900">
                      {estadisticas.planesActivos || 0}
                    </div>
                    <div className="text-sm text-gray-600">Planes Activos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {estadisticas.alertasCriticas || 0}
                    </div>
                    <div className="text-sm text-gray-600">Alertas Críticas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-golden-600">
                      {estadisticas.documentosPendientes || 0}
                    </div>
                    <div className="text-sm text-gray-600">Documentos Pendientes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {estadisticas.totalFotos || 0}
                    </div>
                    <div className="text-sm text-gray-600">Fotografías</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alertas Críticas */}
          {estadisticas?.alertasCriticas > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Alertas Críticas Activas
                </CardTitle>
                <CardDescription className="text-red-600">
                  Hay {estadisticas.alertasCriticas} alertas críticas que requieren atención inmediata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <button
                  onClick={() => setActiveTab('alertas')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Ver Alertas
                </button>
              </CardContent>
            </Card>
          )}

          {/* Documentos Pendientes */}
          {estadisticas?.documentosPendientes > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Documentos Pendientes de Firma
                </CardTitle>
                <CardDescription className="text-orange-600">
                  Hay {estadisticas.documentosPendientes} documentos pendientes de firma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <button
                  onClick={() => setActiveTab('documentos')}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Ver Documentos
                </button>
              </CardContent>
            </Card>
          )}

          {/* Pestañas Principales */}
          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="border-b bg-gray-50 px-6">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="planes" className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Planes de Tratamiento</span>
                      {estadisticas?.planesActivos > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {estadisticas.planesActivos}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="odontograma" className="flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span>Odontograma</span>
                    </TabsTrigger>
                    <TabsTrigger value="fotos" className="flex items-center space-x-2">
                      <Camera className="h-4 w-4" />
                      <span>Historial Fotográfico</span>
                      {estadisticas?.totalFotos > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {estadisticas.totalFotos}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="alertas" className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Alertas</span>
                      {estadisticas?.alertasCriticas > 0 && (
                        <Badge variant="destructive" className="ml-1">
                          {estadisticas.alertasCriticas}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="documentos" className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Documentos Firmados</span>
                      {estadisticas?.documentosPendientes > 0 && (
                        <Badge variant="outline" className="ml-1 border-orange-500 text-orange-600">
                          {estadisticas.documentosPendientes}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="planes" className="mt-0">
                    <PlanesTratamiento 
                      pacienteId={pacienteId} 
                      onRefresh={cargarDatos}
                    />
                  </TabsContent>

                  <TabsContent value="odontograma" className="mt-0">
                    <OdontogramaInteractivo 
                      pacienteId={pacienteId}
                      onRefresh={cargarDatos}
                    />
                  </TabsContent>

                  <TabsContent value="fotos" className="mt-0">
                    <HistorialFotografico 
                      pacienteId={pacienteId}
                      onRefresh={cargarDatos}
                    />
                  </TabsContent>

                  <TabsContent value="alertas" className="mt-0">
                    <SistemaAlertas 
                      pacienteId={pacienteId}
                      onRefresh={cargarDatos}
                    />
                  </TabsContent>

                  <TabsContent value="documentos" className="mt-0">
                    <DocumentosFirmados 
                      pacienteId={pacienteId}
                      onRefresh={cargarDatos}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>
                Acciones comunes para gestión de historia clínica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <button 
                  onClick={() => setActiveTab('planes')}
                  className="flex items-center justify-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="h-5 w-5 text-navy-600" />
                  <span>Nuevo Plan</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('odontograma')}
                  className="flex items-center justify-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Activity className="h-5 w-5 text-navy-600" />
                  <span>Actualizar Diente</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('fotos')}
                  className="flex items-center justify-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Camera className="h-5 w-5 text-navy-600" />
                  <span>Subir Foto</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('alertas')}
                  className="flex items-center justify-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span>Nueva Alerta</span>
                </button>
                
                <button 
                  onClick={() => setActiveTab('documentos')}
                  className="flex items-center justify-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="h-5 w-5 text-navy-600" />
                  <span>Enviar Documento</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}