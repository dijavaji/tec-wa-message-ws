# Tasks: 002-message-normalization-forwarding

## 1. Refinamiento de DTO y Validación
- [x] T1.1 — Actualizar `src/dto/MessageDTO.js` para incluir `device` e `isGroup`. Cubre: R1.
- [x] T1.2 — Implementar lógica de sanitización en el `MessageDTO`. Cubre: R2.
- [x] T1.3 — Añadir validación básica de esquema en `MessageDTO`. Cubre: R2.

## 2. Integración con Axios
- [x] T2.1 — Configurar cliente Axios global con timeouts en `src/config/axios.js`. Cubre: R3.
- [x] T2.2 — Extender `MessageService.js` para incluir el método de envío `forwardToOrchestrator`. Cubre: R3.
- [x] T2.3 — Integrar el flujo en el evento `message` dentro de `src/index.js`. Cubre: R3.

## 3. Manejo de Errores y Logs
- [x] T3.1 — Implementar logs detallados para respuestas exitosas y fallidas del orquestador. Cubre: R3.
- [x] T3.2 — Capturar excepciones de red (ECONNREFUSED, ETIMEDOUT). Cubre: R4.

## 4. Verificación
- [x] T4.1 — Crear tests unitarios para la validación y sanitización del DTO. Cubre: R2.
- [x] T4.2 — Crear tests de integración (mockeando Axios) para el flujo de forwarding. Cubre: R3, R4.

## Trazabilidad
- R1 → T1.1
- R2 → T1.2, T1.3, T4.1
- R3 → T2.1, T2.2, T2.3, T3.1, T4.2
- R4 → T3.2, T4.2
