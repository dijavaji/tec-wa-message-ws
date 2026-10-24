import { expect, describe, it, jest, beforeEach } from '@jest/globals';
import messageService from '../services/MessageService.js';
import baileysService from '../services/BaileysService.js';
import MessageDTO from '../dto/MessageDTO.js';
import axiosClient from '../config/axios.js';

describe('Full Flow Integration (WA -> Orchestrator -> WA)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe completar el ciclo de recibir, forward y responder', async () => {
    const dto = new MessageDTO({
      id: 'flow-123',
      remoteJid: '5491122334455@s.whatsapp.net',
      pushName: 'Diego',
      messageType: 'conversation',
      content: 'Hola bot',
      timestamp: Date.now(),
      device: 'web',
      isGroup: false
    });

    // Usar spyOn en lugar de jest.mock para compatibilidad ESM simple
    const postSpy = jest.spyOn(axiosClient, 'post').mockResolvedValue({ 
      status: 200, 
      data: { 
        success: true, 
        data: { text: '¡Hola! Soy la IA' } 
      } 
    });

    const sendSpy = jest.spyOn(baileysService, 'sendTextMessage').mockResolvedValue({ key: { id: 'resp-123' } });

    const response = await messageService.forwardToOrchestrator(dto);
    
    if (response?.success && response?.data?.text) {
      await baileysService.sendTextMessage(dto.remoteJid, response.data.text);
    }

    expect(postSpy).toHaveBeenCalled();
    expect(sendSpy).toHaveBeenCalledWith(dto.remoteJid, '¡Hola! Soy la IA');

    postSpy.mockRestore();
    sendSpy.mockRestore();
  });

  it('no debe enviar mensaje si el orquestador falla', async () => {
    const dto = new MessageDTO({
      id: 'flow-fail',
      remoteJid: '5491122334455@s.whatsapp.net',
      content: 'Fallo'
    });

    const postSpy = jest.spyOn(axiosClient, 'post').mockResolvedValue({ 
      status: 200, 
      data: { success: false } 
    });

    const sendSpy = jest.spyOn(baileysService, 'sendTextMessage');

    const response = await messageService.forwardToOrchestrator(dto);
    if (response?.success && response?.data?.text) {
      await baileysService.sendTextMessage(dto.remoteJid, response.data.text);
    }

    expect(sendSpy).not.toHaveBeenCalled();

    postSpy.mockRestore();
    sendSpy.mockRestore();
  });
});
