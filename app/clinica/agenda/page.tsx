'use client'

import { useState, useEffect } from 'react'
import { Calendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/es'
import { supabase } from '@/lib/supabase'
import { sqlServerService } from '@/services/sql-server'
import { useAuth } from '@/components/AuthProvider'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import type { Cita, Paciente, Doctor } from '@/types'
import { toast } from 'react-hot-toast'
import {
  CalendarDaysIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// Configurar moment en español
moment.locale('es')
const localizer = momentLocalizer(moment)

// Interfaces para el calendario
interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    cita: Cita
    paciente: Paciente
    doctor: Doctor
  }
}

interface AgendaPageProps {}

export default function AgendaPage({}: AgendaPageProps) {
  const { user } = useAuth()
  const [citas, setCitas] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<View>('month')
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all')
  const [doctors, setDoctors] = useState<Doctor[]>([])

  useEffect(() => {
    loadDoctors()
    loadCitas()
    setupRealtimeSubscription()
  }, [currentDate, selectedDoctor])

  const loadDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('estado', 'activo')
        .order('apellido', { ascending: true })

      if (error) {
        console.error('Error loading doctors:', error)
        return
      }

      setDoctors(data || [])
    } catch (error) {
      console.error('Error loading doctors:', error)
    }
  }

  const loadCitas = async () => {
    try {
      setLoading(true)

      // Calcular rango de fechas basado en la vista actual
      let startDate: string
      let endDate: string

      if (currentView === 'month') {
        startDate = moment(currentDate).startOf('month').format('YYYY-MM-DD')
        endDate = moment(currentDate).endOf('month').format('YYYY-MM-DD')
      } else if (currentView === 'week') {
        startDate = moment(currentDate).startOf('week').format('YYYY-MM-DD')
        endDate = moment(currentDate).endOf('week').format('YYYY-MM-DD')
      } else {
        startDate = moment(currentDate).format('YYYY-MM-DD')
        endDate = moment(currentDate).format('YYYY-MM-DD')
      }

      // Si hay un doctor seleccionado, usar ese filtro
      let query = supabase
        .from('citas')
        .select(`
          *,
          paciente:pacientes(*),
          doctor:doctors(*)
        `)
        .gte('fecha', startDate)
        .lte('fecha', endDate)

      if (selectedDoctor !== 'all') {
        query = query.eq('doctor_id', selectedDoctor)
      }

      const { data, error } = await query
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true })

      if (error) {
        console.error('Error loading citas:', error)
        toast.error('Error cargando citas')
        return
      }

      // Transformar datos para el calendario
      const calendarEvents: CalendarEvent[] = (data || []).map((cita) => ({
        id: cita.id,
        title: `${cita.paciente?.nombre} ${cita.paciente?.apellido} - ${cita.tratamiento}`,
        start: moment(`${cita.fecha} ${cita.hora_inicio}`).toDate(),
        end: moment(`${cita.fecha} ${cita.hora_fin}`).toDate(),
        resource: {
          cita,
          paciente: cita.paciente,
          doctor: cita.doctor
        }
      }))

      setCitas(calendarEvents)
    } catch (error) {
      console.error('Error loading citas:', error)
      toast.error('Error cargando citas')
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('agenda-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'citas'
      }, () => {
        loadCitas()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleNavigate = (date: Date) => {
    setCurrentDate(date)
  }

  const handleView = (view: View) => {
    setCurrentView(view)
  }

  const handleEventSelect = (event: CalendarEvent) => {
    // Abrir modal o redirigir a detalle de cita
    window.location.href = `/clinica/agenda/${event.id}`
  }

  const handleEventDrop = async ({ event, start, end }: any) => {
    try {
      const newDate = moment(start).format('YYYY-MM-DD')
      const newStartTime = moment(start).format('HH:mm')
      const newEndTime = moment(end).format('HH:mm')

      // Actualizar en Supabase
      const { error: supabaseError } = await supabase
        .from('citas')
        .update({
          fecha: newDate,
          hora_inicio: newStartTime,
          hora_fin: newEndTime
        })
        .eq('id', event.id)

      if (supabaseError) throw supabaseError

      // Actualizar en SQL Server
      await sqlServerService.updateCitaInSQL(event.id, {
        fecha: newDate,
        hora_inicio: newStartTime,
        hora_fin: newEndTime
      })

      toast.success('Cita reprogramada exitosamente')
      loadCitas()
    } catch (error) {
      console.error('Error moving event:', error)
      toast.error('Error reprogramando cita')
    }
  }

  const getEventStyle = (event: CalendarEvent) => {
    const estado = event.resource.cita.estado
    
    let backgroundColor = '#3182ce' // azul por defecto
    let borderColor = '#2b6cb0'
    let color = '#ffffff'

    switch (estado) {
      case 'confirmada':
        backgroundColor = '#38a169'
        borderColor = '#2f855a'
        break
      case 'en_curso':
        backgroundColor = '#d69e2e'
        borderColor = '#b7791f'
        color = '#1a202c'
        break
      case 'completada':
        backgroundColor = '#718096'
        borderColor = '#4a5568'
        break
      case 'cancelada':
        backgroundColor = '#e53e3e'
        borderColor = '#c53030'
        break
      case 'emergencia':
        backgroundColor = '#c53030'
        borderColor = '#9b2c2c'
        break
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color,
        border: `2px solid ${borderColor}`,
        borderRadius: '6px',
        fontSize: '12px'
      }
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    let newDate: Date
    
    switch (currentView) {
      case 'month':
        newDate = moment(currentDate).add(direction === 'next' ? 1 : -1, 'month').toDate()
        break
      case 'week':
        newDate = moment(currentDate).add(direction === 'next' ? 1 : -1, 'week').toDate()
        break
      default:
        newDate = moment(currentDate).add(direction === 'next' ? 1 : -1, 'day').toDate()
    }
    
    setCurrentDate(newDate)
  }

  const resetToToday = () => {
    setCurrentDate(new Date())
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Agenda de Citas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de citas y programación dental
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <a
            href="/clinica/agenda/nueva"
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Cita
          </a>
        </div>
      </div>

      {/* Controles de vista y filtros */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Navegación de fechas */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={resetToToday}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Hoy
            </button>
            
            <button
              onClick={() => navigateDate('next')}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            
            <div className="ml-4 text-sm font-medium text-gray-900">
              {moment(currentDate).format('MMMM YYYY')}
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                Doctor:
              </label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="input-field text-sm"
              >
                <option value="all">Todos los doctores</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.nombre} {doctor.apellido}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
              <button
                onClick={() => handleView('month')}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentView === 'month'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => handleView('week')}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentView === 'week'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => handleView('day')}
                className={`px-3 py-1 text-sm rounded-md ${
                  currentView === 'day'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Día
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <Calendar
            localizer={localizer}
            events={citas}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            onNavigate={handleNavigate}
            onView={handleView}
            view={currentView}
            onSelectEvent={handleEventSelect}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventDrop}
            selectable
            resizable
            popup
            eventPropGetter={getEventStyle}
            messages={{
              next: 'Siguiente',
              previous: 'Anterior',
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              agenda: 'Agenda',
              date: 'Fecha',
              time: 'Hora',
              event: 'Evento',
              noEventsInRange: 'No hay eventos en este rango',
              showMore: (total) => `+ Ver ${total} más`
            }}
            formats={{
              dayFormat: (date, culture, localizer) =>
                localizer?.format(date, 'dddd DD/MM', culture) || '',
              dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
                localizer?.format(start, 'DD MMM', culture) +
                ' – ' +
                localizer?.format(end, 'DD MMM', culture),
              monthHeaderFormat: (date, culture, localizer) =>
                localizer?.format(date, 'MMMM YYYY', culture) || '',
              timeGutterFormat: (date, culture, localizer) =>
                localizer?.format(date, 'HH:mm', culture) || '',
              eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                localizer?.format(start, 'HH:mm', culture) +
                ' – ' +
                localizer?.format(end, 'HH:mm', culture)
            }}
            step={15}
            timeslots={4}
            min={new Date(2024, 0, 1, 8, 0)}
            max={new Date(2024, 0, 1, 21, 0)}
          />
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Leyenda de Estados
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Programada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Confirmada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600">En Curso</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span className="text-sm text-gray-600">Completada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Cancelada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span className="text-sm text-gray-600">Emergencia</span>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Citas Hoy</div>
              <div className="text-2xl font-semibold text-gray-900">
                {citas.filter(event => 
                  moment(event.start).isSame(moment(), 'day')
                ).length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">✓</span>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Confirmadas</div>
              <div className="text-2xl font-semibold text-gray-900">
                {citas.filter(event => event.resource.cita.estado === 'confirmada').length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-yellow-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">•</span>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">En Curso</div>
              <div className="text-2xl font-semibold text-gray-900">
                {citas.filter(event => event.resource.cita.estado === 'en_curso').length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">⚠</span>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Emergencias</div>
              <div className="text-2xl font-semibold text-gray-900">
                {citas.filter(event => event.resource.cita.estado === 'emergencia').length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}