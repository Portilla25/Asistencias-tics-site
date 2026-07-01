import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DEFAULT_CAREERS = [
  {
    id: 'info_gastro',
    nombre: 'Tecnologias de la informacion - gastronomia',
    color: '#0d9488',
    secciones: [
      { id: 'info_gastro_L_1', label: 'Lunes 10:30-12:20 (2h)', badge: 'Gastro Lunes' },
    ],
  },
  {
    id: 'redes',
    nombre: 'Tecnologias de la informacion turno manana',
    color: '#f59e0b',
    secciones: [
      { id: 'redes_M_1', label: 'Modulo 1 (Manana)', badge: 'Manana M1' },
      { id: 'redes_M_2', label: 'Modulo 2 (Manana)', badge: 'Manana M2' },
      { id: 'redes_M_3', label: 'Modulo 3 (Manana)', badge: 'Manana M3' },
      { id: 'redes_M_4', label: 'Modulo 4 (Manana)', badge: 'Manana M4' },
    ],
  },
  {
    id: 'redes_sabados',
    nombre: 'Tecnologias de la informacion turno tarde',
    color: '#e11d48',
    secciones: [
      { id: 'redes_T_1', label: 'Modulo 1 (Tarde)', badge: 'Tarde M1' },
      { id: 'redes_T_2', label: 'Modulo 2 (Tarde)', badge: 'Tarde M2' },
      { id: 'redes_T_3', label: 'Modulo 3 (Tarde)', badge: 'Tarde M3' },
      { id: 'redes_T_4', label: 'Modulo 4 (Tarde)', badge: 'Tarde M4' },
    ],
  },
];

const HIDDEN_MODULE_IDS = new Set([
  'redes_S_M1',
  'redes_S_M2',
  'redes_S_M3',
  'redes_S_M4',
  'redes_S_T1',
  'redes_S_T2',
  'redes_S_T3',
  'redes_S_T4',
  'tics_S_1',
  'tics_S_2',
  'tics_S_3',
  'tics_S_4',
]);

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith('--')) continue;
  const key = arg.slice(2);
  const next = process.argv[index + 1];
  if (next && !next.startsWith('--')) {
    args.set(key, next);
    index += 1;
  } else {
    args.set(key, 'true');
  }
}

const normalize = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const hash = (value) => {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  }
  return result.toString(36);
};

const stableHash = (value) => crypto.createHash('sha256').update(value).digest('hex');

const formatDni = (value) => String(value ?? '').replace(/\.0$/, '');

const normalizeDateKey = (value) => {
  const raw = String(value ?? '').trim();
  const isoMatch = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  const localMatch = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (localMatch) return `${localMatch[3]}-${localMatch[2].padStart(2, '0')}-${localMatch[1].padStart(2, '0')}`;
  return raw;
};

const isFullDateKey = (value) => /^\d{4}-\d{2}-\d{2}$/.test(normalizeDateKey(value));

const splitName = (fullName) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: fullName || 'Alumno', lastName: '' };
  if (parts.length === 2) return { lastName: parts[0], firstName: parts[1] };
  return {
    lastName: parts.slice(0, 2).join(' '),
    firstName: parts.slice(2).join(' ') || parts.slice(0, 1).join(' '),
  };
};

const attendanceStatus = (value) => {
  const normalized = normalize(value);
  if (['j', 'justificada', 'justificado', 'permiso'].includes(normalized)) return 'justificado';
  if (['t', 'tarde', 'tardanza'].includes(normalized)) return 'tardanza';
  if (['a', 'ausente', 'falta', 'false', '0', 'no'].includes(normalized)) return 'ausente';
  if (['p', 'presente', 'true', '1', 'si', 's'].includes(normalized)) return 'presente';
  if (normalized.includes('permiso') || normalized.includes('just')) return 'justificado';
  if (normalized.includes('tard')) return 'tardanza';
  if (normalized.includes('falt') || normalized.includes('aus')) return 'ausente';
  return 'presente';
};

const plainObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const findJsonInText = (text, marker) => {
  const start = text.indexOf(marker);
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') {
      inString = true;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return null;
};

const scanChromeLocalStorage = () => {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return null;
  const levelDbDir = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Local Storage', 'leveldb');
  if (!fs.existsSync(levelDbDir)) return null;

  let best = null;
  for (const fileName of fs.readdirSync(levelDbDir)) {
    if (!/\.(ldb|log)$/.test(fileName)) continue;
    let text = '';
    try {
      text = fs.readFileSync(path.join(levelDbDir, fileName)).toString('utf8');
    } catch {
      continue;
    }
    const json = findJsonInText(text, '{"info_gastro_L_1"');
    if (!json) continue;
    if (!best || json.length > best.json.length) best = { fileName, json };
  }
  if (!best) return null;
  return {
    state: JSON.parse(best.json),
    source: `chrome-local-storage:${best.fileName}`,
    sourceText: best.json,
  };
};

