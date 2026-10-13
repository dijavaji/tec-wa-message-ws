import { expect, describe, it, jest } from '@jest/globals';
import QRService from '../../services/QRService.js';

describe('QRService', () => {
  let qrServiceInstance;

  beforeEach(() => {
    qrServiceInstance = new QRService();
  });

  describe('captureQR', () => {
    it('debe capturar QR y generar hash SHA-256', () => {
      const qrImage = 'test-qr-data-12345';
      
      qrServiceInstance.captureQR(qrImage);
      const result = qrServiceInstance.getLatestQR();

      expect(result).toBeDefined();
      expect(result.qrBase64).toBe(qrImage);
      expect(result.mimeType).toBe('image/png');
      expect(result.hash).toHaveLength(64);
      expect(result.timestamp).toBeDefined();
      expect(result.expiresAt).toBeDefined();
    });

    it('debe generar hash SHA-256 válido', () => {
      const qrImage = 'qr-image-xyz-789';
      qrServiceInstance.captureQR(qrImage);
      const result = qrServiceInstance.getLatestQR();

      expect(/^[a-f0-9]{64}$/.test(result.hash)).toBe(true);
    });
  });

  describe('getLatestQR', () => {
    it('debe retornar null si no hay QR capturado', () => {
      const result = qrServiceInstance.getLatestQR();
      expect(result).toBeNull();
    });

    it('debe retornar QR capturado', () => {
      const qrImage = 'base64-encoded-qr';
      qrServiceInstance.captureQR(qrImage);

      const result = qrServiceInstance.getLatestQR();

      expect(result).toBeDefined();
      expect(result.qrBase64).toBe(qrImage);
      expect(result.mimeType).toBe('image/png');
    });

    it('debe retornar null si el cache ha expirado', () => {
      const qrImage = 'expired-qr-data';
      qrServiceInstance.captureQR(qrImage);
      
      qrServiceInstance.lastQR.expiresAt = Date.now() - 1000;

      const result = qrServiceInstance.getLatestQR();
      
      expect(result).toBeNull();
    });
  });

  describe('generateHash', () => {
    it('debe generar hash SHA-256 de una string', () => {
      const data = 'test-data-to-hash';
      const hash = qrServiceInstance.generateHash(data);

      expect(hash).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
    });

    it('debe generar hash consistente para misma data', () => {
      const data = 'consistent-hash-test';
      const hash1 = qrServiceInstance.generateHash(data);
      const hash2 = qrServiceInstance.generateHash(data);

      expect(hash1).toBe(hash2);
    });
  });

  describe('clearCache', () => {
    it('debe limpiar el cache actual', () => {
      const qrImage = 'to-be-cleared';
      qrServiceInstance.captureQR(qrImage);
      
      expect(qrServiceInstance.getLatestQR()).not.toBeNull();

      qrServiceInstance.clearCache();
      
      expect(qrServiceInstance.getLatestQR()).toBeNull();
    });

    it('debe limpiar el timeout de cache', () => {
      const qrImage = 'clear-cache-timeout';
      qrServiceInstance.captureQR(qrImage);

      expect(qrServiceInstance.cacheTimeout).toBeDefined();

      qrServiceInstance.clearCache();
      
      expect(qrServiceInstance.cacheTimeout).toBeNull();
      expect(qrServiceInstance.lastQR).toBeNull();
    });
  });

  describe('emitir eventos', () => {
    it('debe emitir evento qr:updated cuando se captura QR', () => {
      const qrImage = 'event-test-qr';
      const listener = jest.fn();

      qrServiceInstance.on('qr:updated', listener);
      qrServiceInstance.captureQR(qrImage);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          qrBase64: qrImage,
          hash: expect.any(String)
        })
      );
    });
  });
});
