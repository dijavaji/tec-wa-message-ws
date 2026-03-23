import 'dotenv/config';
import express from 'express';
import { conectarWhatsApp } from './WhatsAppClient.js';
import messages from './messages.json' with { type: 'json'};
import { DEFAULTS } from './config.js';

//console.log('\uf232 Iniciando WhatsApp Bot...');
//conectarWhatsApp().catch(console.error);

const PORT = process.env.PORT ?? DEFAULTS.PORT ;

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

app.get('/messages/:id', (req, res) => {
  
});

app.post('/mesages', (req, res) =>{
  //TODO enviar messages
});

app.delete('/messages/:id', (req,res) =>{

});

//actualizar un recurso completo
app.put('/messages/:id', (req,res) =>{

});

//actualizar parcialmente un recurso
app.patch('/messages/:id', (req,res) =>{

});

app.listen(PORT, () => {
  console.log(`Servidor esta corriendo en http://localhost:${PORT} \uf427`)
})

