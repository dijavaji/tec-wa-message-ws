import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import config from '../config/index.js';
import logger from '../config/logger.js';
import fs from 'fs';
import path from 'path';

class SessionService {
  constructor(instanceId = 'default') {
    this.instanceId = instanceId;
    this.sessionPath = path.join(config.sessionPath, 'sessions', instanceId);
  }

  async getAuthState() {
    try {
      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
        logger.info(`Directorio de sesión creado para ${this.instanceId} en: ${this.sessionPath}`);
      }
      return await useMultiFileAuthState(this.sessionPath);
    } catch (error) {
      logger.error(`Error inicializando el estado de autenticación para ${this.instanceId}:`, error);
      throw error;
    }
  }
}

export default SessionService;
