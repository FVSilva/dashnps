import type { EvaluationRow } from '../types';
import { periodoToIndex } from '../utils/dateUtils';
import { sanitizeClientName, parseFloatOrNull, parseIntOrNull } from '../utils/sanitize';

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

interface CacheEntry {
  data: EvaluationRow[];
  timestamp: number;
}

let cache: CacheEntry | null = null;

export interface SheetsConfig {
  spreadsheetId: string;
  apiKey?: string;         // para acesso público read-only
  accessToken?: string;    // para OAuth2
  sheetName?: string;
}

/** Retorna true se o cache ainda é válido */
export function isCacheValid(): boolean {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_TTL_MS;
}

export function invalidateCache(): void {
  cache = null;
}

/** Transforma uma linha bruta da Sheets API em EvaluationRow */
function parseRow(headers: string[], values: string[]): EvaluationRow | null {
  // Aceita tanto os nomes do briefing quanto nomes curtos reais da planilha
  const get = (...cols: string[]) => {
    for (const col of cols) {
      const idx = headers.findIndex(h => h.trim().toLowerCase() === col.trim().toLowerCase());
      if (idx >= 0) return values[idx] ?? '';
    }
    return '';
  };

  const periodo = get('Data (Período)', 'Data', 'Período', 'periodo').trim();
  if (!periodo) return null;

  return {
    cliente: sanitizeClientName(get('Cliente')),
    lt: parseIntOrNull(get('LT')),
    gp: get('GP').trim(),
    gt: get('GT').trim(),
    ds: get('Ds').trim(),
    cp: get('Cp').trim(),
    periodo,
    periodoIndex: periodoToIndex(periodo),
    notaNPS: parseFloatOrNull(get('Nota (NPS)', 'Nota', 'NPS')),
    csatGeral: parseFloatOrNull(get('Geral', 'CSAT Geral', 'csat_geral')),
    atendimento: parseFloatOrNull(get('Atendimento')),
    campanhas: parseFloatOrNull(get('Campanhas')),
    copys: parseFloatOrNull(get('Copys')),
    designs: parseFloatOrNull(get('Designs')),
    prazos: parseFloatOrNull(get('Prazos')),
    resultados: parseFloatOrNull(get('Resultados')),
  };
}

/** Busca dados da Google Sheets API v4 */
export async function fetchFromSheets(config: SheetsConfig, forceRefresh = false): Promise<EvaluationRow[]> {
  if (!forceRefresh && isCacheValid()) {
    return cache!.data;
  }

  const sheetName = config.sheetName ?? 'Satisfação_BD';
  const range = encodeURIComponent(`${sheetName}!A1:P1000`);
  let url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${range}`;

  const headers: HeadersInit = {};
  if (config.apiKey) {
    url += `?key=${config.apiKey}`;
  } else if (config.accessToken) {
    headers['Authorization'] = `Bearer ${config.accessToken}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const rows: string[][] = json.values ?? [];
  if (rows.length < 2) return [];

  const colHeaders = rows[0].map((h: string) => h.trim());
  const data: EvaluationRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = parseRow(colHeaders, rows[i]);
    if (row) data.push(row);
  }

  cache = { data, timestamp: Date.now() };
  return data;
}

/** Retorna os dados do cache local sem fazer fetch (usado em modo demo) */
export function getCachedData(): EvaluationRow[] | null {
  return cache?.data ?? null;
}
