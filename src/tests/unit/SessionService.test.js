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
});
