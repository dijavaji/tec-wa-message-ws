import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'events';
import BaileysService from './BaileysService.js';
import SessionService from './SessionService.js';
import QRService from './QRService.js';
import logger from '../config/logger.js';
import messageService from './MessageService.js';

class BaileysInstanceManager extends EventEmitter {
  constructor() {
    super();
    this.instances = new Map(); // Map<userId, BaileysService>
    this.instanceMetadata = new Map(); // Map<userId, {instanceId, createdAt, phoneNumber, status}>
  }

  /**
   * Crea una nueva instancia de BaileysService para un userId específico
   * @param {string} userId - ID único del usuario
   * @param {string} phoneNumber - Número de teléfono (para referencia)
   * @returns {BaileysService} - La instancia creada
   */
  async createInstance(userId, phoneNumber) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId es requerido y debe ser un string');
    }

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new Error('phoneNumber es requerido y debe ser un string');
    }

    // Validar que no exista ya una instancia para este userId
    if (this.instances.has(userId)) {

      const existing = this.instances.get(userId);

      if (existing.status === 'open' || existing.status === 'connecting') {
        const error = new Error('Usuario ya tiene una instancia activa');
        error.statusCode = 409;
        error.code = 'INSTANCE_EXISTS';
        throw error;
      }
      // Si existe pero está cerrada, la removemos para crear una nueva
      this.instances.delete(userId);
    }

    logger.info({ userId, phoneNumber }, 'Creando nueva instancia de BaileysService');

    // Crear nueva instancia
    const instance = new BaileysService(userId);

    // Guardar metadata
    const instanceId = uuidv4();
    this.instanceMetadata.set(userId, {
      instanceId,
      createdAt: new Date().toISOString(),
      phoneNumber,
      status: 'waiting_scan'
    });

    // Guardar en el registry
    this.instances.set(userId, instance);

    try {
      await instance.init();
      // Setup event listeners para esta instancia
      this._setupInstanceListeners(instance, userId);

      // Emitir evento
      this.emit('instance:created', { userId, instanceId, phoneNumber });

      // Vincular eventos entre servicios
      instance.on('messages.upsert', (upsert) => {
        messageService.handleUpsert(upsert);
      });

      messageService.on('message', async (normalizedMsg) => {
        try{

          logger.info({ msgId: normalizedMsg.id }, 'Procesando mensaje normalizado');

          // 1. Forward al orquestador
          const response = await messageService.forwardToOrchestrator(normalizedMsg);

          // 2. Validar respuesta y enviar de vuelta a WhatsApp
          if (response?.success && response?.data?.text) {
            await instance.sendTextMessage(normalizedMsg.remoteJid, response.data.text);
          } else {
            logger.warn({ msgId: normalizedMsg.id, response }, 'El orquestador no devolvió una respuesta válida para enviar');
            throw new Error('El orquestador no devolvió una respuesta válida para enviar');
          }

          } catch (error) {
          logger.error({ error, msgId: normalizedMsg.id }, 'Error en el flujo de procesamiento de mensaje');
          await instance.sendTextMessage(normalizedMsg.remoteJid, 'Error en el flujo de procesamiento de mensaje');
          }
      });
      logger.info({ userId, instanceId }, 'Instancia creada exitosamente');

      return instance;
    } catch (error) {
      this.instances.delete(userId);
      logger.error({ instanceId, error }, 'Error al inicializar instancia');
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

    // Remover listeners
    this._removeInstanceListeners(instance);

    // Cerrar socket
    try {
      await instance.close();
    } catch (error) {
      logger.warn({ userId, error }, 'Error al cerrar socket al eliminar instancia');
    }

    // Eliminar del registry
    this.instances.delete(userId);
    this.instanceMetadata.delete(userId);

    // Emitir evento
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
   * Setup listeners para una instancia específica
   * @param {BaileysService} instance - La instancia
   * @param {string} userId - ID del usuario
   */
  _setupInstanceListeners(instance, userId) {
    // Escuchar QR
    instance.on('qr', (qr) => {
      logger.debug({ userId }, 'QR recibido, capturando en QRService');
      QRService.captureQR(qr);
      this.updateStatus(userId, 'waiting_scan');
      this.emit('instance:qr_generated', { userId, qr });
    });

    // Escuchar conexión exitosa
    instance.on('connected', () => {
      this.updateStatus(userId, 'ready');
      this.emit('instance:ready', { userId });
    });

    // Escuchar desconexión
    instance.on('disconnected', ({ statusCode, shouldReconnect }) => {
      this.updateStatus(userId, 'disconnected');
      this.emit('instance:disconnected', { 
        userId, 
        statusCode, 
        shouldReconnect 
      });
    });

    // Escuchar errores
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
    // clearAllListeners remueve todos los listeners
    instance.removeAllListeners();
  }
}

// Singleton
const instanceManager = new BaileysInstanceManager();

export default instanceManager;
