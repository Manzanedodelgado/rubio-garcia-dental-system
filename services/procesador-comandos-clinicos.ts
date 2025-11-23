// ===============================================
// PROCESADOR DE COMANDOS CLÍNICOS IA
// Sistema de Gestión Integral - Rubio García Dental
// ===============================================

import { supabase } from '@/lib/supabase'
import { aiService } from './ai'
import { pacientesService } from './pacientes'
import { agendaService } from './agenda'
import { emailService } from './email'
import { whatsappService } from './whatsapp'

export interface ComandoClinico {
  id: string
  patron: string
  tipo: 'crear_cita' | 'enviar_mensaje' | 'consultar_cita' | 'buscar_paciente' | 'general'
  descripcion: string
  parametros: string[]
  ejemplos: string[]
  activo: boolean
}

export interface ParametroExtraido {
  nombre: string
  valor: string
  confianza: number
  tipo: 'fecha' | 'hora' | 'nombre' | 'tratamiento' | 'duracion' | 'telefono' | 'texto'
}

export interface ResultadoComando {
  exito: boolean
  respuesta: string
  accion_ejecutada?: string
  datos?: any
  siguientes_pasos?: string[]
  requiere_confirmacion?: boolean
  parametros_pendientes?: string[]
}

export interface TratamientoAgenda {
  nombre: string
  duracion_minutos: number
  categoria: string
}

// Tratamientos de Agenda Predefinidos
export const TRATAMIENTOS_AGENDA: TratamientoAgenda[] = [
  { nombre: 'Control', duracion_minutos: 15, categoria: 'seguimiento' },
  { nombre: 'Urgencia', duracion_minutos: 15, categoria: 'emergencia' },
  { nombre: 'Protesis Fija', duracion_minutos: 30, categoria: 'protesis' },
  { nombre: 'Cirugia/Injerto', duracion_minutos: 60, categoria: 'cirugia' },
  { nombre: 'Retirar Ortodoncia', duracion_minutos: 30, categoria: 'ortodoncia' },
  { nombre: 'Protesis Removible', duracion_minutos: 15, categoria: 'protesis' },
  { nombre: 'Colocacion Ortodoncia', duracion_minutos: 30, categoria: 'ortodoncia' },
  { nombre: 'Periodoncia', duracion_minutos: 30, categoria: 'periodoncia' },
  { nombre: 'Cirugía de Implante', duracion_minutos: 60, categoria: 'implantologia' },
  { nombre: 'Mensualidad Ortodoncia', duracion_minutos: 15, categoria: 'ortodoncia' },
  { nombre: 'Ajuste Prot/tto', duracion_minutos: 30, categoria: 'protesis' },
  { nombre: 'Primera Visita', duracion_minutos: 15, categoria: 'inicial' },
  { nombre: 'Higiene Dental', duracion_minutos: 15, categoria: 'prevencion' },
  { nombre: 'Endodoncia', duracion_minutos: 45, categoria: 'endodoncia' },
  { nombre: 'Reconstruccion', duracion_minutos: 30, categoria: 'restauracion' },
  { nombre: 'Exodoncia', duracion_minutos: 30, categoria: 'cirugia' },
  { nombre: 'Estudio Ortodoncia', duracion_minutos: 15, categoria: 'ortodoncia' },
  { nombre: 'Rx/escaner', duracion_minutos: 15, categoria: 'diagnostico' }
]

class ProcesadorComandosClinicos {
  private comandosDisponibles: ComandoClinico[] = []

  constructor() {
    this.inicializarComandos()
  }

