export default class MessageDTO {
  constructor({ id, remoteJid, pushName, messageType, content, timestamp }) {
    this.id = id;
    this.remoteJid = remoteJid;
    this.pushName = pushName;
    this.messageType = messageType;
    this.content = content;
    this.timestamp = timestamp;
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

    return new MessageDTO({
      id: msg.key.id,
      remoteJid: msg.key.remoteJidAlt || msg.key.remoteJid,
      pushName: msg.pushName || 'Unknown',
      messageType,
      content,
      timestamp: msg.messageTimestamp,
    });
  }
}
