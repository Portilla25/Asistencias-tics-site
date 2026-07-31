export type TurnStudent = {
  id?: string | number;
  nombre?: string;
  correo?: string;
  email?: string;
  dni?: string | number;
  retirado?: boolean;
  curso?: string;
};

export type TurnModule = {
  alumnos?: TurnStudent[];
  retirados?: TurnStudent[];
  asistencias?: Record<string, unknown>;
  motivos?: Record<string, unknown>;
  notas?: unknown;
  participacion?: unknown;
};

export type TurnSeparationReport = {
  changed: boolean;
  touchedModuleIds: string[];
  removedFromMorning: number;
  removedFromAfternoon: number;
  retiredInAfternoon: number;
  removedRecords: number;
  restoredToMorning: number;
  restoredRecords: number;
};

export const MORNING_TECH_MODULE_IDS = [
  'redes_M_1',
  'redes_M_2',
  'redes_M_3',
  'redes_M_4',
] as const;

export const AFTERNOON_TECH_MODULE_IDS = [
  'redes_T_1',
  'redes_T_2',
  'redes_T_3',
  'redes_T_4',
] as const;

export const TECHNOLOGY_MODULE_IDS = [
  ...MORNING_TECH_MODULE_IDS,
  ...AFTERNOON_TECH_MODULE_IDS,
] as const;

const CONFIRMED_AFTERNOON_STUDENTS = [
  'Castrejón Herrera Yojany Yudith',
  'Cerdán Guevara Moises',
  'Cerna Rasco Santiago Claudio',
  'Díaz Marín Erika Mirella',
  'Malca Gutierrez Elizabeth',
  'Mendoza Chávez Gladis Emerita',
  'Murrugarra Medina Genny Elizabeth',
  'Murrugarra Medina Sandra Mabel',
  'Zavaleta Carrión Geiner Agusto',
  'Carhuamaca Valera Oscar',
  'Chilón Sánchez Tatiana Valentina',
  'Chugnas Cotrina Laury',
  'Cruz Pajares Alejandra',
  'Cueva Castrejón Yenifer Dayana',
  'De la Cruz Paredes Lucy Margot',
  'Gonzales Castrejon Apolinario',
  'Guevara Becerra Sarita Noemí',
  'Masfil Tambillo Leoncio',
  'Mori Rojas Angelica Elizabeth',
  'Pérez Ocas Davy Adrián',
  'Ventura Gallardo Jhefry Jean Pool',
] as const;

const CONFIRMED_RETIRED_AFTERNOON_STUDENTS = [
  'Alejandría Rojas Nixon Yamir',
] as const;

const CONFIRMED_MORNING_ASSIGNMENTS = [
  {
    name: 'Vásquez Mendoza Jorge Nilson',
    moduleId: 'redes_M_2',
    course: 'Mañana M2',
  },
] as const;

const normalizeText = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const normalizePersonName = (value: unknown) =>
  normalizeText(value)
    .split(' ')
    .filter(Boolean)
    .sort()
    .join(' ');

const confirmedAfternoonNames = new Set(
  CONFIRMED_AFTERNOON_STUDENTS.map(normalizePersonName),
);
const confirmedRetiredAfternoonNames = new Set(
  CONFIRMED_RETIRED_AFTERNOON_STUDENTS.map(normalizePersonName),
);

const legacyHash = (value: string) => {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  }
  return result.toString(36);
};

const studentIdentityKeys = (student: TurnStudent): string[] => {
  const keys: string[] = [];
  const name = normalizePersonName(student.nombre);
  const email = normalizeText(student.correo || student.email);
  const dni = String(student.dni ?? '').trim().replace(/\.0$/, '');

  if (name) keys.push(`name:${name}`);
  if (email) keys.push(`email:${email}`);
  if (dni) keys.push(`dni:${dni}`);
  return keys;
};

const addStudentIdentity = (target: Set<string>, student: TurnStudent) => {
  studentIdentityKeys(student).forEach((key) => target.add(key));
};

const studentMatches = (target: Set<string>, student: TurnStudent) =>
  studentIdentityKeys(student).some((key) => target.has(key));

const isConfirmedAfternoonStudent = (student: TurnStudent) =>
  confirmedAfternoonNames.has(normalizePersonName(student.nombre));

