'use client'

import {
  CalendarDaysIcon,
  UserPlusIcon,
  DocumentTextIcon,
  UserGroupIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/components/AuthProvider'
import { clsx } from 'clsx'

interface QuickActionsProps {
  onAction: (action: string) => void
}

export function QuickActions({ onAction }: QuickActionsProps) {
  const { isAdmin } = useAuth()

  const actions = [
    {
      id: 'nueva_cita',
      title: 'Nueva Cita',
      description: 'Programar nueva cita',
      icon: CalendarDaysIcon,
      color: 'bg-blue-600 hover:bg-blue-700',
      iconColor: 'text-blue-100'
    },
    {
      id: 'nuevo_contacto',
      title: 'Nuevo Contacto',
      description: 'Añadir nuevo contacto',
      icon: UserPlusIcon,
      color: 'bg-green-600 hover:bg-green-700',
      iconColor: 'text-green-100'
    },
    {
      id: 'nuevo_documento',
      title: 'Nuevo Documento',
      description: 'Crear documento',
      icon: DocumentTextIcon,
      color: 'bg-purple-600 hover:bg-purple-700',
      iconColor: 'text-purple-100'
    },
    {
      id: 'consultar_ia',
      title: 'Consultar IA',
      description: 'Asistente inteligente',
      icon: SparklesIcon,
      color: 'bg-golden-600 hover:bg-golden-700',
      iconColor: 'text-golden-100'
    },
    {
      id: 'nuevo_usuario',
      title: 'Nuevo Usuario',
      description: 'Crear usuario (Admin)',
      icon: UserGroupIcon,
      color: 'bg-navy-600 hover:bg-navy-700',
      iconColor: 'text-navy-100',
      adminOnly: true
    }
  ]

  const handleActionClick = (actionId: string) => {
    // Verificar permisos para acciones de admin
    const action = actions.find(a => a.id === actionId)
    if (action?.adminOnly && !isAdmin) {
      // Mostrar mensaje de error o redirigir
      alert('No tienes permisos para esta acción')
      return
    }
    
    onAction(actionId)
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Acciones Rápidas
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.id)}
              className={clsx(
                'relative group flex flex-col items-center p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-200',
                action.adminOnly && !isAdmin ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
              )}
              disabled={action.adminOnly && !isAdmin}
            >
              {/* Background Icon */}
              <div className={clsx(
                'absolute inset-0 flex items-center justify-center opacity-10',
                action.iconColor
              )}>
                <action.icon className="h-16 w-16" />
              </div>
              
              {/* Content */}
              <div className="relative z-10 text-center">
                <div className={clsx(
                  'inline-flex p-3 rounded-lg mb-3',
                  action.color
                )}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {action.title}
                </h4>
                
                <p className="text-xs text-gray-500">
                  {action.description}
                </p>
              </div>
              
              {/* Hover effect */}
              <div className={clsx(
                'absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                action.color,
                'bg-opacity-5'
              )} />
              
              {/* Admin indicator */}
              {action.adminOnly && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-navy-100 text-navy-800">
                    Admin
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
        
        {/* Description */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <SparklesIcon className="h-5 w-5 text-navy-600" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-900">
                Acciones Vinculadas
              </h4>
              <p className="mt-1 text-sm text-gray-600">
                Todas las acciones se vinculan automáticamente con los objetos de referencia correspondientes.
                Los cambios se sincronizan en tiempo real con SQL Server y Supabase.
              </p>
            </div>
          </div>
        </div>
        
        {/* Recent Actions */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Acciones Recientes
          </h4>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Nueva cita creada para Dr. Rubio García - 5 min
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              Documento generado - Hace 15 min
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              Consulta IA respondida - Hace 1 hora
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}