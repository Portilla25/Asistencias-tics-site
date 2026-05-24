# Walkthrough: Fix Firestore 1MB Document Size Limit

## Problema
Al retirar un alumno, Firestore rechazaba la escritura porque el documento del módulo (~1.69 MB) superaba el límite de 1 MB.

## Cambios Realizados

Se modificaron **solo 3 funciones** en [app.js](file:///C:/Users/Portilla/Documents/GitHub/Asistencias-tics/src/js/app.js), sin tocar ninguna otra parte del código.

---

### 1. `_syncModuloNow` — Escritura inteligente con chunking dinámico

**Archivo**: [app.js](file:///C:/Users/Portilla/Documents/GitHub/Asistencias-tics/src/js/app.js)

**Antes**: Un solo `fbDb.collection('modulos').doc(key).set(payload)` con todo el módulo.

**Ahora**: 
- Estima el tamaño del payload con `new Blob([JSON.stringify(payload)]).size`
- Si **< 800 KB**: escribe en formato single-doc clásico (retrocompatible)
- Si **≥ 800 KB**: guarda metadata en `modulos/{key}` y divide cada campo pesado en documentos de ~700 KB:
  - `modulos/{key}` → metadata (`fechas`, `emptiedAt`, `_chunked: true`, `_chunkVersion: 2`, `_chunkCounts`)
  - `modulos/{key}__chunk_alumnos_{n}` → partes de `alumnos[]`
  - `modulos/{key}__chunk_retirados_{n}` → partes de `retirados[]`
  - `modulos/{key}__chunk_asistencias_{n}` → partes de `asistencias{}`
  - `modulos/{key}__chunk_motivos_{n}` → partes de `motivos{}`
  - `modulos/{key}__chunk_notas_{n}` → partes de `notas{}`
  - `modulos/{key}__chunk_participacion_{n}` → partes de `participacion{}`
- Limpia chunks antiguos del formato previo (`__alumnos`, `__asistencias`, `__extras`) y chunks sobrantes de escrituras anteriores

---

### 2. `cargarAsistencia` — Lectura con soporte de chunks

**Archivo**: [app.js](file:///C:/Users/Portilla/Documents/GitHub/Asistencias-tics/src/js/app.js)

**Antes**: Leía solo `modulos/{key}` y pasaba a `_hydrateModuloData`.

**Ahora**:
- Lee el doc principal
- Si `rawData._chunked === true`, lee los chunks indicados por `_chunkCounts`
- Mantiene compatibilidad con el formato chunked anterior de 3 documentos
- Reconstruye el objeto completo antes de pasarlo a `_hydrateModuloData`
- Si no es chunked (formato antiguo), funciona exactamente igual que antes

---

### 3. `_mergeModuleState` — No reactivar retirados locales al recargar

**Archivo**: [app.js](file:///C:/Users/Portilla/Documents/GitHub/Asistencias-tics/src/js/app.js)

**Antes**: Si Firebase todavía tenía una versión antigua del módulo, el merge prefería `fb.alumnos` y el alumno retirado volvía a aparecer al recargar.

**Ahora**:
- Une `retirados` locales y remotos
- Filtra `alumnos` para excluir cualquier estudiante que ya esté en `retirados`
- Conserva el retiro local aunque Firebase todavía no haya terminado de sincronizar

---

### 4. `retirarAlumno` — Mejor manejo de errores

**Archivo**: [app.js](file:///C:/Users/Portilla/Documents/GitHub/Asistencias-tics/src/js/app.js)

**Antes**: Si Firebase fallaba, hacía `return` y dejaba al usuario sin confirmación visual.

**Ahora**: 
- El `catch` no bloquea — el alumno se retira localmente sin importar si Firebase falla
- Agenda otro intento de sincronización para los módulos afectados
- El modal se cierra normalmente
- Se muestra historial y un toast diferenciado si la sincronización queda pendiente

---

## Retrocompatibilidad

| Escenario | Comportamiento |
|---|---|
| Doc antiguo (sin `_chunked`) | Se lee como siempre — sin cambios |
| Doc chunked anterior (`_chunked: true` sin `_chunkVersion`) | Se leen los 3 chunk docs y se reconstruye |
| Doc chunked nuevo (`_chunkVersion: 2`) | Se leen los chunks dinámicos y se reconstruye |
| Módulo pequeño (< 800 KB) | Se escribe en formato single-doc clásico |
| Módulo grande (≥ 800 KB) | Se escribe en formato chunked automáticamente |

## Build & Deploy
- ✅ Build exitoso con Vite (`vite build`)
- ✅ Archivos copiados a `Asistencias-tics-site`
- El bundle JS anterior (`index-tkAs41Oz.js`) fue eliminado del sitio
- Nuevo bundle: `index-BU7IIeDM.js` (135 KB)
