// Simulates exactly what downloadFromFirestore + loadInitialAppData does
// Run: node institute-attendance-management-system/test-full-flow.mjs

async function getAllDocs() {
  let all = [];
  let token = '';
  do {
    const url = 'https://firestore.googleapis.com/v1/projects/asistencias-redes/databases/(default)/documents/modulos?pageSize=100' + (token ? '&pageToken=' + token : '');
    const r = await fetch(url);
    const j = await r.json();
    all = all.concat(j.documents || []);
    token = j.nextPageToken || '';
  } while (token);
  return all;
}

function convertFirestoreValue(val) {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(convertFirestoreValue);
  }
  if ('mapValue' in val) {
    const obj = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      obj[k] = convertFirestoreValue(v);
    }
    return obj;
  }
  return val;
}

function convertDoc(doc) {
  const obj = {};
  for (const [k, v] of Object.entries(doc.fields || {})) {
    obj[k] = convertFirestoreValue(v);
  }
  return obj;
}

async function main() {
  console.log('Fetching all docs from Firebase...');
  const allDocs = await getAllDocs();
  console.log(`Total docs: ${allDocs.length}`);

  // Simulate downloadFromFirestore logic
  const state = {};
  const chunks = [];

  allDocs.forEach(doc => {
    const id = doc.name.split('/').pop();
    const data = convertDoc(doc);
    if (id.includes('__chunk_')) {
      chunks.push({ id, data });
    } else {
      state[id] = data;
    }
  });

  console.log(`\nModules: ${Object.keys(state).length}, Chunks: ${chunks.length}`);

  // Reassemble chunked modules (same logic as downloadFromFirestore)
  for (const [moduleId, module] of Object.entries(state)) {
    if (module._chunked) {
      const counts = module._chunkCounts || {};
      console.log(`\n${moduleId}: _chunked=${module._chunked}, _chunkCounts=`, counts);
      for (const field of Object.keys(counts)) {
        const count = counts[field];
        let reassembled = Array.isArray(module[field]) ? [] : {};
        for (let i = 0; i < count; i++) {
          const chunkId = `${moduleId}__chunk_${field}_${i}`;
          const chunkData = chunks.find(c => c.id === chunkId)?.data;
          if (chunkData) {
            if (Array.isArray(reassembled)) {
              Object.keys(chunkData).sort((a, b) => Number(a) - Number(b)).forEach(k => reassembled.push(chunkData[k]));
            } else {
              Object.assign(reassembled, chunkData);
            }
          } else {
            console.log(`  WARNING: chunk ${chunkId} NOT FOUND`);
          }
        }
        console.log(`  ${field}: reassembled ${Array.isArray(reassembled) ? reassembled.length + ' items' : Object.keys(reassembled).length + ' keys'}`);
        module[field] = reassembled;
      }
    }
  }

  // Now simulate loadInitialAppData logic
  console.log('\n--- Simulating loadInitialAppData ---');
  
  // Build asistencias
  let totalAsistencias = 0;
  const dateRange = { min: '9999', max: '0000' };
  
  for (const [moduleId, module] of Object.entries(state)) {
    const asistencias = module.asistencias || {};
    const studentIds = Object.keys(asistencias);
    let moduleAsistCount = 0;
    
    for (const [studentId, byDate] of Object.entries(asistencias)) {
      if (typeof byDate !== 'object' || byDate === null) continue;
      for (const [fecha, estado] of Object.entries(byDate)) {
        moduleAsistCount++;
        totalAsistencias++;
        if (fecha < dateRange.min) dateRange.min = fecha;
        if (fecha > dateRange.max) dateRange.max = fecha;
      }
    }
    
    if (moduleAsistCount > 0) {
      console.log(`${moduleId}: ${studentIds.length} students, ${moduleAsistCount} asistencia entries`);
    }
  }
  
  console.log(`\nTotal asistencias: ${totalAsistencias}`);
  console.log(`Date range: ${dateRange.min} -> ${dateRange.max}`);
  
  // Check specifically for dates after May 18
  let afterMay18 = 0;
  for (const [moduleId, module] of Object.entries(state)) {
    const asistencias = module.asistencias || {};
    for (const [studentId, byDate] of Object.entries(asistencias)) {
      if (typeof byDate !== 'object' || byDate === null) continue;
      for (const [fecha, estado] of Object.entries(byDate)) {
        if (fecha > '2026-05-18') {
          afterMay18++;
        }
      }
    }
  }
  console.log(`Asistencias after 2026-05-18: ${afterMay18}`);
}

main().catch(console.error);