const loadSource = () => {
  const backupPath = args.get('backup');
  const statePath = args.get('state');

  if (backupPath) {
    const parsed = readJson(backupPath);
    return {
      state: parsed.state || parsed,
      personalizados: parsed.personalizados || [],
      carreras: parsed.carreras || DEFAULT_CAREERS,
      source: backupPath,
      sourceText: JSON.stringify(parsed),
    };
  }

  if (statePath) {
    const parsed = readJson(statePath);
    return {
      state: parsed.state || parsed,
      personalizados: parsed.personalizados || [],
      carreras: parsed.carreras || DEFAULT_CAREERS,
      source: statePath,
      sourceText: JSON.stringify(parsed),
    };
  }

  const scanned = scanChromeLocalStorage();
  if (scanned) return { ...scanned, carreras: DEFAULT_CAREERS, personalizados: [] };

  throw new Error('No source found. Use --backup backup.json or --state asist_state.json.');
};

const labelFor = (careers, moduleId) => {
  for (const career of careers) {
    const section = career.secciones?.find((item) => item.id === moduleId);
    if (section) {
      return {
        careerId: career.id,
        label: section.label,
        badge: section.badge || moduleId,
        name: `${career.nombre} - ${section.label}`,
        code: section.badge || moduleId,
        color: career.color || '#6366f1',
        section,
      };
    }
  }
  return {
    careerId: null,
    label: moduleId.replace(/_/g, ' '),
    badge: moduleId,
    name: moduleId.replace(/_/g, ' '),
    code: moduleId,
    color: '#6366f1',
    section: {},
  };
};

