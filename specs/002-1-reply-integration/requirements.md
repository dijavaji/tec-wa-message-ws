# Requirements: 002-1-reply-integration

## User Stories
- **Como Desarrollador**, quiero que el microservicio envíe la respuesta de la IA de vuelta al usuario para completar el ciclo de conversación.
- **Como Administrador**, quiero asegurar que no se intenten enviar mensajes vacíos para evitar errores en la API de WhatsApp.

## Requerimientos EARS

### Requerimiento R1: Envío de Respuesta a WhatsApp
- **User Story**: Como Desarrollador, quiero cerrar el ciclo de comunicación enviando la respuesta del orquestador al usuario.
- **Criterios de Aceptación**:
  1. **WHEN** el orquestador responde con éxito (`success: true`) y el campo `text` no está vacío, **THE SYSTEM SHALL** invocar el envío de mensaje en WhatsApp.
  2. **THE SYSTEM SHALL** usar el `remoteJid` del mensaje original como destinatario.

### Requerimiento R2: Validación de Respuesta
- **User Story**: Como Administrador, quiero evitar envíos innecesarios o erróneos.
- **Criterios de Aceptación**:
  1. **IF** la respuesta del orquestador está vacía o el campo `success` es `false`, **THE SYSTEM SHALL** loguear la omisión y **SHALL NOT** intentar enviar nada a WhatsApp.

### Requerimiento R3: Robustez del Envío
- **User Story**: Como Desarrollador, quiero que fallos en el envío de respuesta no bloqueen el microservicio.
- **Criterios de Aceptación**:
  1. **IF** el envío a través de Baileys falla (ej. desconexión), **THE SYSTEM SHALL** registrar el error en Pino como `WARN` o `ERROR` y continuar su ejecución.
