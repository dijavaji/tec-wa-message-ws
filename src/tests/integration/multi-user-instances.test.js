import { expect, describe, it, jest } from '@jest/globals';
import instanceManager from '../../services/BaileysInstanceManager.js';

describe('Integration: Multi-User Instances', () => {
  beforeEach(() => {
    instanceManager.instances.clear();
    instanceManager.instanceMetadata.clear();
  });

  it('debe crear instancias independientes para múltiples usuarios', async () => {
    const userIdA = 'user_integration_a';
    const userIdB = 'user_integration_b';
    const phoneA = '+34 666 111 111';
    const phoneB = '+34 666 222 222';

    // Mock de BaileysService
    jest.doMock('../../services/BaileysService.js', () => {
      return class MockBaileysService {
        constructor(uId) { this.userId = uId; }
        async init() { return null; }
        async close() {}
        on(event, handler) {
          this._listeners = this._listeners || {};
          this._listeners[event] = this._listeners[event] || [];
          this._listeners[event].push(handler);
        }
        emit(event, data) {
          if (this._listeners && this._listeners[event]) {
            this._listeners[event].forEach(fn => fn(data));
          }
        }
        removeAllListeners() {}
      };
    });

    const BaileysServiceMock = (await import('../../services/BaileysService.js')).default;
    instanceManager.BaileysService = BaileysServiceMock;

    // Crear instancia para usuario A
    await instanceManager.createInstance(userIdA, phoneA);
    
    // Crear instancia para usuario B
    await instanceManager.createInstance(userIdB, phoneB);

    // Verificar que ambas instancias existen
    const instanceA = instanceManager.getInstance(userIdA);
    const instanceB = instanceManager.getInstance(userIdB);

    expect(instanceA).toBeDefined();
    expect(instanceB).toBeDefined();
    expect(instanceA.userId).toBe(userIdA);
    expect(instanceB.userId).toBe(userIdB);

    // Verificar que son instancias diferentes
    expect(instanceA).not.toBe(instanceB);
  });

  it('debe mantener aislamiento de estados entre usuarios', async () => {
    const userIdA = 'user_isolation_a';
    const userIdB = 'user_isolation_b';

    // Mock de BaileysService
    jest.doMock('../../services/BaileysService.js', () => {
      return class MockBaileysService {
        constructor(uId) { this.userId = uId; }
        async init() { return null; }
        async close() {}
        on(event, handler) {
          this._listeners = this._listeners || {};
          this._listeners[event] = this._listeners[event] || [];
          this._listeners[event].push(handler);
        }
        emit(event, data) {
          if (this._listeners && this._listeners[event]) {
            this._listeners[event].forEach(fn => fn(data));
          }
        }
        removeAllListeners() {}
      };
    });

    const BaileysServiceMock = (await import('../../services/BaileysService.js')).default;
    instanceManager.BaileysService = BaileysServiceMock;

    await instanceManager.createInstance(userIdA, '+34 666 111 111');
    await instanceManager.createInstance(userIdB, '+34 666 222 222');

    // Simular eventos independientes
    const instanceA = instanceManager.getInstance(userIdA);
    const instanceB = instanceManager.getInstance(userIdB);

    // Usuario A genera QR
    if (instanceA && instanceA.emit) {
      instanceA.emit('qr', 'qr-data-for-a');
    }

    // Usuario B genera QR diferente
    if (instanceB && instanceB.emit) {
      instanceB.emit('qr', 'qr-data-for-b');
    }

    // Verificar que el estado de B no se vio afectado
    expect(instanceManager.getStatus(userIdA)).toBe('waiting_scan');
    expect(instanceManager.getStatus(userIdB)).toBe('waiting_scan');
  });

  it('debe permitir eliminar instancia de un usuario sin afectar a otros', async () => {
    const userIdA = 'user_delete_a';
    const userIdB = 'user_delete_b';

    // Mock de BaileysService
    jest.doMock('../../services/BaileysService.js', () => {
      return class MockBaileysService {
        constructor(uId) { this.userId = uId; }
        async init() { return null; }
        async close() {}
        on(event, handler) {
          this._listeners = this._listeners || {};
          this._listeners[event] = this._listeners[event] || [];
          this._listeners[event].push(handler);
        }
        emit(event, data) {
          if (this._listeners && this._listeners[event]) {
            this._listeners[event].forEach(fn => fn(data));
          }
        }
        removeAllListeners() {}
      };
    });

    const BaileysServiceMock = (await import('../../services/BaileysService.js')).default;
    instanceManager.BaileysService = BaileysServiceMock;

    await instanceManager.createInstance(userIdA, '+34 666 111 111');
    await instanceManager.createInstance(userIdB, '+34 666 222 222');

    // Verificar ambas existen
    expect(instanceManager.hasInstance(userIdA)).toBe(true);
    expect(instanceManager.hasInstance(userIdB)).toBe(true);

    // Eliminar instancia de A
    await instanceManager.deleteInstance(userIdA);

    // Verificar que A fue eliminada pero B sigue
    expect(instanceManager.hasInstance(userIdA)).toBe(false);
    expect(instanceManager.hasInstance(userIdB)).toBe(true);
  });
});
