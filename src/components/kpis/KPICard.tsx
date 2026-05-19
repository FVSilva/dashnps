import React from 'react';
import type { KPIData, NPSData, RespostasData } from '../../types';
import { DeltaBadge } from './DeltaBadge';
import { NPSGauge } from './NPSGauge';
import { getNPSColor, getCSATColor } from '../../utils/calculations';

interface BaseProps {
  label: string;
  kpi: KPIData;
  previousPeriodo?: string;
  loading?: boolean;
}

/* ── NPS Card ── */
interface NPSCardProps extends BaseProps {
  variant: 'nps';
  kpi: NPSData;
}

/* ── CSAT Card ── */
interface CSATCardProps extends BaseProps {
  variant: 'csat';
}

/* ── Count Card (respostas) ── */
interface CountCardProps extends BaseProps {
  variant: 'count';
  kpi: RespostasData;
  icon?: React.ReactNode;
}

/* ── LT Card ── */
interface LTCardProps extends BaseProps {
  variant: 'lt';
}

type KPICardProps = NPSCardProps | CSATCardProps | CountCardProps | LTCardProps;

export function KPICard(props: KPICardProps) {
  const { label, kpi, previousPeriodo, loading } = props;
  const delta = kpi.delta;
  const borderColor = !kpi.hasHistory ? '#CCCCCC'
    : delta === null ? '#CCCCCC'
    : delta > 0 ? '#52CC5A'
    : delta < 0 ? '#E50914'
    : '#CCCCCC';

  if (loading) return <div className="kpi-card kpi-skeleton" />;

  return (
    <div className="kpi-card" style={{ borderLeftColor: borderColor }}>
      <div className="kpi-label">{label}</div>

      {props.variant === 'nps' && (
        <>
          <NPSGauge
            nps={kpi.value}
            promotores={(kpi as NPSData).promotores}
            neutros={(kpi as NPSData).neutros}
            detratores={(kpi as NPSData).detratores}
            total={(kpi as NPSData).totalRespostas}
          />
          {kpi.stdDev !== null && (
            <div className="kpi-std">σ = {kpi.stdDev.toFixed(2)} pts</div>
          )}
          <DeltaBadge
            delta={delta} hasHistory={kpi.hasHistory}
            previousValue={kpi.previousValue} currentValue={kpi.value}
            previousPeriodo={previousPeriodo} decimals={0} suffix=" pts"
            deltaStdDev={kpi.deltaStdDev}
          />
        </>
      )}

      {props.variant === 'csat' && (
        <>
          <div className="kpi-value" style={{ color: getCSATColor(kpi.value) }}>
            {kpi.value !== null ? kpi.value.toFixed(2) : '—'}
          </div>
          <CSATBar value={kpi.value} />
          {kpi.stdDev !== null && (
            <div className="kpi-std">σ = {kpi.stdDev.toFixed(2)}</div>
          )}
          <CSATClassificationBadge value={kpi.value} />
        </>
      )}

      {props.variant === 'count' && (() => {
        const r = kpi as RespostasData;
        return (
          <>
            <div className="kpi-value kpi-count">
              {(props as CountCardProps).icon}
              {r.taxaResposta !== null ? `${r.taxaResposta}%` : '—'}
            </div>
            <div className="kpi-std">{r.responderam} de {r.totalLinhas} responderam</div>
            <DeltaBadge
              delta={delta} hasHistory={kpi.hasHistory}
              previousValue={kpi.previousValue} currentValue={kpi.value}
              previousPeriodo={previousPeriodo} decimals={0} suffix="%"
            />
          </>
        );
      })()}

      {props.variant === 'lt' && (
        <>
          <div className="kpi-value">
            {kpi.value !== null ? (
              <>{kpi.value.toFixed(1)} <span className="kpi-suffix">meses</span></>
            ) : '—'}
          </div>
          {kpi.stdDev !== null && (
            <div className="kpi-std">σ = {kpi.stdDev.toFixed(1)} meses</div>
          )}
          <DeltaBadge
            delta={delta} hasHistory={kpi.hasHistory}
            previousValue={kpi.previousValue} currentValue={kpi.value}
            previousPeriodo={previousPeriodo} decimals={1} suffix=" meses"
            deltaStdDev={kpi.deltaStdDev}
          />
        </>
      )}
    </div>
  );
}

function CSATClassificationBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="delta-badge delta-none">— Sem dados</span>;
  if (value >= 4.5) return <span className="delta-badge delta-positive">↑ Acima da média</span>;
  if (value >= 3.5) return <span className="delta-badge delta-neutral">= Dentro da média</span>;
  return <span className="delta-badge delta-negative">↓ Abaixo da média</span>;
}

function CSATBar({ value }: { value: number | null }) {
  const pct = value !== null ? ((value - 1) / 4) * 100 : 0;
  const color = getCSATColor(value);
  return (
    <div className="csat-bar-wrap">
      <div className="csat-bar-track">
        <div className="csat-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="csat-bar-labels">
        <span>1</span><span>5</span>
      </div>
    </div>
  );
}
