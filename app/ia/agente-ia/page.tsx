/**
 * PÁGINA DEL AGENTE IA
 * Chat inteligente con IA para Rubio García Dental
 * Autor: MiniMax Agent
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  PaperAirplaneIcon, 
  MicrophoneIcon,
  StopIcon,
  TrashIcon,
  Cog6ToothIcon,
  UserIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface Mensaje {
  id: string;
  tipo: 'usuario' | 'ia';
  contenido: string;
  timestamp: string;
  metadata?: {
    fuente?: 'chat' | 'voz' | 'whatsapp';
    confianza?: number;
    tokens?: number;
  };
}

interface ConfiguracionIA {
  modelo: string;
  temperatura: number;
  max_tokens: number;
  contexto_turnos: number;
  idioma_respuesta: string;
  tono_respuesta: 'formal' | 'casual' | 'profesional';
}

export default function AgenteIAPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [mensajeActual, setMensajeActual] = useState('');
  const [cargando, setCargando] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [configuracion, setConfiguracion] = useState<ConfiguracionIA>({
    modelo: 'llama2',
    temperatura: 0.7,
    max_tokens: 1000,
    contexto_turnos: 10,
    idioma_respuesta: 'es',
    tono_respuesta: 'profesional'
  });
  const [showConfig, setShowConfig] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Inicializar con mensaje de bienvenida
    setMensajes([
      {
        id: '1',
        tipo: 'ia',
        contenido: '¡Hola! Soy tu asistente de IA de Rubio García Dental. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date().toISOString(),
        metadata: { fuente: 'chat', confianza: 1.0 }
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const enviarMensaje = async (contenido: string) => {
    if (!contenido.trim() || cargando) return;

    // Agregar mensaje del usuario
    const mensajeUsuario: Mensaje = {
      id: Date.now().toString(),
      tipo: 'usuario',
      contenido,
      timestamp: new Date().toISOString(),
      metadata: { fuente: 'chat' }
    };

    setMensajes(prev => [...prev, mensajeUsuario]);
    setMensajeActual('');
    setCargando(true);

    try {
      // Simular respuesta de la IA
      const respuestaIA = await generarRespuestaIA(contenido, mensajes);
      
      const mensajeIA: Mensaje = {
        id: (Date.now() + 1).toString(),
        tipo: 'ia',
        contenido: respuestaIA,
        timestamp: new Date().toISOString(),
        metadata: { fuente: 'chat', confianza: 0.92, tokens: 150 }
      };

      setMensajes(prev => [...prev, mensajeIA]);
    } catch (error) {
      console.error('Error generando respuesta:', error);
      const mensajeError: Mensaje = {
        id: (Date.now() + 1).toString(),
        tipo: 'ia',
        contenido: 'Lo siento, ha ocurrido un error procesando tu mensaje. Por favor, inténtalo de nuevo.',
        timestamp: new Date().toISOString(),
        metadata: { fuente: 'chat', confianza: 0.0 }
      };
      setMensajes(prev => [...prev, mensajeError]);
    } finally {
      setCargando(false);
    }
  };

  const generarRespuestaIA = async (pregunta: string, contexto: Mensaje[]): Promise<string> => {
    // Simular llamada a Ollama
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const respuestas = {
      saludo: [
        '¡Hola! Es un placer saludarte. ¿En qué puedo asistirte hoy?',
        '¡Buenos días! Estoy aquí para ayudarte con cualquier consulta sobre nuestra clínica dental.',
        '¡Hola! Bienvenido a Rubio García Dental. ¿Cómo puedo ayudarte?'
      ],
      cita: [
        'Para agendar una cita, puedes llamarnos al 91 123 45 67 o usar nuestro sistema online. ¿Qué tipo de tratamiento necesitas?',
        'Tenemos disponibilidad esta semana. ¿Prefieres mañana o pasado mañana? Nuestros horarios son de 9:00 a 20:00.',
        'Perfecto, ¿podrías decirme qué tipo de cita necesitas? (limpieza, revisión, tratamiento específico...)'
      ],
      precio: [
        'Nuestros precios varían según el tratamiento. Una limpieza básica ronda los 60-80€. ¿Qué tratamiento específico te interesa?',
        'Para darte un presupuesto exacto, necesitaría conocer el tratamiento. ¿Podrías ser más específico?',
        'Tenemos opciones de financiación disponibles. ¿Te gustaría que te explique las modalidades?'
      ],
      emergencia: [
        'Si tienes una emergencia dental, te recomendamos llamar inmediatamente al 91 123 45 67. Tenemos servicio de urgencias.',
        'Para emergencias fuera del horario, también tenemos un servicio 24h. ¿Qué tipo de emergencia tienes?',
        'Entiendo que es urgente. Por favor, llama al 91 123 45 67 inmediatamente o ve a urgencias más cercanas.'
      ]
    };

    const preguntaLower = pregunta.toLowerCase();
    
    if (preguntaLower.includes('hola') || preguntaLower.includes('buenos') || preguntaLower.includes('buenas')) {
      return respuestas.saludo[Math.floor(Math.random() * respuestas.saludo.length)];
    } else if (preguntaLower.includes('cita') || preguntaLower.includes('agendar') || preguntaLower.includes('horario')) {
      return respuestas.cita[Math.floor(Math.random() * respuestas.cita.length)];
    } else if (preguntaLower.includes('precio') || preguntaLower.includes('costo') || preguntaLower.includes('cuanto')) {
      return respuestas.precio[Math.floor(Math.random() * respuestas.precio.length)];
    } else if (preguntaLower.includes('emergencia') || preguntaLower.includes('urgente') || preguntaLower.includes('dolor')) {
      return respuestas.emergencia[Math.floor(Math.random() * respuestas.emergencia.length)];
    } else {
      return `Entiendo tu consulta sobre "${pregunta}". Para brindarte la mejor información posible, te recomiendo contactar directamente con nuestro equipo llamando al 91 123 45 67. También puedo ayudarte con información sobre nuestros tratamientos, horarios o servicios. ¿Hay algo específico en lo que pueda ayudarte?`;
    }
  };

  const iniciarEscucha = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'es-ES';

      recognition.onstart = () => {
        setEscuchando(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMensajeActual(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Error de reconocimiento de voz:', event.error);
        setEscuchando(false);
      };

      recognition.onend = () => {
        setEscuchando(false);
        // Enviar mensaje automáticamente después de reconocimiento
        if (mensajeActual.trim()) {
          setTimeout(() => enviarMensaje(mensajeActual), 500);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      alert('El reconocimiento de voz no está disponible en tu navegador.');
    }
  };

  const pararEscucha = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setEscuchando(false);
    }
  };

  const limpiarChat = () => {
    if (confirm('¿Estás seguro de que quieres limpiar toda la conversación?')) {
      setMensajes([
        {
          id: '1',
          tipo: 'ia',
          contenido: '¡Hola! Soy tu asistente de IA de Rubio García Dental. ¿En qué puedo ayudarte hoy?',
          timestamp: new Date().toISOString(),
          metadata: { fuente: 'chat', confianza: 1.0 }
        }
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    enviarMensaje(mensajeActual);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Agente IA</h1>
              <p className="text-sm text-gray-600">Asistente inteligente Rubio García Dental</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>En línea</span>
            </div>
            
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              title="Configuración"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={limpiarChat}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              title="Limpiar chat"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Panel de Configuración */}
      {showConfig && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <select
                value={configuracion.modelo}
                onChange={(e) => setConfiguracion(prev => ({ ...prev, modelo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="llama2">Llama 2</option>
                <option value="mistral">Mistral</option>
                <option value="codellama">Code Llama</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Creatividad ({configuracion.temperatura})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={configuracion.temperatura}
                onChange={(e) => setConfiguracion(prev => ({ ...prev, temperatura: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tono</label>
              <select
                value={configuracion.tono_respuesta}
                onChange={(e) => setConfiguracion(prev => ({ ...prev, tono_respuesta: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="profesional">Profesional</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {mensajes.map((mensaje) => (
          <div
            key={mensaje.id}
            className={`flex ${mensaje.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-3xl ${mensaje.tipo === 'usuario' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 ${mensaje.tipo === 'usuario' ? 'ml-3' : 'mr-3'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  mensaje.tipo === 'usuario' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                }`}>
                  {mensaje.tipo === 'usuario' ? (
                    <UserIcon className="w-5 h-5" />
                  ) : (
                    <SparklesIcon className="w-5 h-5" />
                  )}
                </div>
              </div>
              
              {/* Mensaje */}
              <div className={`rounded-lg px-4 py-2 ${
                mensaje.tipo === 'usuario'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}>
                <p className="text-sm">{mensaje.contenido}</p>
                <div className={`text-xs mt-1 ${
                  mensaje.tipo === 'usuario' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(mensaje.timestamp).toLocaleTimeString()}
                  {mensaje.metadata && (
                    <span className="ml-2">
                      • {mensaje.metadata.confianza && `Confianza: ${Math.round(mensaje.metadata.confianza * 100)}%`}
                      {mensaje.metadata.tokens && ` • ${mensaje.metadata.tokens} tokens`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {cargando && (
          <div className="flex justify-start">
            <div className="flex mr-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center">
                <SparklesIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={mensajeActual}
              onChange={(e) => setMensajeActual(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={cargando || escuchando}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={escuchando ? pararEscucha : iniciarEscucha}
              className={`p-2 rounded-lg ${
                escuchando 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              disabled={cargando}
              title={escuchando ? 'Parar grabación' : 'Grabar mensaje'}
            >
              {escuchando ? (
                <StopIcon className="w-5 h-5" />
              ) : (
                <MicrophoneIcon className="w-5 h-5" />
              )}
            </button>
            
            <button
              type="submit"
              disabled={!mensajeActual.trim() || cargando || escuchando}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              <span>Enviar</span>
            </button>
          </div>
        </form>
        
        {escuchando && (
          <div className="mt-2 text-sm text-red-600 flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span>Escuchando... Habla ahora</span>
          </div>
        )}
      </div>
    </div>
  );
}