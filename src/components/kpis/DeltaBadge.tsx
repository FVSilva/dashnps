import React, { useState } from 'react';
import { formatDelta } from '../../utils/calculations';
import { formatPeriodo } from '../../utils/dateUtils';

interface Props {
  delta: number | null;
  hasHistory: boolean;
  previousValue: number | null;
  currentValue: number | null;
  previousPeriodo?: string;
  decimals?: number;
  suffix?: string;
  deltaStdDev?: number | null;
}

export function DeltaBadge({
  delta, hasHistory, previousValue, currentValue,
  previousPeriodo, decimals = 1, suffix = '', deltaStdDev,
}: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!hasHistory) {
    return <span className="delta-badge delta-none">— Sem histórico</span>;
  }

  const sign = delta !== null && delta > 0 ? 'positive' : delta !== null && delta < 0 ? 'negative' : 'neutral';
  const arrow = sign === 'positive' ? '↑' : sign === 'negative' ? '↓' : '=';
  const label = delta !== null ? `${arrow} ${formatDelta(delta, decimals)}${suffix}` : '—';
  const prevLabel = previousPeriodo ? formatPeriodo(previousPeriodo) : 'Mês anterior';

  return (
    <span
      className={`delta-badge delta-${sign}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {label}
      {deltaStdDev !== null && deltaStdDev !== undefined && (
        <span className="delta-sigma"> σ {formatDelta(deltaStdDev, 2)}</span>
      )}
      {showTooltip && (
        <div className="delta-tooltip">
          <div className="tooltip-row"><span>Período anterior:</span><strong>{prevLabel}</strong></div>
          <div className="tooltip-row"><span>Valor anterior:</span><strong>{previousValue !== null ? previousValue.toFixed(decimals) + suffix : '—'}</strong></div>
          <div className="tooltip-row"><span>Valor atual:</span><strong>{currentValue !== null ? currentValue.toFixed(decimals) + suffix : '—'}</strong></div>
          <div className="tooltip-row"><span>Diferença:</span><strong>{delta !== null ? formatDelta(delta, decimals) + suffix : '—'}</strong></div>
        </div>
      )}
    </span>
  );
}
