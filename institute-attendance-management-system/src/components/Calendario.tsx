import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const estadoColors: Record<string, string> = {
  presente: 'bg-green-400',
  ausente: 'bg-red-400',
  tardanza: 'bg-amber-400',
  justificado: 'bg-indigo-400',
};

const Calendario: React.FC = () => {
  const { asistencias, materias, currentUser, alumnos } = useApp();
  const sortedDates = asistencias.map(a => a.fecha).sort();
  const latestDate = sortedDates[sortedDates.length - 1];
  const [currentDate, setCurrentDate] = useState(() => latestDate ? new Date(`${latestDate}T12:00:00`) : new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMateria, setSelectedMateria] = useState('');

  const alumnoActual = alumnos.find(a => a.email === currentUser?.email);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthName = currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  const misMaterias = currentUser?.rol === 'alumno' && alumnoActual
    ? materias.filter(m => alumnoActual.materias.includes(m.id))
    : currentUser?.rol === 'docente'
    ? materias.filter(m => m.docenteId === currentUser.id)
    : materias;

  const filteredAsistencias = useMemo(() => {
    let filtered = asistencias.filter(a => a.fecha.startsWith(monthStr));
    if (selectedMateria) filtered = filtered.filter(a => a.materiaId === selectedMateria);
    if (currentUser?.rol === 'alumno' && alumnoActual) {
      filtered = filtered.filter(a => a.alumnoId === alumnoActual.id);
    }
    return filtered;
  }, [asistencias, monthStr, selectedMateria, currentUser, alumnoActual]);

  const getDayStats = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayAsistencias = filteredAsistencias.filter(a => a.fecha === dateStr);
    if (dayAsistencias.length === 0) return null;

    const presentes = dayAsistencias.filter(a => a.estado === 'presente').length;
    const ausentes = dayAsistencias.filter(a => a.estado === 'ausente').length;
    const tardanzas = dayAsistencias.filter(a => a.estado === 'tardanza').length;
    const justificados = dayAsistencias.filter(a => a.estado === 'justificado').length;

    const uniqueEstados = [...new Set(dayAsistencias.map(a => a.estado))];

    return { presentes, ausentes, tardanzas, justificados, total: dayAsistencias.length, uniqueEstados, dateStr, dayAsistencias };
  };

  const selectedDayData = selectedDate ? filteredAsistencias.filter(a => a.fecha === selectedDate) : [];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const today = new Date().toLocaleDateString('en-CA');

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <h3 className="font-semibold text-foreground capitalize">{monthName}</h3>
            <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Filter */}
          <div className="px-5 py-3 border-b border-border bg-background">
            <select value={selectedMateria} onChange={e => setSelectedMateria(e.target.value)}
              className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Todas las materias</option>
              {misMaterias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 bg-background border-b border-border">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {Array.from({ length: adjustedFirstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[70px] border-b border-r border-gray-50" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayStats = getDayStats(day);
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;
              const isWeekend = (i + adjustedFirstDay) % 7 >= 5;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`min-h-[70px] border-b border-r border-gray-50 p-2 cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-50' :
                    isWeekend ? 'bg-background/50' :
                    'hover:bg-background'
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mb-1 ${
                    isToday ? 'bg-indigo-600 text-white' :
                    isSelected ? 'bg-indigo-200 text-indigo-800' :
                    'text-foreground'
                  }`}>
                    {day}
                  </span>

                  {dayStats && (
                    <div className="space-y-0.5">
                      {dayStats.uniqueEstados.slice(0, 3).map(estado => (
                        <div key={estado} className={`w-full h-1.5 rounded-full ${estadoColors[estado]}`} />
                      ))}
                      {dayStats.total > 0 && (
                        <p className="text-[9px] text-muted-foreground">{dayStats.total} reg.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-5 py-3 border-t border-border bg-background flex-wrap">
            {Object.entries({ presente: 'Presente', ausente: 'Ausente', tardanza: 'Tardanza', justificado: 'Justificado' }).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${estadoColors[k]}`} />
                <span className="text-xs text-muted-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-background">
            <h3 className="font-semibold text-foreground">
              {selectedDate
                ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
                : 'Seleccioná un día'}
            </h3>
            {selectedDate && <p className="text-xs text-muted-foreground">{selectedDayData.length} registros</p>}
          </div>

          {selectedDate && selectedDayData.length > 0 ? (
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {selectedDayData.map(asis => {
                const mat = materias.find(m => m.id === asis.materiaId);
                const alumno = alumnos.find(a => a.id === asis.alumnoId);
                return (
                  <div key={asis.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: mat?.color || '#6366f1' }} />
                    <div className="flex-1 min-w-0">
                      {currentUser?.rol !== 'alumno' && alumno && (
                        <p className="text-xs font-medium text-foreground truncate">{alumno.nombre} {alumno.apellido}</p>
                      )}
                      <p className="text-xs text-muted-foreground truncate">{mat?.nombre}</p>
                      {asis.observacion && <p className="text-xs text-muted-foreground italic truncate">{asis.observacion}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      asis.estado === 'presente' ? 'bg-green-100 text-green-700' :
                      asis.estado === 'ausente' ? 'bg-red-100 text-red-700' :
                      asis.estado === 'tardanza' ? 'bg-amber-100 text-amber-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {asis.estado}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-3">
                <ChevronLeft className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm">{selectedDate ? 'Sin registros este día' : 'Seleccioná un día para ver los detalles'}</p>
            </div>
          )}

          {/* Stats mes */}
          <div className="border-t border-border px-5 py-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Resumen del Mes</p>
            <div className="space-y-2">
              {[
                { label: 'Presentes', count: filteredAsistencias.filter(a => a.estado === 'presente').length, color: 'bg-green-500' },
                { label: 'Ausentes', count: filteredAsistencias.filter(a => a.estado === 'ausente').length, color: 'bg-red-500' },
                { label: 'Tardanzas', count: filteredAsistencias.filter(a => a.estado === 'tardanza').length, color: 'bg-amber-500' },
                { label: 'Justificados', count: filteredAsistencias.filter(a => a.estado === 'justificado').length, color: 'bg-indigo-500' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span className="text-xs text-muted-foreground flex-1">{s.label}</span>
                  <span className="text-xs font-bold text-foreground">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendario;