  private inicializarComandos() {
    this.comandosDisponibles = [
      {
        id: 'crear_cita',
        patron: /crea( una)? cita( para)? (.+?) (el dia|el|del) (.+?) (para|con) (.+?) (que dure|duracion)? (.+?)?/i,
        tipo: 'crear_cita',
        descripcion: 'Crear nueva cita en la agenda',
        parametros: ['paciente', 'fecha', 'tratamiento', 'duracion'],
        ejemplos: [
          'Crea una cita para Manuel Rodriguez Rodriguez el dia 17 de diciembre para una reconstruccion que dure 30 min',
          'Agendar cita para Maria Garcia Toledo el 20 de enero para una endodoncia',
          'Nueva cita el viernes para control de ortodoncia'
        ],
        activo: true
      },
      {
        id: 'enviar_mensaje',
        patron: /manda( un)? mensaje( a)? (.+?) (y )?(preguntale|pregunta|si)( se puede ven(ir|i))? ?(a las)? (.+?)?/i,
        tipo: 'enviar_mensaje',
        descripcion: 'Enviar mensaje a paciente',
        parametros: ['paciente', 'mensaje', 'hora'],
        ejemplos: [
          'Manda una mensaje a Maria Garcia Toledo y preguntale si se puede venir a las 16.30h',
          'Enviar mensaje a Juan Perez sobre la cita de mañana',
          'SMS a Carmen Pardo confirmando su cita'
        ],
        activo: true
      },
      {
        id: 'consultar_cita',
        patron: /(que dia|que fecha|cuando|cuando tiene) (cita|una cita|la cita) (.+?)(tiene)?\??$/i,
        tipo: 'consultar_cita',
        descripcion: 'Consultar citas de un paciente',
        parametros: ['paciente'],
        ejemplos: [
          'Que dia tiene cita Carmen Pardo Pardo?',
          'Cuando tiene cita Manuel Rodriguez?',
          'Que fecha tiene la próxima cita Juan Garcia?'
        ],
        activo: true
      },
      {
        id: 'buscar_paciente',
        patron: /busca( al)? paciente (.+?)(tiene)?\??/i,
        tipo: 'buscar_paciente',
        descripcion: 'Buscar información de paciente',
        parametros: ['nombre'],
        ejemplos: [
          'Busca al paciente Maria Garcia',
          'Buscar paciente Ana Rodriguez Lopez',
          'Encontrar datos de Juan Carlos Garcia'
        ],
        activo: true
      },
      {
        id: 'disponibilidad',
        patron: /(cuando|que dia|que fecha) (tienes|tiene|tengo) (libre|disponible)/i,
        tipo: 'general',
        descripcion: 'Consultar disponibilidad',
        parametros: ['fecha', 'doctor'],
        ejemplos: [
          'Cuando tienes libre el viernes?',
          'Que disponibilidad hay mañana?',
          'Que citas tienes para el lunes?'
        ],
        activo: true
      }
    ]
  }

  async procesarComando(entrada: string, sessionId?: string): Promise<ResultadoComando> {
    try {
      const comando = this.encontrarComando(entrada)
      
      if (!comando) {
        return {
          exito: false,
          respuesta: 'No entendí el comando. Puedes probar diciendo: "Crea una cita", "Manda un mensaje", o "Que día tiene cita".'
        }
      }

      const parametros = this.extraerParametros(entrada, comando)
      
      switch (comando.tipo) {
        case 'crear_cita':
          return await this.ejecutarCrearCita(parametros)
        case 'enviar_mensaje':
          return await this.ejecutarEnviarMensaje(parametros)
        case 'consultar_cita':
          return await this.ejecutarConsultarCita(parametros)
        case 'buscar_paciente':
          return await this.ejecutarBuscarPaciente(parametros)
        default:
          return await this.ejecutarComandoGeneral(comando, parametros)
      }

    } catch (error) {
      console.error('Error procesando comando clínico:', error)
      return {
        exito: false,
        respuesta: 'Hubo un error procesando tu comando. Por favor, inténtalo de nuevo.'
      }
    }
  }

