# Design: 001-foundation-refactoring

## 1. Overview
Esta fase se centra en la transición de una arquitectura monolítica basada en `index.js` y `WhatsAppClient.js` hacia una estructura de servicios desacoplados. Se implementarán tres servicios principales: `BaileysService`, `MessageService` y `SessionService`.

## 2. Arquitectura de Componentes
Se utiliza una arquitectura de servicios con comunicación basada en eventos para minimizar el acoplamiento.

```mermaid
graph TD
    App[index.js] --> Config[ConfigService]
    App --> Baileys[BaileysService]
    App --> Session[SessionService]
    App --> Message[MessageService]
    
    Baileys -- "connection.update" --> Session
    Baileys -- "messages.upsert" --> Message
    Session -- "auth_info" --> Baileys
```

## 3. Flujo de Datos
El flujo principal de inicialización y recepción de mensajes:

```mermaid
sequenceDiagram
    participant App
    participant Session as SessionService
    participant Baileys as BaileysService
    participant Msg as MessageService

    App->>Session: init()
    Session->>Session: Load auth state from storage/
    App->>Baileys: init(auth)
    Baileys->>Baileys: Connect to WhatsApp
    
    Note over Baileys, Msg: On Message Received
    Baileys->>Msg: emit("message", raw)
    Msg->>Msg: normalize(raw) -> MessageDTO
    Msg->>Msg: Forward to internal handlers
```

## 4. Interfaces y DTOs
### MessageDTO
Estructura de datos estandarizada para todos los mensajes entrantes:
- `id`: string (message key id)
- `remoteJid`: string (sender id)
- `pushName`: string (sender name)
- `messageType`: string (text, image, etc.)
- `content`: object/string (payload)
- `timestamp`: number

## 5. Estrategia de Sesión y Configuración
- **Almacenamiento**: Se utilizará el directorio `storage/` en lugar de `auth_info_baileys/` para una mejor organización.
- **Persistencia**: Uso de `useMultiFileAuthState` proporcionado por Baileys.
- **Configuración**: Centralizada en `src/config/` cargando variables de entorno.

## 6. Observabilidad y Logs
- **Librería**: `Pino` reemplazará a `console.log`.
- **Niveles**: `info`, `warn`, `error`, `debug`.
- **Formato**: JSON estructurado para facilitar la integración con sistemas de monitoreo en el futuro.
