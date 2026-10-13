import crypto from 'crypto';
import EventEmitter from 'events';
import logger from '../config/logger.js';

class QRService extends EventEmitter {
  constructor() {
    super();
    this.lastQR = null;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutos
    this.cacheTimeout = null;
  }

  /**
   * Captura el QR image, lo convierte a Base64 y genera hash SHA-256
   * @param {string} qrImage - El código QR generado por Baileys
   */
  captureQR(qrImage) {
    try {
      // Generar hash SHA-256 para ETag
      const hash = crypto.createHash('sha256')
        .update(qrImage)
        .digest('hex');

      this.lastQR = {
        qrBase64: qrImage,
        mimeType: 'image/png',
        timestamp: Date.now(),
        hash,
        expiresAt: Date.now() + this.cacheTTL
      };

      // Limpiar cache después del TTL
      if (this.cacheTimeout) {
        clearTimeout(this.cacheTimeout);
      }

      this.cacheTimeout = setTimeout(() => {
        this.clearCache();
      }, this.cacheTTL);

      logger.debug({ hash }, 'QR capturado y cacheado');
      
      // Emitir evento para notificar que el QR ha sido actualizado
      this.emit('qr:updated', this.lastQR);
    } catch (error) {
      logger.error({ error }, 'Error al capturar QR');
    }
  }

  /**
   * Obtiene el último QR generado
   * @returns {{qrBase64: string, mimeType: string, hash: string} | null}
   */
  getLatestQR() {
    if (!this.lastQR) return null;
    
    // Verificar si el cache ha expirado
    if (Date.now() > this.lastQR.expiresAt) {
      this.clearCache();
      return null;
    }

    return {
      qrBase64: this.lastQR.qrBase64,
      mimeType: this.lastQR.mimeType,
      hash: this.lastQR.hash
    };
  }

  /**
   * Genera hash SHA-256 de una string (útil para validación externa)
   * @param {string} data - Datos a hashear
   * @returns {string} - Hash en formato hex
   */
  generateHash(data) {
    return crypto.createHash('sha256')
      .update(data)
      .digest('hex');
  }

  /**
   * Limpia el cache actual
   */
  clearCache() {
    this.lastQR = null;
    if (this.cacheTimeout) {
      clearTimeout(this.cacheTimeout);
      this.cacheTimeout = null;
    }
    logger.debug('QR cache limpiado');
  }
}

export default new QRService();
