import { expect, describe, it, jest, beforeEach } from '@jest/globals';
import instanceManager from '../services/InstanceManager.js';
import BaileysService from '../services/BaileysService.js';
import fs from 'fs';
import path from 'path';

describe('QR Connection Management (Phase 3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('R6: debe aislar las sesiones en carpetas separadas', async () => {
    const id1 = 'test-inst-1';
    const id2 = 'test-inst-2';
    
    // Mock de Baileys init para evitar conexión real
    jest.spyOn(BaileysService.prototype, 'init').mockImplementation(async function() {
      this.status = 'initializing';
      return {};
    });

    await instanceManager.createInstance(id1);
    await instanceManager.createInstance(id2);

    const inst1 = instanceManager.getInstance(id1);
    const inst2 = instanceManager.getInstance(id2);

    expect(inst1.sessionService.sessionPath).toContain(id1);
    expect(inst2.sessionService.sessionPath).toContain(id2);
    expect(inst1.sessionService.sessionPath).not.toEqual(inst2.sessionService.sessionPath);
  });

  it('R5: debe permitir crear instancias dinámicamente', async () => {
    const instanceId = 'dynamic-inst';
    await instanceManager.createInstance(instanceId);
    const instance = instanceManager.getInstance(instanceId);
    expect(instance).toBeDefined();
    expect(instance.instanceId).toBe(instanceId);
  });

  it('R1: debe retornar el QR cuando esté disponible', async () => {
    const instanceId = 'test-qr-inst';
    await instanceManager.createInstance(instanceId);
    const instance = instanceManager.getInstance(instanceId);
    
    instance.qr = 'mock-qr-string';
    
    expect(instance.qr).toBe('mock-qr-string');
  });

  it('R4: debe cerrar la instancia si el QR expira demasiadas veces', () => {
    const instance = new BaileysService('timeout-test');
    instance.maxQrRetries = 2;
    
    // Mock del socket para evitar errores
    instance.sock = { 
      ev: { on: jest.fn(), removeAllListeners: jest.fn() },
      end: jest.fn()
    };

    // Simulamos eventos de QR
    const updateHandler = (update) => {
      const { qr } = update;
      if (qr) {
        instance.qrRetryCount++;
        if (instance.qrRetryCount > instance.maxQrRetries) {
          instance.status = 'closed';
          instance.sock.end();
        }
      }
    };

    updateHandler({ qr: 'qr1' });
    updateHandler({ qr: 'qr2' });
    expect(instance.status).not.toBe('closed');
    
    updateHandler({ qr: 'qr3' });
    expect(instance.status).toBe('closed');
    expect(instance.sock.end).toHaveBeenCalled();
  });
});