const buildExport = ({ state, personalizados = [], carreras = DEFAULT_CAREERS, source, sourceText }) => {
  const moduleIds = new Set();
  carreras.forEach((career) => career.secciones?.forEach((section) => moduleIds.add(section.id)));
  Object.keys(state).forEach((id) => moduleIds.add(id));

  const careers = carreras
    .filter((career) => career.id !== 'tics_sabados')
    .map((career, index) => ({
      id: career.id,
      name: career.nombre,
      icon: career.icono || null,
      color: career.color || null,
      sort_order: index,
      raw: career,
    }));

  const modules = [...moduleIds]
    .filter((id) => !HIDDEN_MODULE_IDS.has(id) && !id.startsWith('tics_S_'))
    .sort()
    .map((id, index) => {
      const meta = labelFor(carreras, id);
      return {
        id,
        career_id: meta.careerId,
        label: meta.label,
        badge: meta.badge,
        name: meta.name,
        code: meta.code,
        teacher_id: 'u-docente-principal',
        description: 'Modulo migrado desde Firebase legacy.',
        color: meta.color,
        hidden: false,
        sort_order: index,
        raw: meta.section,
      };
    });

  const visibleModuleIds = new Set(modules.map((module) => module.id));
  const studentsById = new Map();
  const studentModulesByKey = new Map();
  const refs = new Map();
  const addRef = (moduleId, key, studentId) => {
    const raw = String(key ?? '').trim();
    if (!raw) return;
    if (!refs.has(`${moduleId}:${raw}`)) refs.set(`${moduleId}:${raw}`, studentId);
    const normalized = normalize(raw);
    if (normalized && !refs.has(`${moduleId}:${normalized}`)) refs.set(`${moduleId}:${normalized}`, studentId);
  };

  const addStudent = (moduleId, legacyStudent, forceRetired = false) => {
    const fullName = String(legacyStudent.nombre || '').trim();
    if (!fullName) return null;
    const email = String(legacyStudent.correo || legacyStudent.email || '').trim() || null;
    const dni = formatDni(legacyStudent.dni);
    const phone = String(legacyStudent.cel || legacyStudent.telefono || '').trim() || null;
    const identity = normalize(email || fullName);
    const studentId = `a-${hash(identity)}`;
    const { firstName, lastName } = splitName(fullName);
    const legacyStudentId = String(legacyStudent.id ?? `${moduleId}-${hash(fullName)}`);
    const status = forceRetired || legacyStudent.retirado ? 'retirado' : 'activo';
    const current = studentsById.get(studentId);

    if (current) {
      if (current.status !== 'activo' && status === 'activo') current.status = 'activo';
      current.raw = { ...current.raw, [`module:${moduleId}`]: legacyStudent };
    } else {
      studentsById.set(studentId, {
        id: studentId,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        email,
        dni,
        phone,
        course: legacyStudent.curso || null,
        status,
        source: 'firebase_legacy',
        raw: { [`module:${moduleId}`]: legacyStudent },
      });
    }

    studentModulesByKey.set(`${studentId}:${moduleId}`, {
      student_id: studentId,
      module_id: moduleId,
      legacy_student_id: legacyStudentId,
      status,
      raw: legacyStudent,
    });

    [
      legacyStudentId,
      studentId,
      legacyStudent.id,
      hash(identity),
      hash(fullName),
      `${moduleId}-${hash(fullName)}`,
      fullName,
      `${lastName} ${firstName}`,
      `${lastName}, ${firstName}`,
      dni,
      email,
    ].forEach((key) => addRef(moduleId, key, studentId));

    return studentId;
  };

  for (const moduleId of visibleModuleIds) {
    const moduleState = state[moduleId] || {};
    (moduleState.alumnos || []).forEach((student) => addStudent(moduleId, student, !!student.retirado));
    (moduleState.retirados || []).forEach((student) => addStudent(moduleId, student, true));
  }

  const ensureOrphanStudent = (moduleId, legacyStudentId) => {
    const studentId = `a-orphan-${moduleId}-${hash(legacyStudentId)}`;
    if (!studentsById.has(studentId)) {
      studentsById.set(studentId, {
        id: studentId,
        first_name: `ID ${legacyStudentId}`,
        last_name: 'Alumno sin ficha',
        full_name: `Alumno sin ficha ID ${legacyStudentId}`,
        email: null,
        dni: null,
        phone: null,
        course: null,
        status: 'retirado',
        source: 'firebase_orphan_attendance',
        raw: { legacyStudentId, moduleId },
      });
    }
    if (!studentModulesByKey.has(`${studentId}:${moduleId}`)) {
      studentModulesByKey.set(`${studentId}:${moduleId}`, {
        student_id: studentId,
        module_id: moduleId,
        legacy_student_id: legacyStudentId,
        status: 'retirado',
        raw: { legacyStudentId, orphan: true },
      });
    }
    addRef(moduleId, legacyStudentId, studentId);
    return studentId;
  };

  const findStudentId = (moduleId, key) => {
    const raw = String(key ?? '').trim();
    if (!raw) return null;
    return refs.get(`${moduleId}:${raw}`) || refs.get(`${moduleId}:${normalize(raw)}`) || null;
  };

  const attendance = [];
  const grades = [];
  const rawModules = [];

  for (const moduleId of visibleModuleIds) {
    const moduleState = state[moduleId] || {};
    rawModules.push({ module_id: moduleId, raw: moduleState });

    const addAttendance = (legacyStudentId, rawDate, rawStatus) => {
      const rawStatusValue = typeof rawStatus === 'object' && rawStatus !== null
        ? String(rawStatus.estado ?? rawStatus.val ?? rawStatus.value ?? rawStatus.status ?? rawStatus.asistencia ?? rawStatus.attendance ?? '')
        : String(rawStatus ?? '');
      if (!rawStatusValue) return;
      const fecha = normalizeDateKey(rawDate);
      if (!isFullDateKey(fecha)) return;
      const studentId = findStudentId(moduleId, legacyStudentId) || ensureOrphanStudent(moduleId, String(legacyStudentId));
      const motivos = plainObject(moduleState.motivos);
      const byStudent = plainObject(motivos[legacyStudentId]);
      const byDate = plainObject(motivos[rawDate]) || plainObject(motivos[fecha]);
      attendance.push({
        module_id: moduleId,
        student_id: studentId,
        fecha,
        status: attendanceStatus(rawStatusValue),
        observation: byStudent[rawDate] || byStudent[fecha] || byDate[legacyStudentId] || null,
        registered_by: 'u-docente-principal',
        legacy_student_id: String(legacyStudentId),
        raw_status: rawStatusValue,
        raw: { rawDate, rawStatus },
      });
    };

    Object.entries(plainObject(moduleState.asistencias)).forEach(([outerKey, outerValue]) => {
      const inner = plainObject(outerValue);
      if (isFullDateKey(outerKey)) {
        Object.entries(inner).forEach(([legacyStudentId, rawStatus]) =>
          addAttendance(legacyStudentId, normalizeDateKey(outerKey), rawStatus)
        );
      } else {
        Object.entries(inner).forEach(([rawDate, rawStatus]) => addAttendance(outerKey, rawDate, rawStatus));
      }
    });

    Object.entries(plainObject(moduleState.notas)).forEach(([legacyStudentId, grade]) => {
      const studentId = findStudentId(moduleId, legacyStudentId);
      if (!studentId) return;
      grades.push({
        module_id: moduleId,
        student_id: studentId,
        nota1: grade?.nota1 ?? null,
        nota2: grade?.nota2 ?? null,
        nota3: grade?.nota3 ?? null,
        promedio_final: grade?.promedioFinal ?? grade?.promedio_final ?? null,
        puntos_extra: grade?.puntosExtra ?? grade?.puntos_extra ?? 0,
        raw: grade,
      });
    });
  }

  const customStudents = [];
  const customClasses = [];
  for (const student of Array.isArray(personalizados) ? personalizados : []) {
    const id = String(student.id || `custom-${hash(student.nombre || JSON.stringify(student))}`);
    customStudents.push({
      id,
      name: student.nombre || 'Sin nombre',
      phone: student.tel || null,
      raw: student,
    });
    for (const rawClass of Array.isArray(student.clases) ? student.clases : []) {
      const parsed = parseCustomClass(rawClass);
      if (!parsed?.fecha || !isFullDateKey(parsed.fecha)) continue;
      customClasses.push({
        custom_student_id: id,
        fecha: parsed.fecha,
        status: parsed.val || 'Presente',
        hours: Number(parsed.horas || 0),
        start_time: parsed.horaInicio || null,
        end_time: parsed.horaFin || null,
        raw: rawClass,
      });
    }
  }

  return {
    metadata: {
      exportedAt: new Date().toISOString(),
      source,
      sourceHash: stableHash(sourceText || JSON.stringify(state)),
      notes: 'Normalized export prepared for Supabase import.',
    },
    adminEmails: ['fer250423@gmail.com'],
    careers,
    modules,
    students: [...studentsById.values()],
    studentModules: [...studentModulesByKey.values()],
    attendance: dedupeRows(attendance, (row) => `${row.module_id}:${row.student_id}:${row.fecha}`),
    sessions: [],
    grades: dedupeRows(grades, (row) => `${row.module_id}:${row.student_id}`),
    customStudents: dedupeRows(customStudents, (row) => row.id),
    customClasses,
    rawModules,
  };
};

