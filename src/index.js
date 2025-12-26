import 'dotenv/config';
import express from 'express';
//import { conectarWhatsApp } from './WhatsAppClient.js';
//console.log('\uf232 Iniciando WhatsApp Bot...');
//conectarWhatsApp().catch(console.error);

const PORT = process.env.PORT ?? 1234;

const app = express();

app.get('/', (req, res) => {
  res.send('Hola mundo desde Express')
});

app.listen(PORT, () => {
  console.log(`Servidor esta corriendo en http://localhost:${PORT} \uf427`)
})

