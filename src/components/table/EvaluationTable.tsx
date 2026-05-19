import React, { useState, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import type { EvaluationRow, SortConfig } from '../../types';
import { getNPSRowColor, getCSATColor } from '../../utils/calculations';
import { formatPeriodo } from '../../utils/dateUtils';

const PAGE_SIZE = 25;

interface Props {
  rows: EvaluationRow[];
  loading?: boolean;
}

type Col = { key: keyof EvaluationRow | 'index'; label: string; sortable: boolean };

const COLUMNS: Col[] = [
  { key: 'index', label: '#', sortable: false },
  { key: 'cliente', label: 'Cliente', sortable: true },
  { key: 'periodo', label: 'Período', sortable: true },
  { key: 'notaNPS', label: 'NPS', sortable: true },
  { key: 'csatGeral', label: 'CSAT G.', sortable: true },
  { key: 'atendimento', label: 'Atend.', sortable: true },
  { key: 'campanhas', label: 'Camp.', sortable: true },
  { key: 'copys', label: 'Copys', sortable: true },
  { key: 'designs', label: 'Design', sortable: true },
  { key: 'prazos', label: 'Prazos', sortable: true },
  { key: 'resultados', label: 'Result.', sortable: true },
];

function formatCSAT(v: number | null): string {
  if (v === null) return '—';
  return v.toFixed(1);
}

export function EvaluationTable({ rows, loading }: Props) {
  const [sort, setSort] = useState<SortConfig>({ column: 'periodo', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();

  function handleSearch(v: string) {
    setSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchDebounced(v);
      setPage(1);
    }, 300);
  }

  function handleSort(col: Col) {
    if (!col.sortable) return;
    setSort(prev => ({
      column: col.key,
      direction: prev.column === col.key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setPage(1);
  }

  const filtered = useMemo(() => {
    if (!searchDebounced) return rows;
    const q = searchDebounced.toLowerCase();
    return rows.filter(r => r.cliente.toLowerCase().includes(q));
  }, [rows, searchDebounced]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sort.column === 'index') return 0;
      const key = sort.column as keyof EvaluationRow;

      if (key === 'periodo') {
        const diff = a.periodoIndex - b.periodoIndex;
        if (diff !== 0) return sort.direction === 'asc' ? diff : -diff;
        return a.cliente.localeCompare(b.cliente);
      }

      const av = a[key];
      const bv = b[key];
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === 'string' && typeof bv === 'string') {
        const diff = av.localeCompare(bv);
        return sort.direction === 'asc' ? diff : -diff;
      }
      const diff = (av as number) - (bv as number);
      return sort.direction === 'asc' ? diff : -diff;
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function exportCSV() {
    const csvData = sorted.map(r => ({
      Cliente: r.cliente,
      Período: r.periodo,
      NPS: r.notaNPS ?? '',
      'CSAT Geral': r.csatGeral ?? '',
      Atendimento: r.atendimento ?? '',
      Campanhas: r.campanhas ?? '',
      Copys: r.copys ?? '',
      Designs: r.designs ?? '',
      Prazos: r.prazos ?? '',
      Resultados: r.resultados ?? '',
      GP: r.gp,
      GT: r.gt,
      LT: r.lt ?? '',
    }));
    const csv = Papa.unparse(csvData, { delimiter: ';' });
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nps-csat-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="table-skeleton" />;

  return (
    <div className="eval-table-wrap">
      <div className="eval-table-header">
        <div className="eval-table-meta">
          <span className="eval-count">Mostrando {pageRows.length} de {sorted.length} avaliações</span>
        </div>
        <div className="eval-table-controls">
          <input
            className="eval-search"
            placeholder="Buscar cliente..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
          <button className="btn-export" onClick={exportCSV}>
            ↓ Exportar CSV
          </button>
        </div>
      </div>

      <div className="eval-table-scroll">
        <table className="eval-table">
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={String(col.key)}
                  className={`${col.sortable ? 'sortable' : ''} ${sort.column === col.key ? 'sorted' : ''}`}
                  onClick={() => handleSort(col)}
                >
                  {col.label}
                  {col.sortable && sort.column === col.key && (
                    <span className="sort-icon">{sort.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="eval-empty">
                  Nenhuma avaliação encontrada para os filtros selecionados.
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => {
                const rowNum = (safePage - 1) * PAGE_SIZE + i + 1;
                return (
                  <tr key={`${row.cliente}-${row.periodo}-${i}`} className={i % 2 === 0 ? 'row-even' : 'row-odd'}>
                    <td className="cell-num">{rowNum}</td>
                    <td className="cell-cliente">{row.cliente}</td>
                    <td>{formatPeriodo(row.periodo)}</td>
                    <td>
                      <span
                        className="nps-badge"
                        style={{ background: getNPSRowColor(row.notaNPS), color: '#fff' }}
                      >
                        {row.notaNPS ?? '—'}
                      </span>
                    </td>
                    <CsatCell value={row.csatGeral} />
                    <CsatCell value={row.atendimento} />
                    <CsatCell value={row.campanhas} />
                    <CsatCell value={row.copys} />
                    <CsatCell value={row.designs} />
                    <CsatCell value={row.prazos} />
                    <CsatCell value={row.resultados} />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="eval-pagination">
          <button
            className="page-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >‹ Anterior</button>
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...'
                  ? <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
                  : (
                    <button
                      key={p}
                      className={`page-btn ${p === safePage ? 'active' : ''}`}
                      onClick={() => setPage(p as number)}
                    >
                      {p}
                    </button>
                  )
              )}
          </div>
          <button
            className="page-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >Próximo ›</button>
        </div>
      )}
    </div>
  );
}

function CsatCell({ value }: { value: number | null }) {
  const color = getCSATColor(value);
  if (value === null) return <td className="cell-null">—</td>;
  return (
    <td style={{ color, fontWeight: value >= 4.5 ? '600' : 'normal' }}>
      {value.toFixed(1)}
    </td>
  );
}
