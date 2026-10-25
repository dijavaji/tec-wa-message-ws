import { expect, describe, it } from '@jest/globals';
import BaileysService from '../../services/BaileysService.js';

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
});
