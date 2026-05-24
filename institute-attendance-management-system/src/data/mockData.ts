import { User, Materia, Alumno, Asistencia, ClaseHorario, Notificacion, Periodo } from '../types';

export const usuarios: User[] = [
  { id: 'u1', nombre: 'Admin', apellido: 'Sistema', email: 'admin@instituto.edu', password: '1234', rol: 'admin' },
  { id: 'u2', nombre: 'Carlos', apellido: 'Mendoza', email: 'cmendoza@instituto.edu', password: '1234', rol: 'docente' },
  { id: 'u3', nombre: 'María', apellido: 'Rodríguez', email: 'mrodriguez@instituto.edu', password: '1234', rol: 'docente' },
  { id: 'u4', nombre: 'Jorge', apellido: 'Ramírez', email: 'jramirez@instituto.edu', password: '1234', rol: 'docente' },
  { id: 'u5', nombre: 'Laura', apellido: 'García', email: 'lgarcia@instituto.edu', password: '1234', rol: 'alumno' },
  { id: 'u6', nombre: 'Pedro', apellido: 'López', email: 'plopez@instituto.edu', password: '1234', rol: 'alumno' },
];

export const materias: Materia[] = [
  { id: 'm1', nombre: 'Matemáticas', codigo: 'MAT-101', docenteId: 'u2', descripcion: 'Álgebra y cálculo básico', color: '#6366f1' },
  { id: 'm2', nombre: 'Física', codigo: 'FIS-102', docenteId: 'u2', descripcion: 'Mecánica y termodinámica', color: '#8b5cf6' },
  { id: 'm3', nombre: 'Lengua y Literatura', codigo: 'LEN-101', docenteId: 'u3', descripcion: 'Comprensión y redacción', color: '#ec4899' },
  { id: 'm4', nombre: 'Historia', codigo: 'HIS-101', docenteId: 'u3', descripcion: 'Historia universal y argentina', color: '#f59e0b' },
  { id: 'm5', nombre: 'Química', codigo: 'QUI-101', docenteId: 'u4', descripcion: 'Química general e inorgánica', color: '#10b981' },
  { id: 'm6', nombre: 'Informática', codigo: 'INF-101', docenteId: 'u4', descripcion: 'Programación y sistemas', color: '#3b82f6' },
];

