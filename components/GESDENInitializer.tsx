'use client'

import { useGESDENSync, GESDENStatusWidget } from '@/hooks/useGESDENSync'

/**
 * Componente que inicializa automáticamente la integración GESDEN-Supabase
 * Se incluye en el layout principal para asegurar que esté siempre activo
 */
export function GESDENInitializer() {
  const { isInitialized, error } = useGESDENSync()

  // Log para debugging en desarrollo
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('🔄 GESDEN Integration Status:', {
        initialized: isInitialized,
        error: error || null,
        timestamp: new Date().toISOString()
      })
    }
  }, [isInitialized, error])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <GESDENStatusWidget />
    </div>
  )
}

export default GESDENInitializer