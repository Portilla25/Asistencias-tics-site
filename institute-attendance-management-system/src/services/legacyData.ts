import {
  Alumno,
  Asistencia,
  ClaseHorario,
  Materia,
  Notificacion,
  Periodo,
  User,
} from '../types';
import {
  alumnos as mockAlumnos,
  asistencias as mockAsistencias,
  horarios as mockHorarios,
  materias as mockMaterias,
  notificaciones as mockNotificaciones,
  periodos as mockPeriodos,
  usuarios as mockUsuarios,
} from '../data/mockData';

type LegacyStudent = {
  id?: string | number;
  nombre?: string;
  correo?: string;
  email?: string;
  dni?: string | number;
  cel?: string | number;
  retirado?: boolean;
};

type LegacyModule = {
  alumnos?: LegacyStudent[];
  fechas?: string[];
  asistencias?: Record<string, Record<string, string>>;
  motivos?: Record<string, Record<string, string>>;
  notas?: unknown;
  participacion?: unknown;
};

type LegacySection = {
  id: string;
  label: string;
  badge?: string;
};

type LegacyCareer = {
  id: string;
  nombre: string;
  icono?: string;
  color?: string;
  secciones: LegacySection[];
};

export type InitialAppData = {
  alumnos: Alumno[];
  materias: Materia[];
  asistencias: Asistencia[];
  notificaciones: Notificacion[];
  horarios: ClaseHorario[];
  periodos: Periodo[];
  usuarios: User[];
  source: 'legacy' | 'mock';
};

export const ADMIN_EMAILS = ['fer250423@gmail.com'];
const DOCENTE_ID = 'u-docente-principal';
const ALUMNO_DEMO_ID = 'u-alumno-demo';
const STORAGE_STATE_KEY = 'asist_state';
const FIRESTORE_LIMIT = 800_000;
const CHUNK_LIMIT = 700_000;
const CHUNK_FIELDS = ['alumnos', 'retirados', 'asistencias', 'motivos', 'notas', 'participacion'] as const;
const ARRAY_CHUNK_FIELDS = new Set<string>(['alumnos', 'retirados']);

const DEFAULT_CAREERS: LegacyCareer[] = [
  {
    id: 'redes',
    nombre: 'Redes & TICs',
    color: '#f59e0b',
    secciones: [
      { id: 'redes_M_1', label: 'Turno Mañana - Módulo 1', badge: 'Mañana M1' },
      { id: 'redes_M_2', label: 'Turno Mañana - Módulo 2', badge: 'Mañana M2' },
      { id: 'redes_M_3', label: 'Turno Mañana - Módulo 3', badge: 'Mañana M3' },
      { id: 'redes_M_4', label: 'Turno Mañana - Módulo 4', badge: 'Mañana M4' },
      { id: 'redes_T_1', label: 'Turno Tarde - Módulo 1', badge: 'Tarde M1' },
      { id: 'redes_T_2', label: 'Turno Tarde - Módulo 2', badge: 'Tarde M2' },
      { id: 'redes_T_3', label: 'Turno Tarde - Módulo 3', badge: 'Tarde M3' },
      { id: 'redes_T_4', label: 'Turno Tarde - Módulo 4', badge: 'Tarde M4' },
    ],
  },
  {
    id: 'info_gastro',
    nombre: 'Tecnologías de la Información',
    color: '#0d9488',
    secciones: [{ id: 'info_gastro_L_1', label: 'Clase Lunes', badge: 'Lunes' }],
  },
  {
    id: 'tics_sabados',
    nombre: 'Tecnologías Turno mañana sábados',
    color: '#7c3aed',
    secciones: [
      { id: 'tics_S_1', label: 'Turno Sábado - Módulo 1', badge: 'Sáb M1' },
      { id: 'tics_S_2', label: 'Turno Sábado - Módulo 2', badge: 'Sáb M2' },
      { id: 'tics_S_3', label: 'Turno Sábado - Módulo 3', badge: 'Sáb M3' },
      { id: 'tics_S_4', label: 'Turno Sábado - Módulo 4', badge: 'Sáb M4' },
    ],
  },
  {
    id: 'redes_sabados',
    nombre: 'Tecnologías de la Información y Redes',
    color: '#e11d48',
    secciones: [
      { id: 'redes_S_M1', label: 'Sábado Mañana - Módulo 1', badge: 'Sáb Mañana M1' },
      { id: 'redes_S_M2', label: 'Sábado Mañana - Módulo 2', badge: 'Sáb Mañana M2' },
      { id: 'redes_S_M3', label: 'Sábado Mañana - Módulo 3', badge: 'Sáb Mañana M3' },
      { id: 'redes_S_M4', label: 'Sábado Mañana - Módulo 4', badge: 'Sáb Mañana M4' },
      { id: 'redes_S_T1', label: 'Sábado Tarde - Módulo 1', badge: 'Sáb Tarde T1' },
      { id: 'redes_S_T2', label: 'Sábado Tarde - Módulo 2', badge: 'Sáb Tarde T2' },
      { id: 'redes_S_T3', label: 'Sábado Tarde - Módulo 3', badge: 'Sáb Tarde T3' },
      { id: 'redes_S_T4', label: 'Sábado Tarde - Módulo 4', badge: 'Sáb Tarde T4' },
    ],
  },
];

