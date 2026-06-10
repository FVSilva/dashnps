import type { ResultadosRow } from '../types/resultados';
import { sanitizeClientName, parseFloatOrNull, parseIntOrNull, parseBRL, parsePct } from '../utils/sanitize';

export function parseResultadosRows(raw: string[][]): ResultadosRow[] {
  if (raw.length < 2) return [];

  const headers = raw[0].map(h => h.trim().toLowerCase());

  const idx = (names: string[]): number => {
    for (const name of names) {
      const i = headers.findIndex(h => h === name.toLowerCase());
      if (i >= 0) return i;
    }
    return -1;
  };

  const get = (row: string[], names: string[]): string => {
    const i = idx(names);
    return i >= 0 ? (row[i] ?? '') : '';
  };

  const results: ResultadosRow[] = [];

  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    const data = get(row, ['data']).trim();
    const cliente = get(row, ['cliente']).trim();
    if (!data && !cliente) continue;

    results.push({
      cliente: sanitizeClientName(cliente),
      clienteRaw: cliente,
      data,
      lt: parseIntOrNull(get(row, ['lt'])),
      faturamentoP: parseBRL(get(row, ['faturamento_p'])),
      faturamentoR: parseBRL(get(row, ['faturamento_r'])),
      investimentoP: parseBRL(get(row, ['investimento_p'])),
      investimentoR: parseBRL(get(row, ['investimento_r'])),
      roiP: parseFloatOrNull(get(row, ['roi_p'])),
      roiR: parseFloatOrNull(get(row, ['roi_r'])),
      cacP: parseBRL(get(row, ['cac_p'])),
      cacR: parseBRL(get(row, ['cac_r'])),
      vendasP: parseFloatOrNull(get(row, ['vendas_p'])),
      vendasR: parseFloatOrNull(get(row, ['vendas_r'])),
      ticketP: parseBRL(get(row, ['ticket_p'])),
      ticketR: parseBRL(get(row, ['ticket_r'])),
      gestor: get(row, ['gestor de projeto']).trim(),
      mc: parsePct(get(row, ['mc'])),
    });
  }

  return results;
}
