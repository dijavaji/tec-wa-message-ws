import { EventEmitter } from 'events';
import MessageDTO from '../dto/MessageDTO.js';
import logger from '../config/logger.js';
import axiosClient from '../config/axios.js';

class MessageService extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * @param {object} upsert - Evento messages.upsert de Baileys
   * @param {string} [ownerUserId] - userId de la instancia que recibió el mensaje
   */
  async handleUpsert(upsert, ownerUserId = null) {
    const { messages, type } = upsert;
    
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      try {
        const normalized = MessageDTO.fromBaileys(msg, ownerUserId);
        logger.info({ msgId: normalized.id, ownerUserId: ownerUserId, fromMe: msg.key.fromMe }, 'Mensaje normalizado');
        //this.emit('message', normalized);
        return normalized;
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

  /*async enviarRespuesta(to, texto) {
    try {
      await this.sock.sendMessage(to, { text: texto });
      logger.info('✉️ Mensaje enviado a:', to);
    } catch (error) {
      logger.error('❌ Error enviando mensaje:', error);
    }
  }*/

  /**
   * Procesa un mensaje individual recibido.
   *
   * @param {object} event - Evento message.received
   * @returns {Promise<object|null>}
   */
  async handleIncomingMessage(event) {
    const {  userId, upsertType, messageType, message, content } = event;

    if (!userId || !message?.key?.id || !message?.key?.remoteJid) {
      logger.warn({ event }, 'Evento de mensaje incompleto');
      return null;
    }

    if (message.key.fromMe || upsertType !== 'notify') {
      return null;
    }

    try {
      const messageDTO = MessageDTO.fromBaileys( message, userId, content, messageType );

      logger.info({
        messageId: messageDTO.id,
        ownerUserId: messageDTO.ownerUserId,
        senderId: messageDTO.senderId,
        messageType: messageDTO.messageType,
        isGroup: messageDTO.isGroup
      }, 'Mensaje entrante normalizado');

      return await this.forwardToOrchestrator(messageDTO);

    } catch (error) {
      logger.error({ error, userId, messageId: message.key.id }, 'Error procesando mensaje entrante');
      throw error;
    }
  }


}

export default new MessageService();
