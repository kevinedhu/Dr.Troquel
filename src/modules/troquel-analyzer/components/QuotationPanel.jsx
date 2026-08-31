/**
 * TroquelMaster — QuotationPanel Component
 * 
 * Pricing panel with editable rates, extras, and totals.
 */

import { useState } from 'react';
import { TraceType, TRACE_LABELS, TRACE_COLORS } from '../types.js';

export default function QuotationPanel({
  quotation,
  rates,
  extras,
  includeTypes,
  onSetRate,
  onToggleExtra,
  onUpdateExtraPrice,
  onAddExtra,
  onRemoveExtra,
  onToggleType,
  formatCurrency,
  onSave,
  onExport,
}) {
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraPrice, setNewExtraPrice] = useState('');
  const [editingRate, setEditingRate] = useState(null);

  if (!quotation) return null;

  const handleAddExtra = () => {
    if (!newExtraName.trim()) return;
    onAddExtra?.(newExtraName, parseFloat(newExtraPrice) || 0);
    setNewExtraName('');
    setNewExtraPrice('');
    setShowAddExtra(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px', borderBottom: '1px solid var(--outline-variant)',
        backgroundColor: 'var(--surface-container-high)', borderRadius: '12px 12px 0 0',
      }}>
        <h2 className="text-headline-md" style={{
          fontWeight: 600, color: 'var(--on-surface)', fontSize: 16,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>calculate</span>
          Motor de Cálculo
        </h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Include types toggle */}
        <div>
          <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', fontSize: 10, display: 'block', marginBottom: 4 }}>
            Incluir en cotización
          </label>
          <div style={{ display: 'flex', gap: 4 }}>
            {[TraceType.CUT, TraceType.FOLD, TraceType.PERFORATION].map(type => (
              <button
                key={type}
                onClick={() => onToggleType?.(type)}
                style={{
                  padding: '3px 8px', fontSize: 10, fontWeight: 600, fontFamily: 'Inter',
                  backgroundColor: includeTypes?.includes(type) ? `${TRACE_COLORS[type]}22` : 'var(--surface)',
                  color: includeTypes?.includes(type) ? TRACE_COLORS[type] : 'var(--on-surface-variant)',
                  border: `1px solid ${includeTypes?.includes(type) ? TRACE_COLORS[type] : 'var(--outline-variant)'}`,
                  borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {TRACE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Line items */}
        <div>
          <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', fontSize: 10, display: 'block', marginBottom: 6 }}>
            Costo Base
          </label>
          {quotation.lineItems.map((item) => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 8px', backgroundColor: 'var(--surface)', borderRadius: 4,
              border: '1px solid var(--outline-variant)', marginBottom: 4,
            }}>
              <div>
                <div className="text-body-sm" style={{ fontSize: 12, color: 'var(--on-surface)' }}>
                  {item.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="text-utility-mono" style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                    {item.quantity.toFixed(2)} {item.unit}
                  </span>
                  <span style={{ color: 'var(--outline)', fontSize: 11 }}>×</span>
                  {editingRate === item.id ? (
                    <input
                      type="number"
                      defaultValue={item.rate}
                      onBlur={(e) => {
                        const type = item.id === 'cut' ? TraceType.CUT :
                          item.id === 'fold' ? TraceType.FOLD : TraceType.PERFORATION;
                        onSetRate?.(type, e.target.value);
                        setEditingRate(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.target.blur();
                      }}
                      className="input-field"
                      style={{ width: 48, padding: '1px 4px', fontSize: 11, textAlign: 'center' }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="text-utility-mono"
                      style={{ fontSize: 11, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline dotted' }}
                      onClick={() => setEditingRate(item.id)}
                      title="Clic para editar tarifa"
                    >
                      S/. {item.rate.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-utility-mono" style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: 13 }}>
                {formatCurrency(item.subtotal)}
              </span>
            </div>
          ))}
          {quotation.lineItems.length === 0 && (
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', fontSize: 11, textAlign: 'center', padding: 8 }}>
              Sin líneas de costo
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px dashed var(--outline-variant)', margin: 0 }} />

        {/* Extras */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', fontSize: 10 }}>Extras</label>
            <button
              onClick={() => setShowAddExtra(!showAddExtra)}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
            </button>
          </div>

          {extras?.map((extra) => (
            <div key={extra.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={extra.enabled}
                  onChange={() => onToggleExtra?.(extra.id)}
                />
                <span className="text-body-sm" style={{ color: 'var(--on-surface)', fontSize: 12 }}>
                  {extra.name}
                </span>
              </label>
              <span className="text-utility-mono" style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                {formatCurrency(extra.price)}
              </span>
            </div>
          ))}

          {showAddExtra && (
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <input
                type="text" value={newExtraName}
                onChange={(e) => setNewExtraName(e.target.value)}
                placeholder="Nombre" className="input-field"
                style={{ flex: 1, padding: '3px 6px', fontSize: 11 }}
              />
              <input
                type="number" value={newExtraPrice}
                onChange={(e) => setNewExtraPrice(e.target.value)}
                placeholder="S/." className="input-field"
                style={{ width: 56, padding: '3px 6px', fontSize: 11 }}
              />
              <button onClick={handleAddExtra} style={{
                padding: '3px 6px', fontSize: 10, fontWeight: 600,
                backgroundColor: 'var(--primary)', color: 'var(--on-primary)',
                border: 'none', borderRadius: 3, cursor: 'pointer', fontFamily: 'Inter',
              }}>+</button>
            </div>
          )}
        </div>

        {/* Totals */}
        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--outline-variant)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>Subtotal</span>
            <span className="text-utility-mono" style={{ color: 'var(--on-surface)' }}>
              {formatCurrency(quotation.subtotal)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>IGV (18%)</span>
            <span className="text-utility-mono" style={{ color: 'var(--on-surface)' }}>
              {formatCurrency(quotation.igv)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
            <span className="text-headline-md" style={{ fontWeight: 700, color: 'var(--on-surface)', fontSize: 14 }}>Total</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)', fontFamily: 'Inter' }}>
              {formatCurrency(quotation.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        padding: '10px 14px', backgroundColor: 'var(--surface-container-high)',
        borderTop: '1px solid var(--outline-variant)',
        display: 'flex', flexDirection: 'column', gap: 6, borderRadius: '0 0 12px 12px',
      }}>
        <button className="btn-primary" onClick={onSave} style={{
          width: '100%', justifyContent: 'center', borderRadius: 8,
          boxShadow: '0 0 10px rgba(147,204,255,0.2)',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
          Guardar cotización
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onExport} style={{
            flex: 1, padding: '6px 8px', backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface)',
            border: '1px solid var(--outline-variant)', borderRadius: 4, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 600, fontFamily: 'Inter',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>picture_as_pdf</span>
            PDF
          </button>
          <button style={{
            flex: 1, padding: '6px 8px', backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface)',
            border: '1px solid var(--outline-variant)', borderRadius: 4, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 12, fontWeight: 600, fontFamily: 'Inter',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>rocket_launch</span>
            Iniciar
          </button>
        </div>
      </div>
    </div>
  );
}
