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

export type AfternoonAttendanceRecoveryReport = {
  changed: boolean;
  touchedModuleIds: string[];
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

const CONFIRMED_AFTERNOON_RECORD_ALIASES = [
  '1781366097894161',
] as const;

const CONFIRMED_MORNING_ASSIGNMENTS = [
  {
    name: 'Vásquez Mendoza Jorge Nilson',
    moduleId: 'redes_M_2',
    course: 'Mañana M2',
    recordAliases: ['1774125752225'],
  },
] as const;

const MORNING_COHORT_REFERENCE_MODULE_IDS = [
  'redes_M_3',
  'redes_M_4',
] as const;

const MORNING_COHORT_RECOVERY_TARGETS = [
  { moduleId: 'redes_M_1', course: 'Mañana M1' },
  { moduleId: 'redes_M_2', course: 'Mañana M2' },
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

const findEquivalentStudent = (students: TurnStudent[], candidate: TurnStudent) => {
  const candidateKeys = new Set(studentIdentityKeys(candidate));
  if (candidateKeys.size === 0) {
    return students.find((student) => String(student.id ?? '') === String(candidate.id ?? ''));
  }
  return students.find((student) =>
    studentIdentityKeys(student).some((key) => candidateKeys.has(key)),
  );
};

const richerStudent = (first: TurnStudent, second: TurnStudent) =>
  JSON.stringify(second).length > JSON.stringify(first).length ? second : first;

const cloneValue = <T,>(value: T): T =>
  value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;

const mergeStudentRecords = (
  targetModule: TurnModule,
  sourceModule: TurnModule,
  recordKeys: Set<string>,
  destinationKey?: string,
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
        const targetOuterKey = destinationKey || outerKey;
        if (!(targetOuterKey in targetRecord)) {
          targetRecord[targetOuterKey] = cloneValue(outerValue);
          restored += 1;
          return;
        }

        const targetOuterValue = targetRecord[targetOuterKey];
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
        const targetInnerKey = destinationKey || innerKey;
        const targetOuterValue = targetRecord[outerKey];
        const targetInner =
          targetOuterValue && typeof targetOuterValue === 'object' && !Array.isArray(targetOuterValue)
            ? targetOuterValue as Record<string, unknown>
            : {};
        if (!(targetInnerKey in targetInner)) {
          targetInner[targetInnerKey] = cloneValue(innerValue);
          restored += 1;
        }
        targetRecord[outerKey] = targetInner;
      });
    });

    targetModule[field] = targetRecord;
  });

  return restored;
};

export const recoverConfirmedAfternoonAttendance = (
  state: Record<string, TurnModule>,
  recoveryState?: Record<string, TurnModule>,
): AfternoonAttendanceRecoveryReport => {
  const touchedModuleIds = new Set<string>();
  let restoredRecords = 0;

  if (!recoveryState) {
    return { changed: false, touchedModuleIds: [], restoredRecords: 0 };
  }

  AFTERNOON_TECH_MODULE_IDS.forEach((moduleId) => {
    const targetModule = state[moduleId];
    const sourceModule = recoveryState[moduleId];
    if (!targetModule || !sourceModule) return;

    const sourceStudents = moduleStudents(sourceModule);
    moduleStudents(targetModule)
      .filter(isConfirmedAfternoonStudent)
      .forEach((targetStudent) => {
        const targetName = normalizePersonName(targetStudent.nombre);
        const sourceStudent = sourceStudents.find(
          (student) => normalizePersonName(student.nombre) === targetName,
        );
        if (!sourceStudent) return;

        const recordKeys = new Set<string>();
        addStudentRecordKeys(recordKeys, sourceStudent);
        const destinationKey = String(targetStudent.id ?? '').trim() || undefined;
        const restoredHere = mergeStudentRecords(
          targetModule,
          sourceModule,
          recordKeys,
          destinationKey,
        );
        if (restoredHere > 0) {
          restoredRecords += restoredHere;
          touchedModuleIds.add(moduleId);
        }
      });
  });

  return {
    changed: touchedModuleIds.size > 0,
    touchedModuleIds: [...touchedModuleIds].sort(),
    restoredRecords,
  };
};

type LocatedStudent = {
  student: TurnStudent;
  retired: boolean;
  module: TurnModule;
};

