const CACHE_TTL_MS = 10 * 60 * 1000;
const caches = new Map<string, { data: string[][]; ts: number }>();

export async function fetchRawSheet(
  spreadsheetId: string,
  apiKey: string,
  sheetName: string,
  forceRefresh = false
): Promise<string[][]> {
  const key = `${spreadsheetId}::${sheetName}`;
  const cached = caches.get(key);
  if (!forceRefresh && cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;
  const range = encodeURIComponent(`${sheetName}!A1:Z2000`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Sheets API error: ${response.status}`);
  const json = await response.json();
  const data: string[][] = json.values ?? [];
  caches.set(key, { data, ts: Date.now() });
  return data;
}

export function invalidateSheetCache(spreadsheetId: string, sheetName: string): void {
  caches.delete(`${spreadsheetId}::${sheetName}`);
}
