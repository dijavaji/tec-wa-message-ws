# Índice - Feature 003: QR Connection Management

**Navegación Rápida de Documentación**

---

## 📋 Documentos de Especificación

### 1. **README.md** (START HERE)
   - 📌 Descripción ejecutiva
   - 🎯 Objetivos principales
   - 🚀 Inicio rápido
   - ✅ Checklist de entrega
   - **Tiempo de lectura:** 5 minutos

### 2. **requirements.md** (WHAT)
   - 📊 Contexto misional
   - 📖 16 Historias de usuario (R1-R16)
   - 🎯 Criterios EARS completos
   - 🔗 Trazabilidad Requerimiento → Test
   - 📈 Métricas de aceptación
   - **Tiempo de lectura:** 20 minutos

### 3. **design.md** (HOW)
   - 🧠 Problema y contexto
   - 🏗️ Solución de alto nivel
   - 🔌 Componentes clave (6 diagramas)
   - 🎨 Patrones de diseño
   - ⚖️ Decisiones técnicas justificadas
   - 📦 Consideraciones de escalabilidad
   - 🔌 Endpoints specification
   - **Tiempo de lectura:** 30 minutos

### 4. **tasks.md** (EXECUTE)
   - 📋 6 Grupos de tareas (A-F)
   - ✅ Sub-tareas detalladas con requirements
   - 📅 Cronograma recomendado
   - 🧪 Estrategia de testing
   - ✅ Criterios de éxito
   - **Tiempo de lectura:** 15 minutos + tiempo de ejecución: 50 horas

---

## 🎯 Cómo Usar Esta Documentación

### Si eres **Product Owner / Stakeholder**:
1. Leer: **README.md** (descripción)
2. Revisar: **requirements.md** (EARS criteria)
3. Resultado: Entiender qué se entrega

### Si eres **Architect / Technical Lead**:
1. Leer: **design.md** completo (6 secciones)
2. Revisar: Diagramas Mermaid
3. Validar: Decisiones técnicas (Sección 5)
4. Resultado: Aprobar arquitectura

### Si eres **Developer (Implementador)**:
1. Leer: **design.md** Secciones 1-3 (context + solution + components)
2. Seguir: **tasks.md** paso a paso (GROUP A → B → C → D → E → F)
3. Escribir: Código + Tests
4. Ejecutar: `npm test` después de cada GROUP
5. Resultado: Feature implementado

### Si eres **QA / Tester**:
1. Leer: **requirements.md** (R1-R16)
2. Revisar: **tasks.md** sección E (Tests)
3. Ejecutar: Test plan E2E
4. Validar: Cobertura >= 80%
5. Resultado: Feature validado

---

## 📊 Estructura de Directorios

```
specs/003-qr-connection-management/
├── INDEX.md                  ← Estás aquí
├── README.md                 ← Descripción ejecutiva
├── requirements.md           ← Especificación EARS (16 reqs)
├── design.md                 ← Arquitectura + diagramas
├── tasks.md                  ← Plan ejecutable (GROUP A-F)
└── (código estará en src/)
```

---

## 🔑 Conceptos Clave (Quick Reference)

| Concepto | Ubicación | Descripción |
|----------|-----------|-------------|
| **BaileysInstanceManager** | design.md Sec 3.2 | Singleton registry de instancias |
| **Multi-tenancy** | design.md Sec 1 | Múltiples usuarios sin cross-contamination |
| **ETag Middleware** | design.md Sec 3.6 | Caché HTTP 304 (90% menos ancho de banda) |
| **SessionService** | design.md Sec 3.3 | Persistencia por userId |
| **EARS Criteria** | requirements.md | Formato de especificación de tests |
| **GROUP A-F** | tasks.md | 6 grupos de tareas en orden |

---

## 🧪 Testing Strategy Overview

```
Unit Tests (100% cobertura)
├── QRService
├── BaileysInstanceManager
├── SessionService
├── BaileysService
├── WhatsAppController
└── Middlewares

Integration Tests
├── Multi-user simultaneous
├── Session persistence across restart
└── Polling + ETag cache

E2E Tests (flujo real)
├── User A: create → QR → scan → ready
├── User B: create → QR → scan → ready (independiente)
└── Cross-user isolation validation
```

