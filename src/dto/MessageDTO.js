
const DEFAULT_ASSISTANT_NAME = 'marketing_turistico_bot';
const DEFAULT_CREATED_BY = 'app-was';

export default class MessageDTO {
  constructor({
    id,
    ownerUserId,
    remoteJid,
    remoteJidAlt = null,
    senderJid,
    pushName = 'Unknown',
    messageType = 'unknown',
    content = '',
    timestamp = null,
    isGroup = false
  }) {
    this.id = id;
    this.ownerUserId = ownerUserId ?? null;

    // Conversación o chat al que pertenece el mensaje
    this.remoteJid = remoteJid;
    this.remoteJidAlt = remoteJidAlt;

    // Remitente real del mensaje
    this.senderJid = senderJid;

    this.pushName = pushName;
    this.messageType = messageType;
    this.content = this.sanitize(content);
    this.timestamp = timestamp;
    this.isGroup = isGroup;
  }

  /**
   * Sanitiza únicamente el texto.
   * No modifica objetos ni estructuras multimedia.
   */
  sanitize(value) {
    if (typeof value !== 'string') {
      return value ?? '';
    }

    return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
  }

  /**
   * Identificador del remitente para el orquestador.
   * En grupos utiliza el participante y no el JID del grupo.
   */
  get senderId() {
    return this.senderJid?.split('@')[0] ?? null;
  }

  /**
   * Convierte el DTO al contrato de integración del orquestador.
   */
  toOrchestrator() {
    return {
      senderId: this.senderId,
      text: this.content,
      assistantName:
      process.env.ASSISTANT_NAME || DEFAULT_ASSISTANT_NAME,
      createdBy: DEFAULT_CREATED_BY,

      // Metadatos adicionales
      messageId: this.id,
      ownerUserId: this.ownerUserId,
      chatId: this.remoteJid,
      messageType: this.messageType,
      pushName: this.pushName,
      timestamp: this.timestamp,
      isGroup: this.isGroup
    };
  }

  /**
   * Construye el DTO desde un mensaje individual de Baileys.
   *
   * @param {object} msg - WAMessage original
   * @param {string} ownerUserId - Instancia que recibió el mensaje
   * @param {object} normalizedContent - Contenido normalizado por BaileysService
   * @param {string} messageType - Tipo detectado por BaileysService
   */
  static fromBaileys(
    msg,
    ownerUserId = null,
    normalizedContent = msg.message,
    messageType = null
  ) {
    const key = msg.key ?? {};
    const content = normalizedContent ?? {};

    const remoteJid = key.remoteJid;
    const remoteJidAlt = key.remoteJidAlt ?? null;

    const isGroup = remoteJid?.endsWith('@g.us') ?? false;

    // En grupos el remitente es el participante.
    // En conversaciones individuales es el propio remoteJid.
    const senderJid = isGroup
    ? (key.participantAlt ?? key.participant ?? null)
    : (remoteJidAlt ?? remoteJid);

    const detectedType =
    messageType ?? Object.keys(content)[0] ?? 'unknown';

    return new MessageDTO({
      id: key.id,
      ownerUserId,
      remoteJid,
      remoteJidAlt,
      senderJid,
      pushName: msg.pushName ?? 'Unknown',
      messageType: detectedType,
      content: this.extractText(content, detectedType),
                          timestamp: this.normalizeTimestamp(msg.messageTimestamp),
                          isGroup
    });
  }

  /**
   * Extrae el contenido textual sin asumir que todos los mensajes
   * tienen la misma estructura.
   */
  static extractText(content, messageType) {
    switch (messageType) {
      case 'conversation':
        return content.conversation ?? '';

      case 'extendedTextMessage':
        return content.extendedTextMessage?.text ?? '';

      case 'imageMessage':
        return content.imageMessage?.caption ?? '';

      case 'videoMessage':
        return content.videoMessage?.caption ?? '';

      case 'documentMessage':
        return content.documentMessage?.caption ?? '';

      case 'buttonsResponseMessage':
        return content.buttonsResponseMessage?.selectedDisplayText ?? '';

      case 'listResponseMessage':
        return content.listResponseMessage?.title ?? '';

      case 'templateButtonReplyMessage':
        return content.templateButtonReplyMessage?.selectedDisplayText ?? '';

      case 'messageContextInfo':
        return '';

      default:
        return '';
    }
  }

  /**
   * Normaliza el timestamp de Baileys a milisegundos Unix.
   */
  static normalizeTimestamp(timestamp) {
    if (timestamp == null) {
      return null;
    }

    const value = Number(timestamp);

    return Number.isFinite(value) ? value * 1000 : null;
  }
}
