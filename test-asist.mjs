import fs from 'fs';

const normalize = (value) =>
  String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const hash = (value) => {
  let result = 0;
  for (let i = 0; i < String(value).length; i++) {
    result = (result * 31 + String(value).charCodeAt(i)) >>> 0;
  }
  return result.toString(36);
};

const formatDni = (value) => String(value ?? '').replace(/\.0$/, '');

const splitName = (fullName) => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { nombre: fullName || 'Alumno', apellido: '' };
  if (parts.length === 2) return { apellido: parts[0], nombre: parts[1] };
  return {
    apellido: parts.slice(0, 2).join(' '),
    nombre: parts.slice(2).join(' ') || parts.slice(0, 1).join(' '),
  };
};

async function test() {
  const modRes = await fetch('https://firestore.googleapis.com/v1/projects/asistencias-redes/databases/(default)/documents/modulos/info_gastro_L_1');
  const modData = await modRes.json();
  const module = {};
  
  // Parse alumnos
  module.alumnos = modData.fields.alumnos.arrayValue.values.map(v => {
    const fields = v.mapValue.fields;
    return {
      id: fields.id?.stringValue || fields.id?.integerValue || fields.id?.doubleValue,
      nombre: fields.nombre?.stringValue,
      correo: fields.correo?.stringValue,
      dni: fields.dni?.stringValue || fields.dni?.integerValue || fields.dni?.doubleValue,
    };
  });
  
  // Parse asistencias
  module.asistencias = {};
  for (const [legacyId, byDateObj] of Object.entries(modData.fields.asistencias.mapValue.fields)) {
     module.asistencias[legacyId] = {};
     if (byDateObj.mapValue?.fields) {
       for (const [fecha, estadoObj] of Object.entries(byDateObj.mapValue.fields)) {
         module.asistencias[legacyId][fecha] = estadoObj.stringValue;
       }
     }
  }

  const materiaId = 'info_gastro_L_1';
  const alumnosByKey = new Map();
  const legacyRefToAlumno = new Map();

  module.alumnos.forEach((legacyStudent) => {
    if (legacyStudent.retirado) return;
    const fullName = String(legacyStudent.nombre || '').trim();
    if (!fullName) return;

    const email = String(legacyStudent.correo || legacyStudent.email || '').trim();
    const identity = normalize(email || fullName);
    const alumnoId = `a-${hash(identity)}`;
    const names = splitName(fullName);
    const legacyStudentId = String(legacyStudent.id ?? `${materiaId}-${hash(fullName)}`);

    alumnosByKey.set(alumnoId, {
      id: alumnoId,
      nombre: names.nombre,
      apellido: names.apellido,
      email,
      legacyRefs: { [materiaId]: legacyStudentId },
    });
    legacyRefToAlumno.set(`${materiaId}:${legacyStudentId}`, alumnoId);
  });

  const asistencias = [];
  Object.entries(module.asistencias || {}).forEach(([legacyStudentId, byDate]) => {
    const alumnoId = legacyRefToAlumno.get(`${materiaId}:${legacyStudentId}`);
    if (!alumnoId) {
      console.log('MISSING alumnoId for legacyStudentId:', legacyStudentId);
      return;
    }
    Object.entries(byDate || {}).forEach(([fecha, estado]) => {
      asistencias.push({
        alumnoId,
        materiaId,
        fecha,
        estado
      });
    });
  });

  console.log('Total Alumnos:', alumnosByKey.size);
  console.log('Total Asistencias mapped:', asistencias.length);
  
  const sample = asistencias.find(a => a.fecha === '2026-06-15');
  console.log('Sample for 2026-06-15:', sample);
  
  const sampleAlumno = alumnosByKey.get(sample?.alumnoId);
  console.log('Sample Alumno:', sampleAlumno);
}

test().catch(console.error);
