# Especificación de Requerimientos - Feature 003: QR Connection Management

**Última actualización:** 2026
**Estado:** En Especificación
**Versión:** 1.0

---

## CONTEXTO MISIONAL

Esta feature permite que múltiples usuarios del frontend puedan conectar instancias independientes de WhatsApp a través de un gateway REST, proporcionando QR codes en Base64 y manteniendo sesiones persistentes. Se alinea con el objetivo misional de **Multi-Session Scalability** del microservicio `tec-wa-message-ws`.

---

## HISTORIAS DE USUARIO Y CRITERIOS EARS

### Requirement R1
**User Story:** Como desarrollador Frontend, quiero obtener el QR en formato Base64 mediante un endpoint REST para renderizarlo en una aplicación React.

**Acceptance Criteria (EARS)**
1. WHEN un cliente realiza `GET /api/whatsapp/instances/{userId}/qr`
   THE SYSTEM SHALL retornar `{qrBase64: "iVBORw...", mimeType: "image/png"}`

2. IF el QR aún no ha sido generado
   THEN THE SYSTEM SHALL retornar HTTP 204 No Content (sin body)

3. WHILE el QR es válido
   THE SYSTEM SHALL mantener el mismo valor en caché hasta que cambie o expire

---

### Requirement R2
**User Story:** Como usuario del Frontend, quiero que las peticiones de polling no sobrecarguen el servidor con transferencias de datos innecesarias.

**Acceptance Criteria (EARS)**
1. WHEN el cliente realiza múltiples `GET /api/whatsapp/instances/{userId}/qr` consecutivos
   THE SYSTEM SHALL validar el header `If-None-Match` con el ETag del QR

2. IF el ETag coincide (QR sin cambios)
   THEN THE SYSTEM SHALL responder con HTTP 304 Not Modified (sin body, ancho de banda ~90% menor)

3. IF el QR cambió
   THEN THE SYSTEM SHALL responder con HTTP 200 OK, nuevo QR, nuevo ETag

4. WHILE el cliente hace polling cada 2 segundos
   THE SYSTEM SHALL reducir el consumo de ancho de banda comparado con transferencias completas

---

### Requirement R3
**User Story:** Como administrador, quiero que cada usuario pueda conectar múltiples números de WhatsApp de forma independiente.

**Acceptance Criteria (EARS)**
1. WHEN un usuario realiza `POST /api/whatsapp/instances` con `{userId, phoneNumber}`
   THE SYSTEM SHALL crear una nueva instancia de BaileysService única e independiente para ese usuario

2. IF el usuario ya tiene una instancia activa
   THEN THE SYSTEM SHALL retornar HTTP 409 Conflict con mensaje: "Usuario ya tiene una instancia activa"

3. WHILE existen N usuarios diferentes conectados
   THE SYSTEM SHALL mantener N instancias de BaileysService completamente independientes en memoria sin compartir estado

---

### Requirement R4
**User Story:** Como sistema de gestión de instancias, necesito acceder a ellas de forma rápida y eficiente.

**Acceptance Criteria (EARS)**
1. WHEN se requiere recuperar una instancia de BaileysService por userId
   THE SYSTEM SHALL buscarla en un registry (Map) con acceso O(1)

2. IF la instancia no existe
   THE SYSTEM SHALL retornar null sin lanzar excepciones

3. WHILE el sistema está operativo
   THE SYSTEM SHALL mantener un registro en memoria de todas las instancias activas accesible desde BaileysInstanceManager

---

### Requirement R5
**User Story:** Como usuario, quiero que mi sesión de WhatsApp se recupere automáticamente sin necesidad de escanear un nuevo QR cada vez que inicio sesión.

**Acceptance Criteria (EARS)**
1. WHEN se crea una instancia para un userId que ya posee credenciales guardadas en `storage/`
   THE SYSTEM SHALL cargar automáticamente las credenciales del archivo persistido

2. IF las credenciales son válidas y no han expirado
   THEN THE SYSTEM SHALL conectarse a WhatsApp sin mostrar QR (conexión silenciosa)

3. IF las credenciales no son válidas
   THEN THE SYSTEM SHALL generar un nuevo QR para reautenticación

4. WHILE las credenciales existen en storage
   THE SYSTEM SHALL evitar mostrar el QR de nuevo en conexiones posteriores

---

### Requirement R6
**User Story:** Como servicio de persistencia, necesito guardar y recuperar credenciales de múltiples usuarios sin conflictos.

**Acceptance Criteria (EARS)**
1. WHEN se guarden credenciales de diferentes usuarios
   THE SYSTEM SHALL almacenarlas en directorios aislados: `storage/{userId}/auth_info_baileys/`

2. IF se requieren credenciales de un userId específico
   THE SYSTEM SHALL cargarlas de su directorio correspondiente sin mezclar datos de otros usuarios

3. WHILE el sistema reinicia o se redeploya
   THE SYSTEM SHALL preservar las credenciales de todos los usuarios para recuperación posterior

