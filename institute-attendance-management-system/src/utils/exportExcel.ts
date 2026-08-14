import ExcelJS from 'exceljs';
import { Alumno, Asistencia, Materia, RegistroNotasMateria } from '../types';
import { getTodayInPeru } from './dateUtils';
import { normalizarCalificacion } from './notasCalculations';

const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const downloadWorkbook = async (workbook: ExcelJS.Workbook, fileName: string) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: EXCEL_MIME });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

const safeFilePart = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .toLowerCase();

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

interface MonthlyAttendanceExportOptions {
  alumnos: Alumno[];
  asistencias: Asistencia[];
  materias: Materia[];
  carreraNombre: string;
  year: number;
  month: number;
}

const STATUS_MARKS: Record<Asistencia['estado'], string> = {
  presente: 'P',
  ausente: 'F',
  justificado: 'J',
  tardanza: 'T',
};

const STATUS_STYLES: Record<string, { fill: string; font: string }> = {
  P: { fill: 'FFDCFCE7', font: 'FF166534' },
  F: { fill: 'FFFEE2E2', font: 'FFB91C1C' },
  J: { fill: 'FFE0E7FF', font: 'FF4338CA' },
  T: { fill: 'FFFEF3C7', font: 'FFB45309' },
  '—': { fill: 'FFF1F5F9', font: 'FF64748B' },
};

