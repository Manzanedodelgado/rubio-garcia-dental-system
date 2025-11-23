/**
 * HOOK PARA AUTENTICACIÓN
 * Hook personalizado para manejar la autenticación en componentes React
 * Autor: MiniMax Agent
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { authService, User } from '../services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión actual al cargar
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error verificando autenticación:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authService.login({ email, password });
      if (result.user && !result.error) {
        setUser(result.user);
        return { success: true };
      }
      return { success: false, error: result.error || 'Error de autenticación' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (roles: string[]) => {
    return authService.hasRole(user, roles);
  };

  const hasPermission = (permission: string) => {
    return authService.hasPermission(user, permission);
  };

  const requestPasswordReset = async (email: string) => {
    return await authService.requestPasswordReset({ email });
  };

  const value = {
    user,
    loading,
    login,
    logout,
    hasRole,
    hasPermission,
    requestPasswordReset
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;