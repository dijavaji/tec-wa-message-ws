# Plan de Ejecución - Feature 003: QR Connection Management

**Última actualización:** 2026
**Estado:** Listo para Ejecución
**Estimación Total:** 3-4 sprints (2 semanas)

---

## GRUPOS DE TAREAS (Level 1)

### GROUP A: Servicios Base (2-3 días)
Implementar capas de servicios independientes sin cambiar index.js aún.

### GROUP B: Controladores y Rutas (2-3 días)
Agregar endpoints REST y lógica de negocio.

### GROUP C: Middlewares de Optimización (2 días)
Implementar caché con ETag y error handling centralizado.

### GROUP D: Refactorización Integradora (1-2 días)
Modificar index.js para usar nueva arquitectura.

### GROUP E: Tests Exhaustivos (3-4 días)
Suite completa: unitarios, integration, E2E.

### GROUP F: Documentación y Cleanup (1 día)
Actualizar specs, README, y validación final.

---

## TAREAS DETALLADAS (Level 2)

---

## GROUP A: SERVICIOS BASE

### ✅ A.1 — Crear QRService
**Objetivo:** Capturar QR de Baileys y convertirlo a Base64

**Requirements:**
- R1: Retornar QR en Base64 formato
- R2: Generar hash para caché ETag

**Tareas Sub-nivel:**

```markdown
- [ ] A.1.1 — Crear archivo src/services/QRService.js
  - Clase QRService extend EventEmitter
  - Constructor: inicializar lastQR = null
  - Método: captureQR(qrImage) → convierte a Base64 + hash
  - Método: getLatestQR() → retorna {qrBase64, mimeType}
  - Método: generateHash(qrBase64) → SHA-256 para ETag
  - Método: clearCache() → limpia QR tras timeout (5 min)
  - Emitir evento: 'qr:updated' cuando cambia QR

- [ ] A.1.2 — Test unitario: src/tests/unit/QRService.test.js
  - test_qr_service_capture_valid_qr
  - test_qr_service_base64_format_valid
  - test_qr_service_hash_generation
  - test_qr_service_cache_ttl_expiration
  - Cobertura: 100% de QRService

- [ ] A.1.3 — Integrar con BaileysService
  - Inyectar QRService en constructor de BaileysService
  - Escuchar evento 'qr' de Baileys
  - Llamar qrService.captureQR(qr) cuando se emita

**Demo:** QRService captura evento QR, lo convierte a Base64, genera hash, puede recuperarse vía getLatestQR()
```

---

### ✅ A.2 — Crear BaileysInstanceManager
**Objetivo:** Registry centralizado de instancias BaileysService

**Requirements:**
- R3: Múltiples usuarios simultáneos
- R4: Acceso rápido O(1)

**Tareas Sub-nivel:**

```markdown
- [ ] A.2.1 — Crear archivo src/services/BaileysInstanceManager.js
  - Clase BaileysInstanceManager extend EventEmitter
  - Constructor: instances = new Map(), metadata = new Map()
  - Método: createInstance(userId, phoneNumber) → retorna BaileysService
    - Validar: userId no existe en registry
    - Crear: new BaileysService(userId)
    - Inicializar: await baileysService.init()
    - Registrar en Map
    - Emitir: 'instance:created' con metadatos
    - Retornar instancia
  - Método: getInstance(userId) → retorna BaileysService | null
  - Método: hasInstance(userId) → boolean
  - Método: getAllInstances() → Map de todas las instancias
  - Método: deleteInstance(userId) → boolean
    - Limpiar listeners
    - Remover del registry
    - Emitir: 'instance:deleted'
  - Método: getStatus(userId) → string ('waiting_scan'|'ready'|'disconnected')
  - Singleton: export default new BaileysInstanceManager()

- [ ] A.2.2 — Test unitario: src/tests/unit/BaileysInstanceManager.test.js
  - test_instance_manager_create_instance
  - test_instance_manager_create_duplicate_conflict
  - test_instance_manager_get_instance_exists
  - test_instance_manager_get_instance_not_found
  - test_instance_manager_delete_instance
  - test_instance_manager_registry_performance_o1
  - test_instance_manager_events_emitted
  - Cobertura: 100%

- [ ] A.2.3 — Setup event listeners
  - Escuchar: baileysService.on('qr') → emit 'instance:qr_generated'
  - Escuchar: baileysService.on('connected') → emit 'instance:ready'
  - Escuchar: baileysService.on('disconnected') → emit 'instance:disconnected'

**Demo:** Crear 3 instancias con diferentes usuarios, acceder rápidamente, eliminar una, verificar estado del registry
```

