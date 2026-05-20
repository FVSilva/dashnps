import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { EvaluationRow } from '../../types';
import { CSAT_VERTICALS } from '../../types';
import { sortPeriodos, formatPeriodo } from '../../utils/dateUtils';

interface Props {
  data: EvaluationRow[];
}

function groupByPeriodo(rows: EvaluationRow[]) {
  const map = new Map<string, EvaluationRow[]>();
  for (const row of rows) {
    const arr = map.get(row.periodo) ?? [];
    arr.push(row);
    map.set(row.periodo, arr);
  }
  return map;
}

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function nonNull(vals: (number | null)[]): number[] {
  return vals.filter((v): v is number => v !== null);
}

function calcNPSScore(rows: EvaluationRow[]): number | null {
  const notes = nonNull(rows.map(r => r.notaNPS));
  if (!notes.length) return null;
  const total = notes.length;
  const prom = notes.filter(n => n >= 9).length;
  const det = notes.filter(n => n <= 6).length;
  return Math.round(((prom - det) / total) * 100);
}

const VERTICAL_COLORS: Record<string, string> = {
  atendimento: '#3B82F6',
  campanhas:   '#8B5CF6',
  copys:       '#F59E0B',
  designs:     '#10B981',
  prazos:      '#EF4444',
  resultados:  '#EC4899',
};

const TOOLTIP_STYLE = {
  background: '#1A1A1A',
  border: '1px solid #333',
  borderRadius: 8,
  color: '#fff',
  fontSize: 12,
};

function npsColor(v: number) {
  if (v >= 65) return '#52CC5A';
  if (v >= 30) return '#FFC02A';
  return '#C0392B';
}

