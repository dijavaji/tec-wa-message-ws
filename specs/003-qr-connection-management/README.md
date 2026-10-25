# Feature 003: QR Connection Management

**Estado:** 🔵 En Especificación  
**Rama:** `feature/003-qr-connection-management`  
**Estimación:** 3-4 sprints (2 semanas, ~50 horas)  
**Propietario:** Backend Team  

---

## 📋 Descripción Ejecutiva

Esta feature habilita la gestión de **múltiples instancias independientes de WhatsApp** a través de una REST API, permitiendo que diferentes usuarios del frontend conecten sus propios números de WhatsApp sin interferencias.

**Problema:** Actualmente solo hay 1 número de WhatsApp por despliegue.  
**Solución:** Cada usuario obtiene su propia instancia con QR en Base64, persistencia automática, y polling optimizado (ETag).

---

## 🎯 Objetivos

✅ Multi-tenancy: Múltiples usuarios simultáneos sin cross-contamination  
✅ QR REST API: Endpoints para obtener QR, estado, crear/eliminar instancias  
✅ Caché Inteligente: ETag para reducir ancho de banda 90%  
✅ Persistencia: Recuperación automática de sesiones sin nuevo QR  
✅ Production-Ready: Logging estructurado, error handling, 80%+ cobertura de tests  

---

## 📂 Contenido de Este Directorio

| Archivo | Propósito |
|---------|-----------|
| **requirements.md** | Especificación EARS de 16 requerimientos (R1-R16) |
| **design.md** | Arquitectura con 6 secciones + diagramas Mermaid |
| **tasks.md** | Plan ejecutable con GROUP A-F y sub-tareas |
| **README.md** | Este archivo (guía rápida) |

---

## 🚀 Inicio Rápido

### Para Entender la Feature:
1. Leer **design.md** Sección 2 (SOLUCIÓN PROPUESTA)
2. Revisar diagramas Mermaid de flujo de datos
3. Leer **requirements.md** (primeros 5 requerimientos)

### Para Implementar:
1. Crear rama: `git checkout -b feature/003-qr-connection-management`
2. Seguir **tasks.md** en orden GROUP A → B → C → D → E → F
3. Ejecutar tests después de cada GROUP: `npm test`
4. Hacer commits atómicos por task

### Para Revisar Código:
1. Verificar cobertura: `npm test -- --coverage`
2. Validar logging: Pino en lugar de console.log
3. Revisar error handling: Errores custom classes
4. Validar isolamiento: Tests de cross-contamination

---

## 📊 Arquitectura de Alto Nivel

```
Frontend (React)
    ↓
REST API (/api/whatsapp/*)
    ↓
WhatsAppController (lógica)
    ↓
BaileysInstanceManager (registry Singleton)
    ├─→ BaileysService [User1]
    ├─→ BaileysService [User2]
    └─→ BaileysService [UserN]
         ↓
    SessionService (persistencia)
         ↓
    QRService (Base64 + ETag)
         ↓
    WhatsApp (Baileys WebSocket)
```

---

## 🔑 Conceptos Clave

### Multi-Instance Registry
- **BaileysInstanceManager**: Singleton que mantiene Map<userId, BaileysService>
- Garantiza instancias independientes simultáneamente
- Acceso O(1) por userId

### Caché Inteligente con ETag
- **Estrategia 2** (Polling + Caché HTTP 304)
- Frontend hace polling cada 2s
- Si QR no cambió: respuesta 304 sin body (ancho de banda -90%)
- Si QR cambió: respuesta 200 con nuevo QR

### Persistencia Multi-User
- Estructura: `storage/{userId}/auth_info_baileys/`
- Cada usuario tiene credenciales aisladas
- Recuperación automática en reinicio

### Event-Driven
- BaileysService emite: `qr`, `ready`, `disconnected`, `message`
- InstanceManager escucha y coordina
- MessageService recibe messages para procesar

---

## 📈 Requerimientos (Resumen)

| ID | Aspecto | Descripción |
|----|---------|-------------|
| **R1-R2** | QR API | Obtener QR en Base64, reducción ancho de banda |
| **R3-R4** | Multi-Instance | Gestión de múltiples usuarios, registry rápido |
| **R5-R7** | Persistencia | Recuperación automática, userId injection |
| **R8-R9** | Endpoints | Crear instancia, obtener status |
| **R10-R11** | Validación | Input validation, error handling |
| **R12** | Caché | ETag middleware |
| **R13-R14** | Lifecycle | Eventos de ciclo de vida, cleanup |
| **R15-R16** | Ops | Logging estructurado, tests 80%+ |

**Trazabilidad completa:** Ver `requirements.md` sección final

---

## 🧪 Estrategia de Testing

| Nivel | Tareas | Cobertura |
|-------|--------|-----------|
| **Unit** | QRService, InstanceManager, SessionService, BaileysService, Controller | 100% |
| **Integration** | Multi-user flows, Polling + ETag, Session persistence | 100% |
| **E2E** | Flujo usuario real: crear → QR → conectar → desconectar | Coverage >= 80% |

---

## 🛠️ Decisiones Técnicas Justificadas

1. **Polling + ETag (no WebSocket)**
   - MVP rápido, suficiente latencia para QR
   - Reduce complejidad inicial
   
2. **BaileysInstanceManager Singleton**
   - Guarantía de un único registry
   - Acceso O(1)
   
3. **SessionService por userId**
   - Multi-tenancy limpio
   - Preparado para escala
   
4. **Pino + structured logs**
   - Production-ready
   - Auditable y parseable

Ver `design.md` Sección 5 para justificaciones completas.

---

## 📅 Cronograma

| Semana | Grupos | Horas |
|--------|--------|-------|
| **1** | A (Servicios) + B (Controllers) | 24h |
| **2** | C (Middlewares) + D (Refactor) + E (Tests) + F (Docs) | 26h |
| **TOTAL** | A-F | **50h** |

---

## ✅ Checklist de Entrega

**Código:**
- [ ] Todos los servicios implementados
- [ ] Endpoints REST funcionando
- [ ] Middlewares activos
- [ ] index.js refactorizado
- [ ] Sin console.log (solo Pino)
- [ ] JSDoc en todas las funciones

**Tests:**
- [ ] npm test pasa 100%
- [ ] Coverage >= 80%
- [ ] No hay skipped tests
- [ ] E2E multi-user pasa

**Documentación:**
- [ ] README.md actualizado
- [ ] API reference creado
- [ ] Specs completos
- [ ] No hay datos sensibles

**Proceso:**
- [ ] Rama sin conflictos con main
- [ ] Code review aprobado
- [ ] Merge squash a main

---

## 🔗 Referencias Relacionadas

- **Mission:** `/specs/mission.md` (Multi-Session Scalability objetivo)
- **Tech Stack:** `/specs/tech-stack.md` (Baileys, Express, Pino)
- **Roadmap:** `/specs/roadmap.md` (Phase 3 contexto)

---

## 👥 Contacto y Preguntas

- **Owner:** Backend Team
- **Rama:** `feature/003-qr-connection-management`
- **Para dudas:** Ver design.md Sección 5 (Decisiones Técnicas)

---

**Última actualización:** 2024  
**Versión:** 1.0  
**Estado:** 🔵 En Especificación
