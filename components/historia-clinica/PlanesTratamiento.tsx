"use client"

import { useState, useEffect } from 'react'
import { HistoriaClinicaService } from '@/services/historia-clinica'
import type { PlanTratamiento, Doctor } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar, 
  User, 
  FileText,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  PlayCircle,
  Pause
} from 'lucide-react'

interface PlanesTratamientoProps {
  pacienteId: string
  onRefresh: () => void
}

export default function PlanesTratamiento({ pacienteId, onRefresh }: PlanesTratamientoProps) {
  const [planes, setPlanes] = useState<PlanTratamiento[]>([])
  const [filteredPlanes, setFilteredPlanes] = useState<PlanTratamiento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEstado, setSelectedEstado] = useState<string>('todos')
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PlanTratamiento | null>(null)

  // Estados para el formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    doctor_id: '',
    tratamientos: [] as string[],
    fecha_inicio: '',
    fecha_estimada_fin: '',
    costo_total: 0,
    notas: ''
  })

  useEffect(() => {
    cargarPlanes()
  }, [pacienteId])

  useEffect(() => {
    filtrarPlanes()
  }, [planes, searchQuery, selectedEstado])

  const cargarPlanes = async () => {
    try {
      setLoading(true)
      const planesData = await HistoriaClinicaService.getPlanesTratamiento(pacienteId)
      setPlanes(planesData)
    } catch (error) {
      console.error('Error cargando planes de tratamiento:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtrarPlanes = () => {
    let filtered = planes

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(plan => 
        plan.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.notas.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtrar por estado
    if (selectedEstado !== 'todos') {
      filtered = filtered.filter(plan => plan.estado === selectedEstado)
    }

    setFilteredPlanes(filtered)
  }

  const getEstadoColor = (estado: PlanTratamiento['estado']) => {
    switch (estado) {
      case 'planificacion': return 'bg-gray-100 text-gray-800'
      case 'en_proceso': return 'bg-blue-100 text-blue-800'
      case 'completado': return 'bg-green-100 text-green-800'
      case 'cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoIcon = (estado: PlanTratamiento['estado']) => {
    switch (estado) {
      case 'planificacion': return <Pause className="h-4 w-4" />
      case 'en_proceso': return <PlayCircle className="h-4 w-4" />
      case 'completado': return <CheckCircle className="h-4 w-4" />
      case 'cancelado': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const handleEstadoChange = async (planId: string, nuevoEstado: PlanTratamiento['estado']) => {
    try {
      const success = await HistoriaClinicaService.cambiarEstadoPlan(planId, nuevoEstado)
      if (success) {
        await cargarPlanes()
        onRefresh()
      }
    } catch (error) {
      console.error('Error cambiando estado del plan:', error)
    }
  }

  const handleEliminarPlan = async (planId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este plan de tratamiento?')) {
      try {
        const success = await HistoriaClinicaService.eliminarPlanTratamiento(planId)
        if (success) {
          await cargarPlanes()
          onRefresh()
        }
      } catch (error) {
        console.error('Error eliminando plan:', error)
      }
    }
  }

  const handleGuardarPlan = async () => {
    try {
      if (editingPlan) {
        // Actualizar plan existente
        const success = await HistoriaClinicaService.actualizarPlanTratamiento(editingPlan.id, formData)
        if (success) {
          setShowModal(false)
          setEditingPlan(null)
          resetForm()
          await cargarPlanes()
          onRefresh()
        }
      } else {
        // Crear nuevo plan
        const success = await HistoriaClinicaService.crearPlanTratamiento({
          ...formData,
          paciente_id: pacienteId
        })
        if (success) {
          setShowModal(false)
          resetForm()
          await cargarPlanes()
          onRefresh()
        }
      }
    } catch (error) {
      console.error('Error guardando plan:', error)
    }
  }

  const handleEditarPlan = (plan: PlanTratamiento) => {
    setEditingPlan(plan)
    setFormData({
      titulo: plan.titulo,
      descripcion: plan.descripcion,
      doctor_id: plan.doctor_id,
      tratamientos: plan.tratamientos,
      fecha_inicio: plan.fecha_inicio,
      fecha_estimada_fin: plan.fecha_estimada_fin,
      costo_total: plan.costo_total,
      notas: plan.notas
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      doctor_id: '',
      tratamientos: [],
      fecha_inicio: '',
      fecha_estimada_fin: '',
      costo_total: 0,
      notas: ''
    })
    setEditingPlan(null)
  }

  const abrirModalNuevo = () => {
    resetForm()
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Planes de Tratamiento</h2>
          <p className="text-gray-600">Gestión de planes de tratamiento y seguimiento</p>
        </div>
        <Button onClick={abrirModalNuevo} className="bg-navy-900 hover:bg-navy-800">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Plan
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar planes de tratamiento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedEstado} onValueChange={setSelectedEstado}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="planificacion">Planificación</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Planes */}
      <div className="grid gap-6">
        {filteredPlanes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay planes de tratamiento
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedEstado !== 'todos' 
                  ? 'No se encontraron planes con los filtros aplicados'
                  : 'Comienza creando el primer plan de tratamiento'
                }
              </p>
              <Button onClick={abrirModalNuevo} className="bg-navy-900 hover:bg-navy-800">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredPlanes.map((plan) => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-navy-900 mb-2">
                      {plan.titulo}
                    </CardTitle>
                    <CardDescription className="text-gray-600 mb-3">
                      {plan.descripcion}
                    </CardDescription>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge className={getEstadoColor(plan.estado)}>
                        {getEstadoIcon(plan.estado)}
                        <span className="ml-1 capitalize">{plan.estado.replace('_', ' ')}</span>
                      </Badge>
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-1" />
                        Dr. {plan.doctor?.nombre || 'No asignado'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(plan.fecha_inicio).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        €{plan.costo_total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={plan.estado}
                      onValueChange={(value) => handleEstadoChange(plan.id, value as PlanTratamiento['estado'])}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planificacion">Planificación</SelectItem>
                        <SelectItem value="en_proceso">En Proceso</SelectItem>
                        <SelectItem value="completado">Completado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditarPlan(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEliminarPlan(plan.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {plan.notas && (
                <CardContent className="pt-0">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{plan.notas}</p>
                  </div>
                </CardContent>
              )}
              
              <CardContent>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Fecha inicio: {new Date(plan.fecha_inicio).toLocaleDateString()}</span>
                  {plan.fecha_estimada_fin && (
                    <span>Fecha estimada fin: {new Date(plan.fecha_estimada_fin).toLocaleDateString()}</span>
                  )}
                  {plan.fecha_real_fin && (
                    <span className="text-green-600">Completado: {new Date(plan.fecha_real_fin).toLocaleDateString()}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Creación/Edición */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plan de Tratamiento' : 'Nuevo Plan de Tratamiento'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan 
                ? 'Modifica los datos del plan de tratamiento' 
                : 'Completa los datos para crear un nuevo plan de tratamiento'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título del Plan *
              </label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ej: Tratamiento ortodóntico completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción *
              </label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción detallada del plan de tratamiento..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio *
                </label>
                <Input
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Estimada de Fin
                </label>
                <Input
                  type="date"
                  value={formData.fecha_estimada_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_estimada_fin: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo Total (€)
              </label>
              <Input
                type="number"
                value={formData.costo_total}
                onChange={(e) => setFormData({ ...formData, costo_total: Number(e.target.value) })}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas Adicionales
              </label>
              <Textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Notas adicionales sobre el plan..."
                rows={3}
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
              onClick={handleGuardarPlan}
              className="bg-navy-900 hover:bg-navy-800"
              disabled={!formData.titulo || !formData.descripcion || !formData.fecha_inicio}
            >
              {editingPlan ? 'Actualizar' : 'Crear'} Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}