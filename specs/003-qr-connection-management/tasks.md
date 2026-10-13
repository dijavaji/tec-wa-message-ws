# Tasks: Gestión de Conexiones QR

## Infraestructura y Almacenamiento
- [ ] **T1.1 — Adaptar `SessionService` para multi-instancia.**
  Configurar la lógica de rutas para que cada sesión use `storage/sessions/{instanceId}`.
  _Requirements:_ R6.
- [ ] **T1.2 — Implementar `InstanceManager`.**
  Crear una clase o servicio que mantenga un registro en memoria de las instancias activas (`Map<id, BaileysService>`).
  _Requirements:_ R5, R6.

## API y Ciclo de Vida
- [ ] **T2.1 — Implementar `POST /api/whatsapp/instance`.**
  Crear el controlador y ruta para inicializar instancias dinámicamente.
  _Requirements:_ R5.
- [ ] **T2.2 — Implementar `GET /api/whatsapp/:instanceId/qr`.**
  Endpoint para recuperar el último QR generado en Base64.
  _Requirements:_ R1.
- [ ] **T2.3 — Integrar listeners de eventos en `BaileysService`.**
  Asegurar que cada instancia gestione sus propios eventos de `connection.update` y `creds.update`.
  _Requirements:_ R2.
- [ ] **T2.4 — Lógica de auto-cierre y reintentos de QR.**
  Contador de expiraciones de QR y cierre de socket tras 3 intentos fallidos.
  _Requirements:_ R3, R4.

## Pruebas de Verificación
- [ ] **T3.1 — Tests unitarios para `InstanceManager`.**
  Verificar creación y eliminación de instancias.
  _Requirements:_ R5, R6.
- [ ] **T3.2 — Tests de integración para API de QR.**
  Simular flujo de obtención de QR y expiración.
  _Requirements:_ R1, R3, R4.
