import express from 'express';
import config from './config/index.js';
import logger from './config/logger.js';
import baileysService from './services/BaileysService.js';
import messageService from './services/MessageService.js';

const app = express();
const PORT = config.port;

// Middleware de logs
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Inicialización de servicios
async function start() {
  try {
    logger.info('Iniciando servicios...');
    
    // Conectar WhatsApp
    await baileysService.init();

    // Vincular eventos entre servicios
    baileysService.on('messages.upsert', (upsert) => {
      messageService.handleUpsert(upsert);
    });

    messageService.on('message', (normalizedMsg) => {
      logger.info({ msg: normalizedMsg }, 'Nuevo mensaje procesado');
      // Aquí se podrían agregar más manejadores
    });

    app.listen(PORT, () => {
      logger.info(`Microservicio corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    logger.error('Error durante el inicio del microservicio:', error);
    process.exit(1);
  }
}

start();