const COLORS = ['#f59e0b', '#0d9488', '#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#0284c7', '#f97316'];

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const cloneJson = <T,>(value: T): T => JSON.parse(JSON.stringify(value ?? null)) as T;

const estimateSize = (value: unknown) => new Blob([JSON.stringify(value)]).size;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const flattenObject = (value: unknown, path: string[] = []): Array<{ path: string[]; value: unknown }> => {
  if (!isPlainObject(value)) return path.length ? [{ path, value }] : [];
  const entries = Object.entries(value);
  if (entries.length === 0) return path.length ? [{ path, value: {} }] : [];
  return entries.flatMap(([key, nested]) => flattenObject(nested, [...path, key]));
};

const chunkArrayField = (field: string, value: unknown) => {
  const rows = Array.isArray(value) ? value : [];
  const chunks: Array<Record<string, unknown>> = [];
  let current: unknown[] = [];
  const flush = () => {
    if (current.length > 0) {
      chunks.push({ [field]: current });
      current = [];
    }
  };

  rows.forEach((row) => {
    const next = [...current, row];
    if (current.length > 0 && estimateSize({ [field]: next }) > CHUNK_LIMIT) flush();
    current.push(row);
  });
  flush();
  return chunks;
};

const chunkObjectField = (value: unknown) => {
  const entries = flattenObject(value || {});
  const chunks: Array<{ _flat: true; entries: Array<{ path: string[]; value: unknown }> }> = [];
  let current: Array<{ path: string[]; value: unknown }> = [];
  const flush = () => {
    if (current.length > 0) {
      chunks.push({ _flat: true, entries: current });
      current = [];
    }
  };

  entries.forEach((entry) => {
    const next = [...current, entry];
    if (current.length > 0 && estimateSize({ _flat: true, entries: next }) > CHUNK_LIMIT) flush();
    current.push(entry);
  });
  flush();
  return chunks;
};

const chunkField = (field: string, value: unknown) =>
  ARRAY_CHUNK_FIELDS.has(field) ? chunkArrayField(field, value) : chunkObjectField(value);

const getFirebaseFirestore = () => {
  if (typeof window === 'undefined' || !window.firebase?.firestore) return null;
  const config = safeParse<Record<string, unknown>>(window.localStorage.getItem('fb_config'), {});
  if (Object.keys(config).length === 0) return null;
  const app = window.firebase.apps?.length ? window.firebase.app() : window.firebase.initializeApp(config);
  return window.firebase.firestore(app);
};

const syncLegacyModuleToFirestore = async (moduleId: string, module: LegacyModule) => {
  const db = getFirebaseFirestore();
  if (!db) return;

  const payload: Record<string, unknown> = cloneJson({
    alumnos: module.alumnos || [],
    retirados: (module as Record<string, unknown>).retirados || [],
    asistencias: module.asistencias || {},
    fechas: module.fechas || [],
    motivos: module.motivos || {},
    notas: module.notas || {},
    participacion: module.participacion || {},
  });

  if (estimateSize(payload) < FIRESTORE_LIMIT) {
    await db.collection('modulos').doc(moduleId).set({
      ...payload,
      _chunked: false,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
    });
    return;
  }

  const chunks: Array<{ id: string; data: Record<string, unknown> }> = [];
  const counts: Record<string, number> = {};
  CHUNK_FIELDS.forEach((field) => {
    const fieldChunks = chunkField(field, payload[field]);
    counts[field] = fieldChunks.length;
    fieldChunks.forEach((data, index) => {
      chunks.push({ id: `${moduleId}__chunk_${field}_${index}`, data: cloneJson(data) });
    });
  });

  const batch = db.batch();
  batch.set(db.collection('modulos').doc(moduleId), {
    _chunked: true,
    _chunkVersion: 3,
    _chunkCounts: counts,
    fechas: payload.fechas || [],
    updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
  });
  chunks.forEach((chunk) => {
    batch.set(db.collection('modulos').doc(chunk.id), chunk.data);
  });
  await batch.commit();
};

