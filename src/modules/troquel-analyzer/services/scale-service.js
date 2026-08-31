/**
 * TroquelMaster — Scale Service
 * 
 * Manages scale calibration for converting between pixel/SVG units
 * and real-world measurements (mm, cm, m).
 */

import { ScaleSource } from '../types.js';

/**
 * Create a scale object
 * @param {number} pxPerMm - SVG user units per millimeter
 * @param {string} source - ScaleSource enum value
 * @returns {object}
 */
export function createScale(pxPerMm, source) {
  return {
    pxPerMm,
    mmPerPx: 1 / pxPerMm,
    source,
    timestamp: Date.now(),
  };
}

/**
 * Determine scale from SVG metadata (viewBox, width, height, units)
 * @param {object} metadata - { viewBox, width, height }
 * @returns {object|null}
 */
export function scaleFromSVGMetadata(viewBox, width, height, units) {
  // This is delegated to svg-parser.determineSVGScale
  // This function serves as the public API from the scale service
  if (!viewBox && !width) return null;
  
  const UNIT_TO_MM = {
    'mm': 1, 'cm': 10, 'm': 1000,
    'in': 25.4, 'pt': 25.4 / 72, 'pc': 25.4 / 6,
    'px': 25.4 / 96, '': 25.4 / 96,
  };
  
  if (width && units && UNIT_TO_MM[units] && units !== 'px') {
    const physicalWidthMm = width * UNIT_TO_MM[units];
    const viewBoxWidth = viewBox?.width || width;
    return createScale(viewBoxWidth / physicalWidthMm, ScaleSource.SVG_METADATA);
  }
  
  // Default 96 DPI
  return createScale(1 / UNIT_TO_MM['px'], ScaleSource.SVG_METADATA);
}

/**
 * Create scale from a known dimension
 * @param {number} pixelLength - Measured length in pixels/SVG units
 * @param {number} realLengthMm - Known real length in mm
 * @returns {object}
 */
export function scaleFromKnownDimension(pixelLength, realLengthMm) {
  if (!pixelLength || !realLengthMm || pixelLength <= 0 || realLengthMm <= 0) {
    return null;
  }
  return createScale(pixelLength / realLengthMm, ScaleSource.KNOWN_DIMENSION);
}

/**
 * Create scale from manual two-point calibration
 * @param {{ x: number, y: number }} p1 - First point
 * @param {{ x: number, y: number }} p2 - Second point
 * @param {number} realDistanceMm - Real distance between points in mm
 * @returns {object}
 */
export function scaleFromManualCalibration(p1, p2, realDistanceMm) {
  if (!p1 || !p2 || !realDistanceMm || realDistanceMm <= 0) return null;
  
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);
  
  if (pixelDistance < 0.01) return null;
  
  return createScale(pixelDistance / realDistanceMm, ScaleSource.MANUAL_CALIBRATION);
}

/**
 * Create scale from a physical reference object
 * @param {string} referenceType - 'ruler', 'a4_width', 'a4_height', 'credit_card_width', etc.
 * @param {number} pixelMeasurement - Measured size of reference in pixels
 * @returns {object}
 */
export function scaleFromPhysicalReference(referenceType, pixelMeasurement) {
  const REFERENCE_SIZES_MM = {
    'a4_width': 210,
    'a4_height': 297,
    'letter_width': 215.9,
    'letter_height': 279.4,
    'credit_card_width': 85.6,
    'credit_card_height': 53.98,
    'ruler_cm': 10, // 1 cm
    'ruler_inch': 25.4, // 1 inch
  };
  
  const realSize = REFERENCE_SIZES_MM[referenceType];
  if (!realSize || !pixelMeasurement || pixelMeasurement <= 0) return null;
  
  return createScale(pixelMeasurement / realSize, ScaleSource.PHYSICAL_REFERENCE);
}

/**
 * Convert a length from pixels to real-world units
 * @param {number} lengthPx - Length in SVG user units
 * @param {object} scale - Scale object from createScale
 * @param {string} unit - Target unit: 'mm', 'cm', 'm'
 * @returns {number}
 */
export function convertLength(lengthPx, scale, unit = 'mm') {
  if (!scale || !scale.pxPerMm) return null;
  
  const mm = lengthPx / scale.pxPerMm;
  
  switch (unit) {
    case 'mm': return mm;
    case 'cm': return mm / 10;
    case 'm': return mm / 1000;
    default: return mm;
  }
}

/**
 * Format a length with appropriate precision
 * @param {number} value - Length value
 * @param {string} unit - Unit string
 * @returns {string}
 */
export function formatLength(value, unit = 'mm') {
  if (value === null || value === undefined) return '—';
  
  switch (unit) {
    case 'mm': return `${value.toFixed(2)} mm`;
    case 'cm': return `${value.toFixed(2)} cm`;
    case 'm': return `${value.toFixed(4)} m`;
    default: return `${value.toFixed(2)} ${unit}`;
  }
}
