'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { useStatus } from './StatusProvider'
import {
  HomeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  SparklesIcon,
  BanknotesIcon,
  BeakerIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface NavigationProps {
  mobile?: boolean
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: HomeIcon, 
    description: 'Panel principal' 
  },
  {
    section: 'Clínica',
    items: [
      { 
        name: 'Agenda', 
        href: '/clinica/agenda', 
        icon: CalendarDaysIcon, 
        description: 'Gestión de citas' 
      },
      { 
        name: 'Pacientes', 
        href: '/clinica/pacientes', 
        icon: UserGroupIcon, 
        description: 'Gestión de pacientes' 
      },
      { 
        name: 'Historia Clínica', 
        href: '/clinica/historia-clinica', 
        icon: DocumentTextIcon, 
        description: 'Historial y tratamientos' 
      },
    ]
  },
  {
    section: 'Comunicación',
    items: [
      { 
        name: 'WhatsApp', 
        href: '/mensajeria/whatsapp', 
        icon: ChatBubbleLeftRightIcon, 
        description: 'Chat y mensajes' 
      },
      { 
        name: 'Correo', 
        href: '/mensajeria/correo', 
        icon: DocumentTextIcon, 
        description: 'Email y documentos' 
      },
    ]
  },
  {
    section: 'Inteligencia Artificial',
    items: [
      { 
        name: 'Centro de IA', 
        href: '/ia', 
        icon: SparklesIcon, 
        description: 'Hub central de inteligencia artificial' 
      },
      { 
        name: 'Automatizaciones', 
        href: '/ia/automatizaciones', 
        icon: BeakerIcon, 
        description: 'Flujos automáticos' 
      },
      { 
        name: 'Control por Voz', 
        href: '/ia/voz', 
        icon: BeakerIcon, 
        description: 'Comandos por voz' 
      },
    ]
  },
  {
    section: 'Gestión',
    items: [
      { 
        name: 'Módulo de Gestión', 
        href: '/gestion', 
        icon: BanknotesIcon, 
        description: 'Dashboard de gestión integral' 
      },
      { 
        name: 'Facturas Verifactu', 
        href: '/gestion/facturas', 
        icon: BanknotesIcon, 
        description: 'Sistema de facturación Verifactu' 
      },
      { 
        name: 'Contabilidad', 
        href: '/gestion/contabilidad', 
        icon: BanknotesIcon, 
        description: 'Gestión financiera' 
      },
    ]
  },
  {
    section: 'Configuración',
    items: [
      { 
        name: 'Configuración del Sistema', 
        href: '/configuracion', 
        icon: CogIcon, 
        description: 'Panel de configuración completo' 
      },
    ]
  },
]

export function Navigation({ mobile = false }: NavigationProps) {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()
  const { status } = useStatus()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const renderNavItems = () => {
    return navigation.map((section, sectionIndex) => {
      if ('section' in section) {
        // Section header
        return (
          <div key={sectionIndex} className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.section}
            </h3>
            <nav className="mt-2 space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    pathname?.startsWith(item.href)
                      ? 'nav-link-active'
                      : 'nav-link-inactive'
                  )}
                >
                  <item.icon className="mr-3 h-6 w-6 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.description}</div>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
        )
      } else {
        // Single navigation item
        return (
          <Link
            key={section.name}
            href={section.href}
            className={clsx(
              pathname === section.href
                ? 'nav-link-active'
                : 'nav-link-inactive'
            )}
          >
            <section.icon className="mr-3 h-6 w-6 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium">{section.name}</div>
              <div className="text-xs text-gray-400">{section.description}</div>
            </div>
          </Link>
        )
      }
    })
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex h-16 flex-shrink-0 items-center px-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-navy-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">RGD</span>
            </div>
          </div>
          <div className="ml-3">
            <div className="text-base font-medium text-gray-900">Rubio García</div>
            <div className="text-sm font-medium text-gray-500">Dental</div>
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Estado del sistema</span>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              status.sql_server_connected && status.supabase_connected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className={status.sql_server_connected && status.supabase_connected ? 'text-green-600' : 'text-red-600'}>
              {status.sql_server_connected && status.supabase_connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>WhatsApp: {status.whatsapp_connected ? '✓' : '✗'}</span>
          <span>IA: {status.ai_active ? '✓' : '✗'}</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {renderNavItems()}
      </div>

      {/* User section */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-navy-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <div className="text-sm font-medium text-gray-900">
              {user?.name || 'Administrador'}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {user?.role || 'admin'}
            </div>
          </div>
          <button
            onClick={logout}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600"
            title="Cerrar sesión"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )

  if (mobile) {
    return (
      <>
        {/* Mobile menu button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            type="button"
            className="bg-white rounded-md p-2 shadow-md"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-full max-w-xs">
              <SidebarContent />
            </div>
          </div>
        )}
      </>
    )
  }

  return <SidebarContent />
}