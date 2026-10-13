# Diseño: Gestión de Conexiones QR

## 1. Introducción
Este diseño detalla la transición del microservicio de una única sesión estática a un sistema capaz de gestionar múltiples instancias dinámicas de WhatsApp. Se enfoca en la exposición de una API REST para el control de sesiones y la recuperación de códigos QR.

## 2. Arquitectura de Componentes
El sistema evolucionará a un modelo de "Manager" que orquestará múltiples servicios de Baileys.

```mermaid
graph TD
    API[Express API] --> IM[InstanceManager]
    IM --> BS1[BaileysService: inst_1]
    IM --> BS2[BaileysService: inst_2]
    BS1 --> SS1[SessionService: inst_1]
    BS2 --> SS2[SessionService: inst_2]
    SS1 --> Disk[(Storage/Sessions/inst_1)]
    SS2 --> Disk2[(Storage/Sessions/inst_2)]
```

## 3. Detalles de Componentes
- **InstanceManager:** Singleton que mantiene el mapa de instancias activas. Maneja el ciclo de vida (crear, destruir, buscar).
- **BaileysService (Refactor):** Se instanciará por cada conexión. Mantendrá el estado del último QR generado y el contador de reintentos.
- **SessionService (Refactor):** Recibirá el `instanceId` en su constructor para determinar la ruta de almacenamiento de credenciales.

## 4. Flujo de Datos (Secuencia de Conexión QR)

```mermaid
sequenceDiagram
    participant User
    participant API
    participant IM as InstanceManager
    participant BS as BaileysService
    
    User->>API: POST /api/whatsapp/instance {id: "inst_1"}
    API->>IM: createInstance("inst_1")
    IM->>BS: init()
    BS->>BS: generateQR
    BS-->>IM: qr_generated_event
    
    User->>API: GET /api/whatsapp/inst_1/qr
    API->>IM: getQR("inst_1")
    IM-->>API: {qrBase64: "...", mimeType: "image/png"}
    API-->>User: JSON Response
```

## 5. Especificación de Interfaces
### POST /api/whatsapp/instance
- **Body:** `{ "instanceId": "string" }`
- **Success:** 201 Created
- **Error:** 409 Conflict (si ya existe)

### GET /api/whatsapp/:instanceId/qr
- **Success:** 200 OK
  ```json
  {
    "qrBase64": "iVBORw0KGgoAAAANSUhEUg...",
    "mimeType": "image/png"
  }
  ```
- **Error:** 404 Not Found (instancia no existe), 202 Accepted (instancia existe pero QR aún no generado).

## 6. Estrategia de Pruebas
- **Mocking de Baileys:** Utilizar mocks para los eventos de socket y evitar conexiones reales durante los tests unitarios.
- **Validación de Almacenamiento:** Verificar que tras la creación de una instancia, se cree la carpeta correspondiente en `storage/sessions/`.
- **Test de Límite de QR:** Simular 3 eventos de QR sin escaneo y verificar que la instancia invoque su método de cierre/destrucción.
