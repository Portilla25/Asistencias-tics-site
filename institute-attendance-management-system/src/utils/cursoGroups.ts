import { Materia } from '../types';
import { getCareers, isHiddenMateriaId } from '../services/legacyData';

export interface CursoGroup {
  id: string;
  label: string;
  materias: Materia[];
}

export const getCursoGroups = (misMaterias: Materia[]): CursoGroup[] => {
  const careers = getCareers();
  const visibleMaterias = misMaterias.filter((m) => !isHiddenMateriaId(m.id));
  const groups: CursoGroup[] = [];
  const handledMateriaIds = new Set<string>();

  careers.forEach((career) => {
    const careerMateriaIds = new Set(career.secciones.map((s) => s.id));
    const careerMaterias = visibleMaterias.filter((m) => careerMateriaIds.has(m.id)).sort((a, b) => a.id.localeCompare(b.id));
    
    if (careerMaterias.length > 0) {
      groups.push({ id: career.id, label: career.nombre, materias: careerMaterias });
      careerMaterias.forEach(m => handledMateriaIds.add(m.id));
    }
  });

  // Any other materias that don't belong to a known career
  const otros = visibleMaterias.filter(m => !handledMateriaIds.has(m.id));
  otros.forEach(m => groups.push({ id: m.id, label: m.nombre, materias: [m] }));

  return groups;
};

