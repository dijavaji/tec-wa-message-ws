import { EventEmitter } from 'events';
import MessageDTO from '../dto/MessageDTO.js';
import logger from '../config/logger.js';
import axiosClient from '../config/axios.js';
import instanceManager from './InstanceManager.js';

class MessageService extends EventEmitter {
  constructor() {
    super();
  }

  async handleIncomingMessage(msg) {
    if (!msg.message || msg.key.fromMe) return;

    try {
      const normalized = MessageDTO.fromBaileys(msg);
      logger.debug({ msgId: normalized.id }, 'Mensaje normalizado');
      
      const response = await this.forwardToOrchestrator(normalized);
      
      if (response?.success && response?.data?.text) {
        const instanceId = 'default'; // Por ahora usamos default o lo extraemos de algún lado
        const service = instanceManager.getInstance(instanceId);
        if (service) {
          await service.sendTextMessage(normalized.remoteJid, response.data.text);
        }
      }
    } catch (error) {
      logger.error({ error, msg }, 'Error procesando mensaje entrante');
    }
  }

  handleUpsert(upsert) {
    const { messages, type } = upsert;
    
    if (type !== 'notify') return;

    for (const msg of messages) {
      this.handleIncomingMessage(msg);
    }
  }

  async forwardToOrchestrator(messageDTO) {
    const payload = messageDTO.toOrchestrator();
    
    try {
      logger.info({ msgId: messageDTO.id, payload }, 'Enviando mensaje al orquestador');
      const response = await axiosClient.post('/api/v1/messages', payload);
      logger.info({ msgId: messageDTO.id, status: response.status }, 'Mensaje enviado exitosamente');
      return response.data;
    } catch (error) {
      if (error.response) {
        logger.error({ 
          msgId: messageDTO.id, 
          status: error.response.status, 
          data: error.response.data 
        }, 'Error de respuesta del orquestador');
      } else {
        logger.error({ 
          msgId: messageDTO.id, 
          error: error.message 
        }, 'Error de red al conectar con el orquestador');
      }
    }
  }
}

export default new MessageService();
