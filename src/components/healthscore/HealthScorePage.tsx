import React, { useMemo, useState } from 'react';
import type { HealthScoreRow } from '../../types/healthScore';

interface Props {
  data: HealthScoreRow[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function healthColor(score: number | null): string {
  if (score === null) return '';
  if (score >= 8) return '#52CC5A';
  if (score >= 6) return '#FFC02A';
  return '#C0392B';
}

function avg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export function HealthScorePage({ data, loading, error, onRefresh }: Props) {
  const [filterGP, setFilterGP] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState('');

  const gpOptions = useMemo(() => {
    const set = new Set(data.map(r => r.gp).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const periodoOptions = useMemo(() => {
    const set = new Set(data.map(r => r.data).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter(r => {
      if (filterGP && r.gp !== filterGP) return false;
      if (filterPeriodo && r.data !== filterPeriodo) return false;
      return true;
    });
  }, [data, filterGP, filterPeriodo]);

  const avgHS = useMemo(() => avg(filtered.map(r => r.healthScore)), [filtered]);
  const avgNPS = useMemo(() => avg(filtered.map(r => r.nps)), [filtered]);
  const avgCSAT = useMemo(() => avg(filtered.map(r => r.csat)), [filtered]);

  const hsColor = healthColor(avgHS);

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
          <span className="filter-label">GP/Squad</span>
          <select
            className="filter-trigger filter-select"
            value={filterGP}
            onChange={e => setFilterGP(e.target.value)}
          >
            <option value="">Todos</option>
            {gpOptions.map(gp => (
              <option key={gp} value={gp}>{gp}</option>
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
          <div className="section-title">Indicadores Health Score</div>
          <div className="kpi-row">
            <div className="kpi-card">
              <div className="kpi-label">Health Score Médio</div>
              {loading ? (
                <div className="kpi-skeleton" />
              ) : (
                <div className="kpi-value" style={{ color: hsColor }}>
                  {avgHS !== null ? avgHS.toFixed(1) : '—'}
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
              <div className="kpi-label">NPS Médio</div>
              {loading ? (
                <div className="kpi-skeleton" />
              ) : (
                <div className="kpi-value">
                  {avgNPS !== null ? Math.round(avgNPS) : '—'}
                </div>
              )}
            </div>
            <div className="kpi-card">
              <div className="kpi-label">CSAT Médio</div>
              {loading ? (
                <div className="kpi-skeleton" />
              ) : (
                <div className="kpi-value">
                  {avgCSAT !== null ? avgCSAT.toFixed(2) : '—'}
                </div>
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
                  <th>GP</th>
                  <th>Health Score</th>
                  <th>NPS</th>
                  <th>CSAT</th>
                  <th>Faturamento</th>
                  <th>ROI</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={i}>
                    <td>{row.cliente}</td>
                    <td>{row.data}</td>
                    <td>{row.gp}</td>
                    <td style={{ color: healthColor(row.healthScore), fontWeight: 600 }}>
                      {row.healthScore !== null ? row.healthScore.toFixed(1) : '—'}
                    </td>
                    <td>{row.nps !== null ? row.nps : '—'}</td>
                    <td>{row.csat !== null ? row.csat.toFixed(2) : '—'}</td>
                    <td>
                      {row.faturamento !== null
                        ? row.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : '—'}
                    </td>
                    <td>{row.roi !== null ? row.roi.toFixed(2) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
