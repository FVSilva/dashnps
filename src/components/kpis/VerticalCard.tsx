import React from 'react';
import type { KPIData } from '../../types';
import { DeltaBadge } from './DeltaBadge';
import { getCSATColor } from '../../utils/calculations';

interface Props {
  label: string;
  kpi: KPIData;
  previousPeriodo?: string;
  loading?: boolean;
}

export function VerticalCard({ label, kpi, previousPeriodo, loading }: Props) {
  if (loading) return <div className="vertical-card vertical-skeleton" />;

  const delta = kpi.delta;
  const borderColor = !kpi.hasHistory ? '#CCCCCC'
    : delta === null ? '#CCCCCC'
    : delta > 0 ? '#52CC5A'
    : delta < 0 ? '#E50914'
    : '#CCCCCC';

  const valueColor = getCSATColor(kpi.value);

  return (
    <div className="vertical-card" style={{ borderLeftColor: borderColor }}>
      <div className="vertical-label">{label}</div>
      <div className="vertical-value" style={{ color: valueColor }}>
        {kpi.value !== null ? kpi.value.toFixed(2) : '—'}
        <span className="vertical-scale">/5</span>
      </div>
      {kpi.stdDev !== null && (
        <div className="vertical-std">σ {kpi.stdDev.toFixed(2)}</div>
      )}
      <DeltaBadge
        delta={delta} hasHistory={kpi.hasHistory}
        previousValue={kpi.previousValue} currentValue={kpi.value}
        previousPeriodo={previousPeriodo} decimals={2}
        deltaStdDev={kpi.deltaStdDev}
      />
    </div>
  );
}
