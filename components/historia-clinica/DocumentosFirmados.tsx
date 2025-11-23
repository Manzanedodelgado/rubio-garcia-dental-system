"use client"

import { useState, useEffect } from 'react'
import { HistoriaClinicaService } from '@/services/historia-clinica'
import type { DocumentoFirmado } from '@/types'
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
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Download, 
  CheckCircle, 
  XCircle, 
  Smartphone,
  PenTool,
  Calendar,
  Shield,
  ExternalLink,
  Clock,
  Send
} from 'lucide-react'

interface DocumentosFirmadosProps {
  pacienteId: string
  onRefresh: () => void
}

export default function DocumentosFirmados({ pacienteId, onRefresh }: DocumentosFirmadosProps) {
  const [documentos, setDocumentos] = useState<DocumentoFirmado[]>([])
  const [filteredDocumentos, setFilteredDocumentos] = useState<DocumentoFirmado[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTipo, setSelectedTipo] = useState<string>('todos')
  const [selectedMetodo, setSelectedMetodo] = useState<string>('todos')
  const [showModal, setShowModal] = useState(false)
  const [showVistaPrevia, setShowVistaPrevia] = useState(false)
  const [documentoVistaPrevia, setDocumentoVistaPrevia] = useState<DocumentoFirmado | null>(null)

  // Estados para el formulario
  const [formData, setFormData] = useState({
    tipo: 'consentimiento' as DocumentoFirmado['tipo'],
    titulo: '',
    url_documento: '',
    metodo_firma: 'digital' as DocumentoFirmado['metodo_firma'],
    fecha_firma: new Date().toISOString().split('T')[0]
  })

  const tiposDocumento = [
    { 
      value: 'consentimiento', 
      label: 'Consentimiento Informado', 
      descripcion: 'Consentimiento para procedimientos médicos',
      icon: Shield 
    },
    { 
      value: 'lopd', 
      label: 'LOPD - Protección de Datos', 
      descripcion: 'Consentimiento para tratamiento de datos personales',
      icon: Shield 
    },
    { 
      value: 'tratamiento', 
      label: 'Plan de Tratamiento', 
      descripcion: 'Documento con el plan de tratamiento aceptado',
      icon: FileText 
    },
    { 
      value: 'presupuesto', 
      label: 'Presupuesto', 
      descripcion: 'Presupuesto aceptado por el paciente',
      icon: FileText 
    }
  ]

  const metodosFirma = [
    { 
      value: 'digital', 
      label: 'Firma Digital', 
      descripcion: 'Firmado digitalmente en la plataforma',
      icon: PenTool,
      color: 'bg-blue-100 text-blue-800' 
    },
    { 
      value: 'fisica', 
      label: 'Firma Física', 
      descripcion: 'Firmado en papel físicamente',
      icon: FileText,
      color: 'bg-green-100 text-green-800' 
    },
    { 
      value: 'whatsapp', 
      label: 'WhatsApp', 
      descripcion: 'Aceptado via mensaje de WhatsApp',
      icon: Smartphone,
      color: 'bg-purple-100 text-purple-800' 
    }
  ]

  useEffect(() => {
    cargarDocumentos()
  }, [pacienteId])

  useEffect(() => {
    filtrarDocumentos()
  }, [documentos, searchQuery, selectedTipo, selectedMetodo])

  const cargarDocumentos = async () => {
    try {
      setLoading(true)
      const documentosData = await HistoriaClinicaService.getDocumentosFirmados(pacienteId)
      setDocumentos(documentosData)
    } catch (error) {
      console.error('Error cargando documentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtrarDocumentos = () => {
    let filtered = documentos

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tipo.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtrar por tipo
    if (selectedTipo !== 'todos') {
      filtered = filtered.filter(doc => doc.tipo === selectedTipo)
    }

    // Filtrar por método de firma
    if (selectedMetodo !== 'todos') {
      filtered = filtered.filter(doc => doc.metodo_firma === selectedMetodo)
    }

    setFilteredDocumentos(filtered)
  }

  const getDocumentoInfo = (documento: DocumentoFirmado) => {
    const tipoInfo = tiposDocumento.find(t => t.value === documento.tipo)
    const metodoInfo = metodosFirma.find(m => m.value === documento.metodo_firma)
    
    return {
      tipoInfo,
      metodoInfo,
      tipoIcon: tipoInfo?.icon || FileText,
      metodoIcon: metodoInfo?.icon || FileText,
      metodoColor: metodoInfo?.color || 'bg-gray-100 text-gray-800'
    }
  }

  const handleCrearDocumento = async () => {
    try {
      const nuevoDocumento = await HistoriaClinicaService.registrarDocumentoFirmado({
        ...formData,
        paciente_id: pacienteId,
        firma_validada: formData.metodo_firma !== 'digital'
      })

      if (nuevoDocumento) {
        await cargarDocumentos()
        onRefresh()
        setShowModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error creando documento:', error)
    }
  }

  const handleValidarFirma = async (documentoId: string) => {
    try {
      const success = await HistoriaClinicaService.validarFirmaDocumento(documentoId)
      if (success) {
        await cargarDocumentos()
        onRefresh()
      }
    } catch (error) {
      console.error('Error validando firma:', error)
    }
  }

  const handleVistaPrevia = (documento: DocumentoFirmado) => {
    setDocumentoVistaPrevia(documento)
    setShowVistaPrevia(true)
  }

  const handleEnviarWhatsApp = async (documento: DocumentoFirmado) => {
    // En un entorno real, aquí se integraría con WhatsApp API
    const mensaje = `Hola, te hemos enviado el documento "${documento.titulo}" para tu revisión y firma.`
    
    if (confirm(`¿Deseas enviar este documento por WhatsApp?\n\n${mensaje}`)) {
      alert('Documento enviado por WhatsApp (simulación)')
      // Aquí iría la integración real con WhatsApp
    }
  }

  const resetForm = () => {
    setFormData({
      tipo: 'consentimiento',
      titulo: '',
      url_documento: '',
      metodo_firma: 'digital',
      fecha_firma: new Date().toISOString().split('T')[0]
    })
  }

  const abrirModalNuevo = () => {
    resetForm()
    setShowModal(true)
  }

  const documentosPendientes = documentos.filter(d => !d.firma_validada)
  const documentosValidados = documentos.filter(d => d.firma_validada)

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
          <h2 className="text-2xl font-bold text-navy-900">Documentos Firmados</h2>
          <p className="text-gray-600">Gestión de consentimientos y documentos legales</p>
        </div>
        <Button onClick={abrirModalNuevo} className="bg-navy-900 hover:bg-navy-800">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Documento
        </Button>
      </div>

      {/* Resumen de Documentos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-navy-900">{documentos.length}</div>
            <div className="text-sm text-gray-600">Total Documentos</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{documentosPendientes.length}</div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{documentosValidados.length}</div>
            <div className="text-sm text-gray-600">Validados</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {documentos.filter(d => d.metodo_firma === 'whatsapp').length}
            </div>
            <div className="text-sm text-gray-600">Por WhatsApp</div>
          </CardContent>
        </Card>
      </div>

      {/* Documentos Pendientes (pinned) */}
      {documentosPendientes.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Documentos Pendientes de Validación
            </CardTitle>
            <CardDescription className="text-orange-600">
              Estos documentos requieren validación final
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documentosPendientes.slice(0, 3).map((documento) => {
                const { tipoInfo, metodoInfo, tipoIcon: TipoIcon, metodoIcon: MetodoIcon } = getDocumentoInfo(documento)
                return (
                  <div key={documento.id} className="bg-white p-4 rounded-lg border border-orange-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <TipoIcon className="h-4 w-4 text-orange-600" />
                          <h3 className="font-medium text-orange-900">{documento.titulo}</h3>
                          <Badge className={metodoColor}>
                            <MetodoIcon className="h-3 w-3 mr-1" />
                            {metodoInfo?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-orange-700">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(documento.fecha_firma).toLocaleDateString()}
                          <span className="mx-2">•</span>
                          {tipoInfo?.label}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVistaPrevia(documento)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleValidarFirma(documento.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {documentosPendientes.length > 3 && (
                <div className="text-center text-orange-700 text-sm">
                  +{documentosPendientes.length - 3} documentos más...
                </div>
              )}
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
                  placeholder="Buscar documentos por título o tipo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedTipo} onValueChange={setSelectedTipo}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {tiposDocumento.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMetodo} onValueChange={setSelectedMetodo}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los métodos</SelectItem>
                {metodosFirma.map((metodo) => (
                  <SelectItem key={metodo.value} value={metodo.value}>
                    {metodo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      {filteredDocumentos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay documentos
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedTipo !== 'todos' || selectedMetodo !== 'todos'
                ? 'No se encontraron documentos con los filtros aplicados'
                : 'No hay documentos registrados para este paciente'
              }
            </p>
            <Button onClick={abrirModalNuevo} className="bg-navy-900 hover:bg-navy-800">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primer Documento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDocumentos.map((documento) => {
            const { tipoInfo, metodoInfo, tipoIcon: TipoIcon, metodoIcon: MetodoIcon } = getDocumentoInfo(documento)
            
            return (
              <Card key={documento.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <TipoIcon className="h-5 w-5 text-gray-600" />
                        <CardTitle className="text-lg text-navy-900">
                          {documento.titulo}
                        </CardTitle>
                        <Badge className={metodoColor}>
                          <MetodoIcon className="h-3 w-3 mr-1" />
                          {metodoInfo?.label}
                        </Badge>
                        <Badge variant={documento.firma_validada ? "default" : "secondary"}>
                          {documento.firma_validada ? 'Validado' : 'Pendiente'}
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-700">
                        {tipoInfo?.descripcion}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVistaPrevia(documento)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // En producción esto descargaría el documento
                          window.open(documento.url_documento, '_blank')
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {!documento.firma_validada && documento.metodo_firma === 'digital' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleValidarFirma(documento.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(documento.fecha_firma).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        ID: {documento.id.slice(0, 8)}...
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!documento.firma_validada && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEnviarWhatsApp(documento)}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Enviar WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {documento.hash_documento && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <strong>Hash de validación:</strong> {documento.hash_documento}
                    </div>
                  )}
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
            <DialogTitle>Registrar Nuevo Documento</DialogTitle>
            <DialogDescription>
              Registra un documento firmado o pendiente de firma
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Documento *
              </label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value as DocumentoFirmado['tipo'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposDocumento.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      <div>
                        <div className="font-medium">{tipo.label}</div>
                        <div className="text-xs text-gray-500">{tipo.descripcion}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título del Documento *
              </label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ej: Consentimiento para endodoncia"
              />
            </div>

            {/* URL del documento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL del Documento *
              </label>
              <Input
                value={formData.url_documento}
                onChange={(e) => setFormData({ ...formData, url_documento: e.target.value })}
                placeholder="https://..."
                type="url"
              />
            </div>

            {/* Método de firma */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de Firma *
              </label>
              <Select value={formData.metodo_firma} onValueChange={(value) => setFormData({ ...formData, metodo_firma: value as DocumentoFirmado['metodo_firma'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metodosFirma.map((metodo) => (
                    <SelectItem key={metodo.value} value={metodo.value}>
                      <div className="flex items-center">
                        <metodo.icon className="h-4 w-4 mr-2" />
                        <div>
                          <div className="font-medium">{metodo.label}</div>
                          <div className="text-xs text-gray-500">{metodo.descripcion}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha de firma */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Firma *
              </label>
              <Input
                type="date"
                value={formData.fecha_firma}
                onChange={(e) => setFormData({ ...formData, fecha_firma: e.target.value })}
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
              onClick={handleCrearDocumento}
              className="bg-navy-900 hover:bg-navy-800"
              disabled={!formData.titulo || !formData.url_documento}
            >
              Registrar Documento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Vista Previa */}
      <Dialog open={showVistaPrevia} onOpenChange={setShowVistaPrevia}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              {documentoVistaPrevia?.titulo}
            </DialogTitle>
            <DialogDescription>
              {documentoVistaPrevia && (
                <div className="flex items-center space-x-4 text-sm">
                  <span>Tipo: {tiposDocumento.find(t => t.value === documentoVistaPrevia.tipo)?.label}</span>
                  <span>Método: {metodosFirma.find(m => m.value === documentoVistaPrevia.metodo_firma)?.label}</span>
                  <span>Fecha: {new Date(documentoVistaPrevia.fecha_firma).toLocaleDateString()}</span>
                  <span>Estado: {documentoVistaPrevia.firma_validada ? 'Validado' : 'Pendiente'}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {documentoVistaPrevia && (
            <div className="space-y-4">
              {/* Vista previa del documento */}
              <div className="aspect-[3/4] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2" />
                  <p>Vista previa del documento</p>
                  <p className="text-sm">{documentoVistaPrevia.url_documento}</p>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(documentoVistaPrevia.url_documento, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Documento
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Simular descarga
                      alert('Descargando documento...')
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>

                <div className="flex space-x-2">
                  {!documentoVistaPrevia.firma_validada && (
                    <Button
                      onClick={() => handleValidarFirma(documentoVistaPrevia.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Validar Firma
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleEnviarWhatsApp(documentoVistaPrevia)}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar WhatsApp
                  </Button>
                </div>
              </div>

              {/* Información adicional */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>ID del Documento:</strong> {documentoVistaPrevia.id}
                </div>
                <div>
                  <strong>Hash de Validación:</strong> {documentoVistaPrevia.hash_documento || 'No disponible'}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}