const isConfirmedRetiredAfternoonStudent = (student: TurnStudent) =>
  confirmedRetiredAfternoonNames.has(normalizePersonName(student.nombre));

const moduleStudents = (module: TurnModule | undefined) => [
  ...(module?.alumnos || []),
  ...(module?.retirados || []),
];

const addRecordKey = (target: Set<string>, value: unknown) => {
  const raw = String(value ?? '').trim();
  if (!raw) return;
  target.add(raw);
  const normalized = normalizeText(raw);
  if (normalized) target.add(normalized);
};

const addStudentRecordKeys = (target: Set<string>, student: TurnStudent) => {
  const fullName = String(student.nombre ?? '').trim();
  const normalizedIdentity = normalizeText(student.correo || student.email || fullName);

  addRecordKey(target, student.id);
  addRecordKey(target, fullName);
  addRecordKey(target, student.correo);
  addRecordKey(target, student.email);
  addRecordKey(target, String(student.dni ?? '').replace(/\.0$/, ''));
  if (normalizedIdentity) addRecordKey(target, legacyHash(normalizedIdentity));
  if (fullName) addRecordKey(target, legacyHash(fullName));
};

const recordKeyMatches = (keys: Set<string>, value: string) =>
  keys.has(value) || keys.has(normalizeText(value));

const removeStudentRecords = (module: TurnModule, recordKeys: Set<string>) => {
  let removed = 0;

  (['asistencias', 'motivos', 'notas', 'participacion'] as const).forEach((field) => {
    const value = module[field];
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;

    const outerRecord = value as Record<string, unknown>;
    Object.keys(outerRecord).forEach((outerKey) => {
      if (recordKeyMatches(recordKeys, outerKey)) {
        delete outerRecord[outerKey];
        removed += 1;
        return;
      }

      const innerValue = outerRecord[outerKey];
      if (!innerValue || typeof innerValue !== 'object' || Array.isArray(innerValue)) return;
      const innerRecord = innerValue as Record<string, unknown>;
      Object.keys(innerRecord).forEach((innerKey) => {
        if (recordKeyMatches(recordKeys, innerKey)) {
          delete innerRecord[innerKey];
          removed += 1;
        }
      });
    });
  });

  return removed;
};

const containsEquivalentStudent = (students: TurnStudent[], candidate: TurnStudent) => {
  const candidateKeys = new Set(studentIdentityKeys(candidate));
  if (candidateKeys.size === 0) {
    return students.some((student) => String(student.id ?? '') === String(candidate.id ?? ''));
  }
  return students.some((student) =>
    studentIdentityKeys(student).some((key) => candidateKeys.has(key)),
  );
};

const cloneValue = <T,>(value: T): T =>
  value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;

const mergeStudentRecords = (
  targetModule: TurnModule,
  sourceModule: TurnModule,
  recordKeys: Set<string>,
) => {
  let restored = 0;

  (['asistencias', 'motivos', 'notas', 'participacion'] as const).forEach((field) => {
    const sourceValue = sourceModule[field];
    if (!sourceValue || typeof sourceValue !== 'object' || Array.isArray(sourceValue)) return;

    const sourceRecord = sourceValue as Record<string, unknown>;
    const currentTarget = targetModule[field];
    const targetRecord =
      currentTarget && typeof currentTarget === 'object' && !Array.isArray(currentTarget)
        ? currentTarget as Record<string, unknown>
        : {};

    Object.entries(sourceRecord).forEach(([outerKey, outerValue]) => {
      if (recordKeyMatches(recordKeys, outerKey)) {
        if (!(outerKey in targetRecord)) {
          targetRecord[outerKey] = cloneValue(outerValue);
          restored += 1;
          return;
        }

        const targetOuterValue = targetRecord[outerKey];
        if (
          outerValue &&
          typeof outerValue === 'object' &&
          !Array.isArray(outerValue) &&
          targetOuterValue &&
          typeof targetOuterValue === 'object' &&
          !Array.isArray(targetOuterValue)
        ) {
          const sourceInner = outerValue as Record<string, unknown>;
          const targetInner = targetOuterValue as Record<string, unknown>;
          Object.entries(sourceInner).forEach(([innerKey, innerValue]) => {
            if (!(innerKey in targetInner)) {
              targetInner[innerKey] = cloneValue(innerValue);
              restored += 1;
            }
          });
        }
        return;
      }

      if (!outerValue || typeof outerValue !== 'object' || Array.isArray(outerValue)) return;
      const sourceInner = outerValue as Record<string, unknown>;
      Object.entries(sourceInner).forEach(([innerKey, innerValue]) => {
        if (!recordKeyMatches(recordKeys, innerKey)) return;
        const targetOuterValue = targetRecord[outerKey];
        const targetInner =
          targetOuterValue && typeof targetOuterValue === 'object' && !Array.isArray(targetOuterValue)
            ? targetOuterValue as Record<string, unknown>
            : {};
        if (!(innerKey in targetInner)) {
          targetInner[innerKey] = cloneValue(innerValue);
          restored += 1;
        }
        targetRecord[outerKey] = targetInner;
      });
    });

    targetModule[field] = targetRecord;
  });

  return restored;
};

