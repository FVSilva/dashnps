import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, ScatterChart, Scatter,
  Cell, ReferenceLine,
} from 'recharts';
import type { ResultadosRow } from '../../types/resultados';
import { sortPeriodos, formatPeriodo, periodoToIndex } from '../../utils/dateUtils';

// ─── Helper types & functions ───────────────────────────────────────────────

type StatusMeta = 'verde' | 'amarelo' | 'vermelho' | 'semMeta';

function statusPadrao(realizado: number | null, meta: number | null): StatusMeta {
  if (realizado === null || meta === null || meta === 0) return 'semMeta';
  const pct = (realizado / meta) * 100;
  if (pct >= 100) return 'verde';
  if (pct >= 70) return 'amarelo';
  return 'vermelho';
}

function pctAting(realizado: number | null, meta: number | null): number | null {
  if (realizado === null || meta === null || meta === 0) return null;
  return (realizado / meta) * 100;
}

function statusCAC(cacR: number | null, cacP: number | null): StatusMeta {
  if (cacR === null || cacP === null || cacP === 0) return 'semMeta';
  if (cacR <= cacP) return 'verde';
  if (cacR <= cacP * 1.30) return 'amarelo';
  return 'vermelho';
}

const STATUS_COLOR: Record<StatusMeta, string> = {
  verde: '#27AE60', amarelo: '#D4A017', vermelho: '#E74C3C', semMeta: '#999999',
};
const STATUS_LABEL: Record<StatusMeta, string> = {
  verde: 'Bateu meta', amarelo: 'Próximo da meta', vermelho: 'Abaixo da meta', semMeta: 'Sem meta',
};

function semaforoGeral(row: ResultadosRow): StatusMeta {
  const statuses: StatusMeta[] = [
    statusPadrao(row.faturamentoR, row.faturamentoP),
    statusPadrao(row.roiR, row.roiP),
    statusPadrao(row.vendasR, row.vendasP),
    statusPadrao(row.ticketR, row.ticketP),
    statusCAC(row.cacR, row.cacP),
  ].filter(s => s !== 'semMeta');
  if (!statuses.length) return 'semMeta';
  const verdes = statuses.filter(s => s === 'verde').length;
  const vermelhos = statuses.filter(s => s === 'vermelho').length;
  if (verdes > statuses.length / 2) return 'verde';
  if (vermelhos > statuses.length / 2) return 'vermelho';
  return 'amarelo';
}

function gpColor(gp: string): string {
  const g = gp.trim().toLowerCase();
  if (g === 'camila') return '#3B82F6';
  if (g === 'gabriella') return '#8B5CF6';
  if (g === 'thais') return '#10B981';
  return '#999';
}

function fmtBRL(v: number | null): string {
  if (v === null) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function fmtPct(v: number | null): string {
  if (v === null) return '—';
  return `${v.toFixed(0)}%`;
}

function fmtROI(v: number | null): string {
  if (v === null) return '—';
  return `${v.toFixed(2)}x`;
}

function hasQuedaROI(rows: ResultadosRow[]): boolean {
  if (rows.length < 2) return false;
  const sorted = [...rows].sort((a, b) => periodoToIndex(a.data) - periodoToIndex(b.data));
  const rois = sorted.map(r => r.roiR);
  const n = rois.length;
  if (n >= 3 && rois[n - 1] !== null && rois[n - 2] !== null && rois[n - 3] !== null)
    return rois[n - 1]! < rois[n - 2]! && rois[n - 2]! < rois[n - 3]!;
  if (rois[n - 1] !== null && rois[n - 2] !== null)
    return rois[n - 1]! < rois[n - 2]!;
  return false;
}

// ─── ResultadosTable ─────────────────────────────────────────────────────────

interface TableProps {
  rows: ResultadosRow[];
  allDataByCliente: Map<string, ResultadosRow[]>;
  sortCol: string;
  sortDir: 'asc' | 'desc';
  onSort: (col: string) => void;
  onSelect: (row: ResultadosRow) => void;
}

function PctBadge({ value, status }: { value: number | null; status: StatusMeta }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 7px',
      borderRadius: 12,
      fontWeight: 700,
      fontSize: 12,
      background: STATUS_COLOR[status] + '22',
      color: STATUS_COLOR[status],
      minWidth: 44,
      textAlign: 'center',
    }}>
      {fmtPct(value)}
    </span>
  );
}