const syncTouchedModules = (moduleIds: Set<string>, state: Record<string, LegacyModule>) => {
  moduleIds.forEach((moduleId) => {
    syncLegacyModuleToFirestore(moduleId, state[moduleId]).catch((error) => {
      console.warn(`No se pudo sincronizar ${moduleId} con Firestore`, error);
    });
  });
};

const readStorage = (key: string) => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
};

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const hash = (value: string) => {
  let result = 0;
  for (let i = 0; i < value.length; i++) {
    result = (result * 31 + value.charCodeAt(i)) >>> 0;
  }
  return result.toString(36);
};

const formatDni = (value: unknown) => String(value ?? '').replace(/\.0$/, '');

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { nombre: fullName || 'Alumno', apellido: '' };
  if (parts.length === 2) return { apellido: parts[0], nombre: parts[1] };
  return {
    apellido: parts.slice(0, 2).join(' '),
    nombre: parts.slice(2).join(' ') || parts.slice(0, 1).join(' '),
  };
};

const labelFor = (careers: LegacyCareer[], moduleId: string) => {
  for (const career of careers) {
    const section = career.secciones?.find((item) => item.id === moduleId);
    if (section) {
      return {
        name: `${career.nombre} · ${section.label}`,
        code: section.badge || moduleId,
        color: career.color || COLORS[Math.abs(hash(moduleId).charCodeAt(0)) % COLORS.length],
      };
    }
  }
  return {
    name: moduleId.replace(/_/g, ' '),
    code: moduleId,
    color: COLORS[Math.abs(hash(moduleId).charCodeAt(0)) % COLORS.length],
  };
};

const legacyToEstado = (value: string): Asistencia['estado'] => {
  const normalized = normalize(value);
  if (normalized.includes('permiso') || normalized.includes('just')) return 'justificado';
  if (normalized.includes('tard')) return 'tardanza';
  if (normalized.includes('falt') || normalized.includes('aus')) return 'ausente';
  return 'presente';
};

const estadoToLegacy = (estado: Asistencia['estado']) => {
  if (estado === 'ausente') return 'Falta';
  if (estado === 'justificado') return 'Permiso';
  if (estado === 'tardanza') return 'Tardanza';
  return 'Presente';
};

const uniqueDates = (state: Record<string, LegacyModule>) => {
  const dates = new Set<string>();
  Object.values(state).forEach((module) => {
    module.fechas?.forEach((date) => dates.add(date));
    Object.values(module.asistencias || {}).forEach((byDate) => {
      Object.keys(byDate || {}).forEach((date) => dates.add(date));
    });
  });
  return [...dates].sort();
};

const buildPeriodos = (dates: string[]): Periodo[] => {
  const activeDate = dates[dates.length - 1] || new Date().toLocaleDateString('en-CA');
  const [year, month] = activeDate.split('-').map(Number);
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  return [
    {
      id: 'periodo-actual',
      nombre: `Periodo activo ${String(month).padStart(2, '0')}/${year}`,
      fechaInicio: start,
      fechaFin: end,
      activo: true,
    },
  ];
};