  private encontrarComando(entrada: string): ComandoClinico | null {
    const entradaLower = entrada.toLowerCase().trim()
    
    for (const comando of this.comandosDisponibles) {
      if (comando.patron.test(entradaLower) && comando.activo) {
        return comando
      }
    }
    
    // Búsqueda por palabras clave
    const palabrasClave = {
      crear_cita: ['crea', 'cita', 'agendar', 'programa', 'nueva cita'],
      enviar_mensaje: ['manda', 'mensaje', 'enviar', 'comunicar', 'contactar'],
      consultar_cita: ['que dia', 'cuando', 'fecha', 'cita tiene'],
      buscar_paciente: ['busca', 'buscar', 'paciente', 'encontrar']
    }

    for (const [tipo, palabras] of Object.entries(palabrasClave)) {
      if (palabras.some(palabra => entradaLower.includes(palabra))) {
        return this.comandosDisponibles.find(c => c.tipo === tipo) || null
      }
    }

    return null
  }

  private extraerParametros(entrada: string, comando: ComandoClinico): ParametroExtraido[] {
    const parametros: ParametroExtraido[] = []
    const entradaLower = entrada.toLowerCase()

    // Extraer nombres de personas (patrones comunes)
    const patronesNombres = [
      /para ([a-záéíóúñü\s]+?)(?: el|del|que|duracion|$)/i,
      /a ([a-záéíóúñü\s]+?)(?: y|preguntale|si)/i,
      /cita (.+?)(?: tiene|el|del|$)/i,
      /paciente ([a-záéíóúñü\s]+?)(?: tiene|$)/i
    ]

    for (const patron of patronesNombres) {
      const match = entrada.match(patron)
      if (match && match[1]) {
        parametros.push({
          nombre: 'nombre_completo',
          valor: match[1].trim(),
          confianza: 0.9,
          tipo: 'nombre'
        })
        break
      }
    }

    // Extraer fechas
    const patronesFechas = [
      /el (\d{1,2}) de (\w+)/i, // 17 de diciembre
      /el (\d{1,2})\/(\d{1,2})\/(\d{4})/i, // 17/12/2024
      /(hoy|mañana|pasado mañana|viernes|lunes|martes|miércoles|jueves|sábado|domingo)/i,
      /el (\d{4})-(\d{1,2})-(\d{1,2})/i // 2024-12-17
    ]

    for (const patron of patronesFechas) {
      const match = entrada.match(patron)
      if (match) {
        parametros.push({
          nombre: 'fecha',
          valor: match[0],
          confianza: 0.85,
          tipo: 'fecha'
        })
        break
      }
    }

    // Extraer horas
    const patronHora = /a las (\d{1,2})(?::(\d{2}))?(?:h?)/i
    const matchHora = entrada.match(patronHora)
    if (matchHora) {
      parametros.push({
        nombre: 'hora',
        valor: matchHora[0],
        confianza: 0.9,
        tipo: 'hora'
      })
    }

    // Extraer tratamientos
    for (const tratamiento of TRATAMIENTOS_AGENDA) {
      if (entradaLower.includes(tratamiento.nombre.toLowerCase())) {
        parametros.push({
          nombre: 'tratamiento',
          valor: tratamiento.nombre,
          confianza: 0.95,
          tipo: 'tratamiento'
        })
        break
      }
    }

    // Extraer duraciones
    const patronDuracion = /dure (\d+) (min|minutos)/i
    const matchDuracion = entrada.match(patronDuracion)
    if (matchDuracion) {
      parametros.push({
        nombre: 'duracion',
        valor: matchDuracion[1],
        confianza: 0.9,
        tipo: 'duracion'
      })
    }

    // Extraer texto libre para mensajes
    const patronesMensaje = [
      /preguntale (.+?)(?: si| y|$)/i,
      /mensaje (.+?)(?: y| pregunta|$)/i
    ]

    for (const patron of patronesMensaje) {
      const match = entrada.match(patron)
      if (match && match[1]) {
        parametros.push({
          nombre: 'mensaje',
          valor: match[1].trim(),
          confianza: 0.8,
          tipo: 'texto'
        })
        break
      }
    }

    return parametros
  }

