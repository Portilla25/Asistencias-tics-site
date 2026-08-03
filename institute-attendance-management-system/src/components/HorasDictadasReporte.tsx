import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, Clock, Hash, Layers3, Loader2 } from 'lucide-react';
import { Asistencia, Materia } from '../types';
import { getCareers } from '../services/legacyData';
import { getSesiones, SesionData } from '../services/sesiones';
import { formatDateInPeru, getTodayInPeru, getWeekdayInPeru } from '../utils/dateUtils';
import { getHoursForModule } from '../utils/moduleSchedules';

interface HorasDictadasReporteProps {
  materias: Materia[];
  asistencias: Asistencia[];
}

interface ReportRow {
  id: string;
  materiaId: string;
  modulo: string;
  fecha: string;
  dia: string;
  numeroClase: number | null;
  horas: number;
  tema: string;
  modalidad: string;
}

const formatHours = (value: number) =>
  value.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const MONTH_OPTIONS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const HorasDictadasReporte: React.FC<HorasDictadasReporteProps> = ({ materias, asistencias }) => {
  const [selectedCareerId, setSelectedCareerId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => getTodayInPeru().slice(0, 7));
  const [sesionesByMateria, setSesionesByMateria] = useState<Record<string, SesionData[]>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const careerGroups = useMemo(() => {
    const materiaById = new Map(materias.map((materia) => [materia.id, materia]));

    return getCareers()
      .map((career) => ({
        career,
        materias: career.secciones
          .map((section) => materiaById.get(section.id))
          .filter((materia): materia is Materia => Boolean(materia)),
      }))
      .filter((group) => group.materias.length > 0);
  }, [materias]);

  useEffect(() => {
    if (careerGroups.length === 0) {
      if (selectedCareerId) setSelectedCareerId('');
      return;
    }

    if (!careerGroups.some(({ career }) => career.id === selectedCareerId)) {
      setSelectedCareerId(careerGroups[0].career.id);
    }
  }, [careerGroups, selectedCareerId]);

  const selectedGroup = useMemo(
    () => careerGroups.find(({ career }) => career.id === selectedCareerId),
    [careerGroups, selectedCareerId]
  );

  const selectedMateriaIdsKey = selectedGroup?.materias.map((materia) => materia.id).join('|') || '';

  useEffect(() => {
    if (!selectedMateriaIdsKey) {
      setSesionesByMateria({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    const materiaIds = selectedMateriaIdsKey.split('|');

    setLoading(true);
    setLoadError(false);
    setSesionesByMateria({});

    Promise.all(
      materiaIds.map(async (materiaId) => [materiaId, await getSesiones(materiaId)] as const)
    )
      .then((entries) => {
        if (!cancelled) setSesionesByMateria(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMateriaIdsKey]);

  const rows = useMemo<ReportRow[]>(() => {
    if (!selectedGroup) return [];

    return selectedGroup.materias
      .flatMap((materia) => {
        const attendanceDates = new Set(
          asistencias
            .filter((item) => item.materiaId === materia.id && item.fecha.startsWith(`${selectedMonth}-`))
            .map((item) => item.fecha)
        );
        const sessions = (sesionesByMateria[materia.id] || []).filter((session) =>
          session.fecha.startsWith(`${selectedMonth}-`)
        );
        const sessionByDate = new Map(sessions.map((session) => [session.fecha, session]));
        const dates = new Set([...attendanceDates, ...sessions.map((session) => session.fecha)]);

        return [...dates].map((fecha) => {
          const session = sessionByDate.get(fecha);
          const sessionHours = Number(session?.horas);
          const hours = Number.isFinite(sessionHours) && sessionHours > 0
            ? sessionHours
            : getHoursForModule(materia.id);

          return {
            id: `${materia.id}-${fecha}`,
            materiaId: materia.id,
            modulo: materia.codigo,
            fecha,
            dia: capitalize(getWeekdayInPeru(fecha)),
            numeroClase: session?.numeroClase && session.numeroClase > 0 ? session.numeroClase : null,
            horas: hours,
            tema: session?.tema?.trim() || '',
            modalidad: session?.modalidad?.trim() || 'Presencial',
          };
        });
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.modulo.localeCompare(b.modulo, 'es'));
  }, [asistencias, selectedGroup, selectedMonth, sesionesByMateria]);

  const totalHours = useMemo(() => rows.reduce((sum, row) => sum + row.horas, 0), [rows]);
  const modulesWithClasses = useMemo(() => new Set(rows.map((row) => row.materiaId)).size, [rows]);
  const selectedYear = selectedMonth.slice(0, 4);
  const selectedMonthNumber = selectedMonth.slice(5, 7);
  const availableYears = useMemo(() => {
    const years = new Set<string>([getTodayInPeru().slice(0, 4), selectedYear]);
    asistencias.forEach((item) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(item.fecha)) years.add(item.fecha.slice(0, 4));
    });
    Object.values(sesionesByMateria).forEach((sessions) => {
      sessions.forEach((session) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(session.fecha)) years.add(session.fecha.slice(0, 4));
      });
    });
    return [...years].sort((a, b) => b.localeCompare(a));
  }, [asistencias, selectedYear, sesionesByMateria]);
  const selectedMonthLabel = useMemo(
    () => capitalize(formatDateInPeru(`${selectedMonth}-01`, { month: 'long', year: 'numeric' })),
    [selectedMonth]
  );

  if (careerGroups.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
        <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="font-medium text-foreground">No hay carreras disponibles para este usuario.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Horas dictadas por carrera</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecciona una carrera y un mes para revisar cada clase registrada.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(260px,1fr)_150px_110px]">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Carrera
              <select
                aria-label="Carrera para el reporte de horas"
                value={selectedCareerId}
                onChange={(event) => setSelectedCareerId(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {careerGroups.map(({ career }) => (
                  <option key={career.id} value={career.id}>{career.nombre}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Mes
              <select
                aria-label="Mes para el reporte de horas"
                value={selectedMonthNumber}
                onChange={(event) => setSelectedMonth(`${selectedYear}-${event.target.value}`)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {MONTH_OPTIONS.map((month, index) => {
                  const value = String(index + 1).padStart(2, '0');
                  return <option key={value} value={value}>{month}</option>;
                })}
              </select>
            </label>

            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Año
              <select
                aria-label="Año para el reporte de horas"
                value={selectedYear}
                onChange={(event) => setSelectedMonth(`${event.target.value}-${selectedMonthNumber}`)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
            <Clock className="h-4 w-4" /> Horas dictadas
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-700 dark:text-indigo-200">{formatHours(totalHours)} h</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            <CalendarDays className="h-4 w-4" /> Clases registradas
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-200">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            <Layers3 className="h-4 w-4" /> Módulos con clases
          </div>
          <p className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-200">{modulesWithClasses}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-foreground">Detalle de clases</h3>
            <p className="text-sm text-muted-foreground">{selectedGroup?.career.nombre} · {selectedMonthLabel}</p>
          </div>
          {!loading && rows.length > 0 && (
            <p className="text-xs font-medium text-muted-foreground">{rows.length} clase{rows.length === 1 ? '' : 's'} en el periodo</p>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-52 flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Cargando el detalle de las clases...</p>
          </div>
        ) : rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">Módulo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">Día</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-muted-foreground">N.º de clase</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-muted-foreground">Horas</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">Tema</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">Modalidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-background/70">
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{row.modulo}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">{formatDateInPeru(row.fecha)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.dia}</td>
                    <td className="px-4 py-3 text-center">
                      {row.numeroClase ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                          <Hash className="h-3 w-3" /> {row.numeroClase}
                        </span>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">Sin registrar</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-indigo-600 dark:text-indigo-300">
                      {formatHours(row.horas)} h
                    </td>
                    <td className="max-w-md px-4 py-3 text-sm text-foreground">
                      {row.tema ? (
                        <span className="inline-flex items-start gap-2">
                          <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" />
                          <span>{row.tema}</span>
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground">Sin tema registrado</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{row.modalidad}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-indigo-50/70 dark:bg-indigo-500/10">
                  <td colSpan={4} className="px-4 py-3 text-right text-sm font-bold text-foreground">Total del periodo</td>
                  <td className="px-4 py-3 text-center text-sm font-black text-indigo-700 dark:text-indigo-200">{formatHours(totalHours)} h</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="flex min-h-52 flex-col items-center justify-center p-8 text-center">
            <CalendarDays className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-semibold text-foreground">No hay clases registradas en {selectedMonthLabel}.</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Prueba con otro mes o confirma que la asistencia de esa carrera haya sido guardada.
            </p>
          </div>
        )}

        {loadError && (
          <p className="border-t border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            No se pudieron cargar algunos temas o números de clase. Las fechas y horas disponibles siguen visibles.
          </p>
        )}
      </section>
    </div>
  );
};

export default HorasDictadasReporte;
