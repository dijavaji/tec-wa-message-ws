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

## Phase 3: QR Connection Management (Multi-Instance)
- [x] Add `QRService` to capture Baileys QR and expose it as Base64 for the frontend.
- [x] Add `BaileysInstanceManager` singleton registry (`Map<userId, BaileysService>`).
- [x] Extend `SessionService` for per-user auth state under `storage/` (`useMultiFileAuthState`).
- [x] Adapt `BaileysService` for userId injection (independent WebSocket sessions).
- [x] Expose REST management API via Express (`WhatsAppController` + `whatsappRoutes`):
    - create / get status / get QR / delete instance
- [x] Add ETag middleware for QR polling (`304 Not Modified`).
- [x] Add centralized `errorHandler` middleware for management API errors.
- [x] Wire `index.js` to the instance manager (no single global socket).
- [x] Cover with unit + multi-user integration tests.

## Phase 3.1: Multi-Instance Session & Message Loop (Fix)
- [x] Persist session correctly via Baileys native `saveCreds` on `creds.update`.
- [x] Track connection `status` on each `BaileysService` instance.
- [x] Allow recreating closed instances; return 409 only when already active.
- [x] Roll back registry entries when `init()` fails.
- [x] Move message wiring from `index.js` into `BaileysInstanceManager` (per instance).
- [x] Re-close the loop per instance: WA → Orchestrator → WA (`forwardToOrchestrator` + `sendTextMessage`).

## Phase 3.2: Session Restore & Single Message Pipeline (Fix)
- [x] Boot restore: `index.js` → `WhatsAppController.initAllInstance()` → `BaileysInstanceManager.initInstances()`.
- [x] Add `SessionService.listPersistedUserIds()` to discover `storage/{userId}/auth_info_baileys/creds.json`.
- [x] Add `SessionService.readMeFromCreds(userId)` to read `me.id` / `me.lid` from disk.
- [x] Add `restoreInstance(userId)` / `_startInstance` shared path (phone starts as `pending`).
- [x] After `connected`, sync `phoneNumber` + `jid`/`lid` metadata from `creds.json` (`_syncPhoneFromCreds`).
- [x] Propagate `ownerUserId` through `MessageDTO` / `MessageService.handleUpsert(upsert, ownerUserId)`.
- [x] Register a single global message pipeline (`_ensureMessagePipeline`) so replies go only to the owning instance.
- [x] Cover with unit tests (`SessionService`, `BaileysInstanceManager`, `MessageService`).

## Phase 4: Reliability & Logging
- [ ] Replace `console.log` with structured `Pino` logging across all services.
- [ ] Harden `connection.update` for diverse Baileys disconnection reasons.
- [ ] Add E2E coverage for the full QR → connect → message → reply flow.

## Phase 5: Containerization & Deployment
- [ ] Create `Dockerfile` for the microservice.
- [ ] Configure `docker-compose.yml` including persistent volumes for `storage/`.
- [ ] Health check optimization.
