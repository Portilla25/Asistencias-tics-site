import {
  CalificacionData,
  NotaCampo,
  NotaSimple,
  NotasSimples,
  PuntosAplicados,
} from '../types';

export const NOTA_FIELDS: NotaCampo[] = ['nota1', 'nota2', 'nota3'];
export const SUBNOTAS_POR_NOTA = 3;
export const MAX_NOTA = 20;
export const MAX_PUNTOS_EXTRA = 20;

type NotaValues = Record<NotaCampo, number | null>;

export const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const parseNotaValue = (value: unknown): number | null => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return clampNumber(parsed, 0, MAX_NOTA);
};

export const parsePuntosExtraValue = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return clampNumber(Math.round(parsed), 0, MAX_PUNTOS_EXTRA);
};

export const crearSubnotasVacias = (): NotasSimples => ({
  nota1: crearGrupoSubnotas(),
  nota2: crearGrupoSubnotas(),
  nota3: crearGrupoSubnotas(),
});

const crearGrupoSubnotas = (): NotaSimple[] =>
  Array.from({ length: SUBNOTAS_POR_NOTA }, () => ({
    valor: null,
    tema: '',
  }));

const normalizeTema = (value: unknown) =>
  typeof value === 'string' ? value.slice(0, 60) : '';

const normalizeGrupoSubnotas = (raw: unknown, fallback: number | null): NotaSimple[] => {
  const source = Array.isArray(raw) ? raw : [];
  const result = crearGrupoSubnotas().map((empty, index) => {
    const item = source[index];
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      return {
        valor: parseNotaValue(record.valor),
        tema: normalizeTema(record.tema),
      };
    }
    return {
      ...empty,
      valor: parseNotaValue(item),
    };
  });

  const hasSavedSimpleNote = result.some(nota => nota.valor !== null);
  if (!hasSavedSimpleNote && fallback !== null) {
    result[0] = {
      ...result[0],
      valor: fallback,
    };
  }

  return result;
};

export const calcularPromedioSubnotas = (subnotas: NotaSimple[]): number | null => {
  const validas = subnotas
    .map(nota => nota.valor)
    .filter((valor): valor is number => valor !== null);
  if (validas.length === 0) return null;
  return Math.round(validas.reduce((total, valor) => total + valor, 0) / validas.length);
};

export const calcularPromedioGeneral = (notas: NotaValues): number | null => {
  const validas = NOTA_FIELDS
    .map(campo => notas[campo])
    .filter((valor): valor is number => valor !== null);
  if (validas.length === 0) return null;
  return Math.round(validas.reduce((total, valor) => total + valor, 0) / validas.length);
};

export const distribuirPuntosExtra = (promediosBase: NotaValues, puntosExtra: number) => {
  const notasAjustadas: NotaValues = { ...promediosBase };
  const puntosAplicados: PuntosAplicados = {
    nota1: 0,
    nota2: 0,
    nota3: 0,
  };
  let restantes = parsePuntosExtraValue(puntosExtra);

  while (restantes > 0) {
    const campoMasBajo = [...NOTA_FIELDS]
      .filter(campo => notasAjustadas[campo] !== null && notasAjustadas[campo]! < MAX_NOTA)
      .sort((a, b) => {
        const byValue = notasAjustadas[a]! - notasAjustadas[b]!;
        return byValue !== 0 ? byValue : NOTA_FIELDS.indexOf(a) - NOTA_FIELDS.indexOf(b);
      })[0];

    if (!campoMasBajo) break;

    notasAjustadas[campoMasBajo] = clampNumber(notasAjustadas[campoMasBajo]! + 1, 0, MAX_NOTA);
    puntosAplicados[campoMasBajo] += 1;
    restantes -= 1;
  }

  return {
    notasAjustadas,
    puntosAplicados,
  };
};

export const normalizarCalificacion = (raw?: Partial<CalificacionData>): CalificacionData => {
  const fallbackNotas: NotaValues = {
    nota1: parseNotaValue(raw?.nota1),
    nota2: parseNotaValue(raw?.nota2),
    nota3: parseNotaValue(raw?.nota3),
  };

  const notasSimples: NotasSimples = {
    nota1: normalizeGrupoSubnotas(raw?.notasSimples?.nota1, fallbackNotas.nota1),
    nota2: normalizeGrupoSubnotas(raw?.notasSimples?.nota2, fallbackNotas.nota2),
    nota3: normalizeGrupoSubnotas(raw?.notasSimples?.nota3, fallbackNotas.nota3),
  };

  const promediosBase: NotaValues = {
    nota1: calcularPromedioSubnotas(notasSimples.nota1),
    nota2: calcularPromedioSubnotas(notasSimples.nota2),
    nota3: calcularPromedioSubnotas(notasSimples.nota3),
  };
  const puntosExtra = parsePuntosExtraValue(raw?.puntosExtra ?? 0);
  const { notasAjustadas, puntosAplicados } = distribuirPuntosExtra(promediosBase, puntosExtra);

  return {
    nota1: notasAjustadas.nota1,
    nota2: notasAjustadas.nota2,
    nota3: notasAjustadas.nota3,
    promedioFinal: calcularPromedioGeneral(notasAjustadas),
    puntosExtra,
    notasSimples,
    puntosAplicados,
  };
};
