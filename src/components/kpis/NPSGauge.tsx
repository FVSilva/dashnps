import React from 'react';
import { getNPSColor } from '../../utils/calculations';

interface Props {
  nps: number | null;
  promotores: number;
  neutros: number;
  detratores: number;
  total: number;
}

export function NPSGauge({ nps, promotores, neutros, detratores, total }: Props) {
  const color = getNPSColor(nps);
  const displayValue = nps !== null ? nps : 0;

  // Gauge semicircular: arco vai de 180° (esquerda) até 0° (direita)
  // -100 → 0° (extrema esquerda), +100 → 180° (extrema direita)
  const pct = nps !== null ? (nps + 100) / 200 : 0.5;
  const angle = pct * 180; // 0–180

  const cx = 80, cy = 80, r = 60;
  const startAngle = Math.PI; // 180°
  const endAngle = 0;

  // Trilha completa
  const trackD = describeArc(cx, cy, r, 180, 0);
  // Arco preenchido até o valor atual
  const fillAngleDeg = 180 - angle;
  const fillD = describeArc(cx, cy, r, 180, fillAngleDeg);

  // Agulha
  const needleAngle = (180 - angle) * (Math.PI / 180);
  const nx = cx + r * Math.cos(needleAngle);
  const ny = cy - r * Math.sin(needleAngle);

  const pPct = total > 0 ? Math.round((promotores / total) * 100) : 0;
  const dPct = total > 0 ? Math.round((detratores / total) * 100) : 0;

  return (
    <div className="nps-gauge-wrap">
      <svg viewBox="0 0 160 90" className="nps-gauge-svg">
        {/* Zonas: RED esquerda (NPS<0), YELLOW meio (0–49), GREEN direita (≥50) */}
        <path d={describeArc(cx, cy, r, 0, 90)}    stroke="#C0392B" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d={describeArc(cx, cy, r, 90, 135)}  stroke="#FFC02A" strokeWidth="10" fill="none" />
        <path d={describeArc(cx, cy, r, 135, 180)} stroke="#52CC5A" strokeWidth="10" fill="none" strokeLinecap="round" />
        {/* Agulha */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill={color} />
      </svg>
      <div className="nps-gauge-value" style={{ color }}>
        {nps !== null ? `${nps > 0 ? '+' : ''}${nps}` : '—'}
      </div>
      <div className="nps-gauge-labels">
        <span className="nps-det" title="Detratores (0–6)">
          <span className="dot" style={{ background: '#C0392B' }} />
          {dPct}% Det.
        </span>
        <span className="nps-neu" title="Neutros (7–8)">
          <span className="dot" style={{ background: '#FFC02A' }} />
          {total > 0 ? Math.round((neutros / total) * 100) : 0}% Neu.
        </span>
        <span className="nps-pro" title="Promotores (9–10)">
          <span className="dot" style={{ background: '#52CC5A' }} />
          {pPct}% Pro.
        </span>
      </div>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(Math.PI - rad),
    y: cy - r * Math.sin(Math.PI - rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}
