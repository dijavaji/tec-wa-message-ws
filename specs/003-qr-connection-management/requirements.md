# Requerimientos: Gestión de Conexiones QR (Phase 3)

Como administrador del sistema, quiero gestionar múltiples instancias de WhatsApp y sus conexiones mediante códigos QR para escalar el servicio de mensajería.

## R1 — Obtención de Código QR
**User Story:** Como desarrollador frontend, quiero obtener el código QR de una instancia específica para mostrarlo al usuario final.
**Acceptance Criteria:**
1. WHEN se realiza una petición `GET /api/whatsapp/:instanceId/qr`
   THE SYSTEM SHALL devolver un JSON con el string Base64 del QR y su `mimeType`.
2. IF la instancia no existe o no ha generado un QR aún
   THE SYSTEM SHALL devolver un error 404 con un mensaje descriptivo.

## R2 — Manejo de Eventos de Ciclo de Vida
**User Story:** Como sistema de orquestación, quiero que las instancias notifiquen su estado para mantener sincronizada la conectividad.
**Acceptance Criteria:**
1. WHILE la instancia está en proceso de conexión
   THE SYSTEM SHALL capturar y procesar eventos `qr`, `ready` y `message_create`.
2. WHEN una instancia cambia a estado `ready`
   THE SYSTEM SHALL actualizar el estado interno y permitir el envío de mensajes.

## R3 — Gestión de Expiración y Reconexión
**User Story:** Como usuario, quiero que el código QR se mantenga actualizado o reintente la conexión si hay fallos temporales.
**Acceptance Criteria:**
1. WHEN el código QR de Baileys expira (aprox. 30s)
   THE SYSTEM SHALL regenerar el código automáticamente hasta un límite definido.
2. IF la conexión WebSocket se interrumpe
   THE SYSTEM SHALL intentar la reconexión automática siguiendo las políticas de Baileys.

## R4 — Auto-cierre por Inactividad (QR)
**User Story:** Como administrador, quiero que el sistema libere recursos si un QR no es escaneado tras varios intentos.
**Acceptance Criteria:**
1. IF el código QR expira 3 veces consecutivas sin ser escaneado
   THE SYSTEM SHALL cerrar la instancia y limpiar los recursos temporales.

## R5 — Inicialización de Instancia
**User Story:** Como administrador, quiero crear nuevas instancias dinámicamente mediante una API.
**Acceptance Criteria:**
1. WHEN se realiza una petición `POST /api/whatsapp/instance` con un `instanceId`
   THE SYSTEM SHALL inicializar un nuevo cliente de Baileys asociado a ese ID.
2. IF el `instanceId` ya está en uso y activo
   THE SYSTEM SHALL devolver un error 409 (Conflict).

## R6 — Soporte Multi-instancia
**User Story:** Como sistema, quiero que cada instancia tenga su propio almacenamiento persistente para evitar conflictos.
**Acceptance Criteria:**
1. THE SYSTEM SHALL almacenar las credenciales de cada instancia en `storage/sessions/{instanceId}/`.
2. WHILE existan múltiples instancias activas
   THE SYSTEM SHALL aislar los sockets y eventos de cada una.

## Trazabilidad
- R1 → `test_api_qr_retrieval`
- R2 → `test_lifecycle_events`
- R3 → `test_qr_regeneration`
- R4 → `test_instance_autoclose`
- R5 → `test_api_instance_creation`
- R6 → `test_session_isolation`
