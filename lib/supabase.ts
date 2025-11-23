import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Configuración del cliente con Service Role (solo para operaciones del servidor)
export const supabaseAdmin = (() => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY no está configurada. Admin operations no estarán disponibles.');
    return null;
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
})();

// Función helper para verificar si el cliente admin está disponible
export const isAdminClientAvailable = () => {
  return supabaseAdmin !== null;
};

// Función helper para operaciones administrativas con fallbacks
export const getSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin Client no está configurado. Verifica SUPABASE_SERVICE_ROLE_KEY.');
  }
  return supabaseAdmin;
};

export default supabase;