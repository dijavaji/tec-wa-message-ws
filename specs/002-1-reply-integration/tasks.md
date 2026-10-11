# Tasks: 002-1-reply-integration

## 1. Actualización de BaileysService
- [x] T1.1 — Implementar método `sendTextMessage(to, text)` en `BaileysService.js`. Cubre: R1, R3.
- [x] T1.2 — Asegurar el uso de logs de Pino en el método de envío. Cubre: R3.

## 2. Integración en index.js (Cerrar el ciclo)
- [x] T2.1 — Actualizar el listener de `messageService.on('message')` para procesar la respuesta. Cubre: R1.
- [x] T2.2 — Implementar validación de `response.success` y `text` no vacío. Cubre: R2.
- [x] T2.3 — Manejar excepciones en el flujo de respuesta para evitar caídas del proceso. Cubre: R3.

## 3. Verificación y Tests
- [x] T3.1 — Crear test `src/tests/Integration.test.js` que simule el flujo completo. Cubre: R1, R2.
- [x] T3.2 — Verificar que mensajes vacíos no disparan el envío a WhatsApp. Cubre: R2.

## Trazabilidad
- R1 → T1.1, T2.1
- R2 → T2.2, T3.2
- R3 → T1.1, T1.2, T2.3, T3.1