type LocatedStudent = {
  student: TurnStudent;
  retired: boolean;
  module: TurnModule;
};

const findStudentByName = (
  state: Record<string, TurnModule> | undefined,
  name: string,
  preferredModuleId: string,
): LocatedStudent | null => {
  if (!state) return null;
  const targetName = normalizePersonName(name);
  const moduleIds = [
    preferredModuleId,
    ...TECHNOLOGY_MODULE_IDS.filter((moduleId) => moduleId !== preferredModuleId),
  ];

  for (const moduleId of moduleIds) {
    const module = state[moduleId];
    if (!module) continue;

    const active = (module.alumnos || [])
      .find((student) => normalizePersonName(student.nombre) === targetName);
    if (active) return { student: active, retired: false, module };

    const retired = (module.retirados || [])
      .find((student) => normalizePersonName(student.nombre) === targetName);
    if (retired) return { student: retired, retired: true, module };
  }

  return null;
};

const restoreConfirmedMorningAssignments = (
  state: Record<string, TurnModule>,
  recoveryState?: Record<string, TurnModule>,
) => {
  const touchedModuleIds = new Set<string>();
  let restoredStudents = 0;
  let restoredRecords = 0;

  CONFIRMED_MORNING_ASSIGNMENTS.forEach((assignment) => {
    const located =
      findStudentByName(recoveryState, assignment.name, assignment.moduleId) ||
      findStudentByName(state, assignment.name, assignment.moduleId);
    if (!located) return;

    const targetModule = state[assignment.moduleId] || {
      alumnos: [],
      retirados: [],
      asistencias: {},
      motivos: {},
    };
    state[assignment.moduleId] = targetModule;

    const targetStudents = moduleStudents(targetModule);
    if (!containsEquivalentStudent(targetStudents, located.student)) {
      const restoredStudent = {
        ...cloneValue(located.student),
        curso: assignment.course,
        retirado: located.retired,
      };
      if (located.retired) {
        targetModule.retirados = [...(targetModule.retirados || []), restoredStudent];
      } else {
        targetModule.alumnos = [...(targetModule.alumnos || []), restoredStudent];
      }
      restoredStudents += 1;
      touchedModuleIds.add(assignment.moduleId);
    }

    const recordKeys = new Set<string>();
    addStudentRecordKeys(recordKeys, located.student);
    const restoredHere = mergeStudentRecords(targetModule, located.module, recordKeys);
    if (restoredHere > 0) {
      restoredRecords += restoredHere;
      touchedModuleIds.add(assignment.moduleId);
    }
  });

  return {
    touchedModuleIds,
    restoredStudents,
    restoredRecords,
  };
};