---

### ✅ A.3 — Refactorizar SessionService (Multi-User)
**Objetivo:** Persistencia de credenciales por usuario sin conflictos

**Requirements:**
- R5: Recuperación automática sin nuevo QR
- R6: Aislamiento de credenciales por usuario

**Tareas Sub-nivel:**

```markdown
- [ ] A.3.1 — Refactorizar src/services/SessionService.js
  - Método: getAuthState(userId) → Promise<{state, saveCreds}>
    - Validar: directorio storage/{userId}/ existe
    - Llamar: useMultiFileAuthState(`storage/${userId}/auth_info_baileys/`)
    - Retornar: {state, saveCreds}
  - Método: saveCreds(userId, creds) → Promise<void>
    - Se pasa automáticamente a Baileys en creds.update
  - Método: clearSession(userId) → Promise<void>
    - Eliminar directorio storage/{userId}/auth_info_baileys/
  - Método: sessionExists(userId) → Promise<boolean>
  - Helper: ensureUserDirectory(userId) → crea storage/{userId}/ si no existe
  - Logging: log cada operación con pino

- [ ] A.3.2 — Actualizar estructura de storage
  - Crear directorio: storage/{userId}/auth_info_baileys/
  - Estructura: 
    ```
    storage/
    ├── user_001/
    │   └── auth_info_baileys/
    │       ├── creds.json
    │       ├── pre-key-*.json
    │       └── ...
    ├── user_002/
    │   └── auth_info_baileys/
    │       └── ...
    ```

- [ ] A.3.3 — Test unitario: src/tests/unit/SessionService.test.js
  - test_session_service_get_auth_state_new_user
  - test_session_service_get_auth_state_existing_user
  - test_session_service_multi_user_isolation
  - test_session_service_clear_session
  - test_session_service_persistence_after_restart
  - test_session_service_directory_creation
  - Cobertura: 100%

**Demo:** Crear sesión user_001, simular restart, verificar que user_001 se recupera, crear user_002, verificar aislamiento
```

---

### ✅ A.4 — Adaptar BaileysService (User-ID Injection)
**Objetivo:** BaileysService trabaja con userId específico

**Requirements:**
- R7: userId inyectado en constructor

**Tareas Sub-nivel:**

```markdown
- [ ] A.4.1 — Refactorizar src/services/BaileysService.js
  - Constructor: recibir userId como parámetro obligatorio
    ```javascript
    constructor(userId) {
      super();
      this.userId = userId;
      this.sock = null;
    }
    ```
  - Método init():
    - const {state, saveCreds} = await sessionService.getAuthState(this.userId)
    - Pasar saveCreds a Baileys
    - Registrar QRService para capturar QR
  - Método sendTextMessage(to, text):
    - Log con userId
  - Todos los métodos mantienen contexto this.userId

- [ ] A.4.2 — Inyectar QRService
  - Escuchar evento 'qr' de this.sock
  - Cuando se reciba, llamar: qrService.captureQR(qr)
  - Emitir evento 'qr' a nivel de instancia

- [ ] A.4.3 — Test unitario: src/tests/unit/BaileysService.test.js
  - test_baileys_service_constructor_receives_userid
  - test_baileys_service_init_with_user_specific_session
  - test_baileys_service_qr_captured_to_qr_service
  - test_baileys_service_independent_instances
  - Cobertura: 100%

- [ ] A.4.4 — Verificación: BaileysService instance A ≠ instance B
  - Crear BS_A con userId='user_001'
  - Crear BS_B con userId='user_002'
  - Verificar que A.userId !== B.userId
  - Verificar que A.sock y B.sock son WebSockets independientes

**Demo:** Dos instancias de BaileysService funcionan simultáneamente con diferentes usuarios sin interferencias
```

