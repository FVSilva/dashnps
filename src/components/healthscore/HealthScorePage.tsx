import React, { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis,
} from 'recharts';
import type { HealthScoreRow } from '../../types/healthScore';
import type { EvaluationRow } from '../../types';
import type { ResultadosRow } from '../../types/resultados';
import { sortPeriodos, formatPeriodo, periodoToIndex } from '../../utils/dateUtils';

// ── Types & constants ──────────────────────────────────────────────────────

type Faixa = 'saudavel' | 'atencao' | 'emPerigo' | 'critico' | 'semDados';

function classifyHS(row: HealthScoreRow): Faixa {
  if (row.healthScoreRaw?.toLowerCase() === 'erro' || row.healthScore === null) return 'semDados';
  if (row.healthScore >= 9.0) return 'saudavel';
  if (row.healthScore >= 7.1) return 'atencao';
  if (row.healthScore >= 5.0) return 'emPerigo';
  return 'critico';
}

const FAIXA_COLOR: Record<Faixa, string> = {
  saudavel: '#27AE60',
  atencao:  '#D4A017',
  emPerigo: '#E67E22',
  critico:  '#E74C3C',
  semDados: '#999999',
};

const FAIXA_LABEL: Record<Faixa, string> = {
  saudavel: 'Saudável',
  atencao:  'Atenção',
  emPerigo: 'Em Perigo',
  critico:  'Crítico',
  semDados: 'Sem dados',
};

const FAIXA_ORDER: Record<Faixa, number> = {
  critico: 0, emPerigo: 1, atencao: 2, saudavel: 3, semDados: 4,
};

function hasQuedaConsecutiva(clienteRows: HealthScoreRow[]): boolean {
  if (clienteRows.length < 2) return false;
  const sorted = [...clienteRows].sort((a, b) => periodoToIndex(a.data) - periodoToIndex(b.data));
  const faixas = sorted.map(r => FAIXA_ORDER[classifyHS(r)]);
  const n = faixas.length;
  if (n >= 3) {
    return faixas[n - 1] < faixas[n - 2] && faixas[n - 2] < faixas[n - 3];
  }
  return faixas[n - 1] < faixas[n - 2];
}