  private async ejecutarCrearCita(parametros: ParametroExtraido[]): Promise<ResultadoComando> {
    try {
      // Buscar paciente por nombre
      const paramNombre = parametros.find(p => p.nombre === 'nombre_completo')
      const paramFecha = parametros.find(p => p.nombre === 'fecha')
      const paramTratamiento = parametros.find(p => p.nombre === 'tratamiento')
      const paramDuracion = parametros.find(p => p.nombre === 'duracion')

      if (!paramNombre || !paramFecha) {
        return {
          exito: false,
          respuesta: 'Necesito el nombre del paciente y la fecha para crear la cita.',
          requiere_confirmacion: true,
          parametros_pendientes: ['nombre', 'fecha']
        }
      }

      // Buscar paciente en la base de datos
      const pacientes = await pacientesService.buscarPacientes(paramNombre.valor)
      if (pacientes.length === 0) {
        return {
          exito: false,
          respuesta: `No encontré ningún paciente con el nombre "${paramNombre.valor}". ¿Podrías verificar el nombre?`,
          requiere_confirmacion: true,
          parametros_pendientes: ['nombre_paciente']
        }
      }

      const paciente = pacientes[0] // Tomar el primero como coincidencia

      // Procesar fecha
      const fechaCita = await this.procesarFecha(paramFecha.valor)
      if (!fechaCita) {
        return {
          exito: false,
          respuesta: 'No pude entender la fecha. Por favor, especifica una fecha clara como "17 de diciembre" o "2024-12-17".',
          requiere_confirmacion: true,
          parametros_pendientes: ['fecha']
        }
      }

      // Determinar tratamiento y duración
      let tratamientoFinal = paramTratamiento?.valor || 'Primera Visita'
      let duracionFinal = paramDuracion ? parseInt(paramDuracion.valor) : 15

      const tratamientoEnTabla = TRATAMIENTOS_AGENDA.find(
        t => t.nombre.toLowerCase() === tratamientoFinal.toLowerCase()
      )

      if (tratamientoEnTabla) {
        tratamientoFinal = tratamientoEnTabla.nombre
        duracionFinal = tratamientoEnTabla.duracion_minutos
      }

      // Crear la cita
      const citaData = {
        paciente_id: paciente.id,
        fecha: fechaCita,
        tratamiento: tratamientoFinal,
        duracion_minutos: duracionFinal,
        estado: 'programada',
        notas: `Cita creada por comando de voz IA - ${new Date().toISOString()}`
      }

      const citaCreada = await agendaService.crearCita(citaData)

      if (citaCreada) {
        return {
          exito: true,
          respuesta: `Perfecto, he creado la cita para ${paciente.nombre} ${paciente.apellido} el ${fechaCita.toLocaleDateString('es-ES')} para ${tratamientoFinal} de ${duracionFinal} minutos.`,
          accion_ejecutada: 'cita_creada',
          datos: {
            cita_id: citaCreada.id,
            paciente: paciente.nombre + ' ' + paciente.apellido,
            fecha: fechaCita,
            tratamiento: tratamientoFinal,
            duracion: duracionFinal
          },
          siguientes_pasos: [
            'La cita ha sido agregada a la agenda',
            'Se puede enviar confirmación automática al paciente',
            'Verificar disponibilidad del doctor'
          ]
        }
      } else {
        return {
          exito: false,
          respuesta: 'Hubo un error creando la cita. Por favor, verifica la disponibilidad e inténtalo de nuevo.',
          requiere_confirmacion: true
        }
      }

    } catch (error) {
      console.error('Error ejecutando crear cita:', error)
      return {
        exito: false,
        respuesta: 'Error interno creando la cita. Por favor, contacta con el administrador.'
      }
    }
  }

