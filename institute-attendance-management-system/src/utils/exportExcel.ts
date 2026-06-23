import ExcelJS from 'exceljs';
import { Alumno, Asistencia, RegistroNotasMateria } from '../types';

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
          if (asis.estado === 'presente') mark = 'A'; // A for Asistió
          else if (asis.estado === 'ausente') mark = 'F'; // F for Falta
          else if (asis.estado === 'tardanza') mark = 'T'; // T for Tardanza
          else if (asis.estado === 'justificado') mark = 'J'; // J for Justificado
        }
        
        row.getCell(colNum).value = mark;
      });

      // Grades
      const studentNotas = notas[alumno.id];
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
    const fileName = `Registro_${safeMateriaName}_${new Date().toISOString().split('T')[0]}.xlsx`;
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
          else if (asis.estado === 'ausente') mark = 'A';
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
          else if (val === 'A') cell.font = { color: { argb: 'FFDC2626' }, bold: true };
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
    const fileName = `Asistencias_Limpio_${safeMateriaName}_${new Date().toISOString().split('T')[0]}.xlsx`;
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
