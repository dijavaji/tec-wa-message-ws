import { expect, jest, describe, it } from '@jest/globals';
import messageService from '../services/MessageService.js';
import MessageDTO from '../dto/MessageDTO.js';

const notifyUpsert = (overrides = {}) => ({
  messages: [{
    key: { id: '123', remoteJid: '5491122334455@s.whatsapp.net', ...(overrides.key || {}) },
    pushName: 'Max',
    message: { conversation: 'Hola bot' },
    messageTimestamp: 1678901234,
    ...overrides.msg
  }],
  type: 'notify'
});

describe('MessageService', () => {
  it('test_handle_upsert_returns_dto', async () => {
    const normalized = await messageService.handleUpsert(notifyUpsert(), 'user_100');

    expect(normalized).toBeInstanceOf(MessageDTO);
    expect(normalized.id).toBe('123');
    expect(normalized.content).toBe('Hola bot');
    expect(normalized.pushName).toBe('Max');
    expect(normalized.ownerUserId).toBe('user_100');
  });

  it('test_handle_upsert_does_not_emit_message', async () => {
    const emitSpy = jest.spyOn(messageService, 'emit');

    await messageService.handleUpsert(notifyUpsert(), 'user_100');

    expect(emitSpy).not.toHaveBeenCalledWith('message', expect.anything());
    emitSpy.mockRestore();
  });

  it('test_handle_upsert_ignores_from_me', async () => {
    const emitSpy = jest.spyOn(messageService, 'emit');

    const result = await messageService.handleUpsert(
      notifyUpsert({ key: { fromMe: true } }),
      'user_100'
    );

    expect(result).toBeUndefined();
    expect(emitSpy).not.toHaveBeenCalledWith('message', expect.anything());
    emitSpy.mockRestore();
  });
});
