/**
 * SERVICIO DE AUTENTICACIÓN
 * Sistema completo de autenticación y autorización para Rubio García Dental
 * Autor: MiniMax Agent
 */

import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'admin' | 'dentista' | 'recepcionista' | 'contador';
  activo: boolean;
  fecha_creacion: string;
  ultima_conexion?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  session: any;
  error: string | null;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  error?: string;
}

export class AuthService {
  private supabaseClient = supabase;

  /**
   * Iniciar sesión
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabaseClient.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return {
          user: null,
          session: null,
          error: error.message
        };
      }

      // Obtener información adicional del usuario
      const { data: userData, error: userError } = await this.supabaseClient
        .from('usuarios')
        .select('*')
        .eq('email', credentials.email)
        .single();

      if (userError || !userData) {
        return {
          user: null,
          session: null,
          error: 'Error al obtener datos del usuario'
        };
      }

      // Actualizar última conexión
      await this.updateLastLogin(userData.id);

      return {
        user: userData as User,
        session: data.session,
        error: null
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<{ error: string | null }> {
    try {
      const { error } = await this.supabaseClient.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * Solicitar reset de contraseña
   */
  async requestPasswordReset(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
      const { error } = await this.supabaseClient.auth.resetPasswordForEmail(
        request.email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (error) {
        return {
          success: false,
          message: '',
          error: error.message
        };
      }

      return {
        success: true,
        message: 'Se ha enviado un enlace de recuperación a tu email'
      };
    } catch (error) {
      return {
        success: false,
        message: '',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Resetear contraseña
   */
  async resetPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Verificar sesión actual
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { session } } = await this.supabaseClient.auth.getSession();
      
      if (!session) {
        return null;
      }

      const { data: userData, error } = await this.supabaseClient
        .from('usuarios')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !userData) {
        return null;
      }

      return userData as User;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(user: User | null, requiredRoles: string[]): boolean {
    if (!user) return false;
    return requiredRoles.includes(user.rol);
  }

  /**
   * Verificar permisos específicos
   */
  hasPermission(user: User | null, permission: string): boolean {
    if (!user) return false;

    // Admin tiene todos los permisos
    if (user.rol === 'admin') return true;

    // Definir permisos por rol
    const rolePermissions = {
      'dentista': ['ver_pacientes', 'crear_historia', 'ver_agenda', 'modificar_agenda'],
      'recepcionista': ['ver_pacientes', 'crear_citas', 'ver_agenda', 'modificar_agenda', 'ver_facturas'],
      'contador': ['ver_facturas', 'generar_reportes', 'ver_contabilidad']
    };

    const userPermissions = rolePermissions[user.rol] || [];
    return userPermissions.includes(permission);
  }

  /**
   * Registrar nuevo usuario
   */
  async register(userData: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    rol: string;
  }): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await this.supabaseClient.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      // Crear registro en tabla usuarios
      const { data: newUser, error: userError } = await this.supabaseClient
        .from('usuarios')
        .insert({
          id: data.user?.id,
          email: userData.email,
          nombre: userData.nombre,
          apellido: userData.apellido,
          rol: userData.rol,
          activo: true
        })
        .select()
        .single();

      if (userError) {
        return { user: null, error: userError.message };
      }

      return { user: newUser as User, error: null };
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await this.supabaseClient
        .from('usuarios')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { user: null, error: error.message };
      }

      return { user: data as User, error: null };
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar contraseña actual
      const { error: verifyError } = await this.supabaseClient.auth.signInWithPassword({
        email: '', // Se obtendrá desde la base de datos
        password: currentPassword
      });

      if (verifyError) {
        return { success: false, error: 'Contraseña actual incorrecta' };
      }

      // Actualizar contraseña
      const { error: updateError } = await this.supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Actualizar última conexión
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.supabaseClient
        .from('usuarios')
        .update({ ultima_conexion: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Error actualizando última conexión:', error);
    }
  }

  /**
   * Obtener todos los usuarios (solo admin)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from('usuarios')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as User[];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Desactivar usuario
   */
  async deactivateUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseClient
        .from('usuarios')
        .update({ activo: false })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Reactivar usuario
   */
  async reactivateUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseClient
        .from('usuarios')
        .update({ activo: true })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Cambiar rol de usuario
   */
  async changeUserRole(userId: string, newRole: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseClient
        .from('usuarios')
        .update({ rol: newRole })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

// Instancia singleton del servicio
export const authService = new AuthService();
export default authService;