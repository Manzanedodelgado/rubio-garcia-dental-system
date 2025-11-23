import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { Navigation } from '@/components/Navigation'
import { AuthProvider } from '@/components/AuthProvider'
import { StatusProvider } from '@/components/StatusProvider'
import { GESDENInitializer } from '@/components/GESDENInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Rubio García Dental - Sistema de Gestión',
  description: 'Sistema integral de gestión para clínica dental especializada en implantología y estética de vanguardia',
  keywords: 'clínica dental, implantología, gestión, agenda, pacientes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <AuthProvider>
          <StatusProvider>
            <div className="flex h-full">
              {/* Sidebar Navigation */}
              <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
                <Navigation />
              </div>
              
              {/* Mobile menu overlay */}
              <div className="lg:hidden">
                <Navigation mobile />
              </div>
              
              {/* Main content */}
              <div className="lg:pl-64 flex flex-col flex-1">
                <main className="flex-1">
                  <div className="py-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      {children}
                    </div>
                  </div>
                </main>
              </div>
            </div>
            
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#374151',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                },
                success: {
                  iconTheme: {
                    primary: '#059669',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#dc2626',
                    secondary: '#fff',
                  },
                },
              }}
            />

            {/* GESDEN Integration Initializer */}
            <GESDENInitializer />
          </StatusProvider>
        </AuthProvider>
      </body>
    </html>
  )
}