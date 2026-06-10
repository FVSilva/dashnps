import type { HealthScoreRow } from '../types/healthScore';
import { sanitizeClientName, parseFloatOrNull, parseIntOrNull } from '../utils/sanitize';

export function parseHealthScoreRows(raw: string[][]): HealthScoreRow[] {
  if (raw.length < 2) return [];

  // Strip only leading/trailing quote chars (NOT parentheses, to preserve "(NPS)" and "(CSAT)")
  const headers = raw[0].map(h => h.trim().replace(/^["']+|["']+$/g, '').toLowerCase());

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

    const rawHs = get(row, ['health score', 'healthscore']).trim();
    let healthScore: number | null;
    let healthScoreRaw: string | null;

    if (rawHs.toLowerCase() === 'erro' || rawHs === '') {
      healthScore = null;
      healthScoreRaw = rawHs || null;
    } else {
      healthScore = parseFloatOrNull(rawHs);
      healthScoreRaw = rawHs;
    }

    results.push({
      cliente: sanitizeClientName(get(row, ['cliente'])),
      clienteRaw: get(row, ['cliente']),
      lt: parseIntOrNull(get(row, ['lt'])),
      data,
      healthScore,
      healthScoreRaw,
      faturamento: parseFloatOrNull(get(row, ['faturamento'])),
      roi: parseFloatOrNull(get(row, ['roi'])),
      fatorGravidade: parseFloatOrNull(get(row, ['fator de gravidade'])),
      nivelConsciencia: parseFloatOrNull(get(row, ['nível de consciência', 'nivel de consciencia'])),
      profundidadeRelacionamento: parseFloatOrNull(get(row, ['profundidade do relacionamento'])),
      nps: parseFloatOrNull(get(row, ['net promoter score (nps)'])),
      csat: parseFloatOrNull(get(row, ['customer satisfaction (csat)'])),
      touchCS: parseFloatOrNull(get(row, ['touch - cs'])),
      // Header in sheet is: "Pulsação do Account") — after stripping quotes → pulsação do account)
      pulsacaoAccount: parseFloatOrNull(get(row, ['pulsação do account)', 'pulsação do account', 'pulsacao do account'])),
      pontualidadePagamentos: parseFloatOrNull(get(row, ['pontualidade dos pagamentos'])),
      historicoRenovacoes: parseFloatOrNull(get(row, ['histórico de renovações/upsells', 'historico de renovacoes/upsells'])),
      gp: get(row, ['gp']).trim(),
    });
  }

  return results;
}