  private async ejecutarEnviarMensaje(parametros: ParametroExtraido[]): Promise<ResultadoComando> {
    try {
      const paramNombre = parametros.find(p => p.nombre === 'nombre_completo')
      const paramMensaje = parametros.find(p => p.nombre === 'mensaje')
      const paramHora = parametros.find(p => p.nombre === 'hora')

      if (!paramNombre) {
        return {
          exito: false,
          respuesta: 'Necesito el nombre del paciente para enviar el mensaje.',
          requiere_confirmacion: true,
          parametros_pendientes: ['nombre_paciente']
        }
      }

      // Buscar paciente
      const pacientes = await pacientesService.buscarPacientes(paramNombre.valor)
      if (pacientes.length === 0) {
        return {
          exito: false,
          respuesta: `No encontré ningún paciente con el nombre "${paramNombre.valor}".`,
          requiere_confirmacion: true,
          parametros_pendientes: ['nombre_paciente']
        }
      }

      const paciente = pacientes[0]
      let mensajeFinal = paramMensaje?.valor || 'Se ha programado una cita para usted.'

      if (paramHora) {
        mensajeFinal += ` ¿Puede venir a las ${paramHora.valor}?`
      }

      // Enviar mensaje por WhatsApp si está disponible
      if (paciente.telefono_movil) {
        try {
          await whatsappService.enviarMensaje(paciente.telefono_movil, mensajeFinal)
          
          return {
            exito: true,
            respuesta: `He enviado un mensaje a ${paciente.nombre} ${paciente.apellido}: "${mensajeFinal}"`,
            accion_ejecutada: 'mensaje_enviado',
            datos: {
              paciente: paciente.nombre + ' ' + paciente.apellido,
              telefono: paciente.telefono_movil,
              mensaje: mensajeFinal
            },
            siguientes_pasos: [
              'Mensaje enviado por WhatsApp',
              'Esperar confirmación del paciente',
              'Actualizar estado del paciente'
            ]
          }
        } catch (whatsappError) {
          console.error('Error enviando WhatsApp:', whatsappError)
          
          // Fallback a email
          if (paciente.email) {
            await emailService.enviarEmail({
              to: paciente.email,
              subject: 'Mensaje desde Clínica Rubio García',
              html: `<p>${mensajeFinal}</p><br><p>Saludos,<br>Clínica Rubio García Dental</p>`
            })
            
            return {
              exito: true,
              respuesta: `He enviado un email a ${paciente.nombre} ${paciente.apellido}: "${mensajeFinal}"`,
              accion_ejecutada: 'email_enviado',
              datos: {
                paciente: paciente.nombre + ' ' + paciente.apellido,
                email: paciente.email,
                mensaje: mensajeFinal
              },
              siguientes_pasos: [
                'Email enviado',
                'Paciente puede responder por el mismo medio'
              ]
            }
          }
        }
      }

      return {
        exito: false,
        respuesta: `No pude enviar el mensaje a ${paciente.nombre} ${paciente.apellido}. No tiene teléfono ni email registrado.`,
        requiere_confirmacion: true,
        parametros_pendientes: ['datos_contacto']
      }

    } catch (error) {
      console.error('Error ejecutando enviar mensaje:', error)
      return {
        exito: false,
        respuesta: 'Error interno enviando el mensaje. Por favor, inténtalo de nuevo.'
      }
    }
  }