export const repairTechnologyTurnSeparation = (
  state: Record<string, TurnModule>,
  recoveryState?: Record<string, TurnModule>,
): TurnSeparationReport => {
  const touchedModuleIds = new Set<string>();
  const morningIdentityKeys = new Set<string>();
  const afternoonIdentityKeys = new Set<string>();
  const morningRecordKeys = new Set<string>();
  const afternoonRecordKeys = new Set<string>();
  let removedFromMorning = 0;
  let removedFromAfternoon = 0;
  let retiredInAfternoon = 0;
  let removedRecords = 0;
  const restoration = restoreConfirmedMorningAssignments(state, recoveryState);
  restoration.touchedModuleIds.forEach((moduleId) => touchedModuleIds.add(moduleId));

  const morningSourceStudents = MORNING_TECH_MODULE_IDS
    .flatMap((moduleId) => moduleStudents(state[moduleId]))
    .filter((student) => !isConfirmedAfternoonStudent(student));

  morningSourceStudents.forEach((student) => {
    addStudentIdentity(morningIdentityKeys, student);
    addStudentRecordKeys(morningRecordKeys, student);
  });

  const afternoonSourceStudents = AFTERNOON_TECH_MODULE_IDS
    .flatMap((moduleId) => moduleStudents(state[moduleId]))
    .filter((student) =>
      isConfirmedAfternoonStudent(student) ||
      !studentMatches(morningIdentityKeys, student),
    );

  afternoonSourceStudents.forEach((student) => {
    addStudentIdentity(afternoonIdentityKeys, student);
    addStudentRecordKeys(afternoonRecordKeys, student);
  });

  MORNING_TECH_MODULE_IDS.forEach((moduleId) => {
    const module = state[moduleId];
    if (!module) return;

    const removedStudents: TurnStudent[] = [];
    const shouldRemove = (student: TurnStudent) =>
      isConfirmedAfternoonStudent(student) ||
      (!studentMatches(morningIdentityKeys, student) &&
        studentMatches(afternoonIdentityKeys, student));

    const active = module.alumnos || [];
    const retired = module.retirados || [];
    const nextActive = active.filter((student) => {
      if (!shouldRemove(student)) return true;
      removedStudents.push(student);
      return false;
    });
    const nextRetired = retired.filter((student) => {
      if (!shouldRemove(student)) return true;
      removedStudents.push(student);
      return false;
    });

    if (removedStudents.length > 0) {
      module.alumnos = nextActive;
      module.retirados = nextRetired;
      removedFromMorning += removedStudents.length;
      removedStudents.forEach((student) => addStudentRecordKeys(afternoonRecordKeys, student));
      touchedModuleIds.add(moduleId);
    }

    const removedHere = removeStudentRecords(module, afternoonRecordKeys);
    if (removedHere > 0) {
      removedRecords += removedHere;
      touchedModuleIds.add(moduleId);
    }
  });

  AFTERNOON_TECH_MODULE_IDS.forEach((moduleId) => {
    const module = state[moduleId];
    if (!module) return;

    const removedStudents: TurnStudent[] = [];
    const active = module.alumnos || [];
    const retired = module.retirados || [];
    const nextActive: TurnStudent[] = [];
    const nextRetired = retired.filter((student) => {
      const remove = studentMatches(morningIdentityKeys, student) &&
        !isConfirmedAfternoonStudent(student);
      if (remove) removedStudents.push(student);
      return !remove;
    });

    active.forEach((student) => {
      const remove = studentMatches(morningIdentityKeys, student) &&
        !isConfirmedAfternoonStudent(student);
      if (remove) {
        removedStudents.push(student);
        return;
      }

      if (isConfirmedRetiredAfternoonStudent(student)) {
        const retiredStudent = { ...student, retirado: true };
        if (!containsEquivalentStudent(nextRetired, retiredStudent)) {
          nextRetired.push(retiredStudent);
        }
        retiredInAfternoon += 1;
        return;
      }

      nextActive.push(student);
    });

    if (
      removedStudents.length > 0 ||
      nextActive.length !== active.length ||
      nextRetired.length !== retired.length
    ) {
      module.alumnos = nextActive;
      module.retirados = nextRetired;
      removedFromAfternoon += removedStudents.length;
      removedStudents.forEach((student) => addStudentRecordKeys(morningRecordKeys, student));
      touchedModuleIds.add(moduleId);
    }

    const removedHere = removeStudentRecords(module, morningRecordKeys);
    if (removedHere > 0) {
      removedRecords += removedHere;
      touchedModuleIds.add(moduleId);
    }
  });

  return {
    changed: touchedModuleIds.size > 0,
    touchedModuleIds: [...touchedModuleIds].sort(),
    removedFromMorning,
    removedFromAfternoon,
    retiredInAfternoon,
    removedRecords,
    restoredToMorning: restoration.restoredStudents,
    restoredRecords: restoration.restoredRecords,
  };
};
