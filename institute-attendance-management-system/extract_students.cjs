const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/Portilla/Downloads/backup_asistencias_2026-05-25.json', 'utf8'));
const state = data.state;

// Collect ALL unique students by name from redes_M and redes_T modules
const allModules = ['redes_M_1','redes_M_2','redes_M_3','redes_M_4','redes_T_1','redes_T_2','redes_T_3','redes_T_4'];
const byName = new Map();

allModules.forEach(mId => {
  const mod = state[mId];
  if (!mod || !mod.alumnos) return;
  mod.alumnos.forEach(a => {
    if (a.retirado) return;
    const name = (a.nombre || '').trim();
    if (!name) return;
    if (!byName.has(name)) {
      byName.set(name, {
        // Keep the student data with the lowest id (original)
        ...a,
        _allIds: { [mId]: String(a.id) },
      });
    } else {
      byName.get(name)._allIds[mId] = String(a.id);
    }
  });
});

const uniqueStudents = [...byName.values()].sort((a,b) => a.nombre.localeCompare(b.nombre, 'es'));
console.log(`\n=== ALUMNOS UNICOS POR NOMBRE: ${uniqueStudents.length} ===`);
uniqueStudents.forEach((s, i) => {
  const modules = Object.keys(s._allIds);
  const missingT = ['redes_T_1','redes_T_2','redes_T_3','redes_T_4'].filter(m => !modules.includes(m));
  const status = missingT.length > 0 ? ` ⚠️  FALTA en: ${missingT.join(', ')}` : ' ✅';
  console.log(`  ${(i+1).toString().padStart(2)}. ${s.nombre}${status}`);
});

// Build the definitive list: for each student, take their data and ensure they have an entry
// Output as a clean list for migration
const cleanList = uniqueStudents.map(s => {
  const { _allIds, ...rest } = s;
  return { ...rest, _originalIds: _allIds };
});
fs.writeFileSync('C:/Users/Portilla/Documents/GitHub/Asistencias-tics-site/institute-attendance-management-system/redes_unique_students.json', JSON.stringify(cleanList, null, 2));
console.log(`\nGuardado ${cleanList.length} alumnos unicos en redes_unique_students.json`);
