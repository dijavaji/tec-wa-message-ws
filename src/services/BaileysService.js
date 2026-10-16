import makeWASocket, { DisconnectReason, delay } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import EventEmitter from 'events';
import logger from '../config/logger.js';
import QRCode from 'qrcode-terminal';
import SessionService from './SessionService.js';
import MessageService from './MessageService.js';

class BaileysService extends EventEmitter {
  constructor(instanceId = 'default') {
    super();
    this.instanceId = instanceId;
    this.sock = null;
    this.sessionService = new SessionService(instanceId);
    this.qr = null;
    this.status = 'initializing';
    this.qrRetryCount = 0;
    this.maxQrRetries = 3;
  }

  async init() {
    const { state, saveCreds } = await this.sessionService.getAuthState();

    this.sock = makeWASocket({
      logger: logger.child({ module: `baileys-${this.instanceId}` }, { level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: ['WhatsApp Bot', 'Chrome', '4.0.0'],
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.qr = qr;
        this.qrRetryCount++;
        logger.info({ instanceId: this.instanceId, retry: this.qrRetryCount }, 'Nuevo QR generado');
        QRCode.generate(qr, { small: true });
        this.emit('qr', qr);

        if (this.qrRetryCount > this.maxQrRetries) {
          logger.warn({ instanceId: this.instanceId }, 'Límite de reintentos de QR alcanzado. Cerrando instancia.');
          this.status = 'closed';
          this.emit('qr_timeout');
          this.sock.ev.removeAllListeners('connection.update');
          this.sock.end();
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut && this.status !== 'closed';
        
        this.status = 'closed';
        logger.warn({ instanceId: this.instanceId, statusCode, error: lastDisconnect?.error }, 'Conexión cerrada');
        
        if (shouldReconnect) {
          logger.info({ instanceId: this.instanceId }, 'Intentando reconectar en 5s...');
          setTimeout(() => this.init(), 5000);
        }
        this.emit('disconnected', { statusCode, shouldReconnect });
      } else if (connection === 'open') {
        this.status = 'open';
        this.qr = null;
        this.qrRetryCount = 0;
        logger.info({ instanceId: this.instanceId }, 'WhatsApp conectado exitosamente');
        this.emit('connected');
      }
    });

    this.sock.ev.on('messages.upsert', async (upsert) => {
      if (upsert.type === 'notify') {
        for (const msg of upsert.messages) {
          if (!msg.key.fromMe) {
            await MessageService.handleIncomingMessage(msg);
          }
        }
      }
      this.emit('messages.upsert', upsert);
    });

    return this.sock;
  }

  async sendTextMessage(to, text) {
    if (this.status !== 'open') {
      logger.error({ instanceId: this.instanceId }, 'No se pudo enviar mensaje: Instancia no conectada');
      return;
    }
    try {
      logger.info({ instanceId: this.instanceId, to }, 'Enviando mensaje de texto via WhatsApp');
      return await this.sock.sendMessage(to, { text });
    } catch (error) {
      logger.error({ instanceId: this.instanceId, error, to }, 'Error enviando mensaje via BaileysService');
    }
  }

  async sendMessage(to, content) {
    if (this.status !== 'open') throw new Error('Instancia no conectada');
    return await this.sock.sendMessage(to, content);
  }
}

export default BaileysService;
