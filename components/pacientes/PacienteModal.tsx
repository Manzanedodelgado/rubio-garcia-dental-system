'use client'

import React, { useState, useEffect } from 'react'
import { X, User, Phone, Mail, MapPin, AlertTriangle, Shield, Calendar } from 'lucide-react'
import { Paciente } from '@/types'

interface PacienteModalProps {
  paciente: Paciente | null
  isOpen: boolean
  onClose: () => void
  onSave: (datos: Omit<Paciente, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  isEditing: boolean
}

export function PacienteModal({ paciente, isOpen, onClose, onSave, isEditing }: PacienteModalProps) {
  const [formData, setFormData] = useState<Omit<Paciente, 'id' | 'created_at' | 'updated_at'>>({
    numero_paciente: '',
    nombre: '',
    apellido: '',
    dni: '',
    fecha_nacimiento: '',
    telefono_fijo: '',
    telefono_movil: '',
    email: '',
    direccion: '',
    alergias: '',
    enfermedades: '',
    medicamentos: '',
    preferencias_comunicacion: '',
    consentimiento_lopd: 'sin_firmar',
    estado: 'activo',
    fecha_registro: new Date().toISOString().split('T')[0]
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [saving, setSaving] = useState(false)

  // Cargar datos del paciente cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (isEditing && paciente) {
        setFormData({
          numero_paciente: paciente.numero_paciente,
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          dni: paciente.dni,
          fecha_nacimiento: paciente.fecha_nacimiento,
          telefono_fijo: paciente.telefono_fijo || '',
          telefono_movil: paciente.telefono_movil,
          email: paciente.email,
          direccion: paciente.direccion,
          alergias: paciente.alergias || '',
          enfermedades: paciente.enfermedades || '',
          medicamentos: paciente.medicamentos || '',
          preferencias_comunicacion: paciente.preferencias_comunicacion,
          consentimiento_lopd: paciente.consentimiento_lopd,
          estado: paciente.estado,
          fecha_registro: paciente.fecha_registro
        })
      } else {
        // Reset form for new patient
        setFormData({
          numero_paciente: '',
          nombre: '',
          apellido: '',
          dni: '',
          fecha_nacimiento: '',
          telefono_fijo: '',
          telefono_movil: '',
          email: '',
          direccion: '',
          alergias: '',
          enfermedades: '',
          medicamentos: '',
          preferencias_comunicacion: '',
          consentimiento_lopd: 'sin_firmar',
          estado: 'activo',
          fecha_registro: new Date().toISOString().split('T')[0]
        })
      }
      setErrors({})
    }
  }, [isOpen, isEditing, paciente])

  const validarFormulario = (): boolean => {
    const newErrors: {[key: string]: string} = {}

    // Campos obligatorios
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio'
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es obligatorio'
    if (!formData.dni.trim()) newErrors.dni = 'El DNI es obligatorio'
    if (!formData.fecha_nacimiento) newErrors.fecha_nacimiento = 'La fecha de nacimiento es obligatoria'
    if (!formData.telefono_movil.trim()) newErrors.telefono_movil = 'El teléfono móvil es obligatorio'
    if (!formData.email.trim()) newErrors.email = 'El email es obligatorio'
    if (!formData.direccion.trim()) newErrors.direccion = 'La dirección es obligatoria'

    // Validar formato DNI
    if (formData.dni && !/^\d{8}[A-Z]$/.test(formData.dni.toUpperCase())) {
      newErrors.dni = 'El DNI debe tener formato: 12345678A'
    }

    // Validar formato email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no tiene un formato válido'
    }

    // Validar edad mínima
    if (formData.fecha_nacimiento) {
      const fechaNac = new Date(formData.fecha_nacimiento)
      const hoy = new Date()
      const edad = hoy.getFullYear() - fechaNac.getFullYear()
      if (edad < 0) newErrors.fecha_nacimiento = 'La fecha de nacimiento no puede ser futura'
      if (edad > 120) newErrors.fecha_nacimiento = 'La fecha de nacimiento no es válida'
    }

    // Validar teléfono móvil español
    if (formData.telefono_movil && !/^(\+34|0034|34)?[6-9]\d{8}$/.test(formData.telefono_movil.replace(/\s/g, ''))) {
      newErrors.telefono_movil = 'El teléfono móvil debe ser un número español válido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validarFormulario()) {
      return
    }

    setSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error al guardar paciente:', error)
      // Aquí podrías mostrar una notificación de error
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Datos Personales */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Datos Personales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nombre del paciente"
                />
                {errors.nombre && (
                  <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => handleChange('apellido', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.apellido ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Apellidos del paciente"
                />
                {errors.apellido && (
                  <p className="text-red-500 text-xs mt-1">{errors.apellido}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI *
                </label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => handleChange('dni', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.dni ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="12345678A"
                  maxLength={9}
                />
                {errors.dni && (
                  <p className="text-red-500 text-xs mt-1">{errors.dni}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fecha_nacimiento ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fecha_nacimiento && (
                  <p className="text-red-500 text-xs mt-1">{errors.fecha_nacimiento}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Paciente
                </label>
                <input
                  type="text"
                  value={formData.numero_paciente}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  placeholder="Se generará automáticamente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => handleChange('estado', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Información de Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono Móvil *
                </label>
                <input
                  type="tel"
                  value={formData.telefono_movil}
                  onChange={(e) => handleChange('telefono_movil', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.telefono_movil ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="666 123 456"
                />
                {errors.telefono_movil && (
                  <p className="text-red-500 text-xs mt-1">{errors.telefono_movil}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono Fijo
                </label>
                <input
                  type="tel"
                  value={formData.telefono_fijo}
                  onChange={(e) => handleChange('telefono_fijo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="91 123 45 67"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="email@ejemplo.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección *
                </label>
                <textarea
                  value={formData.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.direccion ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Calle, número, ciudad..."
                  rows={2}
                />
                {errors.direccion && (
                  <p className="text-red-500 text-xs mt-1">{errors.direccion}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información Médica */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Información Médica
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alergias
                </label>
                <textarea
                  value={formData.alergias}
                  onChange={(e) => handleChange('alergias', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Alergias conocidas del paciente..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enfermedades
                </label>
                <textarea
                  value={formData.enfermedades}
                  onChange={(e) => handleChange('enfermedades', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enfermedades relevantes..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicamentos
                </label>
                <textarea
                  value={formData.medicamentos}
                  onChange={(e) => handleChange('medicamentos', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Medicamentos que toma actualmente..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferencias de Comunicación
                </label>
                <textarea
                  value={formData.preferencias_comunicacion}
                  onChange={(e) => handleChange('preferencias_comunicacion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Preferencias del paciente para la comunicación..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Consentimiento LOPD */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Consentimiento LOPD
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado del consentimiento *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="consentimiento_lopd"
                    value="firmado"
                    checked={formData.consentimiento_lopd === 'firmado'}
                    onChange={(e) => handleChange('consentimiento_lopd', e.target.value)}
                    className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Firmado - El paciente ha firmado el consentimiento de protección de datos
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="consentimiento_lopd"
                    value="sin_firmar"
                    checked={formData.consentimiento_lopd === 'sin_firmar'}
                    onChange={(e) => handleChange('consentimiento_lopd', e.target.value)}
                    className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Sin firmar - Pendiente de firma
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Paciente')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}