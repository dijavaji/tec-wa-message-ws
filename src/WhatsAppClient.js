import makeWASocket, { DisconnectReason, useMultiFileAuthState, } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode-terminal';
import MessageHandler from './handlers/MessageHandler.js';

let sock;

export async function conectarWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  
  //const store = makeInMemoryStore({ 
    //logger: pino().child({ level: 'silent', stream: 'store' })
  //});

  sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    generateHighQualityLinkPreview: true,
    browser: ['WhatsApp Bot', 'Chrome', '4.0.0'],
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 60_000,
    keepAliveIntervalMs: 30_000,
    qrTimeout: 60_000,
    markOnlineOnConnect: true
  });

  //store.bind(sock.ev);

  sock.ev.on('creds.update', saveCreds);

  // Evento de mapeo LID/PN (nuevo en v7)
  sock.ev.on('lid-mapping.update', (mappings) => {
    console.log('📍 Actualización de mapeo LID:', mappings);
  });

  sock.ev.on('qr', (qr) => {
    console.log('\n📱 Escanea este QR con WhatsApp (60 segundos):');
    QRCode.generate(qr, { small: true });
  });

  const handler = new MessageHandler(sock);
  handler.configurarManejadores();

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('\n📱 Nuevo QR disponible:');
      QRCode.generate(qr, { small: true });
    }
    
    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      console.log('🔌 Conexión cerrada:', lastDisconnect?.error, '\nCódigo:', statusCode);
      
      if (shouldReconnect) {
        setTimeout(() => conectarWhatsApp(), 5000);
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp conectado exitosamente');
    }
  });

  return sock;
}