function avgValues(vals: (number | null)[]): number | null {
  const valid = vals.filter((v): v is number => v !== null);
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

// ── HSBadge ───────────────────────────────────────────────────────────────

function HSBadge({ row }: { row: HealthScoreRow }) {
  const faixa = classifyHS(row);
  const color = FAIXA_COLOR[faixa];
  const isErro = row.healthScoreRaw?.toLowerCase() === 'erro';
  return (
    <span
      style={{
        background: color,
        color: '#fff',
        borderRadius: 12,
        padding: '2px 10px',
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
      title={isErro ? 'Dados insuficientes para cálculo neste período.' : undefined}
    >
      {isErro ? 'Erro' : row.healthScore !== null ? row.healthScore.toFixed(1) : '—'}
    </span>
  );
}

// ── FaixaBadge — mostra status para TODAS as linhas ──────────────────────

const FAIXA_BADGE_STYLE: Record<Faixa, { bg: string; color: string; label: string }> = {
  saudavel: { bg: '#e8f8ee', color: '#27AE60', label: 'Saudável' },
  atencao:  { bg: '#fef9e7', color: '#D4A017', label: 'Atenção' },
  emPerigo: { bg: '#fef3e2', color: '#E67E22', label: 'Em Perigo' },
  critico:  { bg: '#fde8e8', color: '#E74C3C', label: 'Crítico' },
  semDados: { bg: '#f5f5f5', color: '#999999', label: 'Sem dados' },
};

function FaixaBadge({ row, history }: { row: HealthScoreRow; history: HealthScoreRow[] }) {
  const faixa = classifyHS(row);
  const { bg, color, label } = FAIXA_BADGE_STYLE[faixa];
  const quedaConsec = faixa !== 'semDados' && hasQuedaConsecutiva(history);
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
      <span style={{ background: bg, color, borderRadius: 8, padding: '2px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      {quedaConsec && (
        <span style={{ background: '#f3e8ff', color: '#8B5CF6', borderRadius: 8, padding: '2px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
          Queda consecutiva
        </span>
      )}
    </span>
  );
}

// ── ScoreBadge ────────────────────────────────────────────────────────────

// Cor baseada na legenda do Health Score (≥9 verde, 7.1–8.99 amarelo, 5–7 laranja, <5 vermelho)
function hsScoreColor(value: number): string {
  if (value >= 9.0) return '#27AE60';
  if (value >= 7.1) return '#D4A017';
  if (value >= 5.0) return '#E67E22';
  return '#E74C3C';
}

function ScoreBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="cell-null">—</span>;
  const color = hsScoreColor(value);
  return (
    <span style={{ color, fontWeight: 700, fontSize: 13 }}>{value}</span>
  );
}

// ── SortIcon ──────────────────────────────────────────────────────────────

function SortIcon({ col, sortCol, sortAsc }: { col: string; sortCol: string; sortAsc: boolean }) {
  if (col !== sortCol) return <span style={{ color: '#ccc', marginLeft: 4 }}>↕</span>;
  return <span className="sort-icon" style={{ marginLeft: 4 }}>{sortAsc ? '↑' : '↓'}</span>;
}

// ── HSTable ───────────────────────────────────────────────────────────────

type SortCol = 'idx' | 'cliente' | 'data' | 'gp' | 'lt' | 'healthScore' | 'nps' | 'csat' | 'faturamento' | 'roi';

interface HSTableProps {
  rows: HealthScoreRow[];
  allDataByCliente: Map<string, HealthScoreRow[]>;
  onSelect: (row: HealthScoreRow) => void;
  csatLookup: Map<string, number>;
  resultadosLookup: Map<string, { fat: number | null; roi: number | null }>;
}

function HSTable({ rows, allDataByCliente, onSelect, csatLookup, resultadosLookup }: HSTableProps) {
  const [sortCol, setSortCol] = useState<SortCol>('healthScore');
  const [sortAsc, setSortAsc] = useState(true);

  function toggleSort(col: SortCol) {
    if (col === sortCol) {
      setSortAsc(a => !a);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  }

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      let av: number | string | null = null;
      let bv: number | string | null = null;
      switch (sortCol) {
        case 'idx':       av = 0; bv = 0; break;
        case 'cliente':   av = a.cliente; bv = b.cliente; break;
        case 'data':      av = periodoToIndex(a.data); bv = periodoToIndex(b.data); break;
        case 'gp':        av = a.gp; bv = b.gp; break;
        case 'lt':        av = a.lt; bv = b.lt; break;
        case 'healthScore': av = a.healthScore; bv = b.healthScore; break;
        case 'nps':       av = a.nps; bv = b.nps; break;
        case 'csat':      av = a.csat; bv = b.csat; break;
        case 'faturamento': av = a.faturamento; bv = b.faturamento; break;
        case 'roi':       av = a.roi; bv = b.roi; break;
      }
      // nulls last
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const na = av as number;
      const nb = bv as number;
      return sortAsc ? na - nb : nb - na;
    });
  }, [rows, sortCol, sortAsc]);

  function thProps(col: SortCol) {
    return {
      className: `sortable${sortCol === col ? ' sorted' : ''}`,
      onClick: () => toggleSort(col),
      style: { cursor: 'pointer' },
    };
  }

  if (rows.length === 0) {
    return <div className="eval-empty">Nenhum cliente encontrado para o período selecionado.</div>;
  }

  return (
    <div className="eval-table-wrap">
      <div className="eval-table-scroll">
        <table className="eval-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>#</th>
              <th {...thProps('cliente')}>Cliente <SortIcon col="cliente" sortCol={sortCol} sortAsc={sortAsc} /></th>
              <th {...thProps('data')}>Período <SortIcon col="data" sortCol={sortCol} sortAsc={sortAsc} /></th>
              <th {...thProps('gp')}>GP <SortIcon col="gp" sortCol={sortCol} sortAsc={sortAsc} /></th>
              <th {...thProps('lt')}>LT <SortIcon col="lt" sortCol={sortCol} sortAsc={sortAsc} /></th>
              <th {...thProps('healthScore')}>Health Score <SortIcon col="healthScore" sortCol={sortCol} sortAsc={sortAsc} /></th>
              <th {...thProps('nps')} title="Score interno 1/5/10 do Health Score">NPS (HS) <SortIcon col="nps" sortCol={sortCol} sortAsc={sortAsc} /></th>
              <th title="CSAT real da Pesquisa de Satisfação (escala 1-5)">CSAT</th>
              <th title="Faturamento realizado (BD_resultados)">Faturamento R</th>
              <th title="ROI realizado (BD_resultados)">ROI R</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const history = allDataByCliente.get(row.cliente) ?? [];
              return (
                <tr
                  key={`${row.clienteRaw}-${row.data}`}
                  className={i % 2 === 0 ? 'row-even' : 'row-odd'}
                  onClick={() => onSelect(row)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="cell-num">{i + 1}</td>
                  <td className="cell-cliente" title={row.clienteRaw}>{row.cliente}</td>
                  <td>{formatPeriodo(row.data)}</td>
                  <td>{row.gp || '—'}</td>
                  <td>{row.lt !== null ? row.lt : <span className="cell-null">—</span>}</td>
                  <td><HSBadge row={row} /></td>
                  <td><ScoreBadge value={row.nps} /></td>
                  {(() => {
                    const key = `${row.cliente}||${row.data}`;
                    const csatReal = csatLookup.get(key) ?? null;
                    const res = resultadosLookup.get(key);
                    const fatR = res?.fat ?? null;
                    const roiR = res?.roi ?? null;
                    // Cor baseada no sub-score do BD_Health Score (legenda HS)
                    const csatColor  = row.csat        !== null ? hsScoreColor(row.csat)        : undefined;
                    const fatColor   = row.faturamento  !== null ? hsScoreColor(row.faturamento)  : undefined;
                    const roiColor   = row.roi          !== null ? hsScoreColor(row.roi)          : undefined;
                    return (
                      <>
                        <td style={{ color: csatColor, fontWeight: csatColor ? 600 : undefined }}>
                          {csatReal !== null ? csatReal.toFixed(2) : <span className="cell-null">—</span>}
                        </td>
                        <td style={{ color: fatColor, fontWeight: fatColor ? 600 : undefined }}>
                          {fatR !== null && fatR > 0 ? fatR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : <span className="cell-null">—</span>}
                        </td>
                        <td style={{ color: roiColor, fontWeight: roiColor ? 600 : undefined }}>
                          {roiR !== null && roiR > 0 ? `${roiR.toFixed(2)}×` : <span className="cell-null">—</span>}
                        </td>
                      </>
                    );
                  })()}
                  <td><FaixaBadge row={row} history={history} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── ClientModal ───────────────────────────────────────────────────────────

interface MetricDef {
  label: string;
  key: keyof HealthScoreRow;
  radarLabel: string;
}

const METRICS: MetricDef[] = [
  { label: 'Faturamento',                    key: 'faturamento',                  radarLabel: 'Fatur.' },
  { label: 'ROI',                            key: 'roi',                          radarLabel: 'ROI' },
  { label: 'Fator de Gravidade',             key: 'fatorGravidade',               radarLabel: 'Gravidade' },
  { label: 'Nível de Consciência',           key: 'nivelConsciencia',             radarLabel: 'Consciência' },
  { label: 'Profundidade do Relacionamento', key: 'profundidadeRelacionamento',   radarLabel: 'Relacionam.' },
  { label: 'NPS',                            key: 'nps',                          radarLabel: 'NPS' },
  { label: 'CSAT',                           key: 'csat',                         radarLabel: 'CSAT' },
  { label: 'Touch-CS',                       key: 'touchCS',                      radarLabel: 'Touch-CS' },
  { label: 'Pulsação do Account',            key: 'pulsacaoAccount',              radarLabel: 'Pulsação' },
  { label: 'Pontualidade dos Pagamentos',    key: 'pontualidadePagamentos',       radarLabel: 'Pontual.' },
  { label: 'Histórico de Renovações/Upsells',key: 'historicoRenovacoes',          radarLabel: 'Renovações' },
];

interface ClientModalProps {
  row: HealthScoreRow;
  history: HealthScoreRow[];
  onClose: () => void;
}

function ClientModal({ row, history, onClose }: ClientModalProps) {
  const faixa = classifyHS(row);
  const color = FAIXA_COLOR[faixa];

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => periodoToIndex(a.data) - periodoToIndex(b.data)),
    [history],
  );
  const last6 = sortedHistory.slice(-6);

  const sparkData = last6.map(r => ({
    periodo: formatPeriodo(r.data),
    hs: r.healthScore,
  }));

  const radarData = METRICS.map(m => {
    const val = row[m.key];
    return { metric: m.radarLabel, value: typeof val === 'number' ? val : 0 };
  });

  function metricDisplay(m: MetricDef): string {
    const val = row[m.key];
    if (val === null || val === undefined) return '—';
    if (typeof val === 'number') return val.toFixed(0);
    return String(val);
  }

  function metricDot(m: MetricDef): React.ReactNode {
    const val = row[m.key];
    if (typeof val !== 'number') return null;
    const dotColor = val < 5 ? '#E74C3C' : '#27AE60';
    return <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, display: 'inline-block', flexShrink: 0 }} />;
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: Math.min(600, window.innerWidth), height: '100%', background: '#fff', overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1A1A1A', lineHeight: 1.3 }}>{row.clienteRaw || row.cliente}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              GP: {row.gp || '—'} &nbsp;·&nbsp; LT: {row.lt !== null ? `${row.lt} meses` : '—'} &nbsp;·&nbsp; Referência: {formatPeriodo(row.data)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999', flexShrink: 0, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Health Score badge large */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ background: color, color: '#fff', borderRadius: 16, padding: '8px 24px', fontSize: 28, fontWeight: 800 }}>
            {row.healthScoreRaw?.toLowerCase() === 'erro' ? 'Erro' : row.healthScore !== null ? row.healthScore.toFixed(1) : '—'}
          </span>
          <div>
            <div style={{ fontWeight: 700, color, fontSize: 16 }}>{FAIXA_LABEL[faixa]}</div>
            <div style={{ fontSize: 12, color: '#999' }}>Health Score</div>
          </div>
        </div>

        {/* Scores + History side by side */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Left: metrics table */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#333' }}>Scores detalhados</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {METRICS.map(m => (
                  <tr key={m.key} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '5px 0', color: '#555' }}>{m.label}</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600, color: '#1A1A1A' }}>{metricDisplay(m)}</td>
                    <td style={{ padding: '5px 0 5px 8px', textAlign: 'center', width: 16 }}>{metricDot(m)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right: history sparkline */}
          <div style={{ width: 200, flexShrink: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#333' }}>Histórico HS</div>
            {sparkData.length > 0 ? (
              <LineChart width={200} height={160} data={sparkData}>
                <XAxis dataKey="periodo" tick={{ fontSize: 9 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 9 }} width={20} />
                <Tooltip formatter={(v: number | null) => [v !== null ? v.toFixed(1) : '—', 'HS']} />
                <Line
                  type="monotone"
                  dataKey="hs"
                  stroke={color}
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props as { cx: number; cy: number; payload: { periodo: string } };
                    const isCurrent = payload.periodo === formatPeriodo(row.data);
                    return (
                      <circle
                        key={payload.periodo}
                        cx={cx}
                        cy={cy}
                        r={isCurrent ? 5 : 3}
                        fill={isCurrent ? color : '#fff'}
                        stroke={color}
                        strokeWidth={2}
                      />
                    );
                  }}
                  connectNulls
                />
              </LineChart>
            ) : (
              <div style={{ color: '#bbb', fontSize: 12 }}>Sem histórico disponível.</div>
            )}
          </div>
        </div>

        {/* Radar chart */}
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#333' }}>Radar de desempenho</div>
          <RadarChart width={500} height={280} data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 9 }} />
            <Radar name="Score" dataKey="value" stroke="#E50914" fill="#E50914" fillOpacity={0.3} />
            <Tooltip />
          </RadarChart>
        </div>
      </div>
    </div>
  );
}

