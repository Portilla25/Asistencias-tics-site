import React from 'react';
import { useApp } from '../context/AppContext';
import { Clock, MapPin } from 'lucide-react';

const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const;
const diasLabel: Record<string, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes'
};

const Horarios: React.FC = () => {
  const { horarios, materias, currentUser, alumnos } = useApp();

  const alumnoActual = alumnos.find(a => a.email === currentUser?.email);
  const misHorarios = currentUser?.rol === 'alumno' && alumnoActual
    ? horarios.filter(h => alumnoActual.materias.includes(h.materiaId))
    : currentUser?.rol === 'docente'
    ? horarios.filter(h => materias.find(m => m.id === h.materiaId && m.docenteId === currentUser.id))
    : horarios;

  const getMateria = (id: string) => materias.find(m => m.id === id);

  const horarioGrid: Record<string, typeof horarios> = {};
  dias.forEach(dia => {
    horarioGrid[dia] = misHorarios
      .filter(h => h.dia === dia)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  });

  const horas = ['07:30', '08:00', '09:30', '10:00', '11:30', '12:00', '13:30', '14:00', '15:30'];

  return (
    <div className="p-6 space-y-5">
      {/* Vista Semanal - Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Horario Semanal</h3>
          <p className="text-xs text-gray-500 mt-0.5">2025 — Segundo Trimestre</p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header días */}
            <div className="grid grid-cols-6 border-b border-gray-100 bg-gray-50">
              <div className="p-3 text-xs font-semibold text-gray-500 uppercase">Hora</div>
              {dias.map(d => (
                <div key={d} className="p-3 text-center text-xs font-semibold text-gray-600 uppercase">{diasLabel[d]}</div>
              ))}
            </div>

            {/* Horas */}
            {horas.map(hora => (
              <div key={hora} className="grid grid-cols-6 border-b border-gray-50 min-h-[56px]">
                <div className="p-3 text-xs text-gray-400 font-mono flex items-center">{hora}</div>
                {dias.map(dia => {
                  const clase = misHorarios.find(h => h.dia === dia && h.horaInicio === hora);
                  const materia = clase ? getMateria(clase.materiaId) : null;
                  return (
                    <div key={dia} className="p-1.5 border-l border-gray-50">
                      {clase && materia && (
                        <div className="h-full rounded-lg p-2.5 text-white text-xs" style={{ backgroundColor: materia.color }}>
                          <p className="font-semibold leading-tight truncate">{materia.nombre}</p>
                          <div className="flex items-center gap-1 mt-1 opacity-80">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{clase.aula}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-80">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{clase.horaInicio}-{clase.horaFin}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de materias con horario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {materias
          .filter(m => misHorarios.some(h => h.materiaId === m.id))
          .map(materia => {
            const horariosMateria = misHorarios.filter(h => h.materiaId === materia.id);
            return (
              <div key={materia.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${materia.color}20` }}>
                    <span className="text-sm font-bold" style={{ color: materia.color }}>{materia.nombre[0]}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{materia.nombre}</h4>
                    <p className="text-xs text-gray-500">{materia.codigo}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {horariosMateria.map(h => (
                    <div key={h.id} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-medium text-gray-800 w-20">{diasLabel[h.dia]}</span>
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{h.horaInicio} - {h.horaFin}</span>
                      <MapPin className="w-3 h-3 text-gray-400 ml-auto" />
                      <span>{h.aula}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Horarios;
