export default class MessageHandler {
  constructor(sock) {
    this.sock = sock;
    this.mensajesProcesados = new Map();
  }

  configurarManejadores() {
    this.sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const msg of messages) {
        // En v7, usa remoteJidAlt para obtener el PN (número de teléfono)
        const remoteJid = msg.key.remoteJidAlt || msg.key.remoteJid;
        const isGroup = msg.key.remoteJid.endsWith('@g.us');
        const senderJid = msg.key.participant || msg.key.remoteJid;
        
        if (!msg.key.fromMe && msg.message) {
          const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
          
          console.log(`\ueb1b Mensaje enviado por: ${senderJid}:`, texto);
          
          if (texto.toLowerCase().includes('hola')) {
            await this.enviarRespuesta(remoteJid, '¡Hola! ¿En qué puedo ayudarte? 🤖');
          }
        }
      }
    });

    // Nuevo evento en v7: contacto actualizado
    this.sock.ev.on('contacts.update', (contacts) => {
      console.log('\udb81\udecb Contactos actualizados:', contacts.length);
    });
  }

  async enviarRespuesta(to, texto) {
    try {
      await this.sock.sendMessage(to, { text: texto });
      console.log('✉️ Mensaje enviado a:', to);
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
    }
  }
}