// ── Main page component ───────────────────────────────────────────────────

interface Props {
  data: HealthScoreRow[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  satisfacaoData?: EvaluationRow[];
  resultadosData?: ResultadosRow[];
}

const SQUADS = ['Squad Midas', 'Squad Alpha', 'Squad Omega'];

export function HealthScorePage({ data, loading, error, onRefresh, satisfacaoData = [], resultadosData = [] }: Props) {
  const [periodoFiltro, setPeriodoFiltro] = useState('');
  const [gpFiltro, setGpFiltro] = useState('');
  const [faixaFiltro, setFaixaFiltro] = useState('');
  const [clienteFiltro, setClienteFiltro] = useState('');
  const [squad, setSquad] = useState('Squad Midas');
  const [selectedCliente, setSelectedCliente] = useState<HealthScoreRow | null>(null);

  // Lookup: CSAT real por cliente+período (de BD_Satisfação)
  const csatLookup = useMemo(() => {
    const map = new Map<string, number>();
    satisfacaoData.forEach(r => {
      if (r.csatGeral !== null) {
        const key = `${r.cliente}||${r.periodo}`;
        const prev = map.get(key);
        map.set(key, prev !== undefined ? (prev + r.csatGeral) / 2 : r.csatGeral);
      }
    });
    return map;
  }, [satisfacaoData]);

  // Lookup: Faturamento e ROI reais por cliente+período (de BD_resultados)
  const resultadosLookup = useMemo(() => {
    const map = new Map<string, { fat: number | null; roi: number | null }>();
    resultadosData.forEach(r => {
      map.set(`${r.cliente}||${r.data}`, { fat: r.faturamentoR, roi: r.roiR });
    });
    return map;
  }, [resultadosData]);

  // All periods sorted
  const todosPeriodos = useMemo(
    () => sortPeriodos([...new Set(data.map(r => r.data))]),
    [data],
  );

  // Unique clients (from all data for dropdown completeness)
  const clientes = useMemo(
    () => [...new Set(data.map(r => r.cliente).filter(Boolean))].sort(),
    [data],
  );

  // Unique GPs
  const gps = useMemo(
    () => [...new Set(data.map(r => r.gp).filter(Boolean))].sort(),
    [data],
  );

  const currentPeriodo = periodoFiltro || todosPeriodos[todosPeriodos.length - 1] || '';

  // Data for the current period (before faixa filter, after gp filter)
  const baseCurrentData = useMemo(() => {
    let d = data.filter(r => r.data === currentPeriodo);
    if (gpFiltro)      d = d.filter(r => r.gp === gpFiltro);
    if (clienteFiltro) d = d.filter(r => r.cliente === clienteFiltro);
    return d;
  }, [data, currentPeriodo, gpFiltro, clienteFiltro]);

  // currentData with faixa filter applied
  const currentData = useMemo(() => {
    if (!faixaFiltro) return baseCurrentData;
    return baseCurrentData.filter(r => classifyHS(r) === faixaFiltro);
  }, [baseCurrentData, faixaFiltro]);

  // Previous period
  const prevPeriodo = useMemo(() => {
    const idx = todosPeriodos.indexOf(currentPeriodo);
    return idx > 0 ? todosPeriodos[idx - 1] : '';
  }, [todosPeriodos, currentPeriodo]);

  const prevData = useMemo(
    () => data.filter(r => r.data === prevPeriodo),
    [data, prevPeriodo],
  );

  // Maps for MoM comparison
  const classByCliente = useMemo(() => {
    const map = new Map<string, Faixa>();
    baseCurrentData.forEach(r => map.set(r.cliente, classifyHS(r)));
    return map;
  }, [baseCurrentData]);

  const prevClassByCliente = useMemo(() => {
    const map = new Map<string, Faixa>();
    prevData.forEach(r => map.set(r.cliente, classifyHS(r)));
    return map;
  }, [prevData]);

  const momStats = useMemo(() => {
    let increased = 0, decreased = 0, same = 0;
    classByCliente.forEach((faixa, cliente) => {
      const prev = prevClassByCliente.get(cliente);
      if (!prev) return;
      const cur = FAIXA_ORDER[faixa];
      const old = FAIXA_ORDER[prev];
      if (cur > old) increased++;
      else if (cur < old) decreased++;
      else same++;
    });
    return { increased, decreased, same };
  }, [classByCliente, prevClassByCliente]);

  // Faixa counts from baseCurrentData (before faixa filter)
  const faixaCounts = useMemo(() => {
    const counts = { saudavel: 0, atencao: 0, emPerigo: 0, critico: 0, semDados: 0 };
    baseCurrentData.forEach(r => { counts[classifyHS(r)]++; });
    return counts;
  }, [baseCurrentData]);

  // Averages from baseCurrentData
  const npsMedia = useMemo(() => {
    const rows = baseCurrentData.filter(r => classifyHS(r) !== 'semDados' && r.nps !== null);
    return avgValues(rows.map(r => r.nps));
  }, [baseCurrentData]);

  // CSAT médio real: usa valores de BD_Satisfação via csatLookup (escala 1-5)
  const csatMedia = useMemo(() => {
    const vals = baseCurrentData
      .map(r => csatLookup.get(`${r.cliente}||${r.data}`) ?? null)
      .filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [baseCurrentData, csatLookup]);

  // All data grouped by cliente for modal history
  const allDataByCliente = useMemo(() => {
    const map = new Map<string, HealthScoreRow[]>();
    data.forEach(r => {
      const arr = map.get(r.cliente) ?? [];
      arr.push(r);
      map.set(r.cliente, arr);
    });
    return map;
  }, [data]);

  // Alertas: HS < 6 or semDados, top 5 sorted by HS ascending (nulls last)
  const alertasRows = useMemo(() => {
    return baseCurrentData
      .filter(r => {
        if (!r.cliente) return false; // ignorar leads sem nome
        const f = classifyHS(r);
        return f === 'emPerigo' || f === 'critico'; // só Em Perigo e Crítico (< 7.1)
      })
      .sort((a, b) => {
        if (a.healthScore === null && b.healthScore === null) return 0;
        if (a.healthScore === null) return 1;
        if (b.healthScore === null) return -1;
        return a.healthScore - b.healthScore;
      })
      .slice(0, 5);
  }, [baseCurrentData]);

  // Pie data
  const pieData = useMemo(() => {
    const entries: { name: string; value: number; color: string }[] = [];
    (Object.entries(faixaCounts) as [Faixa, number][]).forEach(([faixa, count]) => {
      if (count > 0) {
        entries.push({ name: FAIXA_LABEL[faixa], value: count, color: FAIXA_COLOR[faixa] });
      }
    });
    return entries;
  }, [faixaCounts]);

  const hasActiveFilter = !!(periodoFiltro || gpFiltro || faixaFiltro || clienteFiltro);

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
          <span className="filter-label">Período</span>
          <select
            className="filter-trigger filter-select"
            value={periodoFiltro}
            onChange={e => setPeriodoFiltro(e.target.value)}
          >
            <option value="">Último disponível</option>
            {todosPeriodos.map(p => (
              <option key={p} value={p}>{formatPeriodo(p)}</option>
            ))}
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
            {gps.map(gp => (
              <option key={gp} value={gp}>{gp}</option>
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
          <span className="filter-label">Faixa</span>
          <select
            className="filter-trigger filter-select"
            value={faixaFiltro}
            onChange={e => setFaixaFiltro(e.target.value)}
          >
            <option value="">Todas</option>
            <option value="saudavel">Saudável</option>
            <option value="atencao">Atenção</option>
            <option value="emPerigo">Em Perigo</option>
            <option value="critico">Crítico</option>
            <option value="semDados">Sem dados</option>
          </select>
        </div>

        <div className="filter-wrap">
          <span className="filter-label">Squad</span>
          <select
            className="filter-trigger filter-select"
            value={squad}
            onChange={e => setSquad(e.target.value)}
          >
            {SQUADS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {hasActiveFilter && (
          <button
            className="filter-trigger"
            style={{ alignSelf: 'flex-end', color: '#E74C3C', borderColor: '#E74C3C' }}
            onClick={() => { setPeriodoFiltro(''); setGpFiltro(''); setFaixaFiltro(''); setClienteFiltro(''); }}
          >
            ✕ Limpar
          </button>
        )}

        <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
          <button className="btn-refresh" onClick={onRefresh} disabled={loading}>
            {loading ? 'Carregando…' : '↻ Atualizar'}
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="section-title">Visão Geral da Carteira — {formatPeriodo(currentPeriodo)}</div>
      {/* KPI grid — 7 cards em 2 linhas: 5 + 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 12 }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Clientes</div>
          {loading ? <div className="kpi-skeleton" /> : <div className="kpi-value">{baseCurrentData.length}</div>}
        </div>
        <div className="kpi-card" style={{ borderLeftColor: FAIXA_COLOR.saudavel }}>
          <div className="kpi-label">Saudável</div>
          {loading ? <div className="kpi-skeleton" /> : (
            <div className="kpi-value" style={{ color: FAIXA_COLOR.saudavel }}>{faixaCounts.saudavel}</div>
          )}
        </div>
        <div className="kpi-card" style={{ borderLeftColor: FAIXA_COLOR.atencao }}>
          <div className="kpi-label">Atenção</div>
          {loading ? <div className="kpi-skeleton" /> : (
            <div className="kpi-value" style={{ color: FAIXA_COLOR.atencao }}>{faixaCounts.atencao}</div>
          )}
        </div>
        <div className="kpi-card" style={{ borderLeftColor: FAIXA_COLOR.emPerigo }}>
          <div className="kpi-label">Em Perigo</div>
          {loading ? <div className="kpi-skeleton" /> : (
            <div className="kpi-value" style={{ color: FAIXA_COLOR.emPerigo }}>{faixaCounts.emPerigo}</div>
          )}
        </div>
        <div className="kpi-card" style={{ borderLeftColor: FAIXA_COLOR.critico }}>
          <div className="kpi-label">Crítico</div>
          {loading ? <div className="kpi-skeleton" /> : (
            <div className="kpi-value" style={{ color: FAIXA_COLOR.critico }}>{faixaCounts.critico}</div>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">NPS Médio (score)</div>
          {loading ? <div className="kpi-skeleton" /> : (
            <div className="kpi-value">{npsMedia !== null ? npsMedia.toFixed(1) : '—'}</div>
          )}
        </div>
        <div className="kpi-card">
          <div className="kpi-label">CSAT Médio</div>
          {loading ? <div className="kpi-skeleton" /> : (
            <div className="kpi-value">{csatMedia !== null ? csatMedia.toFixed(2) : '—'}</div>
          )}
        </div>
      </div>

      {/* Distribution + MoM row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20, marginBottom: 24 }}>
        {/* Donut chart */}
        <div className="report-card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Distribuição por Faixa</div>
          {loading ? (
            <div className="kpi-skeleton" style={{ height: 260 }} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value">
                  {pieData.map(entry => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} clientes`, '']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* MoM + Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* MoM box */}
          <div className="report-card" style={{ flex: '0 0 auto' }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>
              Variação vs {prevPeriodo ? formatPeriodo(prevPeriodo) : 'período anterior'}
            </div>
            {loading ? (
              <div className="kpi-skeleton" style={{ height: 80 }} />
            ) : (
              <div style={{ display: 'flex', gap: 0, flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ color: '#555', fontSize: 14 }}>⬆ Subiram de faixa</span>
                  <span style={{ fontWeight: 700, color: '#27AE60', fontSize: 18 }}>{momStats.increased}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ color: '#555', fontSize: 14 }}>⬇ Caíram de faixa</span>
                  <span style={{ fontWeight: 700, color: '#E74C3C', fontSize: 18 }}>{momStats.decreased}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: '#555', fontSize: 14 }}>= Estáveis</span>
                  <span style={{ fontWeight: 700, color: '#999', fontSize: 18 }}>{momStats.same}</span>
                </div>
              </div>
            )}
          </div>

          {/* Clients needing attention */}
          <div className="report-card" style={{ flex: '1 1 auto' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>⚠ Precisam de atenção agora</div>
            {loading ? (
              <div className="kpi-skeleton" style={{ height: 100 }} />
            ) : alertasRows.length === 0 ? (
              <div style={{ color: '#27AE60', fontSize: 13 }}>Nenhum cliente em situação crítica.</div>
            ) : (
              alertasRows.map((r, idx) => {
                const lkKey = `${r.cliente}||${r.data}`;
                const fatR = resultadosLookup.get(lkKey)?.fat ?? null;
                const csatReal = csatLookup.get(lkKey) ?? null;
                return (
                  <div
                    key={idx}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', gap: 8 }}
                    onClick={() => setSelectedCliente(r)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.clienteRaw}>{r.cliente || '—'}</div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 2, fontSize: 11, color: '#888' }}>
                        {r.gp && <span>GP: {r.gp}</span>}
                        {csatReal !== null && <span>CSAT: <strong style={{ color: '#555' }}>{csatReal.toFixed(2)}</strong></span>}
                        {fatR !== null && fatR > 0 && <span>Fat: <strong style={{ color: '#555' }}>{fatR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</strong></span>}
                      </div>
                    </div>
                    <HSBadge row={r} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Client table */}
      <div className="section-title" style={{ marginTop: 8 }}>Tabela de Clientes</div>
      {loading ? (
        <div className="kpi-skeleton" style={{ height: 200 }} />
      ) : (
        <div className="report-card" style={{ padding: 0 }}>
          <HSTable rows={currentData} allDataByCliente={allDataByCliente} onSelect={setSelectedCliente} csatLookup={csatLookup} resultadosLookup={resultadosLookup} />
        </div>
      )}

      {/* Client detail modal */}
      {selectedCliente && (
        <ClientModal
          row={selectedCliente}
          history={allDataByCliente.get(selectedCliente.cliente) ?? []}
          onClose={() => setSelectedCliente(null)}
        />
      )}
    </div>
  );
}
