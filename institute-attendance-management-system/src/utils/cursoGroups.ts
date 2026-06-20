import { Materia } from '../types';
import { getCareers } from '../services/legacyData';

export interface CursoGroup {
  id: string;
  label: string;
  materias: Materia[];
}

export const getCursoGroups = (misMaterias: Materia[]): CursoGroup[] => {
  const careers = getCareers();
  const groups: CursoGroup[] = [];
  const handledMateriaIds = new Set<string>();

  careers.forEach((career) => {
    const careerMateriaIds = new Set(career.secciones.map((s) => s.id));
    const careerMaterias = misMaterias.filter((m) => careerMateriaIds.has(m.id)).sort((a, b) => a.id.localeCompare(b.id));
    
    if (careerMaterias.length > 0) {
      groups.push({ id: career.id, label: career.nombre, materias: careerMaterias });
      careerMaterias.forEach(m => handledMateriaIds.add(m.id));
    }
  });

  // Any other materias that don't belong to a known career
  const otros = misMaterias.filter(m => !handledMateriaIds.has(m.id));
  otros.forEach(m => groups.push({ id: m.id, label: m.nombre, materias: [m] }));

  return groups;
};