const restoreMorningCohort = (
  state: Record<string, TurnModule>,
  recoveryState?: Record<string, TurnModule>,
) => {
  const [firstReferenceId, secondReferenceId] = MORNING_COHORT_REFERENCE_MODULE_IDS;
  const firstReference = state[firstReferenceId];
  const secondReference = state[secondReferenceId];
  const touchedModuleIds = new Set<string>();
  let restoredStudents = 0;

  if (!firstReference || !secondReference) {
    return { touchedModuleIds, restoredStudents };
  }

  const agreedStudents: Array<{ student: TurnStudent; retired: boolean }> = [];
  const addAgreedStudents = (
    firstStudents: TurnStudent[],
    secondStudents: TurnStudent[],
    retired: boolean,
  ) => {
    firstStudents.forEach((firstStudent) => {
      const secondStudent = findEquivalentStudent(secondStudents, firstStudent);
      if (!secondStudent) return;
      const candidate = richerStudent(firstStudent, secondStudent);
      if (agreedStudents.some((entry) => containsEquivalentStudent([entry.student], candidate))) return;
      agreedStudents.push({ student: candidate, retired });
    });
  };

  addAgreedStudents(firstReference.alumnos || [], secondReference.alumnos || [], false);
  addAgreedStudents(firstReference.retirados || [], secondReference.retirados || [], true);

  MORNING_COHORT_RECOVERY_TARGETS.forEach(({ moduleId, course }) => {
    const targetModule = state[moduleId];
    if (!targetModule) return;

    agreedStudents.forEach(({ student, retired }) => {
      if (containsEquivalentStudent(moduleStudents(targetModule), student)) return;
      const recoveryStudent = findEquivalentStudent(
        moduleStudents(recoveryState?.[moduleId]),
        student,
      );
      const profile = recoveryStudent ? richerStudent(student, recoveryStudent) : student;
      const restoredStudent = {
        ...cloneValue(profile),
        ...(recoveryStudent?.id !== undefined ? { id: recoveryStudent.id } : {}),
        curso: course,
        retirado: retired,
      };
      if (retired) {
        targetModule.retirados = [...(targetModule.retirados || []), restoredStudent];
      } else {
        targetModule.alumnos = [...(targetModule.alumnos || []), restoredStudent];
      }
      restoredStudents += 1;
      touchedModuleIds.add(moduleId);
    });
  });

  return { touchedModuleIds, restoredStudents };
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
    const currentLocated = findStudentByName(state, assignment.name, assignment.moduleId);
    const recoveryLocated = findStudentByName(recoveryState, assignment.name, assignment.moduleId);
    const located = currentLocated || recoveryLocated;
    if (!located) return;

    const targetModule = state[assignment.moduleId] || {
      alumnos: [],
      retirados: [],
      asistencias: {},
      motivos: {},
    };
    state[assignment.moduleId] = targetModule;

    let targetStudent = findEquivalentStudent(moduleStudents(targetModule), located.student);
    if (!targetStudent) {
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
      targetStudent = restoredStudent;
    } else if (targetStudent.curso !== assignment.course) {
      targetStudent.curso = assignment.course;
      touchedModuleIds.add(assignment.moduleId);
    }

    const recordKeys = new Set<string>();
    addStudentRecordKeys(recordKeys, located.student);
    if (recoveryLocated) addStudentRecordKeys(recordKeys, recoveryLocated.student);
    assignment.recordAliases.forEach((key) => addRecordKey(recordKeys, key));
    const destinationKey = String(targetStudent.id ?? '').trim() || undefined;
    let restoredHere = mergeStudentRecords(targetModule, located.module, recordKeys, destinationKey);
    if (recoveryLocated && recoveryLocated.module !== located.module) {
      restoredHere += mergeStudentRecords(
        targetModule,
        recoveryLocated.module,
        recordKeys,
        destinationKey,
      );
    }
    if (restoredHere > 0) {
      restoredRecords += restoredHere;
      touchedModuleIds.add(assignment.moduleId);
    }

    if (destinationKey) {
      const obsoleteRecordKeys = new Set(recordKeys);
      const protectedTargetKeys = new Set<string>();
      addStudentRecordKeys(protectedTargetKeys, targetStudent);
      protectedTargetKeys.forEach((key) => obsoleteRecordKeys.delete(key));
      const removedAliases = removeStudentRecords(targetModule, obsoleteRecordKeys);
      if (removedAliases > 0) {
        restoredRecords += removedAliases;
        touchedModuleIds.add(assignment.moduleId);
      }
    }

    MORNING_TECH_MODULE_IDS
      .filter((moduleId) => moduleId !== assignment.moduleId)
      .forEach((moduleId) => {
        const module = state[moduleId];
        if (!module) return;
        const active = module.alumnos || [];
        const retired = module.retirados || [];
        const removedStudents = [...active, ...retired]
          .filter((student) => normalizePersonName(student.nombre) === normalizePersonName(assignment.name));
        if (removedStudents.length === 0) return;

        const sourceKeys = new Set<string>();
        removedStudents.forEach((student) => addStudentRecordKeys(sourceKeys, student));
        const movedRecords = mergeStudentRecords(targetModule, module, sourceKeys, destinationKey);
        module.alumnos = active.filter(
          (student) => normalizePersonName(student.nombre) !== normalizePersonName(assignment.name),
        );
        module.retirados = retired.filter(
          (student) => normalizePersonName(student.nombre) !== normalizePersonName(assignment.name),
        );
        removeStudentRecords(module, sourceKeys);
        restoredRecords += movedRecords;
        touchedModuleIds.add(moduleId);
        touchedModuleIds.add(assignment.moduleId);
      });
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
  let removedFromMorning = 0;
  let removedFromAfternoon = 0;
  let retiredInAfternoon = 0;
  let removedRecords = 0;
  const cohortRestoration = restoreMorningCohort(state, recoveryState);
  cohortRestoration.touchedModuleIds.forEach((moduleId) => touchedModuleIds.add(moduleId));
  const restoration = restoreConfirmedMorningAssignments(state, recoveryState);
  restoration.touchedModuleIds.forEach((moduleId) => touchedModuleIds.add(moduleId));

  const morningSourceStudents = MORNING_TECH_MODULE_IDS
    .flatMap((moduleId) => moduleStudents(state[moduleId]))
    .filter((student) => !isConfirmedAfternoonStudent(student));

  morningSourceStudents.forEach((student) => {
    addStudentIdentity(morningIdentityKeys, student);
  });

  const afternoonSourceStudents = AFTERNOON_TECH_MODULE_IDS
    .flatMap((moduleId) => moduleStudents(state[moduleId]))
    .filter((student) =>
      isConfirmedAfternoonStudent(student) ||
      !studentMatches(morningIdentityKeys, student),
    );

  afternoonSourceStudents.forEach((student) => {
    addStudentIdentity(afternoonIdentityKeys, student);
  });

  const confirmedAfternoonRecordKeys = new Set<string>();
  CONFIRMED_AFTERNOON_RECORD_ALIASES.forEach((key) => addRecordKey(confirmedAfternoonRecordKeys, key));
  afternoonSourceStudents
    .filter(isConfirmedAfternoonStudent)
    .forEach((student) => addStudentRecordKeys(confirmedAfternoonRecordKeys, student));

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
      touchedModuleIds.add(moduleId);
    }

    const removedRecordKeys = new Set<string>(confirmedAfternoonRecordKeys);
    removedStudents.forEach((student) => addStudentRecordKeys(removedRecordKeys, student));
    [...nextActive, ...nextRetired].forEach((student) => {
      const protectedKeys = new Set<string>();
      addStudentRecordKeys(protectedKeys, student);
      protectedKeys.forEach((key) => removedRecordKeys.delete(key));
    });
    const removedHere = removeStudentRecords(module, removedRecordKeys);
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
      touchedModuleIds.add(moduleId);
    }

    const removedRecordKeys = new Set<string>();
    removedStudents.forEach((student) => addStudentRecordKeys(removedRecordKeys, student));
    [...nextActive, ...nextRetired].forEach((student) => {
      const protectedKeys = new Set<string>();
      addStudentRecordKeys(protectedKeys, student);
      protectedKeys.forEach((key) => removedRecordKeys.delete(key));
    });
    const removedHere = removeStudentRecords(module, removedRecordKeys);
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
    restoredToMorning: cohortRestoration.restoredStudents + restoration.restoredStudents,
    restoredRecords: restoration.restoredRecords,
  };
};