export const alumnos: Alumno[] = [
  { id: 'a1', nombre: 'Laura', apellido: 'García', email: 'lgarcia@instituto.edu', dni: '42123456', curso: '3°A', materias: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'] },
  { id: 'a2', nombre: 'Pedro', apellido: 'López', email: 'plopez@instituto.edu', dni: '43234567', curso: '3°A', materias: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'] },
  { id: 'a3', nombre: 'Sofía', apellido: 'Martínez', email: 'smartinez@instituto.edu', dni: '44345678', curso: '3°A', materias: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'] },
  { id: 'a4', nombre: 'Lucas', apellido: 'Fernández', email: 'lfernandez@instituto.edu', dni: '45456789', curso: '3°A', materias: ['m1', 'm2', 'm3', 'm4'] },
  { id: 'a5', nombre: 'Valentina', apellido: 'González', email: 'vgonzalez@instituto.edu', dni: '46567890', curso: '3°B', materias: ['m1', 'm3', 'm5', 'm6'] },
  { id: 'a6', nombre: 'Matías', apellido: 'Sánchez', email: 'msanchez@instituto.edu', dni: '47678901', curso: '3°B', materias: ['m2', 'm4', 'm5', 'm6'] },
  { id: 'a7', nombre: 'Camila', apellido: 'Torres', email: 'ctorres@instituto.edu', dni: '48789012', curso: '3°B', materias: ['m1', 'm2', 'm3', 'm5'] },
  { id: 'a8', nombre: 'Agustín', apellido: 'Díaz', email: 'adiaz@instituto.edu', dni: '49890123', curso: '4°A', materias: ['m2', 'm4', 'm6'] },
  { id: 'a9', nombre: 'Florencia', apellido: 'Ruiz', email: 'fruiz@instituto.edu', dni: '50901234', curso: '4°A', materias: ['m1', 'm3', 'm5'] },
  { id: 'a10', nombre: 'Nicolás', apellido: 'Herrera', email: 'nherrera@instituto.edu', dni: '51012345', curso: '4°A', materias: ['m1', 'm2', 'm4', 'm6'] },
  { id: 'a11', nombre: 'Antonella', apellido: 'Vega', email: 'avega@instituto.edu', dni: '52123456', curso: '4°B', materias: ['m3', 'm4', 'm5', 'm6'] },
  { id: 'a12', nombre: 'Tomás', apellido: 'Morales', email: 'tmorales@instituto.edu', dni: '53234567', curso: '4°B', materias: ['m1', 'm2', 'm3'] },
];

const generateAsistencias = (): Asistencia[] => {
  const asistencias: Asistencia[] = [];
  const estados: Asistencia['estado'][] = ['presente', 'presente', 'presente', 'presente', 'ausente', 'tardanza', 'justificado'];
  let id = 1;

  const fechas = [
    '2025-03-03', '2025-03-05', '2025-03-10', '2025-03-12', '2025-03-17', '2025-03-19',
    '2025-03-24', '2025-03-26', '2025-03-31', '2025-04-02', '2025-04-07', '2025-04-09',
    '2025-04-14', '2025-04-16', '2025-04-28', '2025-04-30', '2025-05-05', '2025-05-07',
    '2025-05-12', '2025-05-14', '2025-05-19', '2025-05-21', '2025-05-26', '2025-05-28',
    '2025-06-02', '2025-06-04', '2025-06-09', '2025-06-11', '2025-06-16', '2025-06-18',
  ];

  alumnos.forEach(alumno => {
    alumno.materias.forEach(materiaId => {
      fechas.forEach(fecha => {
        const estado = estados[Math.floor(Math.random() * estados.length)];
        asistencias.push({
          id: `as${id++}`,
          alumnoId: alumno.id,
          materiaId,
          fecha,
          estado,
          observacion: estado === 'justificado' ? 'Certificado médico presentado' : estado === 'tardanza' ? 'Llegó 15 minutos tarde' : undefined,
          registradoPor: materias.find(m => m.id === materiaId)?.docenteId || 'u2',
        });
      });
    });
  });

  return asistencias;
};

export const asistencias: Asistencia[] = generateAsistencias();

export const horarios: ClaseHorario[] = [
  { id: 'h1', materiaId: 'm1', dia: 'lunes', horaInicio: '08:00', horaFin: '09:30', aula: 'A-101' },
  { id: 'h2', materiaId: 'm1', dia: 'miercoles', horaInicio: '08:00', horaFin: '09:30', aula: 'A-101' },
  { id: 'h3', materiaId: 'm2', dia: 'martes', horaInicio: '10:00', horaFin: '11:30', aula: 'Lab-1' },
  { id: 'h4', materiaId: 'm2', dia: 'jueves', horaInicio: '10:00', horaFin: '11:30', aula: 'Lab-1' },
  { id: 'h5', materiaId: 'm3', dia: 'lunes', horaInicio: '10:00', horaFin: '11:30', aula: 'A-102' },
  { id: 'h6', materiaId: 'm3', dia: 'viernes', horaInicio: '08:00', horaFin: '09:30', aula: 'A-102' },
  { id: 'h7', materiaId: 'm4', dia: 'martes', horaInicio: '08:00', horaFin: '09:30', aula: 'A-103' },
  { id: 'h8', materiaId: 'm4', dia: 'jueves', horaInicio: '08:00', horaFin: '09:30', aula: 'A-103' },
  { id: 'h9', materiaId: 'm5', dia: 'miercoles', horaInicio: '10:00', horaFin: '11:30', aula: 'Lab-2' },
  { id: 'h10', materiaId: 'm5', dia: 'viernes', horaInicio: '10:00', horaFin: '11:30', aula: 'Lab-2' },
  { id: 'h11', materiaId: 'm6', dia: 'lunes', horaInicio: '12:00', horaFin: '13:30', aula: 'Inf-1' },
  { id: 'h12', materiaId: 'm6', dia: 'miercoles', horaInicio: '12:00', horaFin: '13:30', aula: 'Inf-1' },
];

export const notificaciones: Notificacion[] = [
  { id: 'n1', titulo: 'Asistencia registrada', mensaje: 'Se registró la asistencia del día de hoy en Matemáticas', fecha: '2025-06-18T08:30:00', leida: false, tipo: 'success', destinatarioId: 'u2' },
  { id: 'n2', titulo: 'Alumno con alta inasistencia', mensaje: 'Lucas Fernández supera el 25% de inasistencias en Física', fecha: '2025-06-17T14:00:00', leida: false, tipo: 'warning', destinatarioId: 'u2' },
  { id: 'n3', titulo: 'Reporte generado', mensaje: 'El reporte mensual de Mayo ha sido generado exitosamente', fecha: '2025-06-01T09:00:00', leida: true, tipo: 'info', destinatarioId: 'u1' },
  { id: 'n4', titulo: 'Nueva justificación', mensaje: 'Sofía Martínez presentó certificado médico para el 2025-06-09', fecha: '2025-06-16T10:00:00', leida: false, tipo: 'info', destinatarioId: 'u3' },
  { id: 'n5', titulo: 'Sistema actualizado', mensaje: 'El sistema de asistencias fue actualizado a la versión 2.0', fecha: '2025-06-10T12:00:00', leida: true, tipo: 'info', destinatarioId: 'u1' },
  { id: 'n6', titulo: 'Alta inasistencia detectada', mensaje: 'Matías Sánchez tiene 8 inasistencias en Historia este mes', fecha: '2025-06-15T11:30:00', leida: false, tipo: 'error', destinatarioId: 'u3' },
];

export const periodos: Periodo[] = [
  { id: 'p1', nombre: 'Primer Trimestre 2025', fechaInicio: '2025-03-01', fechaFin: '2025-05-31', activo: false },
  { id: 'p2', nombre: 'Segundo Trimestre 2025', fechaInicio: '2025-06-01', fechaFin: '2025-08-31', activo: true },
  { id: 'p3', nombre: 'Tercer Trimestre 2025', fechaInicio: '2025-09-01', fechaFin: '2025-11-30', activo: false },
];
