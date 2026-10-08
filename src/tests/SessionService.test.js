import { expect, describe, it, jest } from '@jest/globals';
import sessionService from '../services/SessionService.js';
import fs from 'fs';
import path from 'path';

describe('SessionService', () => {
  it('debe crear el directorio de sesión si no existe', async () => {
    const testPath = './test_storage';
    sessionService.sessionPath = testPath;

    if (fs.existsSync(testPath)) {
      fs.rmSync(testPath, { recursive: true });
    }

    await sessionService.getAuthState();
    
    expect(fs.existsSync(testPath)).toBe(true);

    // Limpiar
    fs.rmSync(testPath, { recursive: true });
  });
});
