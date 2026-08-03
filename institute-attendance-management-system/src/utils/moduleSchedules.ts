export interface ModuleSchedule {
  turno: string;
  hora: string;
  dia: string;
}

export const MODULE_SCHEDULES: Record<string, ModuleSchedule> = {
  // Tecnologías de la información - turno mañana
  redes_M_1: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  redes_M_2: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  redes_M_3: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  redes_M_4: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  // Tecnologías de la información - turno tarde
  redes_T_1: { turno: 'Tarde', hora: '14:00 – 18:00', dia: 'Sábado' },
  redes_T_2: { turno: 'Tarde', hora: '14:00 – 18:00', dia: 'Sábado' },
  redes_T_3: { turno: 'Tarde', hora: '14:00 – 18:00', dia: 'Sábado' },
  redes_T_4: { turno: 'Tarde', hora: '14:00 – 18:00', dia: 'Sábado' },
  // Gastronomía
  info_gastro_L_1: { turno: 'Mañana', hora: '10:30 – 12:20', dia: 'Lunes' },
  // Identificadores históricos que aún pueden existir en respaldos
  tics_S_1: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  tics_S_2: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  tics_S_3: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  tics_S_4: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  redes_S_M1: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  redes_S_M2: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  redes_S_M3: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  redes_S_M4: { turno: 'Mañana', hora: '09:00 – 13:00', dia: 'Sábado' },
  redes_S_T1: { turno: 'Tarde', hora: '14:00 – 18:00', dia: 'Sábado' },
  redes_S_T2: { turno: 'Tarde', hora: '14:00 – 18:00', dia: 'Sábado' },
  redes_S_T3: { turno: 'Tarde', hora: '14:00 – 18:00', dia: 'Sábado' },
  redes_S_T4: { turno: 'Tarde', hora: '14:00 – 18:00', dia: 'Sábado' },
};

const HOURS_PER_MODULE: Record<string, number> = {
  info_gastro_L_1: 2,
  redes_M_1: 4,
  redes_M_2: 4,
  redes_M_3: 4,
  redes_M_4: 4,
  redes_T_1: 4,
  redes_T_2: 4,
  redes_T_3: 4,
  redes_T_4: 4,
  tics_S_1: 4,
  tics_S_2: 4,
  tics_S_3: 4,
  tics_S_4: 4,
  redes_S_M1: 4,
  redes_S_M2: 4,
  redes_S_M3: 4,
  redes_S_M4: 4,
  redes_S_T1: 4,
  redes_S_T2: 4,
  redes_S_T3: 4,
  redes_S_T4: 4,
};

export const getHoursForModule = (moduleId: string): number => HOURS_PER_MODULE[moduleId] || 1;