export function RelatoriosPage({ data }: Props) {
  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');
  const [squadSelecionado, setSquadSelecionado] = useState<string>('');

  const clientes = useMemo(() =>
    [...new Set(data.map(r => r.cliente).filter(Boolean))].sort(),
  [data]);

  const squads = useMemo(() =>
    [...new Set(data.map(r => r.gp).filter(Boolean))].sort(),
  [data]);

  const dadosFiltrados = useMemo(() =>
    data.filter(r =>
      (!clienteSelecionado || r.cliente === clienteSelecionado) &&
      (!squadSelecionado  || r.gp === squadSelecionado)
    ),
  [data, clienteSelecionado, squadSelecionado]);

  const periodos = useMemo(() => sortPeriodos([...new Set(dadosFiltrados.map(r => r.periodo))]), [dadosFiltrados]);

  const byPeriodo = useMemo(() => groupByPeriodo(dadosFiltrados), [dadosFiltrados]);

  const npsEvolution = useMemo(() =>
    periodos.map(p => {
      const rows = byPeriodo.get(p) ?? [];
      const score = calcNPSScore(rows);
      const notes = nonNull(rows.map(r => r.notaNPS));
      const total = notes.length;
      return {
        periodo: formatPeriodo(p),
        nps: score,
        promotores: total ? Math.round((notes.filter(n => n >= 9).length / total) * 100) : 0,
        neutros:    total ? Math.round((notes.filter(n => n >= 7 && n <= 8).length / total) * 100) : 0,
        detratores: total ? Math.round((notes.filter(n => n <= 6).length / total) * 100) : 0,
        respostas: total,
        semDados: total === 0,
      };
    }),
  [periodos, byPeriodo]);

  const csatEvolution = useMemo(() =>
    periodos.map(p => {
      const rows = byPeriodo.get(p) ?? [];
      const entry: Record<string, string | number | null> = { periodo: formatPeriodo(p) };
      entry['geral'] = mean(nonNull(rows.map(r => r.csatGeral)));
      for (const v of CSAT_VERTICALS) {
        entry[v.key] = mean(nonNull(rows.map(r => r[v.key])));
      }
      return entry;
    }),
  [periodos, byPeriodo]);

  const respostasEvolution = useMemo(() =>
    periodos.map(p => ({
      periodo: formatPeriodo(p),
      respostas: byPeriodo.get(p)?.length ?? 0,
    })),
  [periodos, byPeriodo]);

  if (!data.length) {
    return (
      <div className="page-body">
        <div className="state-empty">
          <div className="state-icon">📋</div>
          <div className="state-title">Sem dados para gerar relatórios</div>
          <div className="state-msg">Aguardando dados do Google Sheets.</div>
        </div>
      </div>
    );
  }

  const hasMultiple = periodos.length >= 2;

  return (
    <div className="page-body">

      {/* Filtros */}
      <div className="report-filter-bar">
        <div className="filter-wrap">
          <label className="filter-label">Account</label>
          <select
            className="filter-trigger filter-select"
            value={clienteSelecionado}
            onChange={e => setClienteSelecionado(e.target.value)}
          >
            <option value="">Todos</option>
            {clientes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="filter-wrap">
          <label className="filter-label">Squad</label>
          <select
            className="filter-trigger filter-select"
            value={squadSelecionado}
            onChange={e => setSquadSelecionado(e.target.value)}
          >
            <option value="">Todos</option>
            {squads.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {(clienteSelecionado || squadSelecionado) && (
          <button
            className="btn-refresh"
            style={{ marginTop: 20 }}
            onClick={() => { setClienteSelecionado(''); setSquadSelecionado(''); }}
          >
            ✕ Limpar
          </button>
        )}
      </div>

      {!hasMultiple && (
        <div className="state-empty" style={{ marginBottom: 24 }}>
          <div className="state-icon" style={{ fontSize: 28 }}>ℹ️</div>
          <div className="state-title" style={{ fontSize: 14 }}>
            {clienteSelecionado ? `${clienteSelecionado} — ` : ''}Apenas {periodos.length} período{periodos.length !== 1 ? 's' : ''} disponível
          </div>
          <div className="state-msg">Os gráficos de evolução exibem mais detalhes com 2+ meses de dados.</div>
        </div>
      )}

      {/* NPS Score ao longo do tempo */}
      <div className="report-section">
        <div className="section-title">
          Evolução do NPS Score{clienteSelecionado ? ` — ${clienteSelecionado}` : ''}
        </div>
        <div className="report-card">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={npsEvolution} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
              <YAxis domain={[-100, 100]} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v} pts`, 'NPS']} />
              <ReferenceLine y={60} stroke="#555" strokeWidth={1.5} label={{ value: 'Meta (60)', position: 'right', fontSize: 11, fill: '#555' }} />
              <Line
                type="monotone" dataKey="nps" name="NPS Score"
                stroke="#E50914" strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.nps === null) return <g key={props.key} />;
                  return <circle key={props.key} cx={cx} cy={cy} r={6} fill={npsColor(payload.nps)} stroke="#fff" strokeWidth={2} />;
                }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Composição NPS (promotores/neutros/detratores) */}
      <div className="report-section">
        <div className="section-title">Composição NPS por Mês</div>
        <div className="report-card">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={npsEvolution} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [`${v}%`, name]} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="promotores" name="Promotores (9-10)" stackId="a" fill="#52CC5A" />
              <Bar dataKey="neutros"    name="Neutros (7-8)"     stackId="a" fill="#FFC02A" />
              <Bar dataKey="detratores" name="Detratores (0-6)"  stackId="a" fill="#C0392B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CSAT Geral */}
      <div className="report-section">
        <div className="section-title">Evolução do CSAT Geral</div>
        <div className="report-card">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={csatEvolution} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [v?.toFixed(2), 'CSAT Geral']} />
              <ReferenceLine y={4.3} stroke="#555" strokeWidth={1.5} label={{ value: 'Meta (4.3)', position: 'right', fontSize: 11, fill: '#555' }} />
              <Line type="monotone" dataKey="geral" name="CSAT Geral" stroke="#3B82F6" strokeWidth={3} dot={{ r: 5, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CSAT por Vertical */}
      <div className="report-section">
        <div className="section-title">Evolução CSAT por Vertical</div>
        <div className="report-card">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={csatEvolution} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [v?.toFixed(2), name]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={4.3} stroke="#555" strokeWidth={1.5} label={{ value: 'Meta (4.3)', position: 'right', fontSize: 11, fill: '#555' }} />
              {CSAT_VERTICALS.map(v => (
                <Line
                  key={v.key}
                  type="monotone"
                  dataKey={v.key}
                  name={v.label}
                  stroke={VERTICAL_COLORS[v.key]}
                  strokeWidth={2}
                  dot={{ r: 4, stroke: '#fff', strokeWidth: 1 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Volume de respostas */}
      <div className="report-section">
        <div className="section-title">Volume de Respostas por Mês</div>
        <div className="report-card">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={respostasEvolution} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [v, 'Respostas']} />
              <Bar dataKey="respostas" name="Respostas" fill="#E50914" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