---

### Requirement R7
**User Story:** Como instancia de BaileysService, necesito saber a qué usuario pertenezco para acceder a la sesión correcta.

**Acceptance Criteria (EARS)**
1. WHEN se crea una instancia de BaileysService
   THE SYSTEM SHALL inyectarle el userId en su constructor como parámetro obligatorio

2. IF se ejecuta cualquier método de BaileysService (init, sendMessage, etc.)
   THE SYSTEM SHALL usar ese userId para acceder a las credenciales específicas de ese usuario

3. WHILE se procesa un mensaje entrante
   THE SYSTEM SHALL mantener la asociación userId → BaileysService instance para enrutamiento correcto

---

### Requirement R8
**User Story:** Como Frontend, quiero crear una nueva instancia de WhatsApp para conectar un nuevo número.

**Acceptance Criteria (EARS)**
1. WHEN realizo `POST /api/whatsapp/instances` con `{userId, phoneNumber}`
   THE SYSTEM SHALL validar que userId y phoneNumber sean no-nulos y tengan formato válido

2. IF los parámetros son válidos
   THEN THE SYSTEM SHALL crear la instancia y retornar HTTP 201 Created con `{instanceId, status: "generating_qr"}`

3. IF phoneNumber no tiene formato válido
   THEN THE SYSTEM SHALL retornar HTTP 400 Bad Request con detalles del error

4. IF userId ya tiene una instancia activa
   THEN THE SYSTEM SHALL retornar HTTP 409 Conflict

---

### Requirement R9
**User Story:** Como Frontend, quiero conocer el estado actual de mi instancia de WhatsApp.

**Acceptance Criteria (EARS)**
1. WHEN realizo `GET /api/whatsapp/instances/{userId}/status`
   THE SYSTEM SHALL retornar el estado actual: `{status: "waiting_scan" | "ready" | "disconnected"}`

2. IF la instancia no existe
   THEN THE SYSTEM SHALL retornar HTTP 404 Not Found

3. WHILE la instancia está conectada exitosamente
   THE SYSTEM SHALL retornar status `"ready"` hasta que se desconecte

4. WHILE el usuario no ha escaneado el QR
   THE SYSTEM SHALL retornar status `"waiting_scan"`

---

### Requirement R10
**User Story:** Como API REST, debo validar todos los inputs para garantizar integridad de datos.

**Acceptance Criteria (EARS)**
1. WHEN recibo un `POST /api/whatsapp/instances` sin userId o phoneNumber
   THE SYSTEM SHALL retornar HTTP 400 Bad Request con estructura: `{error: "Campo requerido", field: "userId"}`

2. IF phoneNumber no cumple patrón mínimo (ej: +XX 1234567890)
   THEN THE SYSTEM SHALL rechazarlo con mensaje claro: "Formato de número inválido"

3. IF userId contiene caracteres inválidos
   THEN THE SYSTEM SHALL rechazarlo

4. WHILE proceso requests
   THE SYSTEM SHALL registrar todas las validaciones fallidas en logs estructurados

---

### Requirement R11
**User Story:** Como API, debo manejar errores de forma consistente y predecible.

**Acceptance Criteria (EARS)**
1. WHEN ocurre un error interno no controlado
   THE SYSTEM SHALL responder con HTTP 5xx y estructura: `{error: "...", code: "INTERNAL_ERROR", timestamp: "..."}`

2. IF el error es predecible (usuario no encontrado, sesión expirada)
   THEN THE SYSTEM SHALL responder con HTTP 4xx apropiado (404, 410, etc.)

3. WHILE se ejecuta cualquier endpoint
   THE SYSTEM SHALL capturar excepciones, evitar exponer stack traces al cliente, y retornar JSON válido

4. IF ocurre error de conexión a WhatsApp
   THEN THE SYSTEM SHALL marcar instancia como `"disconnected"` y permitir reconexión

---

### Requirement R12
**User Story:** Como optimizador de ancho de banda, quiero implementar caché HTTP inteligente en el endpoint de QR.

**Acceptance Criteria (EARS)**
1. WHEN el cliente realiza `GET /api/whatsapp/instances/{userId}/qr` con header `If-None-Match: "abc123"`
   THE SYSTEM SHALL generar hash actual del QR y compararlo

2. IF hash actual === hash del cliente
   THEN THE SYSTEM SHALL responder con HTTP 304 Not Modified (sin body, header ETag mantenido)

3. IF hash cambió
   THE SYSTEM SHALL responder con HTTP 200 OK, nuevo QR en body, nuevo ETag en header

4. WHILE cliente hace polling
   THE SYSTEM SHALL evitar enviar el mismo QR repetidamente (reducir ancho de banda ~90%)

---

### Requirement R13
**User Story:** Como sistema, necesito mantener coherencia en el ciclo de vida de cada instancia.

