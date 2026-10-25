import { expect, describe, it, jest } from '@jest/globals';
import etagMiddleware from '../../middleware/etagMiddleware.js';
import controller from '../../controllers/WhatsAppController.js';

describe('Integration: QR Polling Cache', () => {
  let mockGetQR;
  let mockController;

  beforeEach(() => {
    mockGetQR = jest.fn();
    
    mockController = {
      getQR: mockGetQR
    };

    jest.mock('../../controllers/WhatsAppController.js', () => ({
      default: mockController
    }));
  });

  it('debe retornar 304 Not Modified cuando QR no ha cambiado', async () => {
    const req = {
      method: 'GET',
      path: '/instances/user1/qr',
      params: { userId: 'user1' },
      headers: { 'if-none-match': 'abc123hash' }
    };

    const res = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    const next = jest.fn();

    // Simular QR con el mismo hash
    mockGetQR.mockResolvedValue({
      qrBase64: 'some-qrcode-data',
      mimeType: 'image/png'
    });

    // Sobrescribir función getLatestQR del módulo QRService
    jest.doMock('../../services/QRService.js', () => ({
      default: {
        getLatestQR: () => ({
          qrBase64: 'some-qrcode-data',
          hash: 'abc123hash'
        })
      }
    }));

    const etagMiddlewareImport = await import('../../middleware/etagMiddleware.js');
    const etagMiddlewareInstance = etagMiddlewareImport.default;

    await etagMiddlewareInstance(req, res, next);

    expect(res.status).toHaveBeenCalledWith(304);
    expect(res.send).toHaveBeenCalled();
  });

  it('debe retornar 200 OK cuando QR cambió', async () => {
    const req = {
      method: 'GET',
      path: '/instances/user1/qr',
      params: { userId: 'user1' },
      headers: { 'if-none-match': 'oldhash123' }
    };

    const res = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    // Simular QR con hash diferente
    mockGetQR.mockResolvedValue({
      qrBase64: 'new-qrcode-data',
      mimeType: 'image/png'
    });

    jest.doMock('../../services/QRService.js', () => ({
      default: {
        getLatestQR: () => ({
          qrBase64: 'new-qrcode-data',
          hash: 'newhash456'
        })
      }
    }));

    const etagMiddlewareImport = await import('../../middleware/etagMiddleware.js');
    const etagMiddlewareInstance = etagMiddlewareImport.default;

    await etagMiddlewareInstance(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  it('debe retornar 204 cuando no hay QR disponible', async () => {
    const req = {
      method: 'GET',
      path: '/instances/user1/qr',
      params: { userId: 'user1' },
      headers: {}
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    const next = jest.fn();

    mockGetQR.mockResolvedValue(null);

    const etagMiddlewareImport = await import('../../middleware/etagMiddleware.js');
    const etagMiddlewareInstance = etagMiddlewareImport.default;

    await etagMiddlewareInstance(req, res, next);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