  private async ejecutarConsultarCita(parametros: ParametroExtraido[]): Promise<ResultadoComando> {
    try {
      const paramNombre = parametros.find(p => p.nombre === 'nombre_completo')

      if (!paramNombre) {
        return {
          exito: false,
          respuesta: 'Necesito el nombre del paciente para consultar sus citas.',
          requiere_confirmacion: true,
          parametros_pendientes: ['nombre_paciente']
        }
      }

      // Buscar paciente
      const pacientes = await pacientesService.buscarPacientes(paramNombre.valor)
      if (pacientes.length === 0) {
        return {
          exito: false,
          respuesta: `No encontré ningún paciente con el nombre "${paramNombre.valor}".`,
          requiere_confirmacion: true,
          parametros_pendientes: ['nombre_paciente']
        }
      }

      const paciente = pacientes[0]

      // Consultar citas del paciente
      const citas = await agendaService.obtenerCitasPaciente(paciente.id, {
        fecha_inicio: new Date(),
        fecha_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Un año
        estado: ['programada', 'confirmada']
      })

      if (citas.length === 0) {
        return {
          exito: true,
          respuesta: `${paciente.nombre} ${paciente.apellido} no tiene citas programadas actualmente.`,
          accion_ejecutada: 'consulta_citas',
          datos: {
            paciente: paciente.nombre + ' ' + paciente.apellido,
            total_citas: 0
          }
        }
      }

      // Ordenar citas por fecha
      citas.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      
      const proximaCita = citas[0]
      const fechaProxima = new Date(proximaCita.fecha).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      let respuesta = `${paciente.nombre} ${paciente.apellido} tiene ${citas.length} cita${citas.length > 1 ? 's' : ''} programada${citas.length > 1 ? 's' : ''}.`
      respuesta += `\n\nPróxima cita: ${fechaProxima} para ${proximaCita.tratamiento}.`

      if (citas.length > 1) {
        respuesta += `\n\nOtras citas programadas:`
        citas.slice(1, 3).forEach((cita, index) => {
          const fecha = new Date(cita.fecha).toLocaleDateString('es-ES')
          respuesta += `\n${index + 2}. ${fecha} - ${cita.tratamiento}`
        })
        
        if (citas.length > 3) {
          respuesta += `\n... y ${citas.length - 3} más`
        }
      }

      return {
        exito: true,
        respuesta,
        accion_ejecutada: 'consulta_citas',
        datos: {
          paciente: paciente.nombre + ' ' + paciente.apellido,
          citas: citas,
          total_citas: citas.length,
          proxima_cita: proximaCita
        },
        siguientes_pasos: [
          'Citas consultadas exitosamente',
          'Información disponible para el personal',
          'Se pueden realizar modificaciones si es necesario'
        ]
      }

    } catch (error) {
      console.error('Error ejecutando consultar cita:', error)
      return {
        exito: false,
        respuesta: 'Error interno consultando las citas. Por favor, inténtalo de nuevo.'
      }
    }
  }

  private async ejecutarBuscarPaciente(parametros: ParametroExtraido[]): Promise<ResultadoComando> {
    try {
      const paramNombre = parametros.find(p => p.nombre === 'nombre_completo')

      if (!paramNombre) {
        return {
          exito: false,
          respuesta: 'Necesito el nombre del paciente para buscarlo.',
          requiere_confirmacion: true,
          parametros_pendientes: ['nombre_paciente']
        }
      }

      const pacientes = await pacientesService.buscarPacientes(paramNombre.valor)

      if (pacientes.length === 0) {
        return {
          exito: true,
          respuesta: `No encontré ningún paciente con el nombre "${paramNombre.valor}".`,
          accion_ejecutada: 'busqueda_paciente',
          datos: {
            termino_busqueda: paramNombre.valor,
            resultados: 0
          }
        }
      }

      const paciente = pacientes[0]
      let respuesta = `Encontré ${pacientes.length} paciente${pacientes.length > 1 ? 's' : ''} que coincide${pacientes.length > 1 ? 'n' : ''} con "${paramNombre.valor}":\n\n`
      respuesta += `${paciente.nombre} ${paciente.apellido}\n`
      respuesta += `Teléfono: ${paciente.telefono_movil || 'No disponible'}\n`
      respuesta += `Email: ${paciente.email || 'No disponible'}\n`
      respuesta += `Fecha registro: ${new Date(paciente.fecha_creacion).toLocaleDateString('es-ES')}\n`

      if (pacientes.length > 1) {
        respuesta += `\n... y ${pacientes.length - 1} paciente${pacientes.length > 2 ? 's' : ''} más.`
        respuesta += '\n\nPara más detalles específicos, proporciona el nombre completo.'
      }

      return {
        exito: true,
        respuesta,
        accion_ejecutada: 'busqueda_paciente',
        datos: {
          termino_busqueda: paramNombre.valor,
          paciente_encontrado: paciente,
          total_resultados: pacientes.length,
          todos_resultados: pacientes
        },
        siguientes_pasos: [
          'Paciente encontrado',
          'Información básica mostrada',
          'Se pueden consultar citas específicas'
        ]
      }

    } catch (error) {
      console.error('Error ejecutando buscar paciente:', error)
      return {
        exito: false,
        respuesta: 'Error interno buscando el paciente. Por favor, inténtalo de nuevo.'
      }
    }
  }

