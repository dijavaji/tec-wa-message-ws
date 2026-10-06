# Agent Instructions - tec-wa-message-ws

## 🚀 Quick Start Commands
- **Dev**: `npm run dev` (uses nodemon)
- **Start**: `npm start`
- **Port**: Defaults to `1234` (defined in `src/config.js`), override via `PORT` env.

## 🏗 Architecture & Flow
- **Entry Point**: `src/index.js` (Express + WhatsApp init).
- **WhatsApp Client**: `src/WhatsAppClient.js` (Baileys socket management).
- **Handlers**: `src/handlers/MessageHandler.js` processes `messages.upsert`.
- **State**: WhatsApp session data is stored in `auth_info_baileys/` (root).

## ⚠️ Critical Constraints
- **Library**: Uses `@whiskeysockets/baileys`. Do NOT use `whatsapp-web.js` or `venom-bot`.
- **Module System**: Strict **ES Modules** (`"type": "module"` in `package.json`). Use `.js` extensions in imports.
- **Microservice Role**: This is a message gateway. It MUST normalize messages and forward them to the orchestrator (URL defined in `.env`).
- **Filesystem**: Always use absolute paths for file tools.

## 🛠 Tech Stack Details
- **Baileys v7+**: Uses `lid-mapping.update` events.
- **Express 5**: Uses `express@^5.2.1`.
- **Logging**: Transitioning to `pino`. Avoid raw `console.log` in services.

## 📋 Roadmaps & Specs
Refer to `specs/` directory for the source of truth on implementation phases:
- `specs/mission.md`: Goals & objectives.
- `specs/tech-stack.md`: Approved libraries.
- `specs/roadmap.md`: Current development status and next steps.

## EARS testable requirements
The requirements are written in **EARS** (Easy Approach to RequirementsSyntax). 

### Requirement R<n>
User Story: As a <role> I want <goal> so that <benefit>
Acceptance Criteria
1. WHEN <trigger> THE SYSTEM SHALL <trigger>
2. IF <unwanted event> THEN THE SYSTEM SHALL <trigger>
3. WHILE <state> THE SYSTEM SHALL <trigger>

Example:
### Requirement R1
User Story: Como estudiante, quiero crear tareas con fecha límite.
Acceptance Criteria
1. WHEN el usuario guarda con título válido
THE SYSTEM SHALL crearla y listarla
2. IF guarda sin título THEN
THE SYSTEM SHALL bloquear + mostrar error
3. WHILE haya filtros activos
THE SYSTEM SHALL mostrar solo coincidencias

The hard rules: 
- (avoiding words like "fast" or "easy"). Each EARS criterion = a test waiting to be written.
- 5 templates When · While · Where · If… Then (ubiquitous, without keyword).
- Each requirement MUST be verifiable by at least one specific test.
- Do not mix multiple `MUST` statements in a single requirement. If there is more than one, split them up.
- Do not use weak verbs ("could," "can," "supports"). Use only `MUST` / `MUST NOT`.
- response in spanish
