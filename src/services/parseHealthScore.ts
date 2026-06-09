import type { HealthScoreRow } from '../types/healthScore';
import { sanitizeClientName, parseFloatOrNull, parseIntOrNull, parseBRL } from '../utils/sanitize';

export function parseHealthScoreRows(raw: string[][]): HealthScoreRow[] {
  if (raw.length < 2) return [];

  const headers = raw[0].map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

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

  const results: HealthScoreRow[] = [];

  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    const data = get(row, ['data']).trim();
    if (!data) continue;

    results.push({
      cliente: sanitizeClientName(get(row, ['cliente'])),
      lt: parseIntOrNull(get(row, ['lt'])),
      data,
      healthScore: parseFloatOrNull(get(row, ['health score'])),
      faturamento: parseBRL(get(row, ['faturamento'])),
      roi: parseFloatOrNull(get(row, ['roi'])),
      fatorGravidade: parseFloatOrNull(get(row, ['fator de gravidade'])),
      nivelConsciencia: parseFloatOrNull(get(row, ['nível de consciência', 'nivel de consciencia'])),
      profundidadeRelacionamento: parseFloatOrNull(get(row, ['profundidade do relacionamento'])),
      nps: parseFloatOrNull(get(row, ['net promoter score (nps)'])),
      csat: parseFloatOrNull(get(row, ['customer satisfaction (csat)'])),
      touchCS: parseFloatOrNull(get(row, ['touch - cs'])),
      pulsacaoAccount: parseFloatOrNull(get(row, ['pulsação do account', 'pulsacao do account', '"pulsação do account"'])),
      pontualidadePagamentos: parseFloatOrNull(get(row, ['pontualidade dos pagamentos'])),
      historicoRenovacoes: parseFloatOrNull(get(row, ['histórico de renovações/upsells', 'historico de renovacoes/upsells'])),
      gp: get(row, ['gp']).trim(),
    });
  }

  return results;
}
