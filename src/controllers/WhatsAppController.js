import instanceManager from '../services/BaileysInstanceManager.js';
import qrService from '../services/QRService.js';
import logger from '../config/logger.js';

class WhatsAppController {
  constructor() {
    this.instanceManager = instanceManager;
    this.qrService = qrService;
  }

  /**
   * Crea una nueva instancia de WhatsApp para un usuario
   * @param {string} userId - ID único del usuario
   * @param {string} phoneNumber - Número de teléfono
   * @returns {Promise<{instanceId: string, status: string}>}
   */
  async createInstance(userId, phoneNumber) {
    // Validar inputs
    if (!userId || typeof userId !== 'string') {
      throw this._buildError('BadRequest', 'userId es requerido', 'userId');
    }

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw this._buildError('BadRequest', 'phoneNumber es requerido', 'phoneNumber');
    }

    if (!this._validatePhoneNumber(phoneNumber)) {
      throw this._buildError('BadRequest', 'Formato de número inválido. Use +XX XXXXXXXXX', 'phoneNumber');
    }

    if (!this._validateUserId(userId)) {
      throw this._buildError('BadRequest', 'Formato de userId inválido. Use alfanuméricos y underscore (3-32 chars)', 'userId');
    }

    try {
      const instance = await this.instanceManager.createInstance(userId, phoneNumber);
      
      // Obtener el instanceId de la metadata
      const metadata = this.instanceManager.instanceMetadata.get(userId);
      const instanceId = metadata.instanceId;

      logger.info({ userId, instanceId, phoneNumber }, 'Instancia de WhatsApp creada exitosamente');

      return {
        instanceId,
        status: 'generating_qr'
      };
    } catch (error) {
      logger.error({ userId, phoneNumber, error }, 'Error creando instancia de WhatsApp');
      throw error;
    }
  }

  /**
   * Obtiene el QR code para un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<{qrBase64: string, mimeType: string} | null>}
   */
  async getQR(userId) {
    const instance = this.instanceManager.getInstance(userId);

    //console.log("recupero la instancia",instance);

    if (!instance) {
      throw this._buildError('NotFound', 'Instancia no encontrada', 'userId');
    }

    const qrData = this.qrService.getLatestQR();

    if (!qrData) {
      return null;
    }

    logger.debug({ userId }, 'QR recuperado exitosamente');

    return {
      qrBase64: qrData.qrBase64,
      mimeType: qrData.mimeType
    };
  }

  /**
   * Obtiene el estado actual de la instancia de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<{status: string}>}
   */
  async getStatus(userId) {
    const status = this.instanceManager.getStatus(userId);

    if (status === null) {
      throw this._buildError('NotFound', 'Instancia no encontrada', 'userId');
    }

    logger.debug({ userId, status }, 'Estado de instancia recuperado');

    return { status };
  }

  /**
   * Elimina una instancia de WhatsApp para un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>}
   */
  async deleteInstance(userId) {
    const exists = this.instanceManager.hasInstance(userId);

    if (!exists) {
      throw this._buildError('NotFound', 'Instancia no encontrada', 'userId');
    }

    const result = await this.instanceManager.deleteInstance(userId);

    if (result) {
      logger.info({ userId }, 'Instancia de WhatsApp eliminada exitosamente');
    }

    return result;
  }

  /**
   * Restaura en memoria todas las sesiones persistidas en disco.
   * @returns {Promise<{restored: number, failed: number, results: Array}>}
   */
  async initAllInstance() {
    try {
      const results = await this.instanceManager.initInstances();
      const restored = results.filter((r) => r.ok).length;
      const failed = results.filter((r) => !r.ok).length;

      logger.info({ restored, failed, results }, 'Instancias de WhatsApp inicializadas desde disco');

      return { restored, failed, results, status: 'initialized' };
    } catch (error) {
      logger.error({ error }, 'Error inicializando instancias');
      throw error;
    }
  }

  /**
   * Valida el formato de un número de teléfono
   * @param {string} phone - Número de teléfono
   * @returns {boolean}
   */
  _validatePhoneNumber(phone) {
    // Formato: +XX XXXXXXXXX (mínimo: +XX 1234567890)
    const phoneRegex = /^\+\d{1,3}\s?\d{7,15}$/;
    return phoneRegex.test(phone.trim());
  }

  /**
   * Valida el formato de un userId
   * @param {string} userId - ID del usuario
   * @returns {boolean}
   */
  _validateUserId(userId) {
    // Alfanuméricos y underscore, 3-32 caracteres
    const userIdRegex = /^[a-zA-Z0-9_]{3,32}$/;
    return userIdRegex.test(userId);
  }

  /**
   * Construye un objeto de error estructurado
   * @param {string} type - Tipo de error (BadRequest, NotFound, Conflict, Internal)
   * @param {string} message - Mensaje
   * @param {string} [field] - Campo afectado (opcional)
   * @returns {Error}
   */
  _buildError(type, message, field) {
    const error = new Error(message);
    error.statusCode = this._getStatusCode(type);
    error.errorCode = type;
    error.field = field;
    error.timestamp = new Date().toISOString();
    return error;
  }

  /**
   * Obtiene el código de estado HTTP según el tipo de error
   * @param {string} type - Tipo de error
   * @returns {number}
   */
  _getStatusCode(type) {
    const statusCodes = {
      BadRequest: 400,
      NotFound: 404,
      Conflict: 409,
      Internal: 500
    };
    return statusCodes[type] || 500;
  }
}

export default new WhatsAppController();
