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
- **Test**: write tests with an approachable, familiar and feature-rich API that gives you results quickly.

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


## tasks.md — executable checklist

Discrete steps in order, each with a checkbox. Each task references at least one `R<n>` that it covers.

Example:

```markdown
- [ ] T1 — Añadir `cmd_recent` en `src/cli.js`. Cubre: R1, R3.
- [ ] T2 — Registrar subparser `recent` con flag `--limit`. Cubre: R1, R2.
- [ ] T3 — Añadir `test_recent_default_limit` en `tests/test_cli.js`. Cubre: R1.
- [ ] T4 — Añadir `test_recent_invalid_limit` en `tests/test_cli.js`. Cubre: R2.
```

The `implementer` marks `[x]` each task upon completion. The `reviewer` rejects if any `[ ]` remains without documented justification.

## Traceability (hard rule)

- Each test in `tests/` must be mappable to an `R<n>` of its spec.
- Each `R<n>` must have at least one specific test.
- The `reviewer` checks this correspondence explicitly and rejects if it is missing.


```markdown
## Trazabilidad
- R1 → `test_recent_default_limit`
- R2 → `test_recent_invalid_limit`
- R3 → `test_recent_custom_limit`
```