const parseCustomClass = (value) => {
  if (value && typeof value === 'object') {
    return {
      fecha: normalizeDateKey(value.fecha),
      val: value.val || 'Presente',
      horas: Number(value.horas || 0),
      horaInicio: value.horaInicio || '',
      horaFin: value.horaFin || '',
    };
  }
  if (typeof value !== 'string') return null;
  const matchHours = value.match(/horas=([\d.,]+)/);
  const matchDate = value.match(/fecha=([0-9-T:.Z/-]+)/);
  const matchVal = value.match(/val=([^;}]+)/);
  const matchInicio = value.match(/horaInicio=([\d:]+)/);
  const matchFin = value.match(/horaFin=([\d:]+)/);
  return {
    fecha: normalizeDateKey(matchDate?.[1] || ''),
    val: matchVal?.[1]?.trim() || 'Presente',
    horas: matchHours ? Number(matchHours[1].replace(',', '.')) : 0,
    horaInicio: matchInicio?.[1]?.trim() || '',
    horaFin: matchFin?.[1]?.trim() || '',
  };
};

const dedupeRows = (rows, keyFn) => {
  const byKey = new Map();
  rows.forEach((row) => byKey.set(keyFn(row), row));
  return [...byKey.values()];
};

const source = loadSource();
const output = buildExport(source);
const outputDir = args.get('out-dir') || path.join(process.cwd(), 'migration-output');
fs.mkdirSync(outputDir, { recursive: true });
const fileName = args.get('out') || `supabase-normalized-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
const outputPath = path.resolve(outputDir, fileName);
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

const counts = {
  careers: output.careers.length,
  modules: output.modules.length,
  students: output.students.length,
  studentModules: output.studentModules.length,
  attendance: output.attendance.length,
  sessions: output.sessions.length,
  grades: output.grades.length,
  customStudents: output.customStudents.length,
  customClasses: output.customClasses.length,
  rawModules: output.rawModules.length,
};

console.log(JSON.stringify({ ok: true, outputPath, source: source.source, sourceHash: output.metadata.sourceHash, counts }, null, 2));
