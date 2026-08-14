import React, { useMemo, useState } from 'react';
import { CalendarDays, FileSpreadsheet, Users } from 'lucide-react';
import { Alumno, Asistencia, Materia } from '../types';
import { getCursoGroups } from '../utils/cursoGroups';
import { getTodayInPeru } from '../utils/dateUtils';
import { exportMonthlyAttendanceExcel } from '../utils/exportExcel';

interface ReporteMensualExcelProps {
  alumnos: Alumno[];
  materias: Materia[];
  asistencias: Asistencia[];
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const ReporteMensualExcel: React.FC<ReporteMensualExcelProps> = ({ alumnos, materias, asistencias }) => {
  const today = getTodayInPeru();
  const [careerId, setCareerId] = useState('');
  const [month, setMonth] = useState(Number(today.slice(5, 7)));
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const careerGroups = useMemo(() => getCursoGroups(materias), [materias]);
  const selectedCareer = careerGroups.find((group) => group.id === careerId);

  const availableYears = useMemo(() => {
    const years = new Set<number>([Number(today.slice(0, 4))]);
    asistencias.forEach((attendance) => {
      const attendanceYear = Number(attendance.fecha.slice(0, 4));
      if (Number.isInteger(attendanceYear)) years.add(attendanceYear);
    });
    return [...years].sort((a, b) => b - a);
  }, [asistencias, today]);

  const monthlySummary = useMemo(() => {
    if (!selectedCareer) return { records: 0, students: 0, classSessions: 0 };
    const materiaIds = new Set(selectedCareer.materias.map((materia) => materia.id));
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const recordsByKey = new Map<string, Asistencia>();
    asistencias
      .filter((attendance) => materiaIds.has(attendance.materiaId) && attendance.fecha.startsWith(prefix))
      .forEach((attendance) => {
        recordsByKey.set(`${attendance.alumnoId}|${attendance.materiaId}|${attendance.fecha}`, attendance);
      });
    const records = [...recordsByKey.values()];
    const studentIdsWithRecords = new Set(records.map((attendance) => attendance.alumnoId));
    return {
      records: records.length,
      students: alumnos.filter((student) =>
        studentIdsWithRecords.has(student.id) || student.materias.some((materiaId) => materiaIds.has(materiaId))
      ).length,
      classSessions: new Set(records.map((attendance) => `${attendance.materiaId}|${attendance.fecha}`)).size,
    };
  }, [alumnos, asistencias, month, selectedCareer, year]);

  const handleCareerChange = (nextCareerId: string) => {
    setCareerId(nextCareerId);
    setMessage(null);

    const nextCareer = careerGroups.find((group) => group.id === nextCareerId);
    if (!nextCareer) return;
    const materiaIds = new Set(nextCareer.materias.map((materia) => materia.id));
    const periods = asistencias
      .filter((attendance) => materiaIds.has(attendance.materiaId) && /^\d{4}-\d{2}/.test(attendance.fecha))
      .map((attendance) => attendance.fecha.slice(0, 7))
      .sort();
    const latestPeriod = periods[periods.length - 1];
    if (latestPeriod) {
      setYear(Number(latestPeriod.slice(0, 4)));
      setMonth(Number(latestPeriod.slice(5, 7)));
    }
  };

  const handleExport = async () => {
    if (!selectedCareer || monthlySummary.records === 0) return;
    setIsExporting(true);
    setMessage(null);
    const success = await exportMonthlyAttendanceExcel({
      alumnos,
      asistencias,
      materias: selectedCareer.materias,
      carreraNombre: selectedCareer.label,
      year,
      month,
    });
    setMessage(success
      ? { type: 'success', text: 'El Excel mensual se descargó correctamente.' }
      : { type: 'error', text: 'No se pudo generar el Excel. Intenta nuevamente.' }
    );
    setIsExporting(false);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Excel mensual de asistencias</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Elige una carrera y un periodo. El archivo mostrará por fecha si cada alumno estuvo presente, faltó, justificó o llegó tarde.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(260px,1fr)_180px_140px_auto] md:items-end">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Carrera</span>
            <select
              value={careerId}
              onChange={(event) => handleCareerChange(event.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Selecciona una carrera</option>
              {careerGroups.map((group) => (
                <option key={group.id} value={group.id}>{group.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mes</span>
            <select
              value={month}
              onChange={(event) => { setMonth(Number(event.target.value)); setMessage(null); }}
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {MONTHS.map((monthName, index) => (
                <option key={monthName} value={index + 1}>{monthName}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Año</span>
            <select
              value={year}
              onChange={(event) => { setYear(Number(event.target.value)); setMessage(null); }}
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {availableYears.map((availableYear) => (
                <option key={availableYear} value={availableYear}>{availableYear}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleExport}
            disabled={!selectedCareer || monthlySummary.records === 0 || isExporting}
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {isExporting ? 'Generando...' : `Descargar ${MONTHS[month - 1]} ${year}`}
          </button>
        </div>
      </section>

      {!selectedCareer ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-background p-8 text-center text-sm text-muted-foreground">
          Selecciona una carrera para preparar el reporte mensual.
        </div>
      ) : monthlySummary.records === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No hay asistencias registradas para {MONTHS[month - 1].toLowerCase()} de {year} en esta carrera.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /> Alumnos incluidos</div>
            <p className="mt-2 text-2xl font-bold text-foreground">{monthlySummary.students}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" /> Clases incluidas</div>
            <p className="mt-2 text-2xl font-bold text-foreground">{monthlySummary.classSessions}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileSpreadsheet className="h-4 w-4" /> Registros incluidos</div>
            <p className="mt-2 text-2xl font-bold text-foreground">{monthlySummary.records}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        <strong className="text-foreground">Solo se descargará {MONTHS[month - 1].toLowerCase()} de {year}.</strong>{' '}
        P = Presente · F = Falta · J = Falta justificada · T = Tardanza · — = Sin registro
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default ReporteMensualExcel;
