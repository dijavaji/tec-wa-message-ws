import { expect, describe, it, jest, beforeEach, afterEach } from '@jest/globals';
import instanceManager from '../../services/BaileysInstanceManager.js';
import sessionService from '../../services/SessionService.js';
import BaileysService from '../../services/BaileysService.js';
import messageService from '../../services/MessageService.js';

const flushAsync = () => new Promise((resolve) => setImmediate(resolve));

const notifyUpsert = {
  type: 'notify',
  messages: [{
    key: { id: 'msg-loop-1', remoteJid: '5491122334455@s.whatsapp.net' },
    pushName: 'Diego',
    message: { conversation: 'Hola bot' },
    messageTimestamp: 1678901234
  }]
};

describe('BaileysInstanceManager', () => {
  let initSpy;

  beforeEach(() => {
    instanceManager.instances.clear();
    instanceManager.instanceMetadata.clear();
    instanceManager._messagePipelineBound = false;
    initSpy = jest.spyOn(BaileysService.prototype, 'init').mockResolvedValue(undefined);
  });

  afterEach(() => {
    initSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('createInstance', () => {
    it('debe lanzar error si userId es inválido', async () => {
      await expect(
        instanceManager.createInstance(null, '+34 666 123 456')
      ).rejects.toThrow('userId es requerido');
    });

    it('debe lanzar error si phoneNumber es inválido', async () => {
      await expect(
        instanceManager.createInstance('user_002', null)
      ).rejects.toThrow('phoneNumber es requerido');
    });
  });

  describe('restoreInstance', () => {
    it('debe lanzar error si userId es inválido', async () => {
      await expect(instanceManager.restoreInstance(null)).rejects.toThrow('userId es requerido');
    });
  });

  describe('_phoneFromMe', () => {
    it('debe derivar E.164 desde me.id', () => {
      const phone = instanceManager._phoneFromMe({
        id: '593963037426:27@s.whatsapp.net',
        lid: '220701927690307:27@lid'
      });
      expect(phone).toBe('+593963037426');
    });

    it('debe preferir me.id sobre me.lid', () => {
      const phone = instanceManager._phoneFromMe({
        id: '5215512345678:1@s.whatsapp.net',
        lid: '999:1@lid'
      });
      expect(phone).toBe('+5215512345678');
    });
  });

  describe('_syncPhoneFromCreds', () => {
    it('debe actualizar metadata con jid/lid/phone tras leer creds', () => {
      const userId = 'user_sync';
      const original = sessionService.readMeFromCreds.bind(sessionService);

      sessionService.readMeFromCreds = () => ({
        id: '593995833440:36@s.whatsapp.net',
        lid: '149503566987460:36@lid',
        name: 'diekgo'
      });

      instanceManager.instanceMetadata.set(userId, {
        instanceId: 'id-1',
        createdAt: new Date().toISOString(),
        phoneNumber: 'pending',
        status: 'ready'
      });

      instanceManager._syncPhoneFromCreds(userId);

      const metadata = instanceManager.instanceMetadata.get(userId);
      expect(metadata.phoneNumber).toBe('+593995833440');
      expect(metadata.jid).toBe('593995833440:36@s.whatsapp.net');
      expect(metadata.lid).toBe('149503566987460:36@lid');

      sessionService.readMeFromCreds = original;
    });
  });

  describe('getInstance', () => {
    it('debe retornar null si no existe', () => {
      const result = instanceManager.getInstance('non_existent_user');
      expect(result).toBeNull();
    });
  });

  describe('hasInstance', () => {
    it('debe retornar false si no existe instancia', () => {
      expect(instanceManager.hasInstance('non_existent')).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('debe retornar null si no existe instancia', () => {
      expect(instanceManager.getStatus('non_existent')).toBeNull();
    });
  });

  describe('per-instance message loop', () => {
    it('test_instance_upsert_loop_forwards_and_replies', async () => {
      await instanceManager.createInstance('user_a', '+54911111111');
      const instanceA = instanceManager.getInstance('user_a');

      const forwardSpy = jest.spyOn(messageService, 'forwardToOrchestrator').mockResolvedValue({
        success: true,
        data: { text: '¡Hola! Soy la IA' }
      });
      const sendSpy = jest.spyOn(instanceA, 'sendTextMessage').mockResolvedValue({});

      instanceA.emit('messages.upsert', notifyUpsert);
      await flushAsync();

      expect(forwardSpy).toHaveBeenCalledTimes(1);
      expect(forwardSpy.mock.calls[0][0].ownerUserId).toBe('user_a');
      expect(sendSpy).toHaveBeenCalledWith(
        '5491122334455@s.whatsapp.net',
        '¡Hola! Soy la IA'
      );
    });

    it('test_instance_reply_stays_on_owning_socket', async () => {
      await instanceManager.createInstance('user_a', '+54911111111');
      await instanceManager.createInstance('user_b', '+54922222222');

      const instanceA = instanceManager.getInstance('user_a');
      const instanceB = instanceManager.getInstance('user_b');

      jest.spyOn(messageService, 'forwardToOrchestrator').mockResolvedValue({
        success: true,
        data: { text: 'reply-a' }
      });
      const sendA = jest.spyOn(instanceA, 'sendTextMessage').mockResolvedValue({});
      const sendB = jest.spyOn(instanceB, 'sendTextMessage').mockResolvedValue({});

      instanceA.emit('messages.upsert', notifyUpsert);
      await flushAsync();

      expect(sendA).toHaveBeenCalledWith('5491122334455@s.whatsapp.net', 'reply-a');
      expect(sendB).not.toHaveBeenCalled();
    });
  });
});
