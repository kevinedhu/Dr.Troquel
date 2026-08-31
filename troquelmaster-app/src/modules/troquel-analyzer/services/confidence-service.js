/**
 * TroquelMaster — Confidence Service
 * 
 * Calculates analysis confidence based on multiple factors.
 */

import { ConfidenceLevel, ScaleSource, FileType } from '../types.js';

/**
 * Calculate confidence for an analysis result
 * @param {object} params
 * @returns {{ percentage: number, level: string, factors: Array }}
 */
export function calculateConfidence({
  fileType,
  scaleSource,
  traceCount,
  hasViewBox = false,
  hasPhysicalUnits = false,
  imageQuality = null,
  hasPerspectiveCorrection = false,
}) {
  const factors = [];
  let score = 0;

  // ── File type factor ──
  if (fileType === FileType.SVG) {
    factors.push({ label: 'Fuente vectorial (SVG)', impact: 30, positive: true });
    score += 30;
  } else if (fileType === FileType.PDF) {
    factors.push({ label: 'Fuente PDF', impact: 20, positive: true });
    score += 20;
  } else if (fileType === FileType.PNG || fileType === FileType.JPG) {
    factors.push({ label: 'Fuente rasterizada (imagen)', impact: 10, positive: true });
    score += 10;
  } else if (fileType === FileType.PHOTO) {
    factors.push({ label: 'Fotografía de cámara', impact: 5, positive: true });
    score += 5;
  }

  // ── Scale factor ──
  switch (scaleSource) {
    case ScaleSource.SVG_METADATA:
    case ScaleSource.PDF_METADATA:
      factors.push({ label: 'Escala extraída automáticamente', impact: 30, positive: true });
      score += 30;
      break;
    case ScaleSource.KNOWN_DIMENSION:
      factors.push({ label: 'Escala por dimensión conocida', impact: 25, positive: true });
      score += 25;
      break;
    case ScaleSource.MANUAL_CALIBRATION:
      factors.push({ label: 'Calibración manual', impact: 20, positive: true });
      score += 20;
      break;
    case ScaleSource.PHYSICAL_REFERENCE:
      factors.push({ label: 'Referencia física', impact: 15, positive: true });
      score += 15;
      break;
    case ScaleSource.NONE:
      factors.push({ label: 'Sin escala — medidas estimadas', impact: -20, positive: false });
      score -= 20;
      break;
  }

  // ── Trace detection ──
  if (traceCount > 0) {
    const traceScore = Math.min(20, traceCount * 2);
    factors.push({ label: `${traceCount} trazos detectados`, impact: traceScore, positive: true });
    score += traceScore;
  } else {
    factors.push({ label: 'Sin trazos detectados', impact: -30, positive: false });
    score -= 30;
  }

  // ── ViewBox ──
  if (hasViewBox) {
    factors.push({ label: 'ViewBox definido', impact: 10, positive: true });
    score += 10;
  }

  // ── Physical units ──
  if (hasPhysicalUnits) {
    factors.push({ label: 'Unidades físicas en archivo', impact: 10, positive: true });
    score += 10;
  }

  // ── Image quality (for raster sources) ──
  if (imageQuality !== null) {
    if (imageQuality >= 80) {
      factors.push({ label: 'Alta calidad de imagen', impact: 10, positive: true });
      score += 10;
    } else if (imageQuality >= 50) {
      factors.push({ label: 'Calidad de imagen media', impact: 0, positive: true });
    } else {
      factors.push({ label: 'Baja calidad de imagen', impact: -10, positive: false });
      score -= 10;
    }
  }

  // ── Perspective correction ──
  if (hasPerspectiveCorrection) {
    factors.push({ label: 'Perspectiva corregida', impact: 5, positive: true });
    score += 5;
  }

  const percentage = Math.max(0, Math.min(100, score));
  let level = ConfidenceLevel.LOW;
  if (percentage >= 70) level = ConfidenceLevel.HIGH;
  else if (percentage >= 40) level = ConfidenceLevel.MEDIUM;

  return { percentage, level, factors };
}
