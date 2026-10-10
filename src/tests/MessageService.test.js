import { expect, jest, describe, it } from '@jest/globals';
import messageService from '../services/MessageService.js';
import MessageDTO from '../dto/MessageDTO.js';

describe('MessageService', () => {
  it('debe normalizar correctamente un mensaje de texto de Baileys', (done) => {
    const rawMsg = {
      messages: [{
        key: { id: '123', remoteJid: '5491122334455@s.whatsapp.net' },
        pushName: 'Diego',
        message: { conversation: 'Hola bot' },
        messageTimestamp: 1678901234
      }],
      type: 'notify'
    };

    messageService.once('message', (normalized) => {
      expect(normalized).toBeInstanceOf(MessageDTO);
      expect(normalized.id).toBe('123');
      expect(normalized.content).toBe('Hola bot');
      expect(normalized.pushName).toBe('Diego');
      done();
    });

    messageService.handleUpsert(rawMsg);
  });

  it('debe ignorar mensajes enviados por mí', () => {
    const emitSpy = jest.spyOn(messageService, 'emit');
    const rawMsg = {
      messages: [{
        key: { id: '124', remoteJid: '5491122334455@s.whatsapp.net', fromMe: true },
        message: { conversation: 'Mensaje saliente' }
      }],
      type: 'notify'
    };

    messageService.handleUpsert(rawMsg);
    expect(emitSpy).not.toHaveBeenCalledWith('message', expect.anything());
  });
});
