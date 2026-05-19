import { useState, useMemo, useCallback } from 'react';
import type { EvaluationRow, FilterState, FilterOptions, FuncaoFilter } from '../types';
import { sortPeriodos } from '../utils/dateUtils';

const SESSION_KEY = 'nps_csat_filters';

function loadSession(): Partial<FilterState> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSession(state: FilterState) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function buildFilterOptions(allData: EvaluationRow[]): FilterOptions {
  const periodos = sortPeriodos([...new Set(allData.map(r => r.periodo))]);
  const gps = [...new Set(allData.map(r => r.gp).filter(Boolean))].sort();
  const gts = [...new Set(allData.map(r => r.gt).filter(Boolean))].sort();
  const designers = [...new Set(allData.map(r => r.ds).filter(Boolean))].sort();
  const copywriters = [...new Set(allData.map(r => r.cp).filter(Boolean))].sort();
  const clientes = [...new Set(allData.map(r => r.cliente).filter(Boolean))].sort();

  return { periodos, gps, gts, designers, copywriters, squads: [], clientes };
}

export function applyFilters(data: EvaluationRow[], filters: FilterState): EvaluationRow[] {
  return data.filter(row => {
    // Filtro de período
    if (filters.periodos.length > 0 && !filters.periodos.includes(row.periodo)) return false;

    // Filtro por função
    if (filters.funcoes.length > 0) {
      const match = filters.funcoes.some(f => {
        if (f.tipo === 'GP') return row.gp === f.nome;
        if (f.tipo === 'GT') return row.gt === f.nome;
        if (f.tipo === 'Ds') return row.ds === f.nome;
        if (f.tipo === 'Cp') return row.cp === f.nome;
        return false;
      });
      if (!match) return false;
    }

    // Filtro por cliente
    if (filters.clientes.length > 0 && !filters.clientes.includes(row.cliente)) return false;

    return true;
  });
}

export function useFilters(allData: EvaluationRow[]) {
  const options = useMemo(() => buildFilterOptions(allData), [allData]);

  const getDefaultPeriodo = useCallback((): string[] => {
    if (!options.periodos.length) return [];
    return [options.periodos[options.periodos.length - 1]];
  }, [options.periodos]);

  const session = loadSession();

  const [filters, setFilters] = useState<FilterState>(() => ({
    periodos: session.periodos ?? getDefaultPeriodo(),
    funcoes: session.funcoes ?? [],
    squad: session.squad ?? 'Squad Midas',
    clientes: session.clientes ?? [],
  }));

  const updateFilters = useCallback((partial: Partial<FilterState>) => {
    setFilters(prev => {
      const next = { ...prev, ...partial };
      saveSession(next);
      return next;
    });
  }, []);

  const setPeriodos = useCallback((periodos: string[]) => updateFilters({ periodos }), [updateFilters]);
  const setFuncoes = useCallback((funcoes: FuncaoFilter[]) => updateFilters({ funcoes }), [updateFilters]);
  const setSquad = useCallback((squad: string) => updateFilters({ squad }), [updateFilters]);
  const setClientes = useCallback((clientes: string[]) => updateFilters({ clientes }), [updateFilters]);

  const filteredData = useMemo(() => applyFilters(allData, filters), [allData, filters]);

  // Dados do mês anterior (período imediatamente anterior ao mais antigo selecionado)
  const previousPeriodData = useMemo((): EvaluationRow[] => {
    if (!filters.periodos.length) return [];
    const sorted = sortPeriodos(filters.periodos);
    const earliest = sorted[0];

    // Encontrar o período anterior ao mais antigo selecionado
    const earliestIdx = options.periodos.indexOf(earliest);
    if (earliestIdx <= 0) return [];
    const prevPeriodo = options.periodos[earliestIdx - 1];

    return applyFilters(allData.filter(r => r.periodo === prevPeriodo), {
      ...filters,
      periodos: [prevPeriodo],
    });
  }, [allData, filters, options.periodos]);

  const hasPreviousPeriod = previousPeriodData.length > 0;

  return {
    filters,
    filteredData,
    previousPeriodData,
    hasPreviousPeriod,
    options,
    setPeriodos,
    setFuncoes,
    setSquad,
    setClientes,
  };
}
