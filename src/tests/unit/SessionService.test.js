import { expect, describe, it } from '@jest/globals';
import sessionService from '../../services/SessionService.js';
import fs from 'fs';
import path from 'path';

describe('SessionService (Multi-User)', () => {
  const testBasePath = './test_multi_user_storage';

  beforeEach(() => {
    if (fs.existsSync(testBasePath)) {
      fs.rmSync(testBasePath, { recursive: true });
    }
    sessionService.sessionPath = testBasePath;
  });

  afterAll(() => {
    if (fs.existsSync(testBasePath)) {
      fs.rmSync(testBasePath, { recursive: true });
    }
  });

  describe('getAuthState', () => {
    it('debe lanzar error si userId es inválido', async () => {
      await expect(sessionService.getAuthState(null)).rejects.toThrow('userId es requerido');
      await expect(sessionService.getAuthState(123)).rejects.toThrow('userId es requerido');
    });
  });

  describe('saveCreds', () => {
    it('debe lanzar error si userId es inválido', async () => {
      await expect(sessionService.saveCreds(null, {})).rejects.toThrow('userId es requerido');
    });

    it('debe lanzar error si creds es null', async () => {
      await expect(sessionService.saveCreds('user_test', null)).rejects.toThrow('creds es requerido');
    });
  });

  describe('clearSession', () => {
    it('debe lanzar error si userId es inválido', async () => {
      await expect(sessionService.clearSession(null)).rejects.toThrow('userId es requerido');
    });
  });

  describe('sessionExists', () => {
    it('debe lanzar error si userId es inválido', async () => {
      await expect(sessionService.sessionExists(null)).rejects.toThrow('userId es requerido');
    });
  });

  describe('listPersistedUserIds', () => {
    it('debe retornar vacío si no existe el directorio base', () => {
      expect(sessionService.listPersistedUserIds()).toEqual([]);
    });

    it('debe listar solo userIds con creds.json', () => {
      const userWithCreds = 'user_ok';
      const userWithoutCreds = 'user_empty';

      fs.mkdirSync(path.join(testBasePath, userWithCreds, 'auth_info_baileys'), { recursive: true });
      fs.writeFileSync(
        path.join(testBasePath, userWithCreds, 'auth_info_baileys', 'creds.json'),
        JSON.stringify({ me: { id: '593111111111:1@s.whatsapp.net' } })
      );
      fs.mkdirSync(path.join(testBasePath, userWithoutCreds, 'auth_info_baileys'), { recursive: true });

      expect(sessionService.listPersistedUserIds()).toEqual([userWithCreds]);
    });
  });

  describe('readMeFromCreds', () => {
    it('debe lanzar error si userId es inválido', () => {
      expect(() => sessionService.readMeFromCreds(null)).toThrow('userId es requerido');
    });

    it('debe retornar null si no hay creds', () => {
      expect(sessionService.readMeFromCreds('missing_user')).toBeNull();
    });

    it('debe leer me.id y me.lid desde creds.json', () => {
      const userId = 'user_me';
      fs.mkdirSync(path.join(testBasePath, userId, 'auth_info_baileys'), { recursive: true });
      fs.writeFileSync(
        path.join(testBasePath, userId, 'auth_info_baileys', 'creds.json'),
        JSON.stringify({
          me: {
            id: '593963037426:27@s.whatsapp.net',
            lid: '220701927690307:27@lid',
            name: 'technoloqie'
          }
        })
      );

      expect(sessionService.readMeFromCreds(userId)).toEqual({
        id: '593963037426:27@s.whatsapp.net',
        lid: '220701927690307:27@lid',
        name: 'technoloqie'
      });
    });
  });
});
