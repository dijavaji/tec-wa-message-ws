import logger from '../config/logger.js';
import BaileysService from './BaileysService.js';

class InstanceManager {
  constructor() {
    this.instances = new Map();
  }

  async createInstance(instanceId) {
    if (this.instances.has(instanceId)) {
      const existing = this.instances.get(instanceId);
      if (existing.status === 'open' || existing.status === 'connecting') {
        const error = new Error(`Instancia ${instanceId} ya existe y está activa`);
        error.status = 409;
        throw error;
      }
      // Si existe pero está cerrada, la removemos para crear una nueva
      this.instances.delete(instanceId);
    }

    logger.info({ instanceId }, 'Creando nueva instancia de WhatsApp');
    const service = new BaileysService(instanceId);
    
    // Almacenamos inmediatamente para evitar colisiones en peticiones paralelas
    this.instances.set(instanceId, service);

    try {
      await service.init();
      return service;
    } catch (error) {
      this.instances.delete(instanceId);
      logger.error({ instanceId, error }, 'Error al inicializar instancia');
      throw error;
    }
  }

  getInstance(instanceId) {
    return this.instances.get(instanceId);
  }

  getAllInstances() {
    return Array.from(this.instances.keys());
  }

  async removeInstance(instanceId) {
    const service = this.instances.get(instanceId);
    if (service) {
      logger.info({ instanceId }, 'Removiendo instancia de WhatsApp');
      if (service.sock) {
        service.sock.logout();
        service.sock.end();
      }
      this.instances.delete(instanceId);
    }
  }
}

export default new InstanceManager();