---

## 📈 Requerimientos Quick List

**Core QR Features (R1-R2):**
- R1: QR en Base64 vía REST
- R2: Caché con ETag 304

**Multi-Instance (R3-R4):**
- R3: Múltiples usuarios independientes
- R4: Registry O(1) lookup

**Persistencia (R5-R7):**
- R5: Recuperación sin nuevo QR
- R6: Isolación por usuario en storage
- R7: userId inyectado en BaileysService

**API & Endpoints (R8-R11):**
- R8: POST crear instancia
- R9: GET status
- R10: Validación de inputs
- R11: Error handling consistente

**Optimización & Ops (R12-R16):**
- R12: ETag cache optimization
- R13: Ciclo de vida eventos
- R14: DELETE cleanup
- R15: Logging estructurado
- R16: Tests 80%+ cobertura

---

## 🔄 Flujo de Trabajo Recomendado

```
1. LEE README.md (5 min)
   ↓
2. ENTIENDE requirements.md (20 min)
   ↓
3. ESTUDIA design.md (30 min)
   ↓
4. EJECUTA tasks.md GROUP A (8 horas)
   ↓
5. EJECUTA tasks.md GROUP B (8 horas)
   ↓
6. EJECUTA tasks.md GROUP C (6 horas)
   ↓
7. EJECUTA tasks.md GROUP D (4 horas)
   ↓
8. EJECUTA tasks.md GROUP E (12 horas)
   ↓
9. EJECUTA tasks.md GROUP F (4 horas)
   ↓
10. VERIFICA: npm test, coverage >= 80%
   ↓
11. MERGE: feature/003-qr-connection-management → main
```

---

## ❓ FAQ

### ¿Cuánto tiempo toma implementar esto?
**~50 horas de desarrollo** (3-4 sprints, 2 semanas)

### ¿Hay breaking changes?
**NO.** Phase 2 (MessageService, MessageDTO) sigue igual. Phase 1 servicios se adaptan pero mantienen backward compatibility.

### ¿Cuál es la diferencia con WebSocket?
**MVP rápido con Polling + ETag.** Futuro: WebSocket en Phase 6.

### ¿Qué pasa si un usuario pierde conexión?
**Auto-reconnect.** BaileysService intenta reconectar en 5s. Frontend puede verificar status.

### ¿Se pierde el QR en reinicio?
**NO.** Credenciales se guardan en `storage/{userId}/`. QR solo se necesita una vez. En reinicio: recupera credenciales, conecta silenciosamente.

### ¿Cuántas instancias simultáneas puedo tener?
**~50 por pod (MVP).** Cada conexión ~100KB. Futuro: descentralizar con Redis.

---

## 🚦 Checklist de Lectura

- [ ] Leí README.md (5 min)
- [ ] Leí requirements.md (20 min)
- [ ] Leí design.md (30 min)
- [ ] Entiendo los 6 componentes clave
- [ ] Puedo explicar BaileysInstanceManager
- [ ] Entiendo ETag + caché 304
- [ ] Conozco los 6 GROUP A-F
- [ ] Listo para ejecutar tasks.md

---

## 🔗 Referencias Externas

- **Baileys GitHub:** https://github.com/WhiskeySockets/Baileys
- **Express Middleware:** https://expressjs.com/en/guide/using-middleware.html
- **Pino Logger:** https://getpino.io/
- **Jest Testing:** https://jestjs.io/
- **HTTP Status Codes:** https://httpwg.org/specs/rfc7231.html#status.304

---

## 📞 Soporte

**¿Dudas sobre especificación?** → Ver requirements.md  
**¿Dudas sobre diseño?** → Ver design.md Sección 5 (Decisiones)  
**¿Dudas sobre implementación?** → Ver tasks.md con detalles  
**¿Dudas técnicas generales?** → Ver design.md Sección 3 (Componentes)

---

**Última actualización:** 2024  
**Versión:** 1.0  
**Estado:** 🔵 En Especificación - Listo para Implementación  

👉 **SIGUIENTE PASO:** Leer `README.md` para descripción ejecutiva