---

## GROUP B: CONTROLADORES Y RUTAS

### ✅ B.1 — Crear WhatsAppController
**Objetivo:** Lógica de negocio para endpoints

**Requirements:**
- R8: Crear instancia con validación
- R9: Obtener estado de instancia

**Tareas Sub-nivel:**

```markdown
- [ ] B.1.1 — Crear archivo src/controllers/WhatsAppController.js
  - Clase WhatsAppController
  - Método: async createInstance(userId, phoneNumber)
    - Validar inputs (userId, phoneNumber)
    - Verificar: !manager.hasInstance(userId)
    - Crear: await manager.createInstance(userId, phoneNumber)
    - Log: info level con userId
    - Retornar: {instanceId, status: 'generating_qr'}
  - Método: async getQR(userId)
    - manager.getInstance(userId)
    - qrService.getLatestQR()
    - Si null: retornar null (middleware devolverá 204)
    - Si existe: retornar {qrBase64, mimeType}
  - Método: async getStatus(userId)
    - manager.getInstance(userId)
    - manager.getStatus(userId)
    - Retornar {status}
  - Método: async deleteInstance(userId)
    - manager.deleteInstance(userId)
    - Retornar boolean

- [ ] B.1.2 — Método privado validatePhoneNumber(phone)
    - Regex: /^\+\d{1,3}\s?\d{1,14}$/ 
    - Retornar boolean

- [ ] B.1.3 — Método privado validateUserId(userId)
    - Regex: /^[a-zA-Z0-9_]{3,32}$/
    - Retornar boolean

- [ ] B.1.4 — Test unitario: src/tests/unit/WhatsAppController.test.js
  - test_controller_create_instance_valid
  - test_controller_create_instance_invalid_phone
  - test_controller_create_instance_duplicate_conflict
  - test_controller_get_qr_exists
  - test_controller_get_qr_not_found
  - test_controller_get_status
  - test_controller_delete_instance
  - Cobertura: 100%

**Demo:** Crear instancia válida, obtener QR, obtener status, eliminar
```

---

### ✅ B.2 — Crear Routes (whatsappRoutes.js)
**Objetivo:** Endpoints REST del API

**Requirements:**
- R10: Validación de inputs
- R11: Error handling consistente

**Tareas Sub-nivel:**

```markdown
- [ ] B.2.1 — Crear archivo src/routes/whatsappRoutes.js
  - Router Express
  - POST /instances
    - Body: {userId, phoneNumber}
    - Middleware: validateRequest (userId, phoneNumber)
    - Controller: whatsappController.createInstance()
    - Response: 201 Created o 409 Conflict o 400 Bad Request
  
  - GET /instances/:userId/qr
    - Param: userId
    - Controller: whatsappController.getQR()
    - Response: 200 {qrBase64, mimeType} o 204 o 404
  
  - GET /instances/:userId/status
    - Param: userId
    - Controller: whatsappController.getStatus()
    - Response: 200 {status} o 404
  
  - DELETE /instances/:userId
    - Param: userId
    - Controller: whatsappController.deleteInstance()
    - Response: 204 o 404

- [ ] B.2.2 — Crear middleware validateRequest
  - Ubicación: src/middleware/validation.js
  - Validar campos requeridos
  - Validar formato de datos
  - Si error: next(new BadRequestError(...))

- [ ] B.2.3 — Test de rutas: src/tests/unit/WhatsAppRoutes.test.js
  - test_route_post_instances_valid
  - test_route_post_instances_missing_field
  - test_route_get_qr
  - test_route_get_status
  - test_route_delete_instances
  - Cobertura: 100%

**Demo:** Llamar cada endpoint, recibir respuestas JSON correctas
```

