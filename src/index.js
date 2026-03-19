import 'dotenv/config';
import express from 'express';
import { conectarWhatsApp } from './WhatsAppClient.js';
import messages from './messages.json' with { type: 'json'};

//console.log('\uf232 Iniciando WhatsApp Bot...');
//conectarWhatsApp().catch(console.error);

const PORT = process.env.PORT ?? 1234;

const app = express();

//middleware
app.use((req, res, next) => {  
  const timeStr = new Date().toLocaleTimeString(); 
  console.log(`[${timeStr}] ${req.method} ${req.url}`);  
  //importante llamar a next()
  next()
})

app.get('/', (req, res) => {
  res.send('Hola mundo desde Express')
});

app.get('/health', (request, response) => {
  response.json({status: 'ok', uptime: process.uptime() })
});

app.get('/messages', (req, res) => {
  res.json(messages);
});



app.listen(PORT, () => {
  console.log(`Servidor esta corriendo en http://localhost:${PORT} \uf427`)
})

