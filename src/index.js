import express from 'express';
import config from './config/index.js';
import logger from './config/logger.js';
import instanceManager from './services/InstanceManager.js';

const app = express();
const PORT = config.port;

app.use(express.json());

// Middleware de logs
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), instances: instanceManager.getAllInstances() });
});

// API para gestión de instancias
app.post('/api/whatsapp/instance', async (req, res) => {
  const { instanceId } = req.body;
  if (!instanceId) return res.status(400).json({ error: 'instanceId es requerido' });

  try {
    await instanceManager.createInstance(instanceId);
    res.status(201).json({ message: `Instancia ${instanceId} inicializada` });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
});

app.get('/api/whatsapp/:instanceId/qr', (req, res) => {
  const { instanceId } = req.params;
  const instance = instanceManager.getInstance(instanceId);

  if (!instance) return res.status(404).json({ error: 'Instancia no encontrada' });
  
  if (instance.status === 'open') return res.status(200).json({ status: 'connected' });
  
  if (!instance.qr) return res.status(202).json({ status: 'pending', message: 'QR aún no generado' });

  res.json({
    qrBase64: instance.qr,
    mimeType: 'image/png'
  });
});

// Inicialización de servicios
async function start() {
  try {
    logger.info('Iniciando servicios...');
    
    // Inicializar instancia por defecto (opcional, según requerimientos)
    // await instanceManager.createInstance('default');

    app.listen(PORT, () => {
      logger.info(`Microservicio corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    logger.error('Error durante el inicio del microservicio:', error);
    process.exit(1);
  }
}

start();
