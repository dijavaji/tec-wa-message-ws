# tec-wa-message-ws

Microservicio de mensajería para WhatsApp basado en Node.js y la librería **Baileys**. Este componente forma parte del ecosistema **SMART CHATBOT IA Solución MVP**, encargado de la conexión directa con WhatsApp y la normalización de mensajes para su procesamiento posterior.

## 🚀 Contexto Baileys

Baileys es una librería WebSocket eficiente para interactuar con WhatsApp que:
- **No usa Selenium ni Chromium**: Optimiza el uso de memoria RAM.
- **Event-Driven**: Escucha eventos mediante `EventEmitter`.
- **Autenticación Flexible**: Soporta código QR y Pairing Code.
- **Mensajería Directa**: Permite el envío y recepción de mensajes de alto rendimiento.

**Evento Clave:** `messages.upsert` - Se dispara ante cualquier mensaje nuevo recibido.

## 🏗️ Arquitectura MVP (Sin Colas)

```text
┌─────────────────────────────────────────────────┐
│ WhatsApp (Baileys WebSocket Connection)         │
└────────────────┬────────────────────────────────┘
                 │ messages.upsert event
                 ▼
┌─────────────────────────────────────────────────┐
│ tec-wa-message-ws (Node.js)                     │
│ ┌──────────────────────────────────────────────┐│
│ │ Baileys Socket Manager                       ││
│ │ - Gestiona sesión WhatsApp                   ││
│ │ - Escucha eventos                            ││
│ └──────────────────────────────────────────────┘│
│         │                                        │
│         │ Normaliza a MessageDTO                │
│         ▼                                        │
│ ┌──────────────────────────────────────────────┐│
│ │ MessageService                               ││
│ │ - Envía REST POST a tec-messages-ws          ││
│ └──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
         │
         │ REST POST /api/messages/receive
         ▼
    tec-messages-ws (Orquestador existente)
```

## 📂 Estructura del Proyecto

```text
tec-wa-message-ws/
├── src/
│   ├── config/
│   │   ├── baileys.config.js       # Configuración Baileys
│   │   ├── logger.config.js        # Logger simple
│   │   └── env.js                  # Variables de entorno
│   ├── services/
│   │   ├── BaileysService.js       # Conexión + eventos Baileys
│   │   ├── MessageService.js       # Normaliza y envía a tec-messages-ws
│   │   └── SessionService.js       # Persiste credenciales
│   ├── dto/
│   │   └── MessageDTO.js           # DTO normalizado
│   ├── middleware/
│   │   └── errorHandler.js         # Manejo de errores
│   ├── app.js                      # Express app
│   └── index.js                    # Entry point
├── storage/                        # Credenciales persistidas de Baileys
├── logs/                           # Logs simples
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── .env
├── package.json
├── nodemon.json
└── README.md
```

## 🛠️ Instalación y Configuración

1. **Instalar dependencias:**
   ```bash
   npm install
   ```
2. **Configurar variables de entorno:**
   Crea un archivo `.env` basado en los requerimientos del sistema:
   ```env
   PORT=3000
   ORCHESTRATOR_URL=http://tec-messages-ws:4000/api/messages/receive
   ```

## 🚦 Ejecución

- **Modo Desarrollo:**
  ```bash
  npm run dev
  ```
- **Producción:**
  ```bash
  npm start
  ```

## 📦 Docker

Para desplegar usando Docker Compose:
```bash
docker-compose up -d --build
```

---
Desarrollado por **technoloqie** para la solución SMART CHATBOT IA.