---

## GROUP C: MIDDLEWARES DE OPTIMIZACIÓN

### ✅ C.1 — Implementar ETag Middleware
**Objetivo:** Caché HTTP 304 para reducir ancho de banda

**Requirements:**
- R2: ETag para polling inteligente
- R12: Reducción 90% de ancho de banda

**Tareas Sub-nivel:**

```markdown
- [ ] C.1.1 — Crear archivo src/middleware/etagMiddleware.js
  - Función: etagMiddleware(req, res, next)
  - En GET /qr:
    - Obtener QR actual: const qr = await controller.getQR(userId)
    - Si no existe: return res.status(204).send()
    - Generar hash: const hash = crypto.createHash('sha256')
                                    .update(qr.qrBase64)
                                    .digest('hex')
    - Si req.headers['if-none-match'] === hash:
        - return res.status(304).set('ETag', hash).send()
    - Si cambió:
        - res.set('ETag', hash)
        - return res.status(200).json({qrBase64, mimeType})
  - Registrar en GET /instances/:userId/qr route

- [ ] C.1.2 — Test: src/tests/unit/ETagMiddleware.test.js
  - test_etag_middleware_304_not_modified
  - test_etag_middleware_200_on_change
  - test_etag_middleware_header_validation
  - test_etag_middleware_performance_bandwidth_reduction
  - Cobertura: 100%

- [ ] C.1.3 — Test E2E de Polling
  - Cliente hace GET sin ETag
  - Servidor responde 200 + ETag + body (ej: 5KB)
  - Cliente hace GET con mismo ETag
  - Servidor responde 304 + sin body (ej: 100 bytes)
  - Verificar reducción ~90%

**Demo:** Polling 10 veces, primera 200 con body, 9 siguientes 304 sin body
```

---

### ✅ C.2 — Implementar Error Handler Middleware
**Objetivo:** Manejo centralizado de errores

**Requirements:**
- R11: Error handling consistente
- R15: Logging estructurado

**Tareas Sub-nivel:**

```markdown
- [ ] C.2.1 — Crear archivo src/middleware/errorHandler.js
  - Función: errorHandler(err, req, res, next)
  - Categorizar errores:
    - BadRequestError (400)
    - NotFoundError (404)
    - ConflictError (409)
    - InternalError (500)
  - Response format:
    ```json
    {
      error: "mensaje",
      code: "ERROR_CODE",
      timestamp: ISO 8601,
      path: req.path,
      method: req.method
    }
    ```
  - Log con Pino: {level, error, userId?, timestamp}
  - Nunca exponer stack traces al cliente

- [ ] C.2.2 — Crear custom Error classes
  - src/utils/errors.js
  - BadRequestError(message, field?)
  - NotFoundError(resource)
  - ConflictError(message)
  - InternalError(message)

- [ ] C.2.3 — Refactorizar controllers para throw errores
  - En lugar de: if (!user) return res.status(404)...
  - Hacer: if (!user) throw new NotFoundError('Instance')
  - Middleware captura y responde

- [ ] C.2.4 — Test: src/tests/unit/ErrorHandler.test.js
  - test_error_handler_bad_request
  - test_error_handler_not_found
  - test_error_handler_conflict
  - test_error_handler_internal
  - test_error_handler_logging_structure
  - Cobertura: 100%

**Demo:** Enviar request inválido, recibir error JSON estructurado
```

---

## GROUP D: REFACTORIZACIÓN INTEGRADORA

### ✅ D.1 — Refactorizar index.js
**Objetivo:** Usar nueva arquitectura con BaileysInstanceManager

**Requirements:**
- R13: Ciclo de vida de instancias
- R14: Limpieza de recursos

**Tareas Sub-nivel:**