**Acceptance Criteria (EARS)**
1. WHEN un usuario crea una instancia
   THE SYSTEM SHALL emitir evento interno `instance:created` con metadatos (userId, timestamp)

2. IF el usuario escanea el QR y WhatsApp autentica
   THE SYSTEM SHALL emitir evento `instance:ready`

3. WHILE la instancia está activa
   THE SYSTEM SHALL permitir enviar y recibir mensajes (flujo integrado con MessageService)

4. IF WhatsApp se desconecta por inactividad o error
   THE SYSTEM SHALL emitir evento `instance:disconnected` y permitir reconexión automática

---

### Requirement R14
**User Story:** Como Frontend, quiero poder desconectar una instancia de forma limpia.

**Acceptance Criteria (EARS)**
1. WHEN realizo `DELETE /api/whatsapp/instances/{userId}`
   THE SYSTEM SHALL terminar la instancia, cerrar socket, liberar recursos

2. IF la instancia no existe
   THEN THE SYSTEM SHALL retornar HTTP 404 Not Found

3. IF la instancia existe
   THEN THE SYSTEM SHALL retornar HTTP 204 No Content

4. WHILE se elimina la instancia
   THE SYSTEM SHALL removerla del registry y emitir evento `instance:deleted`

---

### Requirement R15
**User Story:** Como desarrollador y operador, quiero logging estructurado en todos los endpoints para diagnóstico y auditoría.

**Acceptance Criteria (EARS)**
1. WHEN se crea/recupera/deleta una instancia
   THE SYSTEM SHALL loguear con Pino: `{level: "info", userId, action, timestamp, instanceId}`

2. IF ocurre un error
   THE SYSTEM SHALL loguear stack trace completo, pero sin exponer al cliente

3. WHILE el sistema opera
   THE SYSTEM SHALL mantener logs en formato JSON estructurado para análisis y alertas

4. IF se activa un endpoint
   THE SYSTEM SHALL loguear: método HTTP, ruta, status response, latencia, userId

---

### Requirement R16
**User Story:** Como QA, necesito cobertura exhaustiva de tests para validar comportamiento multi-usuario.

**Acceptance Criteria (EARS)**
1. WHEN ejecuto `npm test`
   THE SYSTEM SHALL correr 100% de tests unitarios + integration + E2E

2. IF hay instancias multi-usuario simultáneas
   THE SYSTEM SHALL validar que no hay cross-contamination de estado entre usuarios

3. WHILE agrego features o cambio servicios
   THE SYSTEM SHALL mantener cobertura de código >= 80%

4. IF un test falla
   THE SYSTEM SHALL fallar la suite completa antes de permitir merge a main

---

## TRAZABILIDAD (Requirement → Test)

| Requerimiento | Test(s) | Estado |
|---------------|---------|--------|
| R1 | `test_qr_service_base64_format.js` | TODO |
| R2 | `test_etag_middleware_cache.js`, `test_etag_middleware_update.js` | TODO |
| R3 | `test_instance_manager_multi_user.js` | TODO |
| R4 | `test_instance_manager_registry_performance.js` | TODO |
| R5 | `test_session_service_recovery.js` | TODO |
| R6 | `test_session_service_multi_user_storage.js` | TODO |
| R7 | `test_baileys_service_user_id_injection.js` | TODO |
| R8 | `test_controller_create_instance_valid.js`, `test_controller_create_instance_conflict.js` | TODO |
| R9 | `test_controller_get_status.js` | TODO |
| R10 | `test_validators_phone_number.js`, `test_validators_user_id.js` | TODO |
| R11 | `test_error_handler_middleware.js` | TODO |
| R12 | `test_etag_cache_performance.js` | TODO |
| R13 | `test_instance_lifecycle_events.js` | TODO |
| R14 | `test_controller_delete_instance.js` | TODO |
| R15 | `test_logging_structure.js` | TODO |
| R16 | `test_e2e_multi_user_complete_flow.js` | TODO |

---

## MÉTRICAS DE ACEPTACIÓN

- ✅ Todos los tests pasan (100% suite)
- ✅ Cobertura de código >= 80%
- ✅ No hay warnings en logs de producción
- ✅ Múltiples usuarios funcionan sin conflictos de estado
- ✅ ETag reduce ancho de banda 90% en polling
- ✅ Credenciales se recuperan automáticamente sin nuevo QR
- ✅ Error handling es consistente en todos los endpoints
- ✅ Documentación API actualizada
- ✅ Feature branch integra sin conflictos a main

---

## NOTAS DE DISEÑO

- Se implementa **Estrategia 2: Polling + Caché ETag** para MVP (sin WebSockets inicialmente)
- BaileysInstanceManager es **Singleton** para garantizar un único registry
- SessionService **isola por userId** usando `storage/{userId}/` para persistencia
- Todos los servicios extienden **EventEmitter** para comunicación inter-servicios
- Se mantiene coherencia con **Mission** de multi-session scalability
