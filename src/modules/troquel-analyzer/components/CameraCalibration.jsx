/**
 * TroquelMaster — CameraCalibration Component
 * 
 * Calibrates image scale so measurements can be in mm.
 * The user places a known reference object next to the troquel in the photo,
 * then selects what it is, and the system computes px-per-mm.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CalibrationReference,
  CALIBRATION_REFERENCE_SIZES,
} from '../types.js';

const REFERENCE_OPTIONS = [
  {
    id: CalibrationReference.A4,
    label: 'Hoja A4',
    description: '210 × 297 mm',
    icon: 'description',
    hint: 'Coloca el troquel sobre una hoja A4',
  },
  {
    id: CalibrationReference.CARTA,
    label: 'Hoja Carta',
    description: '216 × 279 mm',
    icon: 'description',
    hint: 'Coloca el troquel sobre una hoja carta',
  },
  {
    id: CalibrationReference.COIN_SOL,
    label: 'Moneda S/1',
    description: 'Diámetro 25.5 mm',
    icon: 'toll',
    hint: 'Coloca una moneda de sol junto al troquel',
  },
  {
    id: CalibrationReference.COIN_50,
    label: 'Moneda 50 cént.',
    description: 'Diámetro 22 mm',
    icon: 'toll',
    hint: 'Coloca una moneda de 50 céntimos junto al troquel',
  },
  {
    id: CalibrationReference.RULER,
    label: 'Regla / Cinta',
    description: 'Marcas a distancia conocida',
    icon: 'straighten',
    hint: 'Marca dos puntos en la regla visible en la foto',
  },
  {
    id: CalibrationReference.CUSTOM,
    label: 'Dimensión conocida',
    description: 'Ingreso manual (mm)',
    icon: 'edit_square',
    hint: 'Ingresa cuánto mide una dimensión que puedas medir en la imagen',
  },
];

/**
 * @param {object} props
 * @param {string} props.imagePreview - data URL of the image to calibrate
 * @param {number} props.imageWidth - actual pixel width of the image
 * @param {number} props.imageHeight - actual pixel height of the image
 * @param {function} props.onCalibrated - callback({ pxPerMm })
 * @param {function} props.onClose
 */
