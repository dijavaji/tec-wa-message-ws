# Requirements: 001-foundation-refactoring

## User Stories
- **Como Desarrollador**, quiero una estructura de servicios modular para poder mantener y escalar el microservicio de forma sencilla.
- **Como Administrador del Sistema**, quiero una gestión de sesiones robusta para asegurar que el bot se mantenga conectado de manera fiable.
- **Como Desarrollador**, quiero un `MessageDTO` estandarizado para desacoplar la lógica interna de los cambios en la librería `baileys`.

## Requerimientos EARS

### Requerimiento R1: Inicialización de Servicios
- **User Story**: Como Desarrollador, quiero que el sistema inicialice los servicios de forma ordenada para asegurar la disponibilidad.
- **Criterios de Aceptación**:
  1. **WHEN** el microservicio inicia, **THE SYSTEM SHALL** instanciar `BaileysService`, `SessionService` y `MessageService`.
  2. **IF** falla la carga de la configuración inicial, **THE SYSTEM SHALL** registrar el error y abortar el inicio.

### Requerimiento R2: Gestión de Sesiones
- **User Story**: Como Administrador, quiero que las sesiones se guarden en una ubicación específica para facilitar la persistencia.
- **Criterios de Aceptación**:
  1. **WHEN** se establece una conexión, **THE SYSTEM SHALL** persistir los datos de autenticación en el directorio `storage/`.
  2. **IF** los datos de sesión están corruptos o ausentes, **THE SYSTEM SHALL** iniciar el proceso de re-autenticación (QR).

### Requerimiento R3: Normalización de Mensajes (MessageDTO)
- **User Story**: Como Desarrollador, quiero recibir objetos de mensaje limpios para procesarlos sin depender del formato raw de Baileys.
- **Criterios de Aceptación**:
  1. **WHEN** un mensaje nuevo es recibido (`messages.upsert`), **THE SYSTEM SHALL** transformarlo al formato `MessageDTO`.
  2. **THE SYSTEM SHALL** incluir obligatoriamente en el `MessageDTO`: `id`, `remoteJid`, `pushName`, `messageType`, `content` y `timestamp`.

### Requerimiento R4: Desacoplamiento de Eventos
- **User Story**: Como Desarrollador, quiero que los servicios se comuniquen mediante eventos para evitar dependencias circulares.
- **Criterios de Aceptación**:
  1. **WHILE** `BaileysService` esté activo, **THE SYSTEM SHALL** emitir eventos de conexión y mensajes recibidos.
  2. **WHEN** se establece un evento de mensaje, **THE SYSTEM SHALL** invocar al `MessageService` para su procesamiento.
