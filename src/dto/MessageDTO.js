export default class MessageDTO {
  constructor({ id, remoteJid, pushName, messageType, content, timestamp, device, isGroup }) {
    this.id = id;
    this.remoteJid = remoteJid;
    this.pushName = pushName;
    this.messageType = messageType;
    this.content = this.sanitize(content);
    this.timestamp = timestamp;
    this.device = device;
    this.isGroup = isGroup;
  }

  sanitize(text) {
    if (typeof text !== 'string') return text;
    // Sanitización básica de caracteres de control y escapes
    return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  }

  toOrchestrator() {
    return {
      senderId: this.remoteJid.split('@')[0], // Usamos el número/id sin el dominio
      text: this.content,
      assistantName: process.env.ASSISTANT_NAME || "tec_cubepath_hackatonBot",
      createdBy: "app-wps"
    };
  }

  static fromBaileys(msg) {
    const messageType = Object.keys(msg.message || {})[0] || 'unknown';
    let content = '';

    if (messageType === 'conversation') {
      content = msg.message.conversation;
    } else if (messageType === 'extendedTextMessage') {
      content = msg.message.extendedTextMessage.text;
    } else if (messageType === 'imageMessage') {
      content = msg.message.imageMessage.caption || '[Image]';
    } else {
      content = msg.message?.[messageType] || '';
    }

    // Extraer dispositivo si es posible (Baileys suele ponerlo en el ID del mensaje o metadatos de la sesión)
    const device = msg.key.id.length > 20 ? 'android/ios' : 'web';
    const isGroup = msg.key.remoteJid.endsWith('@g.us');

    return new MessageDTO({
      id: msg.key.id,
      remoteJid: msg.key.remoteJidAlt || msg.key.remoteJid,
      pushName: msg.pushName || 'Unknown',
      messageType,
      content,
      timestamp: msg.messageTimestamp,
      device,
      isGroup
    });
  }
}
