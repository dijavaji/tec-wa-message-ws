import express from 'express';
import controller from '../controllers/WhatsAppController.js';

const router = express.Router();

// POST /instances - Crear nueva instancia
router.post('/instances', async (req, res, next) => {
  console.log(req.body);
  try {
    const { userId, phoneNumber } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Campo requerido',
        field: 'userId'
      });
    }

    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Campo requerido',
        field: 'phoneNumber'
      });
    }

    const result = await controller.createInstance(userId, phoneNumber);

    res.status(201).json({
      instanceId: result.instanceId,
      userId,
      status: result.status,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// GET /instances/:userId/qr - Obtener QR code
router.get('/instances/:userId/qr', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const qrData = await controller.getQR(userId);

    if (!qrData) {
      return res.status(204).send();
    }

    res.status(200).json(qrData);
  } catch (error) {
    next(error);
  }
});

// GET /instances/:userId/status - Obtener estado
router.get('/instances/:userId/status', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await controller.getStatus(userId);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /instances/:userId - Eliminar instancia
router.delete('/instances/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    await controller.deleteInstance(userId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
