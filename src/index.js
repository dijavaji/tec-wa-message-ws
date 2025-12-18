import 'dotenv/config';
import { conectarWhatsApp } from './WhatsAppClient.js';

console.log('\udb85\udcde Iniciando WhatsApp Bot...');
conectarWhatsApp().catch(console.error);

