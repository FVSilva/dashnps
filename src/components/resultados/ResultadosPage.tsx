import React, { useMemo, useState } from 'react';
import type { ResultadosRow } from '../../types/resultados';

interface Props {
  data: ResultadosRow[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function atingimentoColor(pct: number): string {
  if (pct >= 100) return '#52CC5A';
  if (pct >= 80) return '#FFC02A';
  return '#C0392B';
}

function sumNonNull(values: (number | null)[]): number {
  return values.filter((v): v is number => v !== null).reduce((a, b) => a + b, 0);
}

function avgNonNull(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export function ResultadosPage({ data, loading, error, onRefresh }: Props) {
  const [filterGestor, setFilterGestor] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState('');

  const gestorOptions = useMemo(() => {
    const set = new Set(data.map(r => r.gestor).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const periodoOptions = useMemo(() => {
    const set = new Set(data.map(r => r.data).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter(r => {
      if (filterGestor && r.gestor !== filterGestor) return false;
      if (filterPeriodo && r.data !== filterPeriodo) return false;
      return true;
    });
  }, [data, filterGestor, filterPeriodo]);

  const totalFatR = useMemo(() => sumNonNull(filtered.map(r => r.faturamentoR)), [filtered]);
  const avgROIR = useMemo(() => avgNonNull(filtered.map(r => r.roiR)), [filtered]);
  const atingiramMeta = useMemo(() => {
    return filtered.filter(r => r.faturamentoR !== null && r.faturamentoP !== null && r.faturamentoR >= r.faturamentoP).length;
  }, [filtered]);

  if (error) {
    return (
      <div className="page-body">
        <div className="state-error">
          <div className="state-icon">⚠️</div>
          <div className="state-title">Erro ao carregar dados</div>
          <div className="state-msg">{error}</div>
          <button className="btn-refresh" onClick={onRefresh}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-body">
      {/* Filter bar */}
      <div className="report-filter-bar">
        <div className="filter-wrap">
          <span className="filter-label">Gestor</span>
          <select
            className="filter-trigger filter-select"
            value={filterGestor}
            onChange={e => setFilterGestor(e.target.value)}
          >
            <option value="">Todos</option>
            {gestorOptions.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div className="filter-wrap">
          <span className="filter-label">Período</span>
          <select
            className="filter-trigger filter-select"
            value={filterPeriodo}
            onChange={e => setFilterPeriodo(e.target.value)}
          >
            <option value="">Todos</option>
            {periodoOptions.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <button className="btn-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? 'Carregando…' : 'Atualizar'}
        </button>
      </div>

      {!loading && filtered.length === 0 && (
        <div className="state-empty">
          <div className="state-icon">📭</div>
          <div className="state-title">Nenhum dado encontrado</div>
          <div className="state-msg">Ajuste os filtros para visualizar dados.</div>
        </div>
      )}

      {(loading || filtered.length > 0) && (
        <>
          <div className="section-title">Indicadores de Resultados</div>
          <div className="kpi-row">
            <div className="kpi-card">
              <div className="kpi-label">Faturamento Realizado</div>
              {loading ? (
                <div className="kpi-skeleton" />
              ) : (
                <div className="kpi-value">
                  {totalFatR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              )}
            </div>
            <div className="kpi-card">
              <div className="kpi-label">ROI Médio</div>
              {loading ? (
                <div className="kpi-skeleton" />
              ) : (
                <div className="kpi-value">
                  {avgROIR !== null ? avgROIR.toFixed(2) : '—'}
                </div>
              )}
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Clientes</div>
              {loading ? (
                <div className="kpi-skeleton" />
              ) : (
                <div className="kpi-value">{filtered.length}</div>
              )}
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Atingiram Meta</div>
              {loading ? (
                <div className="kpi-skeleton" />
              ) : (
                <div className="kpi-value">{atingiramMeta} de {filtered.length}</div>
              )}
            </div>
          </div>

          <div className="section-title">Clientes</div>
          {loading ? (
            <div className="kpi-skeleton" style={{ height: 200 }} />
          ) : (
            <table className="eval-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Período</th>
                  <th>Gestor</th>
                  <th>Fat. Previsto</th>
                  <th>Fat. Realizado</th>
                  <th>Atingimento%</th>
                  <th>ROI P</th>
                  <th>ROI R</th>
                  <th>MC</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const atingPct =
                    row.faturamentoP && row.faturamentoP > 0 && row.faturamentoR !== null
                      ? (row.faturamentoR / row.faturamentoP) * 100
                      : null;
                  return (
                    <tr key={i}>
                      <td>{row.cliente}</td>
                      <td>{row.data}</td>
                      <td>{row.gestor}</td>
                      <td>
                        {row.faturamentoP !== null
                          ? row.faturamentoP.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '—'}
                      </td>
                      <td>
                        {row.faturamentoR !== null
                          ? row.faturamentoR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '—'}
                      </td>
                      <td style={{ color: atingPct !== null ? atingimentoColor(atingPct) : '', fontWeight: 600 }}>
                        {atingPct !== null ? `${atingPct.toFixed(1)}%` : '—'}
                      </td>
                      <td>{row.roiP !== null ? row.roiP.toFixed(2) : '—'}</td>
                      <td>{row.roiR !== null ? row.roiR.toFixed(2) : '—'}</td>
                      <td>{row.mc !== null ? `${row.mc.toFixed(1)}%` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