export const exportMonthlyAttendanceExcel = async ({
  alumnos,
  asistencias,
  materias,
  carreraNombre,
  year,
  month,
}: MonthlyAttendanceExportOptions) => {
  try {
    const monthValue = String(month).padStart(2, '0');
    const periodPrefix = `${year}-${monthValue}`;
    const materiaIds = new Set(materias.map((materia) => materia.id));
    const monthlyAttendanceByKey = new Map<string, Asistencia>();
    asistencias
      .filter((attendance) => materiaIds.has(attendance.materiaId) && attendance.fecha.startsWith(periodPrefix))
      .forEach((attendance) => {
        monthlyAttendanceByKey.set(
          `${attendance.alumnoId}|${attendance.materiaId}|${attendance.fecha}`,
          attendance
        );
      });
    const monthlyAttendance = [...monthlyAttendanceByKey.values()];

    const materiaOrder = new Map(materias.map((materia, index) => [materia.id, index]));
    const sessionMap = new Map<string, { materiaId: string; fecha: string }>();
    monthlyAttendance.forEach((attendance) => {
      const key = `${attendance.materiaId}|${attendance.fecha}`;
      sessionMap.set(key, { materiaId: attendance.materiaId, fecha: attendance.fecha });
    });
    const sessions = [...sessionMap.values()].sort((a, b) =>
      a.fecha.localeCompare(b.fecha) ||
      (materiaOrder.get(a.materiaId) ?? 0) - (materiaOrder.get(b.materiaId) ?? 0)
    );

    const attendanceStudentIds = new Set(monthlyAttendance.map((attendance) => attendance.alumnoId));
    const sortedStudents = alumnos
      .filter((student) =>
        attendanceStudentIds.has(student.id) || student.materias.some((materiaId) => materiaIds.has(materiaId))
      )
      .sort((a, b) =>
        `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es', { sensitivity: 'base' })
      );

    const attendanceByStudentAndSession = new Map<string, Asistencia>();
    monthlyAttendance.forEach((attendance) => {
      attendanceByStudentAndSession.set(
        `${attendance.alumnoId}|${attendance.materiaId}|${attendance.fecha}`,
        attendance
      );
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Asistencias';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('Asistencia mensual', {
      pageSetup: {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9,
      },
    });

    const summaryHeaders = ['Presentes', 'Faltas', 'Justificadas', 'Tardanzas'];
    const totalColumns = 3 + sessions.length + summaryHeaders.length;
    const lastColumn = Math.max(totalColumns, 7);

    worksheet.mergeCells(1, 1, 1, lastColumn);
    worksheet.getCell(1, 1).value = 'REPORTE MENSUAL DE ASISTENCIAS';
    worksheet.getCell(1, 1).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell(1, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    worksheet.getCell(1, 1).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 28;

    worksheet.mergeCells(2, 1, 2, lastColumn);
    worksheet.getCell(2, 1).value = `Carrera: ${carreraNombre}`;
    worksheet.getCell(2, 1).font = { bold: true, size: 12, color: { argb: 'FF1E293B' } };
    worksheet.getCell(2, 1).alignment = { horizontal: 'left', vertical: 'middle' };

    worksheet.mergeCells(3, 1, 3, lastColumn);
    worksheet.getCell(3, 1).value = `Periodo: ${MONTH_NAMES[month - 1]} de ${year}`;
    worksheet.getCell(3, 1).font = { size: 11, color: { argb: 'FF475569' } };

    worksheet.mergeCells(4, 1, 4, lastColumn);
    worksheet.getCell(4, 1).value = 'Leyenda: P = Presente | F = Falta | J = Falta justificada | T = Tardanza | — = Sin registro';
    worksheet.getCell(4, 1).font = { italic: true, size: 10, color: { argb: 'FF475569' } };

    const dateCounts = sessions.reduce<Record<string, number>>((counts, session) => {
      counts[session.fecha] = (counts[session.fecha] || 0) + 1;
      return counts;
    }, {});
    const sessionHeaders = sessions.map((session) => {
      const dateLabel = `${session.fecha.slice(8, 10)}/${session.fecha.slice(5, 7)}`;
      if (dateCounts[session.fecha] === 1) return dateLabel;
      const moduleNumber = (materiaOrder.get(session.materiaId) ?? 0) + 1;
      return `${dateLabel} M${moduleNumber}`;
    });

    const headerValues = ['N°', 'DNI', 'Alumno', ...sessionHeaders, ...summaryHeaders];
    const headerRow = worksheet.getRow(5);
    headerValues.forEach((value, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = value;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
    });
    headerRow.height = 32;

    sortedStudents.forEach((student, studentIndex) => {
      const row = worksheet.getRow(6 + studentIndex);
      row.getCell(1).value = studentIndex + 1;
      row.getCell(2).value = student.dni || '';
      row.getCell(3).value = `${student.apellido}, ${student.nombre}`;

      const totals = { P: 0, F: 0, J: 0, T: 0 };
      sessions.forEach((session, sessionIndex) => {
        const attendance = attendanceByStudentAndSession.get(
          `${student.id}|${session.materiaId}|${session.fecha}`
        );
        const mark = attendance ? STATUS_MARKS[attendance.estado] : '—';
        const cell = row.getCell(4 + sessionIndex);
        cell.value = mark;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true, color: { argb: STATUS_STYLES[mark].font } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATUS_STYLES[mark].fill } };
        if (mark !== '—') totals[mark as keyof typeof totals] += 1;
      });

      const summaryStart = 4 + sessions.length;
      row.getCell(summaryStart).value = totals.P;
      row.getCell(summaryStart + 1).value = totals.F;
      row.getCell(summaryStart + 2).value = totals.J;
      row.getCell(summaryStart + 3).value = totals.T;

      for (let column = 1; column <= totalColumns; column += 1) {
        const cell = row.getCell(column);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        if (column !== 3) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    worksheet.getColumn(1).width = 6;
    worksheet.getColumn(2).width = 13;
    worksheet.getColumn(3).width = 36;
    sessions.forEach((_, index) => { worksheet.getColumn(4 + index).width = 11; });
    summaryHeaders.forEach((_, index) => { worksheet.getColumn(4 + sessions.length + index).width = 13; });
    worksheet.views = [{ state: 'frozen', xSplit: 3, ySplit: 5 }];
    worksheet.autoFilter = {
      from: { row: 5, column: 1 },
      to: { row: Math.max(5, 5 + sortedStudents.length), column: totalColumns },
    };

    const fileName = `Asistencias_mensuales_${safeFilePart(carreraNombre)}_${periodPrefix}.xlsx`;
    await downloadWorkbook(workbook, fileName);
    return true;
  } catch (error) {
    console.error('Error exporting monthly attendance Excel:', error);
    return false;
  }
};

export const exportToGastronomiaExcel = async (
  alumnos: Alumno[],
  asistencias: Asistencia[],
  notas: RegistroNotasMateria,
  materiaNombre: string
) => {
  try {
    // Fetch template
    const response = await fetch('./GASTRONOMIA.xlsx');
    const arrayBuffer = await response.arrayBuffer();

    // Load workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    // Assume data goes to the first worksheet
    const worksheet = workbook.worksheets[0];

    // Filter and sort students (to ensure they are ordered alphabetically)
    const sortedAlumnos = [...alumnos].sort((a, b) =>
      `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es', { sensitivity: 'base' })
    );

    // Extract all unique dates from assistencias and sort them chronologically
    const allDatesSet = new Set<string>();
    asistencias.forEach((a) => allDatesSet.add(a.fecha));
    const sortedDates = Array.from(allDatesSet).sort();
    
    // We only have 15 columns for attendance in this template (C to Q)
    const datesToFill = sortedDates.slice(0, 15);

    // Start row based on template structure
    const START_ROW = 20;

    sortedAlumnos.forEach((alumno, index) => {
      const rowNum = START_ROW + index;
      const row = worksheet.getRow(rowNum);

      // Student Number
      row.getCell(1).value = index + 1;
      // Student Name
      row.getCell(2).value = `${alumno.apellido}, ${alumno.nombre}`;

      // Attendance
      const studentAsistencias = asistencias.filter((a) => a.alumnoId === alumno.id);
      
      datesToFill.forEach((date, dateIndex) => {
        // Col C is 3, D is 4, etc.
        const colNum = 3 + dateIndex; 
        const asis = studentAsistencias.find((a) => a.fecha === date);
        
        let mark = '';
        if (asis) {
          if (asis.estado === 'presente') mark = 'P'; // P for Presente
          else if (asis.estado === 'ausente') mark = 'F'; // F for Falta
          else if (asis.estado === 'tardanza') mark = 'T'; // T for Tardanza
          else if (asis.estado === 'justificado') mark = 'J'; // J for Justificado
        }
        
        row.getCell(colNum).value = mark;
      });

      // Grades
      const studentNotas = notas[alumno.id] ? normalizarCalificacion(notas[alumno.id]) : null;
      if (studentNotas) {
        // Based on column mappings (base 1):
        // Col V (22): EVALUACIONES
        // Col W (23): EX.PRÁCTICO
        // Col X (24): PRÁCTICAS
        // Col Z (26): NOTA FINAL
        
        if (studentNotas.nota1 !== null) row.getCell(22).value = studentNotas.nota1;
        if (studentNotas.nota2 !== null) row.getCell(23).value = studentNotas.nota2;
        if (studentNotas.nota3 !== null) row.getCell(24).value = studentNotas.nota3;
        
        // Col 25 is TRABAJOS, which we don't have a direct field for in CalificacionData
        
        if (studentNotas.promedioFinal !== null) row.getCell(26).value = studentNotas.promedioFinal;
      }
      
      // Secondary N° column (Col U / 21)
      row.getCell(21).value = index + 1;

      // Commit the row changes
      row.commit();
    });

    // Write buffer and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    
    const safeMateriaName = materiaNombre.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `Registro_${safeMateriaName}_${getTodayInPeru()}.xlsx`;
    anchor.download = fileName;
    
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting Excel:', error);
    return false;
  }
};

