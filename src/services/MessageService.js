import { EventEmitter } from 'events';
import MessageDTO from '../dto/MessageDTO.js';
import logger from '../config/logger.js';

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
}

export default new MessageService();
