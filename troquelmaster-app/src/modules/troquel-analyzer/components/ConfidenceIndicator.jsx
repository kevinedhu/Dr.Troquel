/**
 * TroquelMaster — ConfidenceIndicator Component
 * 
 * Visual confidence gauge with factor breakdown.
 */

import { ConfidenceLevel } from '../types.js';

const LEVEL_STYLES = {
  [ConfidenceLevel.HIGH]: { color: '#22c55e', label: 'ALTA', bg: 'rgba(34,197,94,0.1)' },
  [ConfidenceLevel.MEDIUM]: { color: '#f59e0b', label: 'MEDIA', bg: 'rgba(245,158,11,0.1)' },
  [ConfidenceLevel.LOW]: { color: '#ef4444', label: 'BAJA', bg: 'rgba(239,68,68,0.1)' },
};

export default function ConfidenceIndicator({ confidence }) {
  if (!confidence) return null;

  const { percentage, level, factors } = confidence;
  const style = LEVEL_STYLES[level] || LEVEL_STYLES[ConfidenceLevel.LOW];

  // SVG arc for gauge
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8,
      backgroundColor: 'var(--surface)', border: '1px solid var(--outline-variant)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        {/* Circular gauge */}
        <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            {/* Background circle */}
            <circle cx="32" cy="32" r={radius} fill="none"
              stroke="var(--surface-variant)" strokeWidth="5"
              transform="rotate(-90 32 32)"
            />
            {/* Progress arc */}
            <circle cx="32" cy="32" r={radius} fill="none"
              stroke={style.color} strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Inter', color: style.color }}>
              {percentage}%
            </span>
          </div>
        </div>

        <div>
          <div className="text-label-caps" style={{ color: 'var(--on-surface-variant)', fontSize: 10, marginBottom: 2 }}>
            Confianza del Análisis
          </div>
          <div style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: 3,
            backgroundColor: style.bg, color: style.color,
            fontSize: 11, fontWeight: 700, fontFamily: 'Inter', letterSpacing: '0.05em',
          }}>
            {style.label}
          </div>
        </div>
      </div>

      {/* Factor list */}
      {factors && factors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {factors.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                fontSize: 10, color: f.positive !== false ? '#22c55e' : '#ef4444',
                fontFamily: 'Inter', fontWeight: 700, width: 12, textAlign: 'center',
              }}>
                {f.positive !== false ? '✓' : '✗'}
              </span>
              <span className="text-body-sm" style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                {f.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