```markdown
- [ ] D.1.1 — Actualizar src/index.js
  - Remover: initializacion hardcodeada de baileysService.init()
  - Importar: whatsappRoutes
  - Importar: etagMiddleware
  - Importar: errorHandler
  - app.use('/api/whatsapp', whatsappRoutes)
  - app.use(etagMiddleware)
  - app.use(errorHandler)
  - Ya no hacer: baileysService.on('messages.upsert')
  - Mantener: app.get('/health')

- [ ] D.1.2 — Listener de eventos del InstanceManager
  - manager.on('instance:created', (userId) => {
      logger.info({userId, event: 'instance:created'})
    })
  - manager.on('instance:ready', (userId) => {
      logger.info({userId, event: 'instance:ready'})
    })
  - manager.on('instance:disconnected', (userId) => {
      logger.warn({userId, event: 'instance:disconnected'})
    })

- [ ] D.1.3 — Listener de mensajes multi-instancia
  - Problema: messages.upsert se debe escuchar por cada instancia
  - Solución: En BaileysService.init(), después de makeWASocket:
    ```javascript
    this.sock.ev.on('messages.upsert', (upsert) => {
      // messageService maneja normalización y forward
      messageService.handleUpsert(upsert);
    });
    ```
  - Verificar que messageService NO tiene hardcoding de instancia

- [ ] D.1.4 — Test: src/tests/unit/IndexIntegration.test.js
  - test_index_initialization_routes_registered
  - test_index_middlewares_active
  - test_index_instance_manager_used

**Demo:** Iniciar servidor, POST crear instancia, verificar que funciona
```

---

## GROUP E: TESTS EXHAUSTIVOS

### ✅ E.1 — Suite de Unit Tests
**Objetivo:** 100% cobertura de servicios individuales

```markdown
- [ ] E.1.1 — Ejecutar todos los tests unitarios
  npm test -- --testPathPattern="unit"
  
- [ ] E.1.2 — Verificar cobertura >= 80%
  npm test -- --coverage

- [ ] E.1.3 — Revisar reporte de coverage
  Requerimientos que deben estar 100%:
  - QRService
  - BaileysInstanceManager
  - SessionService
  - BaileysService
  - WhatsAppController
  - Middlewares
  - Validadores
```

---

### ✅ E.2 — Integration Tests
**Objetivo:** Flujos multi-componente

```markdown
- [ ] E.2.1 — Crear src/tests/integration/multi-user-instances.test.js
  - test_create_instance_user_a
  - test_create_instance_user_b
  - test_get_qr_user_a (independiente de b)
  - test_get_qr_user_b (independiente de a)
  - test_delete_instance_user_a (user_b no afectado)
  - Verificar: 0 cross-contamination

- [ ] E.2.2 — Crear src/tests/integration/qr-polling-cache.test.js
  - test_first_poll_returns_qr_with_etag
  - test_second_poll_same_etag_returns_304
  - test_poll_after_qr_change_returns_200
  - test_bandwidth_reduction_with_etag

- [ ] E.2.3 — Crear src/tests/integration/session-persistence.test.js
  - test_create_session_user_001
  - test_restart_simulator (mock reinicio)
  - test_session_recovered_no_qr_needed
  - test_new_user_requires_qr

```

---

### ✅ E.3 — End-to-End Tests (E2E)
**Objetivo:** Flujo completo como usuario real

```markdown
- [ ] E.3.1 — Crear src/tests/e2e/complete-flow.test.js
  Escenario:
  1. Usuario A hace POST /instances (user_a, +34666...)
  2. Recibe 201 con instanceId
  3. Usuario A hace GET /qr (polling x5)
    - 1a vez: 200 + QR + ETag
    - 2-5 veces: 304 (ancho de banda reducido)
  4. Simular: Usuario A escanea QR
  5. Verificar: GET /status retorna 'ready'
  6. Usuario B hace POST /instances (user_b, +55...)
  7. User B obtiene QR independiente (diferente a User A)
  8. Simular: User B también conecta
  9. Ambos simultaneamente: GET /status ambos 'ready'
  10. User A DELETE /instances → desconectar
  11. User B aún funciona (isolado)
  12. Restart simulado
  13. User B se recupera sin nuevo QR
  14. User A debe generar nuevo QR

- [ ] E.3.2 — Ejecutar E2E
  npm test -- --testPathPattern="e2e"

- [ ] E.3.3 — Simular condiciones adversas
  - test_e2e_network_disconnect_and_recover
  - test_e2e_qr_expiration
  - test_e2e_concurrent_creations
```

