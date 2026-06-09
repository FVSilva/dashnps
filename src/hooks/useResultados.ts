import { useState, useEffect, useCallback, useRef } from 'react';
import type { ResultadosRow } from '../types/resultados';
import { fetchRawSheet, invalidateSheetCache } from '../services/fetchSheet';
import { parseResultadosRows } from '../services/parseResultados';

interface Config { spreadsheetId: string; apiKey: string; }

export function useResultados(config?: Config) {
  const configRef = useRef(config);
  configRef.current = config;
  const [data, setData] = useState<ResultadosRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (force = false) => {
    setLoading(true); setError(null);
    try {
      if (!configRef.current) { setData([]); return; }
      const raw = await fetchRawSheet(configRef.current.spreadsheetId, configRef.current.apiKey, 'BD_resultados', force);
      setData(parseResultadosRows(raw));
      setLastUpdated(new Date());
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(false); }, [load]);

  const refresh = useCallback(() => {
    if (configRef.current) invalidateSheetCache(configRef.current.spreadsheetId, 'BD_resultados');
    load(true);
  }, [load]);

  return { data, loading, error, lastUpdated, refresh };
}
