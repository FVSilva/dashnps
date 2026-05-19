/** Remove CNPJ do nome do cliente: "Empresa XYZ - 12.345.678/0001-90" → "Empresa XYZ" */
export function sanitizeClientName(raw: string): string {
  if (!raw) return '';
  return raw.replace(/\s*-\s*\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}.*$/, '').trim();
}

export function parseFloatOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const str = String(value).replace(',', '.');
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

export function parseIntOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = parseInt(String(value), 10);
  return isNaN(n) ? null : n;
}
