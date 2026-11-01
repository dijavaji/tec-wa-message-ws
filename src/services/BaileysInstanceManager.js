import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'events';
import BaileysService from './BaileysService.js';
import sessionService from './SessionService.js';
import QRService from './QRService.js';
import logger from '../config/logger.js';
import messageService from './MessageService.js';

class BaileysInstanceManager extends EventEmitter {
  constructor() {
    super();
    this.instances = new Map(); // Map<userId, BaileysService>
    this.instanceMetadata = new Map(); // Map<userId, {instanceId, createdAt, phoneNumber, status, jid?, lid?}>
    this._messagePipelineBound = false;
    this._ensureMessagePipeline();
  }

  /**
   * Registra una sola vez el pipeline MessageService → respuesta WhatsApp.
   * Evita N handlers duplicados (una respuesta por cada instancia en memoria).
   */
  _ensureMessagePipeline() {
    if (this._messagePipelineBound) {
      return;
    }

    messageService.on('message', async (normalizedMsg) => {
      await this._handleNormalizedMessage(normalizedMsg);
    });

    this._messagePipelineBound = true;
    logger.debug('Pipeline global de mensajes registrado');
  }

  /**
   * Enruta la respuesta a la instancia dueña del mensaje (ownerUserId).
   * @param {import('../dto/MessageDTO.js').default} normalizedMsg
   */
  async _handleNormalizedMessage(normalizedMsg) {
    const { ownerUserId, id: msgId, remoteJid } = normalizedMsg;

    if (!ownerUserId) {
      logger.warn({ msgId }, 'Mensaje sin ownerUserId; se ignora respuesta');
      return;
    }

    const instance = this.instances.get(ownerUserId);
    if (!instance) {
      logger.warn({ msgId, ownerUserId }, 'No hay instancia activa para responder');
      return;
    }

    try {
      logger.info({ msgId, ownerUserId }, 'Procesando mensaje normalizado');

      const response = await messageService.forwardToOrchestrator(normalizedMsg);

      if (response?.success && response?.data?.text) {
        await instance.sendTextMessage(remoteJid, response.data.text);
      } else {
        logger.warn({ msgId, response }, 'El orquestador no devolvió una respuesta válida para enviar');
        throw new Error('El orquestador no devolvió una respuesta válida para enviar');
      }
    } catch (error) {
      logger.error({ error, msgId, ownerUserId }, 'Error en el flujo de procesamiento de mensaje');
      await instance.sendTextMessage(remoteJid, 'Error en el flujo de procesamiento de mensaje');
    }
  }

