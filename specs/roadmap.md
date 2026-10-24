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

## Phase 3: Reliability & Logging
- [ ] Replace `console.log` with structured `Pino` logging across all services.
- [ ] Implement `errorHandler` middleware.
- [ ] Enhance `connection.update` logic to handle diverse disconnection reasons (Baileys specific).

## Phase 4: Containerization & Deployment
- [ ] Create `Dockerfile` for the microservice.
- [ ] Configure `docker-compose.yml` including persistent volumes for `storage/`.
- [ ] Health check optimization.

## Phase 5: Multi-Session (Optional/Extended)
- [ ] Implement dynamic session initialization based on configuration or API request.
- [ ] Manage multiple `BaileysService` instances in memory.
