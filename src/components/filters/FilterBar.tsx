import React from 'react';
import { MultiSelect } from './MultiSelect';
import type { FilterState, FilterOptions, FuncaoFilter } from '../../types';
import { formatPeriodo } from '../../utils/dateUtils';

interface Props {
  filters: FilterState;
  options: FilterOptions;
  onPeriodosChange: (v: string[]) => void;
  onFuncoesChange: (v: FuncaoFilter[]) => void;
  onSquadChange: (v: string) => void;
  onClientesChange: (v: string[]) => void;
  onRefresh: () => void;
  lastUpdated: Date | null;
  loading: boolean;
}

export function FilterBar({
  filters, options,
  onPeriodosChange, onFuncoesChange, onSquadChange, onClientesChange,
  onRefresh, lastUpdated, loading,
}: Props) {

  // Opções de período formatadas
  const periodoOptions = options.periodos.map(p => ({
    value: p,
    label: formatPeriodo(p),
  }));

  // Opções de função agrupadas por tipo
  const funcaoOptions = [
    ...options.gps.map(n => ({ value: `GP:${n}`, label: n, group: 'GP (Account)' })),
    ...options.gts.map(n => ({ value: `GT:${n}`, label: n, group: 'GT (Gestor de Tráfego)' })),
    ...options.designers.map(n => ({ value: `Ds:${n}`, label: n, group: 'Designer' })),
    ...options.copywriters.map(n => ({ value: `Cp:${n}`, label: n, group: 'Copywriter' })),
  ];

  const funcaoValues = filters.funcoes.map(f => `${f.tipo}:${f.nome}`);

  function handleFuncaoChange(vals: string[]) {
    const result: FuncaoFilter[] = vals.map(v => {
      const [tipo, ...rest] = v.split(':');
      return { tipo: tipo as FuncaoFilter['tipo'], nome: rest.join(':') };
    });
    onFuncoesChange(result);
  }

  const clienteOptions = options.clientes.map(c => ({ value: c, label: c }));

  const updatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="filter-bar">
      <div className="filter-bar-filters">
        <MultiSelect
          label="Período"
          options={periodoOptions}
          value={filters.periodos}
          onChange={onPeriodosChange}
          placeholder="Selecione..."
        />
        <MultiSelect
          label="Função"
          options={funcaoOptions}
          value={funcaoValues}
          onChange={handleFuncaoChange}
          placeholder="Todos"
        />
        <div className="filter-wrap">
          <label className="filter-label">Squad</label>
          <select
            className="filter-trigger filter-select"
            value={filters.squad}
            onChange={e => onSquadChange(e.target.value)}
          >
            {['Squad Midas', 'Squad Alpha', 'Squad Omega'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <MultiSelect
          label="Cliente"
          options={clienteOptions}
          value={filters.clientes}
          onChange={onClientesChange}
          searchable
          placeholder="Todos"
          maxDisplay={1}
        />
      </div>
      <div className="filter-bar-actions">
        {updatedStr && <span className="filter-updated">Atualizado às {updatedStr}</span>}
        <button className="btn-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? '...' : '↻ Atualizar'}
        </button>
      </div>
    </div>
  );
}