const dayFromDate = (date: string): ClaseHorario['dia'] | null => {
  const day = new Date(`${date}T12:00:00`).getDay();
  const days: Array<ClaseHorario['dia'] | null> = [null, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return days[day] || null;
};

const buildHorarios = (materias: Materia[]): ClaseHorario[] => {
  const horasLog = safeParse<Array<Record<string, unknown>>>(readStorage('horas_log'), []);
  const seen = new Set<string>();
  const horarios: ClaseHorario[] = [];

  horasLog.forEach((entry, index) => {
    const materiaId = String(entry._key || '');
    const materia = materias.find((item) => item.id === materiaId);
    const fecha = String(entry.fecha || '');
    const dia = dayFromDate(fecha);
    if (!materia || !dia) return;

    const horaInicio = String(entry.entrada || '08:00');
    const horaFin = String(entry.salida || '10:00');
    const key = `${materiaId}-${dia}-${horaInicio}-${horaFin}`;
    if (seen.has(key)) return;
    seen.add(key);
    horarios.push({
      id: `h-${index}-${materiaId}`,
      materiaId,
      dia,
      horaInicio,
      horaFin,
      aula: String(entry.aula || entry.curso || materia.codigo),
    });
  });

  return horarios;
};

const buildUsers = (alumnos: Alumno[]): User[] => {
  const firstAlumno = alumnos.find((alumno) => alumno.email);
  return [
    {
      id: 'u-admin',
      nombre: 'Fernando',
      apellido: 'Portilla',
      email: ADMIN_EMAILS[0],
      password: 'admin',
      rol: 'admin',
      provider: 'google',
    },
    {
      id: DOCENTE_ID,
      nombre: 'Docente',
      apellido: 'Redes & TICs',
      email: 'docente@redes-tics.local',
      password: 'docente',
      rol: 'docente',
      provider: 'local',
    },
    {
      id: ALUMNO_DEMO_ID,
      nombre: firstAlumno?.nombre || 'Alumno',
      apellido: firstAlumno?.apellido || 'Demo',
      email: firstAlumno?.email || 'alumno@redes-tics.local',
      password: 'alumno',
      rol: 'alumno',
      provider: 'local',
    },
  ];
};

const buildNotifications = (alumnos: Alumno[], asistencias: Asistencia[]): Notificacion[] => {
  const notifications: Notificacion[] = [
    {
      id: 'n-backup',
      titulo: 'Backup protegido',
      mensaje: 'Se conserva una copia de la web anterior y un respaldo de mayo antes del cambio visual.',
      fecha: new Date().toISOString(),
      leida: false,
      tipo: 'success',
      destinatarioId: 'u-admin',
    },
  ];

  alumnos.slice(0, 3).forEach((alumno) => {
    const records = asistencias.filter((item) => item.alumnoId === alumno.id);
    if (records.length === 0) return;
    const ausencias = records.filter((item) => item.estado === 'ausente').length;
    const pct = Math.round((ausencias / records.length) * 100);
    if (pct >= 20) {
      notifications.push({
        id: `n-risk-${alumno.id}`,
        titulo: 'Alumno con inasistencias',
        mensaje: `${alumno.nombre} ${alumno.apellido} tiene ${pct}% de faltas registradas.`,
        fecha: new Date().toISOString(),
        leida: false,
        tipo: 'warning',
        destinatarioId: DOCENTE_ID,
      });
    }
  });

  return notifications;
};

export const loadInitialAppData = (): InitialAppData => {
  const state = safeParse<Record<string, LegacyModule>>(readStorage(STORAGE_STATE_KEY), {});
  const hasLegacyState = Object.keys(state).length > 0;
  if (!hasLegacyState) {
    return {
      alumnos: mockAlumnos,
      materias: mockMaterias,
      asistencias: mockAsistencias,
      notificaciones: mockNotificaciones,
      horarios: mockHorarios,
      periodos: mockPeriodos,
      usuarios: mockUsuarios,
      source: 'mock',
    };
  }

  const careers = safeParse<LegacyCareer[]>(readStorage('asist_carreras'), DEFAULT_CAREERS);
  const moduleIds = new Set<string>();
  careers.forEach((career) => career.secciones?.forEach((section) => moduleIds.add(section.id)));
  Object.keys(state).forEach((key) => moduleIds.add(key));

  const materias = [...moduleIds].sort().map((moduleId, index): Materia => {
    const meta = labelFor(careers, moduleId);
    return {
      id: moduleId,
      nombre: meta.name,
      codigo: meta.code,
      docenteId: DOCENTE_ID,
      descripcion: 'Módulo migrado desde la versión anterior del sistema.',
      color: meta.color || COLORS[index % COLORS.length],
    };
  });

  const alumnosByKey = new Map<string, Alumno>();
  const legacyRefToAlumno = new Map<string, string>();

  materias.forEach((materia) => {
    const module = state[materia.id];
    module?.alumnos?.forEach((legacyStudent) => {
      if (legacyStudent.retirado) return;
      const fullName = String(legacyStudent.nombre || '').trim();
      if (!fullName) return;

      const email = String(legacyStudent.correo || legacyStudent.email || '').trim();
      const identity = normalize(email || fullName);
      const alumnoId = `a-${hash(identity)}`;
      const names = splitName(fullName);
      const current = alumnosByKey.get(alumnoId);
      const legacyStudentId = String(legacyStudent.id ?? `${materia.id}-${hash(fullName)}`);

      if (current) {
        if (!current.materias.includes(materia.id)) current.materias.push(materia.id);
        current.legacyRefs = { ...current.legacyRefs, [materia.id]: legacyStudentId };
      } else {
        alumnosByKey.set(alumnoId, {
          id: alumnoId,
          nombre: names.nombre,
          apellido: names.apellido,
          email,
          dni: formatDni(legacyStudent.dni),
          curso: materia.codigo,
          materias: [materia.id],
          legacyRefs: { [materia.id]: legacyStudentId },
        });
      }
      legacyRefToAlumno.set(`${materia.id}:${legacyStudentId}`, alumnoId);
    });
  });

  const asistencias: Asistencia[] = [];
  materias.forEach((materia) => {
    const module = state[materia.id];
    Object.entries(module?.asistencias || {}).forEach(([legacyStudentId, byDate]) => {
      const alumnoId = legacyRefToAlumno.get(`${materia.id}:${legacyStudentId}`);
      if (!alumnoId) return;
      Object.entries(byDate || {}).forEach(([fecha, estado]) => {
        asistencias.push({
          id: `as-${materia.id}-${legacyStudentId}-${fecha}`,
          alumnoId,
          materiaId: materia.id,
          fecha,
          estado: legacyToEstado(estado),
          observacion: module?.motivos?.[legacyStudentId]?.[fecha],
          registradoPor: DOCENTE_ID,
        });
      });
    });
  });

  const alumnos = [...alumnosByKey.values()].sort((a, b) =>
    `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es', { sensitivity: 'base' })
  );
  const usuarios = buildUsers(alumnos);

  return {
    alumnos,
    materias,
    asistencias,
    notificaciones: buildNotifications(alumnos, asistencias),
    horarios: buildHorarios(materias),
    periodos: buildPeriodos(uniqueDates(state)),
    usuarios,
    source: 'legacy',
  };
};

export const persistLegacyAttendanceBatch = (items: Omit<Asistencia, 'id'>[], alumnos: Alumno[]) => {
  if (typeof window === 'undefined' || items.length === 0) return;

  const state = safeParse<Record<string, LegacyModule>>(window.localStorage.getItem(STORAGE_STATE_KEY), {});
  const touchedModules = new Set<string>();
  items.forEach((item) => {
    const alumno = alumnos.find((candidate) => candidate.id === item.alumnoId);
    const legacyStudentId = alumno?.legacyRefs?.[item.materiaId];
    if (!legacyStudentId) return;

    const module = state[item.materiaId] || { alumnos: [], fechas: [], asistencias: {} };
    module.fechas = Array.from(new Set([...(module.fechas || []), item.fecha])).sort();
    module.asistencias = module.asistencias || {};
    module.asistencias[legacyStudentId] = module.asistencias[legacyStudentId] || {};
    module.asistencias[legacyStudentId][item.fecha] = estadoToLegacy(item.estado);
    if (item.observacion) {
      module.motivos = module.motivos || {};
      module.motivos[legacyStudentId] = module.motivos[legacyStudentId] || {};
      module.motivos[legacyStudentId][item.fecha] = item.observacion;
    }
    state[item.materiaId] = module;
    touchedModules.add(item.materiaId);
  });

  window.localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state));
  syncTouchedModules(touchedModules, state);
};

export const createLegacyBackup = () => {
  const backup = {
    state: safeParse<Record<string, LegacyModule>>(readStorage(STORAGE_STATE_KEY), {}),
    personalizados: safeParse<unknown[]>(readStorage('asist_personalizados'), []),
    historial: safeParse<unknown[]>(readStorage('asist_historial'), []),
    carreras: safeParse<LegacyCareer[]>(readStorage('asist_carreras'), DEFAULT_CAREERS),
    horasLog: safeParse<unknown[]>(readStorage('horas_log'), []),
    claseBaseConfig: safeParse<Record<string, unknown>>(readStorage('clase_base_config'), {}),
    exportedAt: new Date().toISOString(),
    exportedFrom: 'new-react-ui',
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `backup_asistencias_${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};