export default function CameraCalibration({ imagePreview, imageWidth, imageHeight, onCalibrated, onClose }) {
  const [step, setStep] = useState('select'); // 'select' | 'measure' | 'done'
  const [selectedRef, setSelectedRef] = useState(null);
  const [customMm, setCustomMm] = useState('');
  const [measurePoints, setMeasurePoints] = useState([]); // [{x,y}, {x,y}]
  const [pxPerMm, setPxPerMm] = useState(null);

  const imgRef = useRef(null);
  const svgRef = useRef(null);

  // Step 1: Select reference
  const handleSelectRef = useCallback((refId) => {
    setSelectedRef(refId);

    // For A4/CARTA: we know the image fills the reference — skip manual measure
    if (refId === CalibrationReference.A4 || refId === CalibrationReference.CARTA) {
      const sizes = CALIBRATION_REFERENCE_SIZES[refId];
      // Assume the image is a photo of the page — use the page width
      const ppMm = imageWidth / sizes.width;
      setPxPerMm(ppMm);
      setStep('done');
    } else {
      setStep('measure');
    }
  }, [imageWidth]);

  // Step 2: User clicks two points on the image (for RULER/CUSTOM)
  const handleImageClick = useCallback((e) => {
    if (step !== 'measure') return;
    if (measurePoints.length >= 2) return;

    const rect = imgRef.current.getBoundingClientRect();
    // Convert click to image coordinates
    const scaleX = imageWidth / rect.width;
    const scaleY = imageHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const newPoints = [...measurePoints, { x, y }];
    setMeasurePoints(newPoints);

    if (newPoints.length === 2) {
      // Calculate pixel distance between the two points
      const dx = newPoints[1].x - newPoints[0].x;
      const dy = newPoints[1].y - newPoints[0].y;
      const distPx = Math.hypot(dx, dy);

      let knownMm = 0;
      if (selectedRef === CalibrationReference.COIN_SOL) {
        knownMm = CALIBRATION_REFERENCE_SIZES[CalibrationReference.COIN_SOL].diameter;
      } else if (selectedRef === CalibrationReference.COIN_50) {
        knownMm = CALIBRATION_REFERENCE_SIZES[CalibrationReference.COIN_50].diameter;
      } else if (selectedRef === CalibrationReference.RULER) {
        // Will be set by user in the next input
        knownMm = null;
      } else if (selectedRef === CalibrationReference.CUSTOM) {
        knownMm = parseFloat(customMm) || null;
      }

      if (knownMm) {
        setPxPerMm(distPx / knownMm);
        setStep('done');
      } else {
        // Need manual input for ruler
        setStep('input_mm');
      }
    }
  }, [step, measurePoints, imageWidth, imageHeight, selectedRef, customMm]);

  // Confirm ruler / custom mm input
  const confirmMm = useCallback(() => {
    const mm = parseFloat(customMm);
    if (!mm || mm <= 0) return;
    if (measurePoints.length === 2) {
      const dx = measurePoints[1].x - measurePoints[0].x;
      const dy = measurePoints[1].y - measurePoints[0].y;
      const distPx = Math.hypot(dx, dy);
      setPxPerMm(distPx / mm);
      setStep('done');
    } else if (selectedRef === CalibrationReference.CUSTOM) {
      // Use image width as reference
      const ppMm = imageWidth / mm;
      setPxPerMm(ppMm);
      setStep('done');
    }
  }, [customMm, measurePoints, imageWidth, selectedRef]);

  const handleApply = useCallback(() => {
    if (pxPerMm) {
      onCalibrated?.({ pxPerMm });
    }
  }, [pxPerMm, onCalibrated]);

  const reset = useCallback(() => {
    setStep('select');
    setSelectedRef(null);
    setMeasurePoints([]);
    setPxPerMm(null);
    setCustomMm('');
  }, []);

  // Overlay drawing (for showing clicked points on image)
  const renderOverlay = () => {
    if (!imagePreview || measurePoints.length === 0) return null;
    const rect = imgRef.current?.getBoundingClientRect() || { width: 1, height: 1 };
    const sx = rect.width / imageWidth;
    const sy = rect.height / imageHeight;

    return (
      <svg
        ref={svgRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox={`0 0 ${rect.width} ${rect.height}`}
      >
        {measurePoints.map((p, i) => (
          <g key={i}>
            <circle cx={p.x * sx} cy={p.y * sy} r={8} fill="rgba(147,204,255,0.8)" stroke="#fff" strokeWidth={2} />
            <text x={p.x * sx + 12} y={p.y * sy + 4} fill="#fff" fontSize={12} fontFamily="Inter">{i + 1}</text>
          </g>
        ))}
        {measurePoints.length === 2 && (
          <line
            x1={measurePoints[0].x * sx} y1={measurePoints[0].y * sy}
            x2={measurePoints[1].x * sx} y2={measurePoints[1].y * sy}
            stroke="#93ccff" strokeWidth={2} strokeDasharray="6,3"
          />
        )}
      </svg>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 16px 12px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4,
        }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <div style={{ fontFamily: 'Inter', fontWeight: 700, color: '#fff', fontSize: 15 }}>
            Calibrar Escala
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
            {step === 'select' && 'Elige una referencia de medida'}
            {step === 'measure' && `Toca los puntos extremos en la imagen`}
            {step === 'input_mm' && 'Ingresa la distancia real'}
            {step === 'done' && '¡Calibración lista!'}
          </div>
        </div>
      </div>

      {/* Image preview (always visible once we have it) */}
      {imagePreview && step !== 'select' && (
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          cursor: step === 'measure' && measurePoints.length < 2 ? 'crosshair' : 'default',
          minHeight: 0,
        }}>
          <img
            ref={imgRef}
            src={imagePreview}
            alt="Vista de calibración"
            onClick={handleImageClick}
            style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}
          />
          {renderOverlay()}

          {/* Instruction banner */}
          {step === 'measure' && measurePoints.length < 2 && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
              padding: '32px 16px 16px', textAlign: 'center',
            }}>
              <p style={{ fontFamily: 'Inter', color: '#fff', fontSize: 13, margin: 0 }}>
                {measurePoints.length === 0
                  ? `Toca el punto 1 de la ${REFERENCE_OPTIONS.find(r => r.id === selectedRef)?.label}`
                  : 'Toca el punto 2'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step: Select reference */}
      {step === 'select' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {REFERENCE_OPTIONS.map(opt => (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelectRef(opt.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--primary)', flexShrink: 0 }}>
                  {opt.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Inter', fontWeight: 600, color: '#fff', fontSize: 14 }}>
                    {opt.label}
                  </div>
                  <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    {opt.description}
                  </div>
                  <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(147,204,255,0.7)', marginTop: 2 }}>
                    {opt.hint}
                  </div>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }}>
                  chevron_right
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Input mm (for ruler or custom) */}
      {(step === 'input_mm' || (step === 'measure' && selectedRef === CalibrationReference.CUSTOM && measurePoints.length === 0)) && (
        <div style={{
          padding: 20, flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <label style={{ fontFamily: 'Inter', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
            {selectedRef === CalibrationReference.RULER
              ? '¿Qué distancia mide esa línea en mm?'
              : '¿Cuánto mide el ancho del troquel en mm?'}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              value={customMm}
              onChange={e => setCustomMm(e.target.value)}
              placeholder="Ej: 150"
              style={{
                flex: 1, padding: '10px 14px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                color: '#fff', fontFamily: 'Inter', fontSize: 15,
              }}
            />
            <button
              onClick={() => {
                if (selectedRef === CalibrationReference.CUSTOM && measurePoints.length === 0) {
                  const mm = parseFloat(customMm);
                  if (mm > 0) {
                    setPxPerMm(imageWidth / mm);
                    setStep('done');
                  }
                } else {
                  confirmMm();
                }
              }}
              style={{
                padding: '10px 20px', backgroundColor: 'var(--primary)',
                color: '#fff', border: 'none', borderRadius: 8,
                fontFamily: 'Inter', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && pxPerMm && (
        <div style={{
          padding: 20, flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{
            backgroundColor: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span className="material-symbols-outlined" style={{ color: '#22c55e', fontSize: 22 }}>check_circle</span>
            <div>
              <div style={{ fontFamily: 'Inter', fontWeight: 600, color: '#22c55e', fontSize: 14 }}>
                Calibración completada
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                {pxPerMm.toFixed(2)} px/mm · 1 mm = {(1 / pxPerMm).toFixed(1)} px
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={reset}
              style={{
                flex: 1, padding: '12px', backgroundColor: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8, fontFamily: 'Inter', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              Recalibrar
            </button>
            <motion.button
              onClick={handleApply}
              whileTap={{ scale: 0.97 }}
              style={{
                flex: 2, padding: '12px', backgroundColor: 'var(--primary)',
                color: '#fff', border: 'none', borderRadius: 8,
                fontFamily: 'Inter', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>straighten</span>
              Aplicar Escala
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