export const exportToCleanAttendanceExcel = async (
  alumnos: Alumno[],
  asistencias: Asistencia[],
  materiaNombre: string
) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Asistencias');

    const sortedAlumnos = [...alumnos].sort((a, b) =>
      `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es', { sensitivity: 'base' })
    );

    const allDatesSet = new Set<string>();
    asistencias.forEach((a) => allDatesSet.add(a.fecha));
    const sortedDates = Array.from(allDatesSet).sort();

    // Configure columns
    const columns = [
      { header: 'N°', key: 'n', width: 5 },
      { header: 'ALUMNO', key: 'alumno', width: 40 },
      ...sortedDates.map(date => ({
        header: new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        key: date,
        width: 8
      })),
      { header: '% ASISTENCIA', key: 'pct', width: 15 }
    ];
    worksheet.columns = columns;

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' } // Indigo 600
      };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });

    // Fill rows
    sortedAlumnos.forEach((alumno, index) => {
      const studentAsistencias = asistencias.filter((a) => a.alumnoId === alumno.id);
      
      let presentes = 0;
      let total = 0;

      const rowData: any = {
        n: index + 1,
        alumno: `${alumno.apellido}, ${alumno.nombre}`
      };

      sortedDates.forEach((date) => {
        const asis = studentAsistencias.find((a) => a.fecha === date);
        if (asis) {
          total++;
          if (asis.estado === 'presente' || asis.estado === 'justificado') presentes++;
          
          let mark = '';
          if (asis.estado === 'presente') mark = 'P';
          else if (asis.estado === 'ausente') mark = 'F';
          else if (asis.estado === 'tardanza') mark = 'T';
          else if (asis.estado === 'justificado') mark = 'J';
          
          rowData[date] = mark;
        }
      });

      const pct = total > 0 ? Math.round((presentes / total) * 100) : 0;
      rowData.pct = `${pct}%`;

      const row = worksheet.addRow(rowData);
      
      // Style row cells
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        if (colNumber > 2 && colNumber <= 2 + sortedDates.length) {
          cell.alignment = { horizontal: 'center' };
          const val = cell.value;
          if (val === 'P') cell.font = { color: { argb: 'FF16A34A' }, bold: true };
          else if (val === 'F') cell.font = { color: { argb: 'FFDC2626' }, bold: true };
          else if (val === 'T') cell.font = { color: { argb: 'FFD97706' }, bold: true };
          else if (val === 'J') cell.font = { color: { argb: 'FF4F46E5' }, bold: true };
        }
        if (colNumber === 2 + sortedDates.length + 1) { // Pct column
           cell.alignment = { horizontal: 'center' };
           if (pct >= 70) cell.font = { color: { argb: 'FF16A34A' }, bold: true };
           else cell.font = { color: { argb: 'FFDC2626' }, bold: true };
        }
      });
    });

    // Write buffer and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    
    const safeMateriaName = materiaNombre.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `Asistencias_Limpio_${safeMateriaName}_${getTodayInPeru()}.xlsx`;
    anchor.download = fileName;
    
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting clean Excel:', error);
    return false;
  }
};
