import makeWASocket, { DisconnectReason, getContentType, normalizeMessageContent } from '@whiskeysockets/baileys'

import QRCode from 'qrcode-terminal';
import EventEmitter from 'node:events';
import logger from '../config/logger.js';
import messageClassifier from '../utils/MessageClassifier.js';
import sessionService from './SessionService.js';
import qrService from './QRService.js';

const DEFAULT_RECONNECT_DELAY_MS = 5_000;

class BaileysService extends EventEmitter {
  constructor(
    userId,
    {
      reconnectDelayMs = DEFAULT_RECONNECT_DELAY_MS,
      // Por defecto procesa mensajes nuevos. Agrega 'append' si también
      // quieres procesar mensajes históricos o añadidos.
      acceptedUpsertTypes = ['notify'],
      ignoreFromMe = true
    } = {}
  ) {
    super()

    if (!userId || typeof userId !== 'string') {
      throw new Error('userId es requerido y debe ser un string')
    }

    this.userId = userId
    this.reconnectDelayMs = reconnectDelayMs
    this.acceptedUpsertTypes = new Set(acceptedUpsertTypes)
    this.ignoreFromMe = ignoreFromMe

    this.sock = null
    this.status = 'idle'
    this.stopped = false
    this.startPromise = null
    this.reconnectTimer = null

    logger.debug({ userId }, 'BaileysService creado')
  }

  async init() {
    if (this.stopped) {
      throw new Error('BaileysService fue cerrado y no puede reiniciarse')
    }

    // Evita crear dos sockets si init() se invoca en paralelo.
    if (this.startPromise) return this.startPromise

      // Si ya hay un socket conectado o conectándose, reutilízalo.
      if (this.sock && ['connecting', 'open'].includes(this.status)) {
        return this.sock
      }

      this.startPromise = this.createSocket()
      .catch((error) => {
        this.status = 'closed'
        logger.error( { userId: this.userId, error }, 'Error inicializando Baileys');
        this.scheduleReconnect();
        throw error
      })
      .finally(() => {
        this.startPromise = null
      })

      return this.startPromise
  }

  async createSocket() {
    const { state, saveCreds } = await sessionService.getAuthState(this.userId)

    if (this.stopped) {
      throw new Error('BaileysService fue cerrado durante la inicialización');
    }

    const socket = makeWASocket({
      logger: logger.child({ module: `baileys-${this.userId}`, userId: this.userId }, { level: 'silent' }),
                                printQRInTerminal: false,
                                auth: state,
                                browser: ['WhatsApp Bot', 'Chrome', '4.0.0'],
    });

    this.sock = socket;
    this.status = 'connecting';

    socket.ev.on('creds.update', () => {
      //sessionService.saveCreds(this.userId, creds);
      Promise.resolve(saveCreds()).catch((error) => {
        logger.error( { userId: this.userId, error }, 'Error guardando credenciales');
      })
    });

    socket.ev.on('connection.update', (update) => {
      this.handleConnectionUpdate(update, socket)
    })

    socket.ev.on('messages.upsert', (event) => {
      // EventEmitter no espera promesas de los callbacks.
      this.handleMessagesUpsert(event).catch((error) => {
        logger.error(  { userId: this.userId, error }, 'Error procesando messages.upsert' );
      });
    })

    return socket
  }

  async handleMessagesUpsert(event) {
    // Mantiene compatibilidad con el código que ya escucha el evento bruto.
    this.emit('messages.upsert', event);

    if (!this.acceptedUpsertTypes.has(event.type)) {
      logger.debug( { userId: this.userId, upsertType: event.type }, 'Upsert ignorado por configuración' );
      return;
    }

    for (const message of event.messages ?? []) {
      try {
        await this.processMessage(message, event.type)
      } catch (error) {
        logger.error( { userId: this.userId, messageId: message?.key?.id, error }, 'Error procesando mensaje');
      }
    }
  }

  async processMessage(message, upsertType) {

    if (!message?.message) return

      if (this.ignoreFromMe && message.key?.fromMe) {
        return
      }

      const classification = messageClassifier.classify(message)

      if (!classification) {
        logger.debug( { userId: this.userId, messageId: message.key?.id }, 'No se pudo clasificar el mensaje' );
        return;
      }

      const { rawType, category, content } = classification;

      this.emit('message.received', { userId: this.userId, upsertType, messageId: message.key?.id, remoteJid: message.key?.remoteJid,
        participant: message.key?.participant,
        fromMe: message.key?.fromMe ?? false,
        rawType,
        category,
        message,
        content
      })
  }

  handleConnectionUpdate(update, socket) {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      logger.info({ userId: this.userId }, 'Nuevo QR disponible');
      qrService.captureQR(qr);
      QRCode.generate(qr, { small: true });
      // Emitir evento QR para que InstanceManager lo maneje
      this.emit('qr', qr);
    }

    if (connection === 'open') {
      this.clearReconnectTimer()
      this.status = 'open'

      logger.info({ userId: this.userId }, 'WhatsApp conectado')
      this.emit('connected')
      return
    }

    if (connection !== 'close') return

      const statusCode = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      // No borres accidentalmente un socket más nuevo.
      if (this.sock === socket) {
        this.sock = null;
      }

      this.status = 'closed';

    logger.warn( { userId: this.userId, statusCode, error: lastDisconnect?.error }, 'Conexión cerrada');

    this.emit('disconnected', { statusCode, shouldReconnect });

    if (shouldReconnect) {
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.stopped || this.reconnectTimer) return;

    logger.info( { userId: this.userId, delayMs: this.reconnectDelayMs }, 'Programando reconexión');

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;

      this.init().catch(() => {
        // init() registra el error y programa el siguiente intento.
      })
    }, this.reconnectDelayMs)
  }

  clearReconnectTimer() {
    if (!this.reconnectTimer) return;

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  async sendTextMessage(to, text) {
    return this.sendMessage(to, { text })
  }

  async sendMessage(to, content) {
    if (!this.sock || this.status !== 'open') {
      throw new Error('BaileysService no está conectado')
    }

    try {
      return await this.sock.sendMessage(to, content)
    } catch (error) {
      logger.error(
        { userId: this.userId, to, error },
        'Error enviando mensaje'
      )
      throw error
    }
  }

  async close() {
    this.stopped = true
    this.status = 'closed'
    this.clearReconnectTimer()

    const socket = this.sock
    this.sock = null

    if (socket) {
      logger.info({ userId: this.userId }, 'Cerrando conexión Baileys')
      socket.end(new Error('BaileysService cerrado por la aplicación'))
    }

    this.removeAllListeners()
  }
}

export default BaileysService
