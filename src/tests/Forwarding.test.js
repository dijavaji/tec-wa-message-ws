import { expect, describe, it, jest, beforeEach } from '@jest/globals';
import messageService from '../services/MessageService.js';
import MessageDTO from '../dto/MessageDTO.js';
import axiosClient from '../config/axios.js';

// En ESM, el mocking de Jest funciona diferente. Usaremos spyOn en el cliente ya importado.
describe('MessageService Forwarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe enviar el payload correcto al orquestador', async () => {
    const dto = new MessageDTO({
      id: 'abc',
      remoteJid: '5491122334455@s.whatsapp.net',
      pushName: 'Diego',
      messageType: 'conversation',
      content: 'Hola bot',
      timestamp: 123456789,
      device: 'web',
      isGroup: false
    });

    const postSpy = jest.spyOn(axiosClient, 'post').mockResolvedValue({ 
      status: 200, 
      data: { success: true } 
    });

    await messageService.forwardToOrchestrator(dto);

    expect(postSpy).toHaveBeenCalledWith('/api/v1/messages', {
      senderId: '5491122334455',
      text: 'Hola bot',
      assistantName: 'tec_praxis_InnovaBot',
      createdBy: 'app-wps'
    });
    
    postSpy.mockRestore();
  });

  it('debe loguear error cuando el orquestador falla', async () => {
    const dto = new MessageDTO({
      id: 'abc',
      remoteJid: '5491122334455@s.whatsapp.net',
      pushName: 'Diego',
      messageType: 'conversation',
      content: 'Error test',
      timestamp: 123456789,
      device: 'web',
      isGroup: false
    });

    const postSpy = jest.spyOn(axiosClient, 'post').mockRejectedValue({
      response: { status: 500, data: 'Internal Server Error' }
    });

    await expect(messageService.forwardToOrchestrator(dto)).resolves.not.toThrow();
    expect(postSpy).toHaveBeenCalled();
    
    postSpy.mockRestore();
  });
});
