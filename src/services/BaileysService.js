import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import EventEmitter from 'events';
import QRCode from 'qrcode-terminal';
import logger from '../config/logger.js';
import sessionService from './SessionService.js';

class BaileysService extends EventEmitter {
  constructor() {
    super();
    this.sock = null;
  }

  async init() {
    const { state, saveCreds } = await sessionService.getAuthState();

    this.sock = makeWASocket({
      logger: logger.child({ module: 'baileys-internal' }, { level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: ['WhatsApp Bot', 'Chrome', '4.0.0'],
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        logger.info('Nuevo QR disponible');
        QRCode.generate(qr, { small: true });
        this.emit('qr', qr);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        logger.warn({ statusCode, error: lastDisconnect?.error }, 'Conexión cerrada');
        
        if (shouldReconnect) {
          logger.info('Intentando reconectar en 5s...');
          setTimeout(() => this.init(), 5000);
        }
        this.emit('disconnected', { statusCode, shouldReconnect });
      } else if (connection === 'open') {
        logger.info('WhatsApp conectado exitosamente');
        this.emit('connected');
      }
    });

    this.sock.ev.on('messages.upsert', (upsert) => {
      this.emit('messages.upsert', upsert);
    });

    return this.sock;
  }

  async sendTextMessage(to, text) {
    if (!this.sock) {
      logger.error('No se pudo enviar mensaje: BaileysService no inicializado');
      return;
    }
    try {
      logger.info({ to }, 'Enviando mensaje de texto via WhatsApp');
      return await this.sock.sendMessage(to, { text });
    } catch (error) {
      logger.error({ error, to }, 'Error enviando mensaje via BaileysService');
    }
  }

  async sendMessage(to, content) {
    if (!this.sock) throw new Error('BaileysService no inicializado');
    return await this.sock.sendMessage(to, content);
  }
}

export default new BaileysService();
