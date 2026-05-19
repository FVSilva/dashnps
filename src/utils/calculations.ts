import type { EvaluationRow, KPIData, NPSData, RespostasData, CSATVertical } from '../types';

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number | null {
  if (values.length < 2) return null;
  const m = mean(values)!;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function nonNull(values: (number | null)[]): number[] {
  return values.filter((v): v is number => v !== null);
}

export function calcNPS(rows: EvaluationRow[]): NPSData {
  const notes = nonNull(rows.map(r => r.notaNPS));
  if (!notes.length) {
    return { value: null, stdDev: null, delta: null, deltaStdDev: null, previousValue: null, hasHistory: false, promotores: 0, neutros: 0, detratores: 0, totalRespostas: 0 };
  }
  const total = notes.length;
  const promotores = notes.filter(n => n >= 9).length;
  const detratores = notes.filter(n => n <= 6).length;
  const neutros = total - promotores - detratores;
  const nps = Math.round(((promotores - detratores) / total) * 100);
  return {
    value: nps,
    stdDev: stdDev(notes),
    delta: null,
    deltaStdDev: null,
    previousValue: null,
    hasHistory: false,
    promotores,
    neutros,
    detratores,
    totalRespostas: total,
  };
}

export function calcCSATGeral(rows: EvaluationRow[]): KPIData {
  const values = nonNull(rows.map(r => r.csatGeral));
  return {
    value: mean(values),
    stdDev: stdDev(values),
    delta: null,
    deltaStdDev: null,
    previousValue: null,
    hasHistory: false,
  };
}

export function calcCSATVertical(rows: EvaluationRow[], vertical: CSATVertical): KPIData {
  const values = nonNull(rows.map(r => r[vertical]));
  return {
    value: mean(values),
    stdDev: stdDev(values),
    delta: null,
    deltaStdDev: null,
    previousValue: null,
    hasHistory: false,
  };
}

export function calcTotalRespostas(rows: EvaluationRow[]): RespostasData {
  const totalLinhas = rows.length;
  const responderam = rows.filter(r => r.notaNPS !== null).length;
  const taxaResposta = totalLinhas > 0 ? Math.round((responderam / totalLinhas) * 100) : null;
  return {
    value: taxaResposta,
    stdDev: null,
    delta: null,
    deltaStdDev: null,
    previousValue: null,
    hasHistory: false,
    responderam,
    totalLinhas,
    taxaResposta,
  };
}

export function calcLTMedio(rows: EvaluationRow[]): KPIData {
  const values = nonNull(rows.map(r => r.lt));
  return {
    value: mean(values),
    stdDev: stdDev(values),
    delta: null,
    deltaStdDev: null,
    previousValue: null,
    hasHistory: false,
  };
}

export function withDelta<T extends KPIData>(current: T, previous: T | null, hasHistory: boolean): T {
  if (!hasHistory || previous === null) {
    return { ...current, hasHistory: false, delta: null, deltaStdDev: null, previousValue: null };
  }
  const delta = current.value !== null && previous.value !== null
    ? current.value - previous.value
    : null;
  const deltaStdDev = current.stdDev !== null && previous.stdDev !== null
    ? current.stdDev - previous.stdDev
    : null;
  return {
    ...current,
    hasHistory: true,
    delta,
    deltaStdDev,
    previousValue: previous.value,
  };
}

export function getNPSColor(nps: number | null): string {
  if (nps === null) return '#CCCCCC';
  if (nps >= 65) return '#52CC5A';
  if (nps >= 30) return '#FFC02A';
  return '#C0392B';
}

export function getCSATColor(csat: number | null): string {
  if (csat === null) return '#CCCCCC';
  if (csat >= 4.5) return '#52CC5A';
  if (csat >= 3.5) return '#FFC02A';
  return '#C0392B';
}

export function getNPSRowColor(nota: number | null): string {
  if (nota === null) return '#CCCCCC';
  if (nota >= 9) return '#52CC5A';
  if (nota >= 7) return '#FFC02A';
  return '#C0392B';
}

export function formatDelta(delta: number | null, decimals = 1): string {
  if (delta === null) return '—';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(decimals)}`;
}

export function formatValue(value: number | null, decimals = 1): string {
  if (value === null) return '—';
  return value.toFixed(decimals);
}
