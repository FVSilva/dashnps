export const MONTH_MAP: Record<string, number> = {
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
};

export const MONTH_NAMES: Record<number, string> = {
  1: 'jan', 2: 'fev', 3: 'mar', 4: 'abr', 5: 'mai', 6: 'jun',
  7: 'jul', 8: 'ago', 9: 'set', 10: 'out', 11: 'nov', 12: 'dez',
};

export const MONTH_LABELS: Record<number, string> = {
  1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril', 5: 'Maio', 6: 'Junho',
  7: 'Julho', 8: 'Agosto', 9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro',
};

/** Converte "2026-abr." → número 202604 para ordenação */
export function periodoToIndex(periodo: string): number {
  const clean = periodo.replace('.', '').trim().toLowerCase();
  const parts = clean.split('-');
  if (parts.length !== 2) return 0;
  const [yearStr, monthStr] = parts;
  const year = parseInt(yearStr, 10);
  const month = MONTH_MAP[monthStr] ?? 0;
  if (!year || !month) return 0;
  return year * 100 + month;
}

/** Converte 202604 → "2026-abr." */
export function indexToPeriodo(index: number): string {
  const year = Math.floor(index / 100);
  const month = index % 100;
  return `${year}-${MONTH_NAMES[month]}.`;
}

/** Formata período para exibição: "2026-abr." → "Abr/2026" */
export function formatPeriodo(periodo: string): string {
  const idx = periodoToIndex(periodo);
  if (!idx) return periodo;
  const year = Math.floor(idx / 100);
  const month = idx % 100;
  const monthName = MONTH_LABELS[month] ?? '';
  return `${monthName}/${year}`;
}

/** Dado um índice de período, retorna o índice do mês anterior */
export function getPreviousPeriodoIndex(index: number): number {
  const year = Math.floor(index / 100);
  const month = index % 100;
  if (month === 1) return (year - 1) * 100 + 12;
  return year * 100 + (month - 1);
}

/** Ordena períodos cronologicamente (nunca alfabeticamente) */
export function sortPeriodos(periodos: string[]): string[] {
  return [...periodos].sort((a, b) => periodoToIndex(a) - periodoToIndex(b));
}

/** Dado um conjunto de períodos selecionados, calcula o período anterior (mês antes do mais antigo selecionado) */
export function getPreviousPeriodo(selectedPeriodos: string[]): string {
  const sorted = sortPeriodos(selectedPeriodos);
  const earliest = periodoToIndex(sorted[0]);
  return indexToPeriodo(getPreviousPeriodoIndex(earliest));
}

export function getQuarter(index: number): number {
  const month = index % 100;
  return Math.ceil(month / 3);
}
