# Tasks: 001-foundation-refactoring

## 1. Preparación y Estructura Base
- [x] T1.1 — Crear estructura de carpetas `src/config`, `src/services`, `src/dto`. Cubre: R1.
- [x] T1.2 — Configurar `Pino` logger centralizado en `src/config/logger.js`. Cubre: R1.
- [x] T1.3 — Mover lógica de configuración de `env` a `src/config/index.js`. Cubre: R1.

## 2. Implementación de Servicios
- [x] T2.1 — Implementar `SessionService` para gestionar `storage/`. Cubre: R2.
- [x] T2.2 — Refactorizar `WhatsAppClient.js` en `BaileysService`. Cubre: R1, R4.
- [x] T2.3 — Implementar `MessageService` con lógica de normalización. Cubre: R3.

## 3. Integración y Refactorización Final
- [x] T3.1 — Actualizar `src/index.js` para inicializar los nuevos servicios. Cubre: R1.
- [x] T3.2 — Implementar `MessageDTO.js` en `src/dto/`. Cubre: R3.
- [x] T3.3 — Verificar comunicación por eventos entre `BaileysService` y `MessageService`. Cubre: R4.

## 4. Pruebas y Validación
- [x] T4.1 — Añadir tests unitarios para `SessionService`. Cubre: R2.
- [x] T4.2 — Añadir tests unitarios para `MessageService` (normalización). Cubre: R3.
- [x] T4.3 — Verificar persistencia de sesión en el nuevo directorio `storage/`. Cubre: R2.

## Trazabilidad
- R1 → T1.1, T1.2, T1.3, T2.2, T3.1
- R2 → T2.1, T4.1, T4.3
- R3 → T2.3, T3.2, T4.2
- R4 → T2.2, T3.3
