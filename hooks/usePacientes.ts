/**
 * HOOK PARA GESTIÓN DE PACIENTES
 * Hook personalizado para manejar operaciones de pacientes
 * Autor: MiniMax Agent
 */

import { useState, useEffect } from 'react';
import { pacientesService, Paciente } from '../services/pacientes';

interface UsePacientesReturn {
  pacientes: Paciente[];
  loading: boolean;
  error: string | null;
  crearPaciente: (paciente: Omit<Paciente, 'id' | 'fecha_creacion'>) => Promise<{ success: boolean; paciente?: Paciente; error?: string }>;
  actualizarPaciente: (id: string, actualizaciones: Partial<Paciente>) => Promise<{ success: boolean; paciente?: Paciente; error?: string }>;
  eliminarPaciente: (id: string) => Promise<{ success: boolean; error?: string }>;
  buscarPacientes: (termino: string) => Promise<Paciente[]>;
  obtenerPacientePorId: (id: string) => Promise<Paciente | null>;
  recargarPacientes: () => Promise<void>;
}

export function usePacientes(filtros?: { activo?: boolean }): UsePacientesReturn {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarPacientes();
  }, [filtros]);

  const cargarPacientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pacientesService.obtenerPacientes(filtros || {});
      setPacientes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando pacientes');
    } finally {
      setLoading(false);
    }
  };

  const crearPaciente = async (nuevoPaciente: Omit<Paciente, 'id' | 'fecha_creacion'>) => {
    try {
      const resultado = await pacientesService.crearPaciente(nuevoPaciente);
      if (resultado.paciente) {
        setPacientes(prev => [resultado.paciente!, ...prev]);
      }
      return resultado;
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error creando paciente' 
      };
    }
  };

  const actualizarPaciente = async (id: string, actualizaciones: Partial<Paciente>) => {
    try {
      const resultado = await pacientesService.actualizarPaciente(id, actualizaciones);
      if (resultado.paciente) {
        setPacientes(prev => prev.map(p => p.id === id ? resultado.paciente! : p));
      }
      return resultado;
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error actualizando paciente' 
      };
    }
  };

  const eliminarPaciente = async (id: string) => {
    try {
      const resultado = await pacientesService.eliminarPaciente(id);
      if (resultado.success) {
        setPacientes(prev => prev.filter(p => p.id !== id));
      }
      return resultado;
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error eliminando paciente' 
      };
    }
  };

  const buscarPacientes = async (termino: string) => {
    try {
      return await pacientesService.buscarPacientes(termino);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error buscando pacientes');
    }
  };

  const obtenerPacientePorId = async (id: string) => {
    try {
      return await pacientesService.obtenerPacientePorId(id);
    } catch (err) {
      console.error('Error obteniendo paciente:', err);
      return null;
    }
  };

  const recargarPacientes = async () => {
    await cargarPacientes();
  };

  return {
    pacientes,
    loading,
    error,
    crearPaciente,
    actualizarPaciente,
    eliminarPaciente,
    buscarPacientes,
    obtenerPacientePorId,
    recargarPacientes
  };
}

export default usePacientes;