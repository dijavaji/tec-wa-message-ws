import { expect, describe, it, jest, beforeEach, afterEach } from '@jest/globals';
import BaileysService from '../../services/BaileysService.js';
import qrService from '../../services/QRService.js';

describe('BaileysService', () => {
  describe('constructor', () => {
    it('debe recibir userId como parámetro obligatorio', () => {
      expect(() => new BaileysService()).toThrow('userId es requerido');
      expect(() => new BaileysService(null)).toThrow('userId es requerido');
      expect(() => new BaileysService(123)).toThrow('userId es requerido');
    });

    it('debe establecer userId en la instancia', () => {
      const instance = new BaileysService('test_user_001');
      expect(instance.userId).toBe('test_user_001');
    });

    it('debe inicializar sock como null', () => {
      const instance = new BaileysService('test_user_002');
      expect(instance.sock).toBeNull();
    });
  });

  describe('connectionUpdate / messagesUpsert', () => {
    let captureSpy;

    beforeEach(() => {
      captureSpy = jest.spyOn(qrService, 'captureQR').mockImplementation(() => {});
    });

    afterEach(() => {
      captureSpy.mockRestore();
    });

    it('test_connection_update_emits_qr_and_connected', () => {
      const instance = new BaileysService('user_events');
      const onQr = jest.fn();
      const onConnected = jest.fn();

      instance.on('qr', onQr);
      instance.on('connected', onConnected);

      instance.connectionUpdate({ qr: 'fake-qr-payload' });
      expect(onQr).toHaveBeenCalledWith('fake-qr-payload');
      expect(captureSpy).toHaveBeenCalledWith('fake-qr-payload');

      instance.connectionUpdate({ connection: 'open' });
      expect(onConnected).toHaveBeenCalledTimes(1);
      expect(instance.status).toBe('open');
    });

    it('test_messages_upsert_reemits_event', () => {
      const instance = new BaileysService('user_upsert');
      const onUpsert = jest.fn();
      const event = {
        type: 'notify',
        messages: [{ key: { id: '1', remoteJid: 'x@s.whatsapp.net' }, message: { conversation: 'hi' } }]
      };

      instance.on('messages.upsert', onUpsert);
      instance.messagesUpsert(event);

      expect(onUpsert).toHaveBeenCalledWith(event);
    });
  });
});
