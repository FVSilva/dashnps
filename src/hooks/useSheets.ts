import { useState, useEffect, useCallback, useRef } from 'react';
import type { EvaluationRow } from '../types';
import { fetchFromSheets, isCacheValid, invalidateCache, type SheetsConfig } from '../services/googleSheets';
import { MOCK_DATA } from '../data/mockData';

export type DataSource = 'mock' | 'sheets';

interface UseSheetResult {
  data: EvaluationRow[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
  dataSource: DataSource;
}

export function useSheets(config?: SheetsConfig): UseSheetResult {
  // Guardar config em ref para não causar re-renders ao receber novo objeto literal
  const configRef = useRef<SheetsConfig | undefined>(config);
  configRef.current = config;

  const dataSource: DataSource = config?.spreadsheetId ? 'sheets' : 'mock';
  const dataSourceRef = useRef(dataSource);
  dataSourceRef.current = dataSource;

  const [data, setData] = useState<EvaluationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      if (dataSourceRef.current === 'mock') {
        await new Promise(r => setTimeout(r, 600));
        setData(MOCK_DATA);
        setLastUpdated(new Date());
      } else {
        const rows = await fetchFromSheets(configRef.current!, forceRefresh);
        setData(rows);
        setLastUpdated(new Date());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []); // sem dependências — usa refs internamente

  useEffect(() => {
    load(false);
  }, [load]); // roda só uma vez na montagem

  const refresh = useCallback(() => {
    if (dataSourceRef.current === 'sheets') invalidateCache();
    load(true);
  }, [load]);

  return { data, loading, error, lastUpdated, refresh, dataSource };
}
