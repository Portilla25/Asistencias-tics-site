export type Role = 'admin' | 'docente' | 'alumno';

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: Role;
  avatar?: string;
  provider?: 'local' | 'google';
}

export interface Materia {
  id: string;
  nombre: string;
  codigo: string;
  docenteId: string;
  descripcion: string;
  color: string;
}

export interface Alumno {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  curso: string;
  estado?: 'activo' | 'retirado';
  avatar?: string;
  materias: string[];
  legacyRefs?: Record<string, string>;
}

export interface Asistencia {
  id: string;
  alumnoId: string;
  materiaId: string;
  fecha: string;
  estado: 'presente' | 'ausente' | 'tardanza' | 'justificado';
  observacion?: string;
  registradoPor: string;
}

export interface ClaseHorario {
  id: string;
  materiaId: string;
  dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';
  horaInicio: string;
  horaFin: string;
  aula: string;
}

export interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  tipo: 'info' | 'warning' | 'success' | 'error';
  destinatarioId: string;
}

export interface Periodo {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
}

export type NotaCampo = 'nota1' | 'nota2' | 'nota3';

export interface NotaSimple {
  valor: number | null;
  tema: string;
}

export type NotasSimples = Record<NotaCampo, NotaSimple[]>;
export type PuntosAplicados = Record<NotaCampo, number>;

export interface CalificacionData {
  nota1: number | null;
  nota2: number | null;
  nota3: number | null;
  promedioFinal: number | null;
  puntosExtra?: number;
  notasSimples?: Partial<NotasSimples>;
  puntosAplicados?: Partial<PuntosAplicados>;
}

export type RegistroNotasMateria = Record<string, CalificacionData>;
