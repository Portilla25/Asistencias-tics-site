# Walkthrough: Fix Firestore 1MB Document Size Limit

## Problema
Al retirar un alumno, Firestore rechazaba la escritura porque el documento del módulo (~1.69 MB) superaba el límite de 1 MB.

## Cambios Realizados

Se modificaron **solo 3 funciones** en [app.js](file:///C:/Users/Portilla/Documents/GitHub/Asistencias-tics/src/js/app.js), sin tocar ninguna otra parte del código.

---

### 1. `_syncModuloNow` — Escritura inteligente con chunking automático

**Archivo**: [app.js L183-L241](file:///C:/Users/Portilla/Documents/GitHub/Asistencias-tics/src/js/app.js#L183-L241)

**Antes**: Un solo `fbDb.collection('modulos').doc(key).set(payload)` con todo el módulo.

**Ahora**: 
- Estima el tamaño del payload con `new Blob([JSON.stringify(payload)]).size`
- Si **< 800 KB**: escribe en formato single-doc clásico (retrocompatible)
- Si **≥ 800 KB**: divide en 4 documentos usando `batch.set()` atómico:
  - `modulos/{key}` → metadata (`fechas`, `emptiedAt`, `_chunked: true`)
  - `modulos/{key}__alumnos` → `alumnos[]` + `retirados[]`
  - `modulos/{key}__asistencias` → `asistencias{}`
  - `modulos/{key}__extras` → `motivos{}`, `notas{}`, `participacion{}`

---

### 2. `cargarAsistencia` — Lectura con soporte de chunks

**Archivo**: [app.js L1357-L1406](file:///C:/Users/Portilla/Documents/GitHub/Asistencias-tics/src/js/app.js#L1357-L1406)

**Antes**: Leía solo `modulos/{key}` y pasaba a `_hydrateModuloData`.

**Ahora**:
- Lee el doc principal
- Si `rawData._chunked === true`, lee los 3 chunk docs en paralelo con `Promise.all`
- Reconstruye el objeto completo antes de pasarlo a `_hydrateModuloData`
- Si no es chunked (formato antiguo), funciona exactamente igual que antes

---

### 3. `retirarAlumno` — Mejor manejo de errores

**Archivo**: [app.js L2674-L2679](file:///C:/Users/Portilla/Documents/GitHub/Asistencias-tics/src/js/app.js#L2674-L2679)

**Antes**: Si Firebase fallaba, hacía `return` y dejaba al usuario sin confirmación visual.

**Ahora**: 
- El `catch` no bloquea — el alumno se retira localmente sin importar si Firebase falla
- El modal se cierra normalmente
- Se muestra el historial y toast de éxito
- Firebase se sincronizará en el próximo intento automático

---

## Retrocompatibilidad

| Escenario | Comportamiento |
|---|---|
| Doc antiguo (sin `_chunked`) | Se lee como siempre — sin cambios |
| Doc nuevo (`_chunked: true`) | Se leen los 3 chunk docs y se reconstruye |
| Módulo pequeño (< 800 KB) | Se escribe en formato single-doc clásico |
| Módulo grande (≥ 800 KB) | Se escribe en formato chunked automáticamente |

## Build & Deploy
- ✅ Build exitoso con Vite (`vite build`)
- ✅ Archivos copiados a `Asistencias-tics-site`
- El bundle JS antiguo (`index-CGSJXisA.js`) fue eliminado
- Nuevo bundle: `index-tkAs41Oz.js` (133 KB)
