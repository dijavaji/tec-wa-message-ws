import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import config from '../config/index.js';
import logger from '../config/logger.js';
import fs from 'fs';
import path from 'path';

class SessionService {
  constructor() {
    this.sessionPath = config.sessionPath;
  }

  /**
   * Obtiene el estado de autenticación para un userId específico
   * @param {string} userId - ID del usuario
   * @returns {Promise<{state: object, saveCreds: function}>}
   */
  async getAuthState(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId es requerido y debe ser un string');
    }

    try {
      // Asegurar directorio del usuario: storage/{userId}/auth_info_baileys/
      const userAuthPath = path.join(this.sessionPath, userId, 'auth_info_baileys');
      await this._ensureUserDirectory(userId);

      logger.debug({ userId, userAuthPath }, 'Obteniendo estado de autenticación');

      return await useMultiFileAuthState(userAuthPath);
    } catch (error) {
      logger.error({ userId, error }, 'Error inicializando el estado de autenticación');
      throw error;
    }
  }

  /**
   * Guarda credenciales para un userId específico (se llama automáticamente por Baileys)
   * @param {string} userId - ID del usuario
   * @param {object} creds - Credenciales a guardar
   */
  async saveCreds(userId, creds) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId es requerido y debe ser un string');
    }

    if (!creds) {
      throw new Error('creds es requerido');
    }

    try {
      const userAuthPath = path.join(this.sessionPath, userId, 'auth_info_baileys');
      await this._ensureUserDirectory(userId);

      // Baileys ya se encarga de escribir los archivos en el directorio
      // Este método puede usarse para lógica adicional si es necesario
      logger.debug({ userId }, 'Credenciales guardadas (Baileys handle)');
    } catch (error) {
      logger.error({ userId, error }, 'Error guardando credenciales');
      throw error;
    }
  }

  /**
   * Borra la sesión de un usuario específico
   * @param {string} userId - ID del usuario
   */
  async clearSession(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId es requerido y debe ser un string');
    }

    try {
      const userAuthPath = path.join(this.sessionPath, userId, 'auth_info_baileys');
      
      if (fs.existsSync(userAuthPath)) {
        fs.rmSync(userAuthPath, { recursive: true, force: true });
        logger.info({ userId }, 'Sesión borrada exitosamente');
      } else {
        logger.warn({ userId }, 'Intento de borrar sesión que no existe');
      }
    } catch (error) {
      logger.error({ userId, error }, 'Error borrando sesión');
      throw error;
    }
  }

  /**
   * Verifica si existe una sesión para un userId
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>}
   */
  async sessionExists(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId es requerido y debe ser un string');
    }

    try {
      const userAuthPath = path.join(this.sessionPath, userId, 'auth_info_baileys');
      return fs.existsSync(userAuthPath);
    } catch (error) {
      logger.error({ userId, error }, 'Error verificando existencia de sesión');
      return false;
    }
  }

  /**
   * Crea el directorio del usuario si no existe
   * @param {string} userId - ID del usuario
   * @private
   */
  async _ensureUserDirectory(userId) {
    const userSessionPath = path.join(this.sessionPath, userId);
    
    if (!fs.existsSync(userSessionPath)) {
      fs.mkdirSync(userSessionPath, { recursive: true });
      logger.debug({ userId, userSessionPath }, 'Directorio de usuario creado');
    }

    const userAuthPath = path.join(userSessionPath, 'auth_info_baileys');
    
    if (!fs.existsSync(userAuthPath)) {
      fs.mkdirSync(userAuthPath, { recursive: true });
      logger.debug({ userId, userAuthPath }, 'Directorio auth_info_baileys creado');
    }
  }

  /**
   * Lista userIds con sesión persistida (creds.json presente).
   * No carga el auth state en memoria: eso lo hace BaileysService.init().
   * @returns {string[]}
   */
  listPersistedUserIds() {
    try {
      if (!fs.existsSync(this.sessionPath)) {
        return [];
      }

      return fs
        .readdirSync(this.sessionPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((userId) => {
          const credsPath = path.join(
            this.sessionPath,
            userId,
            'auth_info_baileys',
            'creds.json'
          );
          return fs.existsSync(credsPath);
        });
    } catch (error) {
      logger.error({ error }, 'Error listando sesiones persistidas');
      throw error;
    }
  }

  /**
   * Lee me.id / me.lid desde creds.json de un usuario.
   * @param {string} userId
   * @returns {{ id?: string, lid?: string, name?: string } | null}
   */
  readMeFromCreds(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId es requerido y debe ser un string');
    }

    try {
      const credsPath = path.join(
        this.sessionPath,
        userId,
        'auth_info_baileys',
        'creds.json'
      );

      if (!fs.existsSync(credsPath)) {
        return null;
      }

      const creds = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
      if (!creds?.me) {
        return null;
      }

      return {
        id: creds.me.id,
        lid: creds.me.lid,
        name: creds.me.name
      };
    } catch (error) {
      logger.error({ userId, error }, 'Error leyendo me desde creds.json');
      return null;
    }
  }

}

export default new SessionService();