---

## GROUP F: DOCUMENTACIÓN Y CLEANUP

### ✅ F.1 — Actualizar Documentación
**Objetivo:** Specs, README, API Reference

```markdown
- [ ] F.1.1 — Actualizar specs/roadmap.md
  - Markear Phase 3 como [x] completed
  - Incluir nuevas tareas en status

- [ ] F.1.2 — Crear specs/phase3-api-reference.md
  - Descripción de cada endpoint
  - Ejemplos de requests/responses
  - Códigos de error esperados

- [ ] F.1.3 — Actualizar README.md
  - Agregar sección "Multi-Instance Management"
  - Instrucciones de uso de nuevos endpoints

- [ ] F.1.4 — Crear CHANGELOG.md
  - Cambios en Phase 3
  - Breaking changes (si aplica)
  - Nuevas features
```

---

### ✅ F.2 — Validación Final
**Objetivo:** Verificación de entrega

```markdown
- [ ] F.2.1 — Checklist de código
  ✅ Sin console.log (solo pino)
  ✅ Todas las funciones tienen JSDoc
  ✅ No hay archivos temporales o .env.example
  ✅ No hay datos sensibles en specs/

- [ ] F.2.2 — Checklist de tests
  ✅ npm test pasa 100%
  ✅ npm test -- --coverage >= 80%
  ✅ No hay skipped tests (skip para futuros)

- [ ] F.2.3 — Checklist de rendimiento
  ✅ ETag reduce 90% ancho de banda (verificado en test)
  ✅ Lookup de instancia es O(1)
  ✅ No memory leaks (simular con inspector)

- [ ] F.2.4 — Merge a main
  - Crear PR desde feature/003-qr-connection-management
  - Code review
  - Merge squash a main
```

---

## CRONOGRAMA RECOMENDADO

| Semana | Grupo(s) | Horas | Tareas |
|--------|----------|-------|--------|
| **Semana 1** | A | 16h | A.1, A.2, A.3, A.4 (servicios base) |
| **Semana 1** | B | 8h | B.1, B.2 (controllers + routes) |
| **Semana 2** | C | 6h | C.1, C.2 (middlewares) |
| **Semana 2** | D | 4h | D.1 (refactorización index.js) |
| **Semana 2** | E | 12h | E.1, E.2, E.3 (tests exhaustivos) |
| **Semana 2** | F | 4h | F.1, F.2 (documentación + cleanup) |
| **TOTAL** | — | **50h** | Phase 3 Completa |

---

## DEPENDENCIAS Y PREREQUISITOS

### Instalaciones Requeridas
```bash
npm install uuid              # Para generar instanceIds
npm install --save-dev jest   # Ya existe
```

### Conocimiento Previo Requerido
- Arquitectura existente de tec-wa-message-ws (COMPLETADO)
- EventEmitter de Node.js
- Express.js y middlewares
- Baileys API básica
- Testing con Jest

### Archivos Pre-existentes a No Tocar
- `src/services/MessageService.js` (fase 2, seguirá igual)
- `src/dto/MessageDTO.js` (fase 2)
- `src/config/` (solo lectura)

---

## CRITERIOS DE ÉXITO

✅ **Funcionales:**
- 16 requerimientos (R1-R16) implementados
- Todos los tests pasan
- API responde en < 200ms

✅ **No-Funcionales:**
- Cobertura >= 80%
- Zero cross-contamination entre usuarios
- ETag reduce 90% ancho de banda
- Logs estructurados con Pino

✅ **Proceso:**
- Feature branch sin conflictos
- Code review aprobado
- Documentation actualizada
- Zero breaking changes en otras fases