function SortIcon({ col, sortCol, sortDir }: { col: string; sortCol: string; sortDir: 'asc' | 'desc' }) {
  if (sortCol !== col) return <span style={{ color: '#ccc', fontSize: 10 }}> ⇅</span>;
  return <span className="sort-icon"> {sortDir === 'asc' ? '↑' : '↓'}</span>;
}

function ResultadosTable({ rows, allDataByCliente, sortCol, sortDir, onSort, onSelect }: TableProps) {
  return (
    <div className="eval-table-wrap">
      <div className="eval-table-scroll">
        <table className="eval-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>#</th>
              <th>Cliente</th>
              <th>GP</th>
              <th className={`sortable${sortCol === 'lt' ? ' sorted' : ''}`} onClick={() => onSort('lt')}>
                LT <SortIcon col="lt" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th>Status</th>
              <th className={`sortable${sortCol === 'fatPct' ? ' sorted' : ''}`} onClick={() => onSort('fatPct')}>
                Fat P <SortIcon col="fatPct" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th className={`sortable${sortCol === 'fatR' ? ' sorted' : ''}`} onClick={() => onSort('fatR')}>
                Fat R <SortIcon col="fatR" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th className={`sortable${sortCol === 'fatPct' ? ' sorted' : ''}`} onClick={() => onSort('fatPct')}>
                Fat% <SortIcon col="fatPct" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th>ROI P</th>
              <th className={`sortable${sortCol === 'roiR' ? ' sorted' : ''}`} onClick={() => onSort('roiR')}>
                ROI R <SortIcon col="roiR" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th className={`sortable${sortCol === 'roiPct' ? ' sorted' : ''}`} onClick={() => onSort('roiPct')}>
                ROI% <SortIcon col="roiPct" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th>Invest P</th>
              <th>Invest R</th>
              <th>CAC P</th>
              <th>CAC R</th>
              <th>Alertas</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={16} className="eval-empty">Nenhum resultado encontrado</td></tr>
            )}
            {rows.map((row, i) => {
              const fatStatus = statusPadrao(row.faturamentoR, row.faturamentoP);
              const roiStatus = statusPadrao(row.roiR, row.roiP);
              const cacStatus = statusCAC(row.cacR, row.cacP);
              const semaforo = semaforoGeral(row);
              const clienteHistory = allDataByCliente.get(row.cliente) ?? [];
              const quedaROI = hasQuedaROI(clienteHistory);
              const roiCritico = roiStatus === 'vermelho';
              const subinvest = row.investimentoR !== null && row.investimentoP !== null && row.investimentoP > 0
                && (row.investimentoR / row.investimentoP) < 0.7;

              return (
                <tr
                  key={row.clienteRaw + row.data + i}
                  className={i % 2 === 0 ? 'row-even' : 'row-odd'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelect(row)}
                >
                  <td className="cell-num">{i + 1}</td>
                  <td className="cell-cliente" title={row.clienteRaw} style={{ maxWidth: 200 }}>
                    {row.cliente.slice(0, 28)}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      background: gpColor(row.gestor) + '22',
                      color: gpColor(row.gestor),
                    }}>
                      {row.gestor || '—'}
                    </span>
                  </td>
                  <td>{row.lt !== null ? row.lt : <span className="cell-null">—</span>}</td>
                  <td>
                    <span
                      title={STATUS_LABEL[semaforo]}
                      style={{
                        display: 'inline-block',
                        width: 12, height: 12, borderRadius: '50%',
                        background: STATUS_COLOR[semaforo],
                        verticalAlign: 'middle',
                      }}
                    />
                  </td>
                  <td>{fmtBRL(row.faturamentoP)}</td>
                  <td>{fmtBRL(row.faturamentoR)}</td>
                  <td><PctBadge value={pctAting(row.faturamentoR, row.faturamentoP)} status={fatStatus} /></td>
                  <td>{fmtROI(row.roiP)}</td>
                  <td>{fmtROI(row.roiR)}</td>
                  <td><PctBadge value={pctAting(row.roiR, row.roiP)} status={roiStatus} /></td>
                  <td>{fmtBRL(row.investimentoP)}</td>
                  <td>{fmtBRL(row.investimentoR)}</td>
                  <td>{fmtBRL(row.cacP)}</td>
                  <td>
                    {row.cacR !== null ? (
                      <span style={{ color: STATUS_COLOR[cacStatus], fontWeight: 600 }}>{fmtBRL(row.cacR)}</span>
                    ) : <span className="cell-null">—</span>}
                  </td>
                  <td>
                    <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {roiCritico && (
                        <span style={{ fontSize: 10, background: '#fde8e8', color: '#E74C3C', padding: '2px 5px', borderRadius: 8, fontWeight: 700 }}>ROI crítico</span>
                      )}
                      {subinvest && (
                        <span style={{ fontSize: 10, background: '#fff3e0', color: '#e67e22', padding: '2px 5px', borderRadius: 8, fontWeight: 700 }}>Subinvest.</span>
                      )}
                      {quedaROI && (
                        <span style={{ fontSize: 10, background: '#f3e8ff', color: '#8B5CF6', padding: '2px 5px', borderRadius: 8, fontWeight: 700 }}>Queda ROI</span>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ClienteModal ─────────────────────────────────────────────────────────────

interface ModalProps {
  row: ResultadosRow;
  history: ResultadosRow[];
  onClose: () => void;
}

function MetricCard({
  label,
  meta,
  realizado,
  fmt,
  status,
}: {
  label: string;
  meta: number | null;
  realizado: number | null;
  fmt: (v: number | null) => string;
  status: StatusMeta;
}) {
  return (
    <div style={{
      background: '#fafafa',
      border: '1px solid #eee',
      borderRadius: 10,
      padding: '12px 14px',
      minWidth: 110,
      flex: 1,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#888', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: STATUS_COLOR[status] }}>{fmt(realizado)}</div>
      <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>Meta: {fmt(meta)}</div>
      <div style={{ marginTop: 4 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: 8,
          background: STATUS_COLOR[status] + '22',
          color: STATUS_COLOR[status],
        }}>{STATUS_LABEL[status]}</span>
      </div>
    </div>
  );
}

function ClienteModal({ row, history, onClose }: ModalProps) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => periodoToIndex(a.data) - periodoToIndex(b.data)),
    [history]
  );
  const last6 = sortedHistory.slice(-6);

  const roiSparkData = last6.map(r => ({
    periodo: formatPeriodo(r.data),
    roiR: r.roiR,
    roiP: r.roiP,
  }));

  const barData = [
    { name: 'Faturamento', meta: row.faturamentoP, real: row.faturamentoR },
    { name: 'Investimento', meta: row.investimentoP, real: row.investimentoR },
    { name: 'Vendas', meta: row.vendasP, real: row.vendasR },
    { name: 'Ticket', meta: row.ticketP, real: row.ticketR },
    { name: 'CAC', meta: row.cacP, real: row.cacR },
  ];

  const below70 = [
    { label: 'Faturamento', pct: pctAting(row.faturamentoR, row.faturamentoP) },
    { label: 'ROI', pct: pctAting(row.roiR, row.roiP) },
    { label: 'Vendas', pct: pctAting(row.vendasR, row.vendasP) },
    { label: 'Ticket', pct: pctAting(row.ticketR, row.ticketP) },
  ].filter(m => m.pct !== null && m.pct < 70);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 650,
        height: '100%',
        background: '#fff',
        overflowY: 'auto',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#1A1A1A', wordBreak: 'break-word' }}>{row.clienteRaw}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: gpColor(row.gestor) + '22', color: gpColor(row.gestor),
              }}>{row.gestor || '—'}</span>
              {row.lt !== null && (
                <span style={{ fontSize: 12, color: '#666', background: '#f5f5f5', padding: '2px 8px', borderRadius: 20 }}>LT {row.lt}</span>
              )}
              <span style={{ fontSize: 12, color: '#666', background: '#f5f5f5', padding: '2px 8px', borderRadius: 20 }}>{formatPeriodo(row.data)}</span>
              {row.mc !== null && (
                <span style={{ fontSize: 12, color: '#666', background: '#f5f5f5', padding: '2px 8px', borderRadius: 20 }}>MC {row.mc.toFixed(1)}%</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: '#888', lineHeight: 1, padding: 4, flexShrink: 0 }}
          >×</button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* KPI cards */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#555', marginBottom: 10 }}>Métricas do Período</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <MetricCard label="Faturamento" meta={row.faturamentoP} realizado={row.faturamentoR} fmt={fmtBRL} status={statusPadrao(row.faturamentoR, row.faturamentoP)} />
              <MetricCard label="ROI" meta={row.roiP} realizado={row.roiR} fmt={fmtROI} status={statusPadrao(row.roiR, row.roiP)} />
              <MetricCard label="CAC" meta={row.cacP} realizado={row.cacR} fmt={fmtBRL} status={statusCAC(row.cacR, row.cacP)} />
              <MetricCard label="Vendas" meta={row.vendasP} realizado={row.vendasR} fmt={v => v !== null ? v.toFixed(0) : '—'} status={statusPadrao(row.vendasR, row.vendasP)} />
              <MetricCard label="Ticket" meta={row.ticketP} realizado={row.ticketR} fmt={fmtBRL} status={statusPadrao(row.ticketR, row.ticketP)} />
            </div>
          </div>

          {/* Bar chart P vs R */}
          <div className="report-card">
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Meta vs Realizado</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => {
                  if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
                  return String(v);
                }} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} />
                <Legend />
                <Bar dataKey="meta" name="Meta" fill="#999" radius={[4, 4, 0, 0]} />
                <Bar dataKey="real" name="Realizado" fill="#E50914" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ROI sparkline */}
          {roiSparkData.some(d => d.roiR !== null) && (
            <div className="report-card">
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Evolução do ROI (últimos 6 meses)</div>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={roiSparkData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}x`} />
                  <Tooltip formatter={(v: number) => fmtROI(v)} />
                  <Line dataKey="roiR" stroke="#E50914" name="ROI R" dot={{ r: 4 }} strokeWidth={2} connectNulls={false} />
                  <Line dataKey="roiP" stroke="#999" strokeDasharray="4 2" name="ROI P" dot={false} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Below 70% alert */}
          {below70.length > 0 && (
            <div style={{ background: '#fff5f5', border: '1px solid #fde', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#E74C3C', marginBottom: 8 }}>Métricas abaixo de 70% da meta</div>
              {below70.map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <span style={{ color: '#E74C3C', fontSize: 14 }}>⚠</span>
                  <span style={{ fontSize: 13 }}><strong>{m.label}</strong>: {fmtPct(m.pct)} atingido</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

interface Props {
  data: ResultadosRow[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function ResultadosPage({ data, loading, error, onRefresh }: Props) {
  const [periodoFiltro, setPeriodoFiltro] = useState('');
  const [gpFiltro, setGpFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [clienteFiltro, setClienteFiltro] = useState('');
  const [squad, setSquad] = useState('Squad Midas');
  const [sortCol, setSortCol] = useState<string>('fatPct');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedRow, setSelectedRow] = useState<ResultadosRow | null>(null);

  // ── Derived selectors ────────────────────────────────────────────────────
  const todosPeriodos = useMemo(
    () => sortPeriodos([...new Set(data.map(r => r.data))]).reverse(),
    [data]
  );
  const gps = useMemo(
    () => [...new Set(data.map(r => r.gestor).filter(Boolean))].sort(),
    [data]
  );
  const clientes = useMemo(
    () => [...new Set(data.map(r => r.cliente).filter(Boolean))].sort(),
    [data]
  );

  const currentPeriodo = periodoFiltro || todosPeriodos[0] || '';

  const prevPeriodo = useMemo(() => {
    const allSorted = sortPeriodos([...new Set(data.map(r => r.data))]);
    const idx = allSorted.indexOf(currentPeriodo);
    return idx > 0 ? allSorted[idx - 1] : null;
  }, [data, currentPeriodo]);

  const currentAll = useMemo(() =>
    data.filter(r =>
      r.data === currentPeriodo &&
      (!gpFiltro      || r.gestor === gpFiltro) &&
      (!clienteFiltro || r.cliente === clienteFiltro)
    ),
    [data, currentPeriodo, gpFiltro, clienteFiltro]
  );

  const filteredData = useMemo(() => {
    if (!statusFiltro) return currentAll;
    return currentAll.filter(r => semaforoGeral(r) === statusFiltro);
  }, [currentAll, statusFiltro]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let av: number | null = null, bv: number | null = null;
      switch (sortCol) {
        case 'fatPct': av = pctAting(a.faturamentoR, a.faturamentoP); bv = pctAting(b.faturamentoR, b.faturamentoP); break;
        case 'roiPct': av = pctAting(a.roiR, a.roiP); bv = pctAting(b.roiR, b.roiP); break;
        case 'fatR': av = a.faturamentoR; bv = b.faturamentoR; break;
        case 'roiR': av = a.roiR; bv = b.roiR; break;
        case 'lt': av = a.lt; bv = b.lt; break;
        default: av = pctAting(a.faturamentoR, a.faturamentoP); bv = pctAting(b.faturamentoR, b.faturamentoP);
      }
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [filteredData, sortCol, sortDir]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalClientes = currentAll.length;
  const fatTotalR = currentAll.reduce((s, r) => s + (r.faturamentoR ?? 0), 0);
  const fatTotalP = currentAll.filter(r => r.faturamentoP !== null).reduce((s, r) => s + (r.faturamentoP ?? 0), 0);
  const roiMedio = (() => {
    const vals = currentAll.map(r => r.roiR).filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  })();
  const pctBateuFat = (() => {
    const c = currentAll.filter(r => r.faturamentoP !== null).length;
    if (!c) return null;
    const b = currentAll.filter(r => statusPadrao(r.faturamentoR, r.faturamentoP) === 'verde').length;
    return (b / c) * 100;
  })();
  const pctBateuROI = (() => {
    const c = currentAll.filter(r => r.roiP !== null).length;
    if (!c) return null;
    const b = currentAll.filter(r => statusPadrao(r.roiR, r.roiP) === 'verde').length;
    return (b / c) * 100;
  })();

  // ── Alerts ───────────────────────────────────────────────────────────────
  const alertasRows = useMemo(() => {
    return [...currentAll]
      .filter(r => r.roiR !== null || r.faturamentoR !== null)
      .sort((a, b) => {
        const ap = pctAting(a.roiR, a.roiP) ?? pctAting(a.faturamentoR, a.faturamentoP) ?? 200;
        const bp = pctAting(b.roiR, b.roiP) ?? pctAting(b.faturamentoR, b.faturamentoP) ?? 200;
        return ap - bp;
      })
      .slice(0, 5);
  }, [currentAll]);

  // ── All data by client (sparklines) ─────────────────────────────────────
  const allDataByCliente = useMemo(() => {
    const map = new Map<string, ResultadosRow[]>();
    data.forEach(r => {
      const arr = map.get(r.cliente) ?? [];
      arr.push(r);
      map.set(r.cliente, arr);
    });
    return map;
  }, [data]);

  // ── Charts data ──────────────────────────────────────────────────────────
  const distribuicaoROI = useMemo(() => {
    const counts = { verde: 0, amarelo: 0, vermelho: 0, semMeta: 0 };
    currentAll.forEach(r => counts[statusPadrao(r.roiR, r.roiP)]++);
    return [
      { name: 'Bateu meta', value: counts.verde, color: '#27AE60' },
      { name: 'Próximo', value: counts.amarelo, color: '#D4A017' },
      { name: 'Abaixo', value: counts.vermelho, color: '#E74C3C' },
      { name: 'Sem meta', value: counts.semMeta, color: '#999' },
    ].filter(d => d.value > 0);
  }, [currentAll]);

  const rankingROI = useMemo(() => {
    const withROI = currentAll.filter(r => r.roiR !== null).sort((a, b) => (b.roiR ?? 0) - (a.roiR ?? 0));
    return { top5: withROI.slice(0, 5), bottom5: [...withROI].reverse().slice(0, 5) };
  }, [currentAll]);

  const evolucaoFat = useMemo(() => {
    const allPeriods = sortPeriodos([...new Set(data.map(r => r.data))]);
    return allPeriods.map(p => {
      const rows = data.filter(r => r.data === p && (!gpFiltro || r.gestor === gpFiltro));
      return {
        periodo: formatPeriodo(p),
        realizado: rows.reduce((s, r) => s + (r.faturamentoR ?? 0), 0) || null,
        meta: rows.filter(r => r.faturamentoP !== null).reduce((s, r) => s + (r.faturamentoP ?? 0), 0) || null,
      };
    });
  }, [data, gpFiltro]);

  const scatterData = useMemo(() =>
    currentAll
      .filter(r => r.roiR !== null && r.investimentoR !== null)
      .map(r => ({
        name: r.cliente.slice(0, 20),
        x: r.investimentoR,
        y: r.roiR,
        status: statusPadrao(r.roiR, r.roiP),
      })),
    [currentAll]
  );

  // ── Sort handler ─────────────────────────────────────────────────────────
  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="page-body">
        <div className="state-error">
          <div className="state-icon">⚠</div>
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
          <span className="filter-label">Período</span>
          <select
            className="filter-trigger filter-select"
            value={periodoFiltro}
            onChange={e => setPeriodoFiltro(e.target.value)}
            disabled={loading && todosPeriodos.length === 0}
          >
            {loading && todosPeriodos.length === 0
              ? <option value="">Carregando...</option>
              : <>
                  <option value="">Mais recente</option>
                  {todosPeriodos.map(p => (
                    <option key={p} value={p}>{formatPeriodo(p)}</option>
                  ))}
                </>
            }
          </select>
        </div>
        <div className="filter-wrap">
          <span className="filter-label">Gestor de Projetos</span>
          <select
            className="filter-trigger filter-select"
            value={gpFiltro}
            onChange={e => setGpFiltro(e.target.value)}
          >
            <option value="">Todos</option>
            {gps.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div className="filter-wrap">
          <span className="filter-label">Cliente</span>
          <select
            className="filter-trigger filter-select"
            value={clienteFiltro}
            onChange={e => setClienteFiltro(e.target.value)}
          >
            <option value="">Todos</option>
            {clientes.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="filter-wrap">
          <span className="filter-label">Status</span>
          <select
            className="filter-trigger filter-select"
            value={statusFiltro}
            onChange={e => setStatusFiltro(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="verde">Bateu meta</option>
            <option value="amarelo">Próximo da meta</option>
            <option value="vermelho">Abaixo da meta</option>
            <option value="semMeta">Sem meta</option>
          </select>
        </div>
        <div className="filter-wrap">
          <span className="filter-label">Squad</span>
          <select
            className="filter-trigger filter-select"
            value={squad}
            onChange={e => setSquad(e.target.value)}
          >
            {['Squad Midas', 'Squad Alpha', 'Squad Omega'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {(periodoFiltro || gpFiltro || statusFiltro || clienteFiltro) && (
          <button
            className="btn-export"
            onClick={() => { setPeriodoFiltro(''); setGpFiltro(''); setStatusFiltro(''); setClienteFiltro(''); }}
          >
            ✕ Limpar
          </button>
        )}
        <button className="btn-refresh" onClick={onRefresh} disabled={loading} style={{ marginLeft: 'auto' }}>
          {loading ? 'Carregando…' : 'Atualizar'}
        </button>
      </div>

      {/* KPI cards */}
      <div className="section-title">Visão Geral — {formatPeriodo(currentPeriodo)}</div>
      {/* KPI Row 1 — totals */}
      <div className="kpi-row" style={{ marginBottom: 12 }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Clientes</div>
          {loading ? <div className="kpi-skeleton" style={{ height: 40 }} /> : (
            <div className="kpi-value">{totalClientes}</div>
          )}
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Fat. Total Realizado</div>
          {loading ? <div className="kpi-skeleton" style={{ height: 40 }} /> : (
            <div className="kpi-value" style={{ fontSize: 22 }}>{fmtBRL(fatTotalR)}</div>
          )}
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Fat. Total Meta</div>
          {loading ? <div className="kpi-skeleton" style={{ height: 40 }} /> : (
            <div className="kpi-value" style={{ fontSize: 22 }}>{fmtBRL(fatTotalP)}</div>
          )}
        </div>
      </div>
      {/* KPI Row 2 — rates */}
      <div className="kpi-row" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">ROI Médio</div>
          {loading ? <div className="kpi-skeleton" style={{ height: 40 }} /> : (
            <div className="kpi-value" style={{ fontSize: 32 }}>{fmtROI(roiMedio)}</div>
          )}
        </div>
        <div className="kpi-card">
          <div className="kpi-label">% Bateu Fat.</div>
          {loading ? <div className="kpi-skeleton" style={{ height: 40 }} /> : (
            <div className="kpi-value" style={{ fontSize: 32, color: pctBateuFat !== null && pctBateuFat >= 60 ? '#27AE60' : '#E74C3C' }}>
              {fmtPct(pctBateuFat)}
            </div>
          )}
        </div>
        <div className="kpi-card">
          <div className="kpi-label">% Bateu ROI</div>
          {loading ? <div className="kpi-skeleton" style={{ height: 40 }} /> : (
            <div className="kpi-value" style={{ fontSize: 32, color: pctBateuROI !== null && pctBateuROI >= 60 ? '#27AE60' : '#E74C3C' }}>
              {fmtPct(pctBateuROI)}
            </div>
          )}
        </div>
      </div>

      {/* Alerts + Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8, marginBottom: 24 }}>
        <div className="report-card">
          <div style={{ fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#E74C3C' }}>⚠</span> Precisam de atenção agora
          </div>
          {alertasRows.length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>Nenhum alerta no período.</div>}
          {alertasRows.map((r, i) => {
            const roiPct = pctAting(r.roiR, r.roiP);
            const fatPct = pctAting(r.faturamentoR, r.faturamentoP);
            const roiStatus = statusPadrao(r.roiR, r.roiP);
            const clienteHistory = allDataByCliente.get(r.cliente) ?? [];
            const queda = hasQuedaROI(clienteHistory);
            return (
              <div
                key={r.clienteRaw + i}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                onClick={() => setSelectedRow(r)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.clienteRaw}>
                    {r.cliente.slice(0, 30)}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                    {queda && <span style={{ fontSize: 10, background: '#f3e8ff', color: '#8B5CF6', padding: '1px 5px', borderRadius: 6, fontWeight: 700 }}>Queda ROI</span>}
                    {roiStatus === 'vermelho' && <span style={{ fontSize: 10, background: '#fde8e8', color: '#E74C3C', padding: '1px 5px', borderRadius: 6, fontWeight: 700 }}>ROI crítico</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  {roiPct !== null && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLOR[roiStatus] }}>
                      ROI {fmtPct(roiPct)}
                    </span>
                  )}
                  {roiPct === null && fatPct !== null && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLOR[statusPadrao(r.faturamentoR, r.faturamentoP)] }}>
                      Fat {fmtPct(fatPct)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="report-card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Distribuição por Faixa de ROI</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={distribuicaoROI} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="Clientes" radius={[4, 4, 0, 0]}>
                {distribuicaoROI.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytic charts */}
      <div className="section-title">Análise de Resultados</div>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 24 }}>
        <div className="report-card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Evolução do Faturamento Total</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={evolucaoFat} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="periodo" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => {
                if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
                return String(v);
              }} />
              <Tooltip formatter={(v: number) => fmtBRL(v)} />
              <Legend />
              <Line dataKey="realizado" stroke="#E50914" name="Realizado" dot={{ r: 3 }} strokeWidth={2} connectNulls={false} />
              <Line dataKey="meta" stroke="#999" strokeDasharray="4 2" name="Meta" dot={false} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Evolução do ROI</div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="x" name="Investimento R" type="number" tick={{ fontSize: 10 }} tickFormatter={v => {
                if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                return String(v);
              }} />
              <YAxis dataKey="y" name="ROI R" type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v}x`} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(v: unknown, name: string) => {
                  const num = v as number;
                  return name === 'Investimento R' ? fmtBRL(num) : fmtROI(num);
                }}
              />
              <Scatter
                data={scatterData}
                shape={(props: {cx?: number; cy?: number; payload?: {status: StatusMeta}}) => (
                  <circle
                    cx={props.cx ?? 0}
                    cy={props.cy ?? 0}
                    r={6}
                    fill={STATUS_COLOR[props.payload?.status ?? 'semMeta']}
                    opacity={0.8}
                  />
                )}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 5 / Bottom 5 */}
      <div className="section-title">Ranking de ROI</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="report-card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Top 5 ROI Realizado</div>
          {rankingROI.top5.length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>Sem dados de ROI neste período.</div>}
          {rankingROI.top5.map((r, i) => (
            <div key={r.clienteRaw} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }} onClick={() => setSelectedRow(r)}>
              <span style={{ fontSize: 13, display: 'flex', alignItems: 'center' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: '50%',
                  background: '#f5f5f5', color: '#999', fontSize: 11, fontWeight: 700, marginRight: 8,
                  flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                {r.cliente.slice(0, 25)}
              </span>
              <span style={{ fontWeight: 700, color: '#27AE60' }}>{fmtROI(r.roiR)}</span>
            </div>
          ))}
        </div>
        <div className="report-card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Bottom 5 ROI Realizado</div>
          {rankingROI.bottom5.length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>Sem dados de ROI neste período.</div>}
          {rankingROI.bottom5.map((r, i) => (
            <div key={r.clienteRaw} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }} onClick={() => setSelectedRow(r)}>
              <span style={{ fontSize: 13, display: 'flex', alignItems: 'center' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: '50%',
                  background: '#f5f5f5', color: '#999', fontSize: 11, fontWeight: 700, marginRight: 8,
                  flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                {r.cliente.slice(0, 25)}
              </span>
              <span style={{ fontWeight: 700, color: '#E74C3C' }}>{fmtROI(r.roiR)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main table */}
      <div className="section-title" style={{ marginTop: 8 }}>Tabela de Resultados</div>
      <ResultadosTable
        rows={sortedData}
        allDataByCliente={allDataByCliente}
        sortCol={sortCol}
        sortDir={sortDir}
        onSort={handleSort}
        onSelect={setSelectedRow}
      />

      {/* Modal */}
      {selectedRow && (
        <ClienteModal
          row={selectedRow}
          history={allDataByCliente.get(selectedRow.cliente) ?? []}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  );
}
