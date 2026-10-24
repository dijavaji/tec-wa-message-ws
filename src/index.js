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

    messageService.on('message', async (normalizedMsg) => {
      try {
        logger.info({ msgId: normalizedMsg.id }, 'Procesando mensaje normalizado');
        
        // 1. Forward al orquestador
        const response = await messageService.forwardToOrchestrator(normalizedMsg);
        
        // 2. Validar respuesta y enviar de vuelta a WhatsApp
        if (response?.success && response?.data?.text) {
          await baileysService.sendTextMessage(normalizedMsg.remoteJid, response.data.text);
        } else {
          logger.warn({ msgId: normalizedMsg.id, response }, 'El orquestador no devolvió una respuesta válida para enviar');
          throw new Error('El orquestador no devolvió una respuesta válida para enviar');
        }
      } catch (error) {
        logger.error({ error, msgId: normalizedMsg.id }, 'Error en el flujo de procesamiento de mensaje');
        await baileysService.sendTextMessage(normalizedMsg.remoteJid, 'Error en el flujo de procesamiento de mensaje');
      }
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
