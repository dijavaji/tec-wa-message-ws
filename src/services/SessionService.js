import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import config from '../config/index.js';
import logger from '../config/logger.js';
import fs from 'fs';

class SessionService {
  constructor() {
    this.sessionPath = config.sessionPath;
  }

  async getAuthState() {
    try {
      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
        logger.info(`Directorio de sesión creado en: ${this.sessionPath}`);
      }
      return await useMultiFileAuthState(this.sessionPath);
    } catch (error) {
      logger.error('Error inicializando el estado de autenticación:', error);
      throw error;
    }
  }
}

export default new SessionService();