  /**
   * Crea una nueva instancia de BaileysService para un userId específico
   * @param {string} userId - ID único del usuario
   * @param {string} phoneNumber - Número de teléfono (para referencia)
   * @returns {Promise<BaileysService>}
   */
  async createInstance(userId, phoneNumber) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId es requerido y debe ser un string');
    }

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new Error('phoneNumber es requerido y debe ser un string');
    }

    return this._startInstance(userId, phoneNumber);
  }

  /**
   * Restaura una instancia desde disco (sin phoneNumber previo).
   * El JID/número se sincroniza desde creds.json al conectar.
   * @param {string} userId
   * @returns {Promise<BaileysService>}
   */
  async restoreInstance(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId es requerido y debe ser un string');
    }

    return this._startInstance(userId, 'pending');
  }

  /**
   * Arranca todas las sesiones persistidas en storage/{userId}/auth_info_baileys.
   * @returns {Promise<Array<{userId: string, ok: boolean, error?: string}>>}
   */
  async initInstances() {
    const userIds = sessionService.listPersistedUserIds();
    logger.info({ count: userIds.length, userIds }, 'Restaurando sesiones persistidas');

    const results = [];

    for (const userId of userIds) {
      try {
        if (this.instances.has(userId)) {
          const existing = this.instances.get(userId);
          if (existing.status === 'open' || existing.status === 'connecting') {
            results.push({ userId, ok: true, skipped: true });
            continue;
          }
        }

        await this.restoreInstance(userId);
        results.push({ userId, ok: true });
      } catch (error) {
        logger.error({ userId, error }, 'Fallo al restaurar instancia');
        results.push({ userId, ok: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Núcleo compartido create / restore.
   * @param {string} userId
   * @param {string} phoneNumber
   * @returns {Promise<BaileysService>}
   * @private
   */
  async _startInstance(userId, phoneNumber) {
    if (this.instances.has(userId)) {
      const existing = this.instances.get(userId);

      if (existing.status === 'open' || existing.status === 'connecting') {
        const error = new Error('Usuario ya tiene una instancia activa');
        error.statusCode = 409;
        error.code = 'INSTANCE_EXISTS';
        throw error;
      }

      this.instances.delete(userId);
      this.instanceMetadata.delete(userId);
    }

    logger.info({ userId, phoneNumber }, 'Iniciando instancia de BaileysService');

    const instance = new BaileysService(userId);
    const instanceId = uuidv4();

    this.instanceMetadata.set(userId, {
      instanceId,
      createdAt: new Date().toISOString(),
      phoneNumber,
      status: 'waiting_scan'
    });

    this.instances.set(userId, instance);

    try {
      await instance.init();
      this._setupInstanceListeners(instance, userId);
      this.emit('instance:created', { userId, instanceId, phoneNumber });

      // Solo enruta upsert → MessageService; la respuesta va por el pipeline global
      instance.on('messages.upsert', (upsert) => {
        messageService.handleUpsert(upsert, userId);
      });

      logger.info({ userId, instanceId }, 'Instancia iniciada exitosamente');
      return instance;
    } catch (error) {
      this.instances.delete(userId);
      this.instanceMetadata.delete(userId);
      logger.error({ instanceId, userId, error }, 'Error al inicializar instancia');
      throw error;
    }
  }

  /**
   * Obtiene una instancia por userId
   * @param {string} userId - ID del usuario
   * @returns {BaileysService | null}
   */
  getInstance(userId) {
    return this.instances.get(userId) || null;
  }

  /**
   * Verifica si existe una instancia para un userId
   * @param {string} userId - ID del usuario
   * @returns {boolean}
   */
  hasInstance(userId) {
    return this.instances.has(userId);
  }

  /**
   * Obtiene todas las instancias
   * @returns {Map<string, BaileysService>}
   */
  getAllInstances() {
    return this.instances;
  }

  /**
   * Elimina una instancia por userId
   * @param {string} userId - ID del usuario
   * @returns {boolean} - true si se eliminó, false si no existía
   */
  async deleteInstance(userId) {
    const instance = this.instances.get(userId);

    if (!instance) {
      return false;
    }

    logger.info({ userId }, 'Eliminando instancia de BaileysService');

    this._removeInstanceListeners(instance);

    try {
      await instance.close();
    } catch (error) {
      logger.warn({ userId, error }, 'Error al cerrar socket al eliminar instancia');
    }

    this.instances.delete(userId);
    this.instanceMetadata.delete(userId);

    this.emit('instance:deleted', { userId });

    logger.info({ userId }, 'Instancia eliminada exitosamente');

    return true;
  }

  /**
   * Obtiene el estado actual de una instancia
   * @param {string} userId - ID del usuario
   * @returns {'waiting_scan' | 'ready' | 'disconnected' | null}
   */
  getStatus(userId) {
    const metadata = this.instanceMetadata.get(userId);

    if (!metadata) {
      return null;
    }

    return metadata.status;
  }

  /**
   * Actualiza el estado de una instancia
   * @param {string} userId - ID del usuario
   * @param {'waiting_scan' | 'ready' | 'disconnected'} status - Nuevo estado
   */
  updateStatus(userId, status) {
    const metadata = this.instanceMetadata.get(userId);

    if (metadata) {
      metadata.status = status;
      this.instanceMetadata.set(userId, metadata);
      logger.debug({ userId, status }, 'Estado de instancia actualizado');
    }
  }

  /**
   * Tras conectar, lee me.id / me.lid de creds.json y actualiza metadata.
   * @param {string} userId
   */
  _syncPhoneFromCreds(userId) {
    const me = sessionService.readMeFromCreds(userId);
    if (!me) {
      logger.warn({ userId }, 'creds.json sin me; phoneNumber no actualizado');
      return;
    }

    const metadata = this.instanceMetadata.get(userId);
    if (!metadata) {
      return;
    }

    const phoneNumber = this._phoneFromMe(me);
    metadata.jid = me.id ?? null;
    metadata.lid = me.lid ?? null;
    if (phoneNumber) {
      metadata.phoneNumber = phoneNumber;
    }

    this.instanceMetadata.set(userId, metadata);
    logger.info(
      { userId, phoneNumber: metadata.phoneNumber, jid: metadata.jid, lid: metadata.lid },
      'phoneNumber sincronizado desde creds.json tras conectar'
    );
  }

  /**
   * Deriva un teléfono E.164 aproximado desde me.id o me.lid.
   * Ej: 593963037426:27@s.whatsapp.net → +593963037426
   * @param {{ id?: string, lid?: string }} me
   * @returns {string | null}
   */
  _phoneFromMe(me) {
    const jid = me.id || me.lid;
    if (!jid || typeof jid !== 'string') {
      return null;
    }

    // LID no es número telefónico usable como phone display
    if (!me.id && me.lid) {
      return me.lid;
    }

    const userPart = jid.split('@')[0] || '';
    const number = userPart.split(':')[0];
    if (!number || !/^\d+$/.test(number)) {
      return jid;
    }

    return `+${number}`;
  }

  /**
   * Setup listeners para una instancia específica
   * @param {BaileysService} instance - La instancia
   * @param {string} userId - ID del usuario
   */
  _setupInstanceListeners(instance, userId) {
    instance.on('qr', (qr) => {
      logger.debug({ userId }, 'QR recibido, capturando en QRService');
      QRService.captureQR(qr);
      this.updateStatus(userId, 'waiting_scan');
      this.emit('instance:qr_generated', { userId, qr });
    });

    instance.on('connected', () => {
      this.updateStatus(userId, 'ready');
      this._syncPhoneFromCreds(userId);
      this.emit('instance:ready', { userId });
    });

    instance.on('disconnected', ({ statusCode, shouldReconnect }) => {
      this.updateStatus(userId, 'disconnected');
      this.emit('instance:disconnected', {
        userId,
        statusCode,
        shouldReconnect
      });
    });

    instance.on('error', (error) => {
      logger.error({ userId, error }, 'Error en BaileysService');
      this.emit('instance:error', { userId, error });
    });
  }

  /**
   * Remueve todos los listeners de una instancia
   * @param {BaileysService} instance - La instancia
   */
  _removeInstanceListeners(instance) {
    instance.removeAllListeners();
  }
}

// Singleton
const instanceManager = new BaileysInstanceManager();

export default instanceManager;
