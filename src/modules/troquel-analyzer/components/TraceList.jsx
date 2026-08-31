/**
 * TroquelMaster — TraceList Component
 * 
 * Scrollable list of detected traces with selection, filtering, and type editing.
 */

import { useState, useMemo } from 'react';
import { TraceType, TRACE_COLORS, TRACE_LABELS } from '../types.js';

export default function TraceList({
  traces = [],
  selectedTraceId,
  onSelectTrace,
  onToggleTrace,
  onClassifyTrace,
  onRemoveTrace,
  scale,
}) {
  const [filterType, setFilterType] = useState(null);

  const filteredTraces = useMemo(() => {
    if (!filterType) return traces;
    return traces.filter(t => t.type === filterType);
  }, [traces, filterType]);

  const typeCount = useMemo(() => {
    const counts = {};
    for (const t of traces) {
      counts[t.type] = (counts[t.type] || 0) + 1;
    }
    return counts;
  }, [traces]);

  if (traces.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 32, opacity: 0.4, display: 'block', marginBottom: 4 }}>
          gesture
        </span>
        <p className="text-body-sm">No hay trazos detectados</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid var(--outline-variant)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span className="text-label-caps" style={{ color: 'var(--on-surface-variant)', fontSize: 11 }}>
          Trazos ({traces.length})
        </span>
      </div>

      {/* Type filters */}
      <div style={{ padding: '6px 8px', display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid var(--outline-variant)' }}>
        <FilterChip
          label={`Todos (${traces.length})`}
          active={filterType === null}
          onClick={() => setFilterType(null)}
        />
        {Object.entries(typeCount).map(([type, count]) => (
          <FilterChip
            key={type}
            label={`${TRACE_LABELS[type]} (${count})`}
            active={filterType === type}
            color={TRACE_COLORS[type]}
            onClick={() => setFilterType(filterType === type ? null : type)}
          />
        ))}
      </div>

      {/* Trace list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {filteredTraces.map(trace => {
          const isSelected = trace.id === selectedTraceId;
          const lengthDisplay = trace.lengthMm !== null
            ? `${(trace.lengthMm / 10).toFixed(2)} cm`
            : `${trace.lengthPx.toFixed(1)} px`;

          return (
            <div
              key={trace.id}
              onClick={() => onSelectTrace?.(trace.id)}
              style={{
                padding: '6px 12px',
                display: 'flex', alignItems: 'center', gap: 8,
                backgroundColor: isSelected ? 'rgba(147,204,255,0.08)' : 'transparent',
                borderLeft: isSelected ? `3px solid ${TRACE_COLORS[trace.type]}` : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                opacity: trace.included ? 1 : 0.45,
              }}
              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {/* Include checkbox */}
              <input
                type="checkbox"
                checked={trace.included}
                onChange={(e) => { e.stopPropagation(); onToggleTrace?.(trace.id); }}
                style={{ width: 14, height: 14 }}
              />

              {/* Color dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: TRACE_COLORS[trace.type],
                flexShrink: 0,
              }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="text-body-sm" style={{
                  fontSize: 12, fontWeight: isSelected ? 600 : 400,
                  color: 'var(--on-surface)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {trace.label}
                </div>
                <div className="text-utility-mono" style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                  {TRACE_LABELS[trace.type]} · {lengthDisplay}
                </div>
              </div>

              {/* Expanded actions for selected trace */}
              {isSelected && (
                <div style={{ display: 'flex', gap: 2 }}>
                  <select
                    value={trace.type}
                    onChange={(e) => { e.stopPropagation(); onClassifyTrace?.(trace.id, e.target.value); }}
                    className="input-field"
                    style={{ padding: '2px 4px', fontSize: 10, width: 70, paddingRight: '20px !important' }}
                  >
                    {Object.entries(TRACE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveTrace?.(trace.id); }}
                    style={{
                      padding: 2, background: 'none', border: 'none',
                      color: 'var(--error)', cursor: 'pointer', display: 'flex',
                    }}
                    title="Eliminar trazo"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({ label, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '2px 8px', fontSize: 10, fontWeight: 600, fontFamily: 'Inter',
        backgroundColor: active ? (color ? `${color}22` : 'var(--secondary-container)') : 'var(--surface)',
        color: active ? (color || 'var(--on-secondary-container)') : 'var(--on-surface-variant)',
        border: `1px solid ${active ? (color || 'var(--secondary-container)') : 'var(--outline-variant)'}`,
        borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  );
}
