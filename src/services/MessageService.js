import { EventEmitter } from 'events';
import MessageDTO from '../dto/MessageDTO.js';
import logger from '../config/logger.js';
import axiosClient from '../config/axios.js';

class MessageService extends EventEmitter {
  constructor() {
    super();
  }

  handleUpsert(upsert) {
    const { messages, type } = upsert;
    
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      try {
        const normalized = MessageDTO.fromBaileys(msg);
        logger.debug({ msgId: normalized.id }, 'Mensaje normalizado');
        this.emit('message', normalized);
      } catch (error) {
        logger.error({ error, msg }, 'Error normalizando mensaje');
      }
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

  async enviarRespuesta(to, texto) {
    try {
      await this.sock.sendMessage(to, { text: texto });
      logger.info('✉️ Mensaje enviado a:', to);
    } catch (error) {
      logger.error('❌ Error enviando mensaje:', error);
    }
  }

}

export default new MessageService();
