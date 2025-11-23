"use client"

import { useState, useEffect } from 'react'
import { HistoriaClinicaService } from '@/services/historia-clinica'
import type { AlertaMedica } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  AlertTriangle, 
  Info, 
  Plus, 
  Search, 
  Trash2, 
  Clock, 
  Shield,
  AlertCircle,
  X,
  CheckCircle,
  Calendar
} from 'lucide-react'

interface SistemaAlertasProps {
  pacienteId: string
  onRefresh: () => void
}

export default function SistemaAlertas({ pacienteId, onRefresh }: SistemaAlertasProps) {
  const [alertas, setAlertas] = useState<AlertaMedica[]>([])
  const [filteredAlertas, setFilteredAlertas] = useState<AlertaMedica[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNivel, setSelectedNivel] = useState<string>('todos')
  const [selectedTipo, setSelectedTipo] = useState<string>('todos')
  const [showModal, setShowModal] = useState(false)
  const [showVerificar, setShowVerificar] = useState(false)
  const [alertaParaVerificar, setAlertaParaVerificar] = useState<AlertaMedica | null>(null)

  // Estados para el formulario
  const [formData, setFormData] = useState({
    tipo: 'nota' as AlertaMedica['tipo'],
    titulo: '',
    descripcion: '',
    nivel: 'info' as AlertaMedica['nivel'],
    activa: true
  })

  const tiposAlerta = [
    { value: 'alergia', label: 'Alergia', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    { value: 'medicamento', label: 'Medicamento', color: 'bg-orange-100 text-orange-800', icon: Shield },
    { value: 'procedimiento', label: 'Procedimiento', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    { value: 'nota', label: 'Nota', color: 'bg-gray-100 text-gray-800', icon: Info }
  ]

  const nivelesAlerta = [
    { value: 'info', label: 'Información', color: 'bg-blue-100 text-blue-800', icon: Info },
    { value: 'advertencia', label: 'Advertencia', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
    { value: 'critico', label: 'Crítico', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
  ]

  useEffect(() => {
    cargarAlertas()
  }, [pacienteId])

  useEffect(() => {
    filtrarAlertas()
  }, [alertas, searchQuery, selectedNivel, selectedTipo])

  const cargarAlertas = async () => {
    try {
      setLoading(true)
      const alertasData = await HistoriaClinicaService.getAlertas(pacienteId)
      setAlertas(alertasData)
    } catch (error) {
      console.error('Error cargando alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtrarAlertas = () => {
    let filtered = alertas

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(alerta => 
        alerta.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alerta.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtrar por nivel
    if (selectedNivel !== 'todos') {
      filtered = filtered.filter(alerta => alerta.nivel === selectedNivel)
    }

    // Filtrar por tipo
    if (selectedTipo !== 'todos') {
      filtered = filtered.filter(alerta => alerta.tipo === selectedTipo)
    }

    setFilteredAlertas(filtered)
  }

  const getAlertaInfo = (alerta: AlertaMedica) => {
    const tipoInfo = tiposAlerta.find(t => t.value === alerta.tipo)
    const nivelInfo = nivelesAlerta.find(n => n.value === alerta.nivel)
    
    return {
      tipoInfo,
      nivelInfo,
      tipoIcon: tipoInfo?.icon || Info,
      nivelIcon: nivelInfo?.icon || Info,
      tipoColor: tipoInfo?.color || 'bg-gray-100 text-gray-800',
      nivelColor: nivelInfo?.color || 'bg-gray-100 text-gray-800'
    }
  }

  const handleCrearAlerta = async () => {
    try {
      const nuevaAlerta = await HistoriaClinicaService.crearAlerta({
        ...formData,
        paciente_id: pacienteId
      })

      if (nuevaAlerta) {
        await cargarAlertas()
        onRefresh()
        setShowModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error creando alerta:', error)
    }
  }

  const handleDesactivarAlerta = async (alertaId: string) => {
    if (confirm('¿Estás seguro de que deseas desactivar esta alerta?')) {
      try {
        const success = await HistoriaClinicaService.desactivarAlerta(alertaId)
        if (success) {
          await cargarAlertas()
          onRefresh()
        }
      } catch (error) {
        console.error('Error desactivando alerta:', error)
      }
    }
  }

  const handleVerificarAlerta = (alerta: AlertaMedica) => {
    setAlertaParaVerificar(alerta)
    setShowVerificar(true)
  }

  const handleConfirmarVerificacion = async () => {
    if (alertaParaVerificar) {
      await handleDesactivarAlerta(alertaParaVerificar.id)
      setShowVerificar(false)
      setAlertaParaVerificar(null)
    }
  }

  const resetForm = () => {
    setFormData({
      tipo: 'nota',
      titulo: '',
      descripcion: '',
      nivel: 'info',
      activa: true
    })
  }

  const abrirModalNueva = () => {
    resetForm()
    setShowModal(true)
  }

  const alertasCriticas = alertas.filter(a => a.nivel === 'critico' && a.activa)
  const alertasActivas = alertas.filter(a => a.activa)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Sistema de Alertas</h2>
          <p className="text-gray-600">Gestión de alertas médicas y notificaciones</p>
        </div>
        <Button onClick={abrirModalNueva} className="bg-navy-900 hover:bg-navy-800">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Alerta
        </Button>
      </div>

      {/* Resumen de Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-navy-900">{alertasActivas.length}</div>
            <div className="text-sm text-gray-600">Total Activas</div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{alertasCriticas.length}</div>
            <div className="text-sm text-gray-600">Críticas</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {alertas.filter(a => a.nivel === 'advertencia' && a.activa).length}
            </div>
            <div className="text-sm text-gray-600">Advertencias</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {alertas.filter(a => a.nivel === 'info' && a.activa).length}
            </div>
            <div className="text-sm text-gray-600">Informativas</div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticas (pinned) */}
      {alertasCriticas.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Alertas Críticas Activas
            </CardTitle>
            <CardDescription className="text-red-600">
              Estas alertas requieren atención inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertasCriticas.map((alerta) => {
                const { tipoInfo, nivelInfo, tipoIcon: TipoIcon, nivelIcon: NivelIcon } = getAlertaInfo(alerta)
                return (
                  <div key={alerta.id} className="bg-white p-4 rounded-lg border border-red-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <TipoIcon className="h-4 w-4 text-red-600" />
                          <h3 className="font-medium text-red-900">{alerta.titulo}</h3>
                          <Badge className={nivelColor}>{nivelInfo?.label}</Badge>
                        </div>
                        <p className="text-red-700 text-sm mb-2">{alerta.descripcion}</p>
                        <div className="flex items-center text-xs text-red-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(alerta.fecha_creacion).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerificarAlerta(alerta)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDesactivarAlerta(alerta.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar alertas por título o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedNivel} onValueChange={setSelectedNivel}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los niveles</SelectItem>
                {nivelesAlerta.map((nivel) => (
                  <SelectItem key={nivel.value} value={nivel.value}>
                    {nivel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTipo} onValueChange={setSelectedTipo}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {tiposAlerta.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alertas */}
      {filteredAlertas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay alertas activas
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedNivel !== 'todos' || selectedTipo !== 'todos'
                ? 'No se encontraron alertas con los filtros aplicados'
                : 'No hay alertas activas para este paciente'
              }
            </p>
            <Button onClick={abrirModalNueva} className="bg-navy-900 hover:bg-navy-800">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Alerta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlertas.map((alerta) => {
            const { tipoInfo, nivelInfo, tipoIcon: TipoIcon, nivelIcon: NivelIcon } = getAlertaInfo(alerta)
            
            return (
              <Card key={alerta.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <TipoIcon className="h-5 w-5 text-gray-600" />
                        <CardTitle className="text-lg text-navy-900">
                          {alerta.titulo}
                        </CardTitle>
                        <Badge className={nivelColor}>
                          <NivelIcon className="h-3 w-3 mr-1" />
                          {nivelInfo?.label}
                        </Badge>
                        <Badge variant="outline">
                          {tipoInfo?.label}
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-700">
                        {alerta.descripcion}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerificarAlerta(alerta)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDesactivarAlerta(alerta.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Creada: {new Date(alerta.fecha_creacion).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-1" />
                      Estado: {alerta.activa ? 'Activa' : 'Inactiva'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal de Creación */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Alerta Médica</DialogTitle>
            <DialogDescription>
              Crea una nueva alerta para el paciente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Alerta *
              </label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value as AlertaMedica['tipo'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposAlerta.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nivel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nivel de Severidad *
              </label>
              <Select value={formData.nivel} onValueChange={(value) => setFormData({ ...formData, nivel: value as AlertaMedica['nivel'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nivelesAlerta.map((nivel) => (
                    <SelectItem key={nivel.value} value={nivel.value}>
                      {nivel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ej: Alergia a penicilina"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción *
              </label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción detallada de la alerta..."
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCrearAlerta}
              className="bg-navy-900 hover:bg-navy-800"
              disabled={!formData.titulo || !formData.descripcion}
            >
              Crear Alerta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Verificación */}
      <Dialog open={showVerificar} onOpenChange={setShowVerificar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              Verificar Alerta
            </DialogTitle>
            <DialogDescription>
              ¿Confirmas que has revisado y resuelto esta alerta?
            </DialogDescription>
          </DialogHeader>

          {alertaParaVerificar && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">{alertaParaVerificar.titulo}</h3>
                <p className="text-gray-700 text-sm">{alertaParaVerificar.descripcion}</p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowVerificar(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleConfirmarVerificacion}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Marcar como Revisada
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}