  private async ejecutarComandoGeneral(comando: ComandoClinico, parametros: ParametroExtraido[]): Promise<ResultadoComando> {
    // Usar el servicio de IA general para comandos no específicos
    const respuestaIA = await aiService.generateResponse([
      {
        role: 'user',
        content: `El usuario ha dado el comando: "${comando.descripcion}". Por favor, proporciona una respuesta útil.`
      }
    ])

    return {
      exito: true,
      respuesta: respuestaIA,
      accion_ejecutada: 'comando_general',
      datos: {
        tipo_comando: comando.tipo,
        parametros: parametros
      }
    }
  }

  private async procesarFecha(fechaStr: string): Promise<Date | null> {
    const hoy = new Date()
    const fechaStrLower = fechaStr.toLowerCase()

    // Fechas relativas
    if (fechaStrLower.includes('hoy')) {
      return hoy
    }
    
    if (fechaStrLower.includes('mañana')) {
      return new Date(hoy.getTime() + 24 * 60 * 60 * 1000)
    }
    
    if (fechaStrLower.includes('pasado mañana')) {
      return new Date(hoy.getTime() + 2 * 24 * 60 * 60 * 1000)
    }

    // Días de la semana
    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    const diaEnTexto = diasSemana.findIndex(dia => fechaStrLower.includes(dia))
    
    if (diaEnTexto !== -1) {
      const diferencia = (diaEnTexto - hoy.getDay() + 7) % 7
      const diasHasta = diferencia === 0 ? 7 : diferencia // Próxima semana si es el mismo día
      return new Date(hoy.getTime() + diasHasta * 24 * 60 * 60 * 1000)
    }

    // Formato DD/MM/YYYY o DD-MM-YYYY
    const matchDMY = fechaStr.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/)
    if (matchDMY) {
      const [, dia, mes, año] = matchDMY
      return new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia))
    }

    // Formato "17 de diciembre"
    const meses = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
      'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    }

    const matchTexto = fechaStr.match(/(\d{1,2}) de (\w+)/i)
    if (matchTexto) {
      const [, dia, mes] = matchTexto
      const mesNum = meses[mes.toLowerCase()]
      if (mesNum !== undefined) {
        return new Date(hoy.getFullYear(), mesNum, parseInt(dia))
      }
    }

    return null
  }

  obtenerTratamientosDisponibles(): TratamientoAgenda[] {
    return TRATAMIENTOS_AGENDA
  }

  obtenerComandosDisponibles(): ComandoClinico[] {
    return this.comandosDisponibles.filter(c => c.activo)
  }

  async entrenarComando(entradaUsuario: string, comandoCorrecto: string): Promise<boolean> {
    try {
      // En una implementación real, aquí se entrenaría el modelo
      // Por ahora, simplemente registramos para análisis
      console.log('Entrenando comando:', { entrada: entradaUsuario, comando: comandoCorrecto })
      return true
    } catch (error) {
      console.error('Error entrenando comando:', error)
      return false
    }
  }
}

export const procesadorComandosClinicos = new ProcesadorComandosClinicos()
export default ProcesadorComandosClinicos