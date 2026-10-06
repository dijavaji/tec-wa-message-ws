# Tech Stack: tec-wa-message-ws

## Runtime & Framework
- **Runtime**: Node.js (Latest LTS)
- **Framework**: Express.js (v5+) - Minimalist web framework for internal health checks and potential management APIs.
- **Module System**: ES Modules (ESM) for modern JavaScript syntax.

## WhatsApp Integration
- **Core Library**: `@whiskeysockets/baileys` - A high-performance, non-headless WhatsApp Web API implementation.
- **Authentication**: `useMultiFileAuthState` for persistent, file-based session storage.

## Communication & Utilities
- **HTTP Client**: `Axios` - For reliable REST POST requests to the orchestrator.
- **Logging**: `Pino` - For high-performance, structured JSON logging.
- **Error Handling**: `@hapi/boom` - For standardized HTTP-friendly error objects.
- **Process Management**: `Nodemon` (Dev) & `Docker` (Prod).

## Data Patterns
- **DTO (Data Transfer Object)**: Strict `MessageDTO` structure to decouple internal logic from external library changes.
- **Service Layer**: Separation of concerns between `BaileysService` (protocol), `MessageService` (logic/forwarding), and `SessionService` (persistence).
