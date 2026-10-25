import crypto from 'crypto';

/**
 * Middleware para caching HTTP con ETag
 * Reduce ancho de banda ~90% en polling de QR
 */
const etagMiddleware = async (req, res, next) => {
  // Solo aplicar a requests GET que tengan userId
  if (req.method !== 'GET' || !req.params.userId) {
    return next();
  }

  // Solo aplicar a endpoint de QR
  if (!req.path.includes('/qr')) {
    return next();
  }

  // Obtener QR actual
  const controller = (await import('../controllers/WhatsAppController.js')).default;
  const qrData = await controller.getQR(req.params.userId);

  if (!qrData) {
    return res.status(204).send();
  }

  // Generar hash SHA-256 del QR
  const currentHash = crypto.createHash('sha256')
    .update(qrData.qrBase64)
    .digest('hex');

  // Establecer ETag header
  res.set('ETag', currentHash);

  // Verificar If-None-Match header del cliente
  const clientETag = req.headers['if-none-match'];

  if (clientETag && clientETag === currentHash) {
    // QR no ha cambiado - respuesta 304 Not Modified
    return res.status(304).send();
  }

  // QR cambió - continuar con response normal
  next();
};

export default etagMiddleware;
