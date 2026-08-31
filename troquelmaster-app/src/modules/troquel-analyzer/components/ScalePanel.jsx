/**
 * TroquelMaster — ScalePanel Component
 * 
 * Scale information and calibration controls.
 */

import { useState } from 'react';
import { ScaleSource } from '../types.js';

const SOURCE_LABELS = {
  [ScaleSource.SVG_METADATA]: 'Metadatos SVG',
  [ScaleSource.PDF_METADATA]: 'Metadatos PDF',
  [ScaleSource.KNOWN_DIMENSION]: 'Dimensión conocida',
  [ScaleSource.MANUAL_CALIBRATION]: 'Calibración manual',
  [ScaleSource.PHYSICAL_REFERENCE]: 'Referencia física',
  [ScaleSource.NONE]: 'Sin escala',
};

export default function ScalePanel({
  scale,
  scaleSource,
  isCalibrating,
  calibrationPoints,
  onStartCalibration,
  onCompleteCalibration,
  onCancelCalibration,
  onSetKnownDimension,
}) {
  const [calDistance, setCalDistance] = useState('');
  const [calUnit, setCalUnit] = useState('cm');
  const [dimPixels, setDimPixels] = useState('');
  const [dimReal, setDimReal] = useState('');
  const [dimUnit, setDimUnit] = useState('mm');
  const [showDimInput, setShowDimInput] = useState(false);

  const hasScale = scale !== null && scale > 0;

  const handleCalibrationSubmit = () => {
    const distance = parseFloat(calDistance);
    if (isNaN(distance) || distance <= 0) return;
    let distanceMm = distance;
    if (calUnit === 'cm') distanceMm = distance * 10;
    if (calUnit === 'm') distanceMm = distance * 1000;
    if (calUnit === 'in') distanceMm = distance * 25.4;
    onCompleteCalibration?.(distanceMm);
    setCalDistance('');
  };

  const handleDimSubmit = () => {
    const px = parseFloat(dimPixels);
    const real = parseFloat(dimReal);
    if (isNaN(px) || isNaN(real) || px <= 0 || real <= 0) return;
    let realMm = real;
    if (dimUnit === 'cm') realMm = real * 10;
    if (dimUnit === 'm') realMm = real * 1000;
    if (dimUnit === 'in') realMm = real * 25.4;
    onSetKnownDimension?.(px, realMm);
    setShowDimInput(false);
  };

  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8,
      backgroundColor: 'var(--surface)', border: '1px solid var(--outline-variant)',
    }}>
      <div className="text-label-caps" style={{ color: 'var(--on-surface-variant)', fontSize: 10, marginBottom: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }}>
          straighten
        </span>
        Escala
      </div>

      {/* Current scale info */}
      {hasScale ? (
        <div style={{ marginBottom: 8 }}>
          <div className="text-utility-mono" style={{ fontSize: 12, color: 'var(--on-surface)' }}>
            1 px = {(1 / scale).toFixed(4)} mm
          </div>
          <div className="text-body-sm" style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
            Fuente: {SOURCE_LABELS[scaleSource] || scaleSource}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '6px 8px', borderRadius: 4, marginBottom: 8,
          backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <span className="text-body-sm" style={{ fontSize: 11, color: 'var(--error)' }}>
            ⚠ No es posible determinar la escala física
          </span>
        </div>
      )}

      {/* Calibration mode */}
      {isCalibrating ? (
        <div style={{
          padding: 8, borderRadius: 4,
          backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)',
        }}>
          <div className="text-body-sm" style={{ fontSize: 11, color: '#22c55e', marginBottom: 4 }}>
            📐 Selecciona dos puntos en el visor
          </div>
          <div className="text-body-sm" style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginBottom: 6 }}>
            Puntos: {calibrationPoints?.length || 0}/2
          </div>
          
          {calibrationPoints?.length === 2 && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              <input
                type="number"
                value={calDistance}
                onChange={(e) => setCalDistance(e.target.value)}
                placeholder="Distancia real"
                className="input-field"
                style={{ flex: 1, padding: '4px 6px', fontSize: 11 }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCalibrationSubmit()}
              />
              <select
                value={calUnit}
                onChange={(e) => setCalUnit(e.target.value)}
                className="input-field"
                style={{ width: 48, padding: '4px 4px', fontSize: 11 }}
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="m">m</option>
                <option value="in">in</option>
              </select>
              <button
                onClick={handleCalibrationSubmit}
                style={{
                  padding: '4px 8px', fontSize: 10, fontWeight: 600,
                  backgroundColor: '#22c55e', color: '#fff',
                  border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'Inter',
                }}
              >
                OK
              </button>
            </div>
          )}
          
          <button
            onClick={onCancelCalibration}
            style={{
              padding: '2px 6px', fontSize: 10, fontWeight: 600,
              backgroundColor: 'transparent', color: 'var(--on-surface-variant)',
              border: '1px solid var(--outline-variant)', borderRadius: 3, cursor: 'pointer',
              fontFamily: 'Inter', width: '100%',
            }}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={onStartCalibration}
            style={{
              padding: '4px 8px', fontSize: 11, fontWeight: 600,
              backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface)',
              border: '1px solid var(--outline-variant)', borderRadius: 4, cursor: 'pointer',
              fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 4,
              justifyContent: 'center', width: '100%',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>straighten</span>
            Calibrar manualmente
          </button>
          
          {!showDimInput ? (
            <button
              onClick={() => setShowDimInput(true)}
              style={{
                padding: '4px 8px', fontSize: 11, fontWeight: 600,
                backgroundColor: 'transparent', color: 'var(--on-surface-variant)',
                border: '1px solid var(--outline-variant)', borderRadius: 4, cursor: 'pointer',
                fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 4,
                justifyContent: 'center', width: '100%',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>aspect_ratio</span>
              Dimensión conocida
            </button>
          ) : (
            <div style={{
              padding: 6, borderRadius: 4,
              backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline-variant)',
            }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                <input
                  type="number" value={dimPixels}
                  onChange={(e) => setDimPixels(e.target.value)}
                  placeholder="px" className="input-field"
                  style={{ flex: 1, padding: '3px 6px', fontSize: 11 }}
                />
                <span className="text-body-sm" style={{ alignSelf: 'center', fontSize: 11 }}>=</span>
                <input
                  type="number" value={dimReal}
                  onChange={(e) => setDimReal(e.target.value)}
                  placeholder="real" className="input-field"
                  style={{ flex: 1, padding: '3px 6px', fontSize: 11 }}
                />
                <select
                  value={dimUnit} onChange={(e) => setDimUnit(e.target.value)}
                  className="input-field"
                  style={{ width: 44, padding: '3px 2px', fontSize: 11 }}
                >
                  <option value="mm">mm</option>
                  <option value="cm">cm</option>
                  <option value="m">m</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={handleDimSubmit} style={{
                  flex: 1, padding: '3px 6px', fontSize: 10, fontWeight: 600,
                  backgroundColor: 'var(--primary)', color: 'var(--on-primary)',
                  border: 'none', borderRadius: 3, cursor: 'pointer', fontFamily: 'Inter',
                }}>Aplicar</button>
                <button onClick={() => setShowDimInput(false)} style={{
                  flex: 1, padding: '3px 6px', fontSize: 10, fontWeight: 600,
                  backgroundColor: 'transparent', color: 'var(--on-surface-variant)',
                  border: '1px solid var(--outline-variant)', borderRadius: 3, cursor: 'pointer', fontFamily: 'Inter',
                }}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
