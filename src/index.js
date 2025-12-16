import 'dotenv/config';
import { conectarWhatsApp } from './WhatsAppClient.js';

console.log('🚀 Iniciando WhatsApp Bot...');
conectarWhatsApp().catch(console.error);

