import express from 'express';
import config from './config/index.js';
import logger from './config/logger.js';
import messageService from './services/MessageService.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import etagMiddleware from './middleware/etagMiddleware.js';

const app = express();
const PORT = config.port;

app.use(express.json());
// Middleware de logs estructurados
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    url: req.url,
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Routes
app.use('/api/whatsapp', whatsappRoutes);

// Middleware de caching (ETag)
app.use(etagMiddleware);

// Middleware de error handling
app.use(errorHandler);

// Middleware 404 para rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    code: 'NOT_FOUND',
    path: req.path,
    method: req.method
  });
});

// Inicialización de servicios
async function start() {
  try {
    logger.info('Iniciando microservicio tec-wa-message-ws...');

    app.listen(PORT, () => {
      logger.info(`Microservicio corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    logger.error('Error durante el inicio del microservicio:', error);
    process.exit(1);
  }
}

start();
