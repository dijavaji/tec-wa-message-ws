# Requirements: 002-message-normalization-forwarding

## User Stories
- **Como Desarrollador**, quiero que el microservicio envíe los mensajes normalizados al orquestador para que el sistema de IA pueda procesarlos.
- **Como Arquitecto de Datos**, quiero asegurar que el `MessageDTO` incluya metadatos del dispositivo para análisis de usuario.
- **Como Desarrollador**, quiero que los datos enviados sean validados y sanitizados para prevenir errores en el orquestador.

## Requerimientos EARS

### Requerimiento R1: Extensión de MessageDTO
- **User Story**: Como Desarrollador, quiero metadatos adicionales en el DTO para enriquecer la información del mensaje.
- **Criterios de Aceptación**:
  1. **THE SYSTEM SHALL** incluir en `MessageDTO` los campos: `device` (web/android/ios) y `isGroup`.
  2. **WHEN** se reciba un mensaje, **THE SYSTEM SHALL** extraer el nombre del dispositivo desde el `msg.key`.

### Requerimiento R2: Validación y Sanitización
- **User Story**: Como Desarrollador, quiero asegurar la integridad de los datos antes del envío.
- **Criterios de Aceptación**:
  1. **WHEN** se genera un `MessageDTO`, **THE SYSTEM SHALL** validar que cumple con el esquema definido.
  2. **THE SYSTEM SHALL** sanitizar caracteres especiales en el campo `content` para evitar inyecciones.

### Requerimiento R3: Forwarding REST (Fire & Forget)
- **User Story**: Como Desarrollador, quiero que los mensajes se envíen al orquestador con el formato exacto requerido por su API.
- **Criterios de Aceptación**:
  1. **WHEN** un mensaje es normalizado con éxito, **THE SYSTEM SHALL** realizar un `POST` a la URL definida en `ORCHESTRATOR_URL`.
  2. **THE SYSTEM SHALL** enviar el siguiente JSON: `{ "senderId": string, "text": string, "assistantName": "tec_praxis_InnovaBot", "createdBy": "app-wps" }`.
  3. **IF** el orquestador responde con un error (4xx o 5xx), **THE SYSTEM SHALL** registrar el error en los logs de Pino y descartar el mensaje.

### Requerimiento R4: Gestión de Errores de Red
- **User Story**: Como Desarrollador, quiero que el sistema sea resiliente ante caídas de red durante el envío.
- **Criterios de Aceptación**:
  1. **IF** hay un error de conexión (timeout o DNS), **THE SYSTEM SHALL** loguear el evento como `ERROR` incluyendo el `msgId`.
