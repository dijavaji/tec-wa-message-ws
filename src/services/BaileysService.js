import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import EventEmitter from 'events';
import QRCode from 'qrcode-terminal';
import logger from '../config/logger.js';
import sessionService from './SessionService.js';
import qrService from './QRService.js';

class BaileysService extends EventEmitter {
  /**
   * Constructor with userId injection
   * @param {string} userId - ID único del usuario para esta instancia
   */
  constructor(userId) {
    super();
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId es requerido y debe ser un string');
    }
    
    this.userId = userId;
    this.sock = null;
    this.status = 'initializing';
    logger.debug({ userId }, 'BaileysService instance created');
  }

  async init() {
    logger.info({ userId: this.userId }, 'Inicializando BaileysService con sesión específica del usuario');

    // Obtener estado de autenticación para este userId
    const { state, saveCreds } = await sessionService.getAuthState(this.userId);

    this.sock = makeWASocket({
      logger: logger.child({ module: `baileys-${this.userId}`, userId: this.userId }, { level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: ['WhatsApp Bot', 'Chrome', '4.0.0'],
    });

    //this.eventHandler();

    // Guardar credenciales usando SessionService
    this.sock.ev.on('creds.update', saveCreds);
    //this.sock.ev.on('creds.update', (creds) => {
      //sessionService.saveCreds(this.userId, creds);
    //});

    this.sock.ev.on('connection.update', (update) => {
      this.connectionUpdate(update);
    });

    this.sock.ev.on('messages.upsert', (event) => {
      this.messagesUpsert(event);
    });

    return this.sock;
  }

  eventHandler(){
    this.sock.ev.process(async (events) => {

      try{
        if (events.call) {
          logger.info({ userId: this.userId}, 'Evento llamada');
        }

        if(events['creds.update']){
          sessionService.saveCreds(this.userId, events['creds.update']);
        }

        if (events['connection.update']) {
          this.connectionUpdate(events['connection.update']);
        }

        if (events['messages.upsert']) {
          this.messagesUpsert(events['messages.upsert']);
        }

      }catch(error){
          logger.error({ userId: this.userId, error}, 'Error eventHandler de BaileysService');
      }
    });
  }

  messagesUpsert(event){
    //if (event.type !== 'notify') return
      this.emit('messages.upsert', event);
  }

  connectionUpdate(event){

    const { connection, lastDisconnect, qr } = event;

    if (qr) {
      logger.info({ userId: this.userId }, 'Nuevo QR disponible');
      // Capturar QR en QRService
      qrService.captureQR(qr);

      QRCode.generate(qr, { small: true });
      // Emitir evento QR para que InstanceManager lo maneje
      this.emit('qr', qr);
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      this.status = 'closed';
      logger.warn({ userId: this.userId, statusCode, error: lastDisconnect?.error }, 'Conexión cerrada');

      if (shouldReconnect) {
        logger.info({ userId: this.userId }, 'Intentando reconectar en 5s...');
        setTimeout(() => this.init(), 5000);
      }
      this.emit('disconnected', { statusCode, shouldReconnect });
    } else if (connection === 'open') {
      this.status = 'open';
      logger.info({ userId: this.userId }, 'WhatsApp conectado exitosamente');
      this.emit('connected');
    }

  }

  async sendTextMessage(to, text) {
    if (!this.sock) {
      logger.error({ userId: this.userId }, 'No se pudo enviar mensaje: BaileysService no inicializado');
      return;
    }
    try {
      logger.info({ userId: this.userId, to }, 'Enviando mensaje de texto via WhatsApp');
      return await this.sock.sendMessage(to, { text });
    } catch (error) {
      logger.error({ userId: this.userId, error, to }, 'Error enviando mensaje via BaileysService');
    }
  }

  async sendMessage(to, content) {
    if (!this.sock) throw new Error('BaileysService no inicializado');
    return await this.sock.sendMessage(to, content);
  }

  /**
   * Cierra la conexión y libera recursos
   */
  async close() {
    if (this.sock) {
      logger.info({ userId: this.userId }, 'Cerrando conexión de BaileysService');
      await this.sock.close();
      this.sock = null;
    }
    // Remover listeners para evitar memory leaks
    this.removeAllListeners();
  }
}

export default BaileysService;
