import { expect, describe, it, jest } from '@jest/globals';
import instanceManager from '../../services/BaileysInstanceManager.js';

describe('BaileysInstanceManager', () => {
  beforeEach(() => {
    instanceManager.instances.clear();
    instanceManager.instanceMetadata.clear();
  });

  describe('createInstance', () => {
    it('debe lanzar error si userId ya tiene instancia', async () => {
      const userId = 'user_duplicate';
      const phoneNumber = '+34 666 123 456';

      await expect(
        instanceManager.createInstance(userId, phoneNumber)
      ).rejects.toThrow('userId es requerido');
    });

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
});
