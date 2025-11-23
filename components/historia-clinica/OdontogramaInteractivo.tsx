"use client"

import { useState, useEffect } from 'react'
import { HistoriaClinicaService } from '@/services/historia-clinica'
import type { Odontograma, Diente } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import { 
  Save, 
  RotateCcw, 
  Info, 
  AlertTriangle,
  CheckCircle,
  Crown,
  XCircle,
  Zap
} from 'lucide-react'

interface OdontogramaInteractivoProps {
  pacienteId: string
  onRefresh: () => void
}

export default function OdontogramaInteractivo({ pacienteId, onRefresh }: OdontogramaInteractivoProps) {
  const [odontograma, setOdontograma] = useState<Odontograma | null>(null)
  const [selectedDiente, setSelectedDiente] = useState<Diente | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Estados para el formulario de edición de diente
  const [editForm, setEditForm] = useState({
    estado: 'sano' as Diente['estado'],
    tratamientos: [] as string[],
    notas: ''
  })

  const estadosDiente = [
    { value: 'sano', label: 'Sano', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
    { value: 'caries', label: 'Caries', color: 'bg-red-100 text-red-800 border-red-300', icon: AlertTriangle },
    { value: 'obturado', label: 'Obturado', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
    { value: 'corona', label: 'Corona', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Crown },
    { value: 'ausente', label: 'Ausente', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: XCircle },
    { value: 'implante', label: 'Implante', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: Zap }
  ]

  const tratamientosComunes = [
    'Empaste',
    'Endodoncia',
    'Corona',
    'Implante',
    'Extracción',
    'Limpieza',
    'Fluorización',
    'Sellado',
    'Blanqueamiento',
    'Ortodoncia'
  ]

  useEffect(() => {
    cargarOdontograma()
  }, [pacienteId])

  const cargarOdontograma = async () => {
    try {
      setLoading(true)
      const data = await HistoriaClinicaService.getOdontograma(pacienteId)
      setOdontograma(data)
    } catch (error) {
      console.error('Error cargando odontograma:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDienteClick = (diente: Diente) => {
    setSelectedDiente(diente)
    setEditForm({
      estado: diente.estado,
      tratamientos: [...diente.tratamientos],
      notas: diente.notas || ''
    })
    setShowModal(true)
  }

  const handleGuardarDiente = async () => {
    if (!selectedDiente) return

    try {
      setUpdating(true)
      const success = await HistoriaClinicaService.actualizarDiente(
        pacienteId,
        selectedDiente.numero,
        {
          estado: editForm.estado,
          tratamientos: editForm.tratamientos,
          notas: editForm.notas
        }
      )

      if (success) {
        await cargarOdontograma()
        onRefresh()
        setShowModal(false)
      }
    } catch (error) {
      console.error('Error guardando diente:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleResetearOdontograma = async () => {
    if (confirm('¿Estás seguro de que deseas resetear todos los dientes a estado sano?')) {
      try {
        setUpdating(true)
        // Esta función resetearía todos los dientes
        // Por simplicidad, recrearemos el odontograma
        const nuevoOdontograma = await HistoriaClinicaService.crearOdontogramaInicial(pacienteId)
        setOdontograma(nuevoOdontograma)
        onRefresh()
      } catch (error) {
        console.error('Error reseteando odontograma:', error)
      } finally {
        setUpdating(false)
      }
    }
  }

  const getDienteColor = (diente: Diente) => {
    const estadoInfo = estadosDiente.find(e => e.value === diente.estado)
    return estadoInfo?.color || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const renderDiente = (numero: number, position: 'superior' | 'inferior', side: 'izquierda' | 'derecha') => {
    if (!odontograma) return null

    const diente = odontograma.dientes.find(d => d.numero === numero)
    if (!diente) return null

    const estadoInfo = estadosDiente.find(e => e.value === diente.estado)
    const IconComponent = estadoInfo?.icon || CheckCircle

    return (
      <button
        key={numero}
        onClick={() => handleDienteClick(diente)}
        className={`
          w-12 h-16 border-2 rounded-lg flex flex-col items-center justify-center text-xs font-medium
          transition-all hover:scale-105 hover:shadow-md
          ${getDienteColor(diente)}
          ${selectedDiente?.numero === numero ? 'ring-2 ring-navy-500' : ''}
        `}
        title={`Diente ${numero} - ${estadoInfo?.label || 'Desconocido'}`}
      >
        <IconComponent className="h-3 w-3 mb-1" />
        <span>{numero}</span>
      </button>
    )
  }

  const renderSeccionDientes = (
    titulo: string, 
    numeros: number[], 
    position: 'superior' | 'inferior'
  ) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-navy-900 text-center">
        {titulo}
      </h3>
      <div className="space-y-2">
        {/* Dientes derechos (18-15, 48-45) */}
        <div className="flex justify-end space-x-1">
          {numeros.slice(0, 4).reverse().map(numero => 
            renderDiente(numero, position, 'derecha')
          )}
        </div>
        
        {/* Caninos (14, 44) */}
        <div className="flex justify-center space-x-8">
          <div className="w-12 flex justify-center">
            {numeros.length > 4 && renderDiente(numeros[4], position, 'centro')}
          </div>
          <div className="w-12 flex justify-center">
            {numeros.length > 9 && renderDiente(numeros[9], position, 'centro')}
          </div>
        </div>
        
        {/* Incisivos centrales y laterales (13-11, 43-41) */}
        <div className="flex justify-center space-x-1">
          {numeros.slice(5, 9).reverse().map(numero => 
            renderDiente(numero, position, 'centro')
          )}
        </div>
        
        {/* Incisivos centrales y laterales (21-23, 31-33) */}
        <div className="flex justify-center space-x-1">
          {numeros.slice(10, 14).map(numero => 
            renderDiente(numero, position, 'centro')
          )}
        </div>
        
        {/* Caninos (24, 34) */}
        <div className="flex justify-center space-x-8">
          <div className="w-12 flex justify-center">
            {numeros.length > 14 && renderDiente(numeros[14], position, 'centro')}
          </div>
          <div className="w-12 flex justify-center">
            {numeros.length > 19 && renderDiente(numeros[19], position, 'centro')}
          </div>
        </div>
        
        {/* Dientes derechos (25-28, 35-38) */}
        <div className="flex justify-start space-x-1">
          {numeros.slice(15).map(numero => 
            renderDiente(numero, position, 'izquierda')
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
      </div>
    )
  }

  if (!odontograma) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay odontograma disponible
          </h3>
          <p className="text-gray-600 mb-4">
            No se pudo cargar el odontograma para este paciente
          </p>
          <Button onClick={cargarOdontograma} className="bg-navy-900 hover:bg-navy-800">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Odontograma Interactivo</h2>
          <p className="text-gray-600">
            Última actualización: {new Date(odontograma.ultima_actualizacion).toLocaleString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleResetearOdontograma}
            disabled={updating}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetear
          </Button>
        </div>
      </div>

      {/* Leyenda */}
      <Card>
        <CardHeader>
          <CardTitle>Leyenda de Estados</CardTitle>
          <CardDescription>
            Haz clic en cualquier diente para editar su estado y tratamientos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {estadosDiente.map((estado) => {
              const IconComponent = estado.icon
              return (
                <div key={estado.value} className={`p-3 rounded-lg border ${estado.color} text-center`}>
                  <IconComponent className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">{estado.label}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Odontograma */}
      <Card>
        <CardHeader>
          <CardTitle>Diagrama Dental</CardTitle>
          <CardDescription>
            Haz clic en cualquier diente para ver y editar su información
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Dientes superiores */}
            {renderSeccionDientes(
              'Dientes Superiores', 
              [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], 
              'superior'
            )}
            
            {/* Línea divisoria */}
            <div className="border-t-2 border-gray-300 my-8"></div>
            
            {/* Dientes inferiores */}
            {renderSeccionDientes(
              'Dientes Inferiores', 
              [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38], 
              'inferior'
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {estadosDiente.map((estado) => {
          const cantidad = odontograma.dientes.filter(d => d.estado === estado.value).length
          const IconComponent = estado.icon
          
          return (
            <Card key={estado.value}>
              <CardContent className="p-4 text-center">
                <IconComponent className="h-6 w-6 mx-auto mb-2" />
                <div className="text-2xl font-bold text-navy-900">{cantidad}</div>
                <div className="text-sm text-gray-600">{estado.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal de Edición de Diente */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Editar Diente {selectedDiente?.numero}
            </DialogTitle>
            <DialogDescription>
              Modifica el estado y tratamientos del diente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Estado actual vs nuevo */}
            {selectedDiente && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Estado Actual:</span>
                  <Badge className={getDienteColor(selectedDiente)}>
                    {estadosDiente.find(e => e.value === selectedDiente.estado)?.label}
                  </Badge>
                </div>
                {selectedDiente.fecha_ultimo_tratamiento && (
                  <div className="text-xs text-gray-600">
                    Último tratamiento: {new Date(selectedDiente.fecha_ultimo_tratamiento).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {/* Nuevo estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nuevo Estado *
              </label>
              <Select value={editForm.estado} onValueChange={(value) => setEditForm({ ...editForm, estado: value as Diente['estado'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {estadosDiente.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tratamientos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tratamientos
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {tratamientosComunes.map((tratamiento) => (
                  <label key={tratamiento} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editForm.tratamientos.includes(tratamiento)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditForm({
                            ...editForm,
                            tratamientos: [...editForm.tratamientos, tratamiento]
                          })
                        } else {
                          setEditForm({
                            ...editForm,
                            tratamientos: editForm.tratamientos.filter(t => t !== tratamiento)
                          })
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span>{tratamiento}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <Textarea
                value={editForm.notas}
                onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })}
                placeholder="Notas adicionales sobre el diente..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowModal(false)}
              disabled={updating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleGuardarDiente}
              className="bg-navy-900 hover:bg-navy-800"
              disabled={updating}
            >
              {updating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}