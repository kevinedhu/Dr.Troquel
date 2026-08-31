/**
 * TroquelMaster — LengthSummary Component
 * 
 * Displays aggregated length measurements with manual override support.
 */

import { useState } from 'react';
import { TraceType, TRACE_COLORS, TRACE_LABELS } from '../types.js';

export default function LengthSummary({ result, onSetManualLength, onToggleManualLength }) {
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  if (!result) return null;

  const hasScale = result.scale !== null;
  const cutMm = hasScale ? (result.cutLengthMm || 0) : 0;
  const foldMm = hasScale ? (result.foldLengthMm || 0) : 0;
  const perfMm = hasScale ? (result.perforationLengthMm || 0) : 0;

  const activeCutMm = result.useManualLength && result.manualCutLengthMm !== null
    ? result.manualCutLengthMm
    : cutMm;

  const handleManualSubmit = () => {
    const val = parseFloat(manualInput);
    if (!isNaN(val) && val > 0) {
      onSetManualLength?.(val * 10); // cm to mm
      setShowManualInput(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Main cut length */}
      <div style={{
        padding: '10px 12px', borderRadius: 8,
        backgroundColor: 'var(--surface)', border: '1px solid var(--outline-variant)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span className="text-label-caps" style={{ color: TRACE_COLORS[TraceType.CUT], fontSize: 10 }}>
            Longitud de Corte
          </span>
          {hasScale && (
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              style={{
                background: 'none', border: 'none', color: 'var(--on-surface-variant)',
                cursor: 'pointer', display: 'flex', padding: 0,
              }}
              title="Corrección manual"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
            </button>
          )}
        </div>

        {hasScale ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{
                fontSize: 28, fontWeight: 700, fontFamily: 'Inter',
                color: result.useManualLength ? 'var(--tertiary)' : 'var(--primary)',
              }}>
                {(activeCutMm / 10).toFixed(2)}
              </span>
              <span className="text-utility-mono" style={{ color: 'var(--on-surface-variant)' }}>cm</span>
              <span style={{
                fontSize: 14, fontWeight: 500, fontFamily: 'Inter',
                color: 'var(--on-surface-variant)', marginLeft: 8,
              }}>
                {(activeCutMm / 1000).toFixed(4)} m
              </span>
            </div>

            {/* Manual override indicator */}
            {result.useManualLength && result.manualCutLengthMm !== null && (
              <div style={{
                marginTop: 6, padding: '4px 8px', borderRadius: 4,
                backgroundColor: 'rgba(255,185,95,0.1)', border: '1px solid rgba(255,185,95,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <span className="text-body-sm" style={{ fontSize: 11, color: 'var(--tertiary)' }}>
                    ⚠ Valor manual · Automático: {(cutMm / 10).toFixed(2)} cm
                  </span>
                </div>
                <button
                  onClick={onToggleManualLength}
                  style={{
                    padding: '1px 6px', fontSize: 10, fontWeight: 600,
                    backgroundColor: 'transparent', color: 'var(--tertiary)',
                    border: '1px solid var(--tertiary)', borderRadius: 3, cursor: 'pointer',
                    fontFamily: 'Inter',
                  }}
                >
                  Usar auto
                </button>
              </div>
            )}

            {/* Manual input */}
            {showManualInput && (
              <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                <input
                  type="number"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="cm"
                  className="input-field"
                  style={{ flex: 1, padding: '4px 8px', fontSize: 12 }}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                  autoFocus
                />
                <button
                  onClick={handleManualSubmit}
                  style={{
                    padding: '4px 8px', fontSize: 11, fontWeight: 600,
                    backgroundColor: 'var(--primary)', color: 'var(--on-primary)',
                    border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'Inter',
                  }}
                >
                  OK
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{
            padding: '6px 8px', borderRadius: 4,
            backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          }}>
            <span className="text-body-sm" style={{ fontSize: 11, color: 'var(--error)' }}>
              ⚠ No es posible determinar la escala física
            </span>
            <div className="text-utility-mono" style={{ marginTop: 2, fontSize: 11 }}>
              {result.cutLengthPx.toFixed(1)} px (sin escala)
            </div>
          </div>
        )}
      </div>

      {/* Secondary lengths */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { type: TraceType.FOLD, mm: foldMm, px: result.foldLengthPx },
          { type: TraceType.PERFORATION, mm: perfMm, px: result.perforationLengthPx },
        ].map(({ type, mm, px }) => {
          if (px <= 0) return null;
          return (
            <div key={type} style={{
              flex: 1, padding: '6px 8px', borderRadius: 6,
              backgroundColor: 'var(--surface)', border: '1px solid var(--outline-variant)',
            }}>
              <span className="text-label-caps" style={{ color: TRACE_COLORS[type], fontSize: 9 }}>
                {TRACE_LABELS[type]}
              </span>
              <div className="text-utility-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>
                {hasScale ? `${(mm / 10).toFixed(2)} cm` : `${px.toFixed(1)} px`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
