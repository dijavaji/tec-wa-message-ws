# Roadmap: tec-wa-message-ws

Implementation order divided into small, manageable phases.

## Phase 1: Foundation & Refactoring
- [x] Initialize `specs/` and project "constitution".
- [x] Refactor current monolithic `index.js`/`WhatsAppClient.js` into the proposed service structure:
    - `src/config/` (env, baileys, logger)
    - `src/services/` (BaileysService, MessageService, SessionService)
    - `src/dto/` (MessageDTO)
- [x] Implement `SessionService` to properly manage `auth_info_baileys` within a `storage/` directory.

## Phase 2: Message Normalization & Forwarding
- [x] Define `MessageDTO.js` fields based on stakeholder requirements.
- [x] Implement normalization logic in `MessageService`.
- [x] Integrate `Axios` to POST normalized messages to `tec-messages-ws` endpoint.
- [x] Add basic retry logic for orchestrator communication.

## Phase 2.1: Reply Integration (Fix)
- [x] Implement `sendTextMessage` in `BaileysService`.
- [x] Close the loop: WA -> Orchestrator -> WA.
- [x] Validate orchestrator responses before sending back to WhatsApp.

## Phase 3: QR Connection Management (Multi-Instance + REST API) ✅ COMPLETED

**Feature Branch:** `feature/003-qr-connection-management`

**Documentación:** Ver `specs/003-qr-connection-management/`
  - `requirements.md` — Especificación EARS de 16 requerimientos
  - `design.md` — Arquitectura con 6 secciones + diagramas Mermaid
  - `tasks.md` — Plan ejecutable con 2 niveles de tareas

**Tareas Principales:**

### GROUP A: Servicios Base ✅
- [x] A.1 — Crear QRService (captura + Base64)
- [x] A.2 — Crear BaileysInstanceManager (Singleton registry)
- [x] A.3 — Refactorizar SessionService (multi-user)
- [x] A.4 — Adaptar BaileysService (user-id injection)

### GROUP B: Controladores y Rutas ✅
- [x] B.1 — Crear WhatsAppController
- [x] B.2 — Crear whatsappRoutes.js

### GROUP C: Middlewares de Optimización ✅
- [x] C.1 — ETag Middleware (caché HTTP 304)
- [x] C.2 — Error Handler Middleware (centralizado)

### GROUP D: Refactorización Integradora ✅
- [x] D.1 — Refactorizar index.js (usar InstanceManager)

### GROUP E: Tests Exhaustivos ✅
- [x] E.1 — Suite de unit tests
- [x] E.2 — Integration tests (multi-user)
- [ ] E.3 — E2E tests (flujo completo)

### GROUP F: Documentación y Cleanup ✅
- [x] F.1 — Actualizar documentación
- [x] F.2 — Validación final y merge

## Phase 4: Reliability & Logging
- [ ] Replace `console.log` with structured `Pino` logging across all services.
- [ ] Implement `errorHandler` middleware.
- [ ] Enhance `connection.update` logic to handle diverse disconnection reasons (Baileys specific).

## Phase 5: Containerization & Deployment
- [ ] Create `Dockerfile` for the microservice.
- [ ] Configure `docker-compose.yml` including persistent volumes for `storage/`.
- [ ] Health check optimization.

## Phase 6: Multi-Session (Optional/Extended)
- [ ] Implement dynamic session initialization based on configuration or API request.
- [ ] Manage multiple `BaileysService` instances in memory.
