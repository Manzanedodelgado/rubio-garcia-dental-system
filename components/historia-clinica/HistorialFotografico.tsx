"use client"

import { useState, useEffect } from 'react'
import { HistoriaClinicaService } from '@/services/historia-clinica'
import type { FotoTratamiento } from '@/types'
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
  Camera, 
  Upload, 
  Search, 
  Trash2, 
  Download, 
  Tag, 
  Calendar, 
  Image as ImageIcon,
  Plus,
  X,
  Eye
} from 'lucide-react'

interface HistorialFotograficoProps {
  pacienteId: string
  onRefresh: () => void
}

export default function HistorialFotografico({ pacienteId, onRefresh }: HistorialFotograficoProps) {
  const [fotos, setFotos] = useState<FotoTratamiento[]>([])
  const [filteredFotos, setFilteredFotos] = useState<FotoTratamiento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEtiqueta, setSelectedEtiqueta] = useState<string>('todas')
  const [showModal, setShowModal] = useState(false)
  const [showViewer, setShowViewer] = useState(false)
  const [selectedFoto, setSelectedFoto] = useState<FotoTratamiento | null>(null)
  const [uploading, setUploading] = useState(false)

  // Estados para el formulario
  const [formData, setFormData] = useState({
    tratamiento_id: '',
    descripcion: '',
    etiquetas: [] as string[],
    nuevaEtiqueta: ''
  })

  const tratamientosComunes = [
    'Limpieza Dental',
    'Empaste',
    'Endodoncia',
    'Corona',
    'Implante',
    'Extracción',
    'Ortodoncia',
    'Blanqueamiento',
    'Primera Visita',
    'Control',
    'Urgencia',
    'Cirugía'
  ]

  const etiquetasComunes = [
    'antes_tratamiento',
    'durante_tratamiento',
    'despues_tratamiento',
    'radiografia',
    'intraoral',
    'extraoral',
    'seguimiento',
    'urgencia',
    'control'
  ]

  useEffect(() => {
    cargarFotos()
  }, [pacienteId])

  useEffect(() => {
    filtrarFotos()
  }, [fotos, searchQuery, selectedEtiqueta])

  const cargarFotos = async () => {
    try {
      setLoading(true)
      const fotosData = await HistoriaClinicaService.getFotosTratamiento(pacienteId)
      setFotos(fotosData)
    } catch (error) {
      console.error('Error cargando fotos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtrarFotos = () => {
    let filtered = fotos

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(foto => 
        foto.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        foto.etiquetas.some(etiqueta => etiqueta.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filtrar por etiqueta
    if (selectedEtiqueta !== 'todas') {
      filtered = filtered.filter(foto => 
        foto.etiquetas.includes(selectedEtiqueta)
      )
    }

    setFilteredFotos(filtered)
  }

  const obtenerEtiquetasUnicas = () => {
    const todasEtiquetas = fotos.flatMap(foto => foto.etiquetas)
    return [...new Set(todasEtiquetas)]
  }

  const handleSubirFoto = async (file: File) => {
    try {
      setUploading(true)
      
      // En un entorno real, aquí subirías el archivo a Supabase Storage
      // Por ahora simularemos la subida
      const urlFoto = URL.createObjectURL(file)
      
      const fotoData = {
        paciente_id: pacienteId,
        cita_id: undefined,
        tratamiento_id: formData.tratamiento_id || 'general',
        descripcion: formData.descripcion || `Foto subida el ${new Date().toLocaleDateString()}`,
        url_foto: urlFoto, // En producción sería la URL real de Supabase Storage
        fecha_toma: new Date().toISOString().split('T')[0],
        etiquetas: formData.etiquetas
      }

      const nuevaFoto = await HistoriaClinicaService.subirFotoTratamiento(fotoData)
      
      if (nuevaFoto) {
        await cargarFotos()
        onRefresh()
        setShowModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error subiendo foto:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleEliminarFoto = async (fotoId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta foto?')) {
      try {
        const success = await HistoriaClinicaService.eliminarFotoTratamiento(fotoId)
        if (success) {
          await cargarFotos()
          onRefresh()
        }
      } catch (error) {
        console.error('Error eliminando foto:', error)
      }
    }
  }

  const handleVerFoto = (foto: FotoTratamiento) => {
    setSelectedFoto(foto)
    setShowViewer(true)
  }

  const handleAgregarEtiqueta = () => {
    if (formData.nuevaEtiqueta && !formData.etiquetas.includes(formData.nuevaEtiqueta)) {
      setFormData({
        ...formData,
        etiquetas: [...formData.etiquetas, formData.nuevaEtiqueta],
        nuevaEtiqueta: ''
      })
    }
  }

  const handleQuitarEtiqueta = (etiqueta: string) => {
    setFormData({
      ...formData,
      etiquetas: formData.etiquetas.filter(e => e !== etiqueta)
    })
  }

  const resetForm = () => {
    setFormData({
      tratamiento_id: '',
      descripcion: '',
      etiquetas: [],
      nuevaEtiqueta: ''
    })
  }

  const abrirModalSubida = () => {
    resetForm()
    setShowModal(true)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar que es una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido')
        return
      }

      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('La imagen debe ser menor a 10MB')
        return
      }

      handleSubirFoto(file)
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Historial Fotográfico</h2>
          <p className="text-gray-600">Gestión de fotografías de tratamientos y seguimiento</p>
        </div>
        <Button onClick={abrirModalSubida} className="bg-navy-900 hover:bg-navy-800">
          <Upload className="h-4 w-4 mr-2" />
          Subir Foto
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
                  placeholder="Buscar fotos por descripción o etiqueta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedEtiqueta} onValueChange={setSelectedEtiqueta}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por etiqueta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las etiquetas</SelectItem>
                {etiquetasComunes.map((etiqueta) => (
                  <SelectItem key={etiqueta} value={etiqueta}>
                    {etiqueta.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Fotos */}
      {filteredFotos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay fotografías
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedEtiqueta !== 'todas' 
                ? 'No se encontraron fotos con los filtros aplicados'
                : 'Comienza subiendo la primera fotografía del tratamiento'
              }
            </p>
            <Button onClick={abrirModalSubida} className="bg-navy-900 hover:bg-navy-800">
              <Camera className="h-4 w-4 mr-2" />
              Subir Primera Foto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFotos.map((foto) => (
            <Card key={foto.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square relative bg-gray-100">
                <img
                  src={foto.url_foto}
                  alt={foto.descripcion}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => handleVerFoto(foto)}
                />
                <div className="absolute top-2 right-2 flex space-x-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={() => handleVerFoto(foto)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEliminarFoto(foto.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-medium text-navy-900 mb-2 line-clamp-2">
                  {foto.descripcion}
                </h3>
                
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(foto.fecha_toma).toLocaleDateString()}
                </div>
                
                {foto.etiquetas.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {foto.etiquetas.slice(0, 3).map((etiqueta) => (
                      <Badge key={etiqueta} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {etiqueta.replace('_', ' ')}
                      </Badge>
                    ))}
                    {foto.etiquetas.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{foto.etiquetas.length - 3} más
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Subida */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Subir Nueva Fotografía</DialogTitle>
            <DialogDescription>
              Selecciona una imagen y completa la información del tratamiento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selección de archivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Selecciona una imagen (máx. 10MB)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="cursor-pointer"
                    disabled={uploading}
                  >
                    {uploading ? 'Subiendo...' : 'Seleccionar Archivo'}
                  </Button>
                </label>
              </div>
            </div>

            {/* Tratamiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Tratamiento
              </label>
              <Select value={formData.tratamiento_id} onValueChange={(value) => setFormData({ ...formData, tratamiento_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de tratamiento" />
                </SelectTrigger>
                <SelectContent>
                  {tratamientosComunes.map((tratamiento) => (
                    <SelectItem key={tratamiento} value={tratamiento.toLowerCase().replace(' ', '_')}>
                      {tratamiento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Describe la fotografía del tratamiento..."
                rows={3}
              />
            </div>

            {/* Etiquetas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Etiquetas
              </label>
              
              {/* Etiquetas seleccionadas */}
              {formData.etiquetas.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {formData.etiquetas.map((etiqueta) => (
                    <Badge key={etiqueta} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {etiqueta.replace('_', ' ')}
                      <button
                        onClick={() => handleQuitarEtiqueta(etiqueta)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Agregar nueva etiqueta */}
              <div className="flex space-x-2">
                <Input
                  value={formData.nuevaEtiqueta}
                  onChange={(e) => setFormData({ ...formData, nuevaEtiqueta: e.target.value })}
                  placeholder="Nueva etiqueta..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAgregarEtiqueta()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAgregarEtiqueta}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Etiquetas sugeridas */}
              <div className="flex flex-wrap gap-1 mt-2">
                {etiquetasComunes.map((etiqueta) => (
                  <Button
                    key={etiqueta}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => {
                      if (!formData.etiquetas.includes(etiqueta)) {
                        setFormData({
                          ...formData,
                          etiquetas: [...formData.etiquetas, etiqueta]
                        })
                      }
                    }}
                    disabled={formData.etiquetas.includes(etiqueta)}
                  >
                    {etiqueta.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowModal(false)}
              disabled={uploading}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualización */}
      <Dialog open={showViewer} onOpenChange={setShowViewer}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ImageIcon className="h-5 w-5 mr-2" />
              {selectedFoto?.descripcion}
            </DialogTitle>
            <DialogDescription>
              {selectedFoto && (
                <div className="flex items-center space-x-4 text-sm">
                  <span>Fecha: {new Date(selectedFoto.fecha_toma).toLocaleDateString()}</span>
                  <span>Tratamiento: {selectedFoto.tratamiento_id}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedFoto && (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={selectedFoto.url_foto}
                  alt={selectedFoto.descripcion}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {selectedFoto.etiquetas.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Etiquetas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFoto.etiquetas.map((etiqueta) => (
                      <Badge key={etiqueta} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {etiqueta.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    // En producción, esto descargaría la imagen
                    const link = document.createElement('a')
                    link.href = selectedFoto.url_foto
                    link.download = `tratamiento_${selectedFoto.id}.jpg`
                    link.click()
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                
                <div className="text-sm text-gray-600">
                  ID: {selectedFoto.id}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}