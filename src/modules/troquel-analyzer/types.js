/**
 * TroquelMaster — Troquel Analyzer Type Definitions
 * 
 * Central type/constant definitions for the entire analyzer module.
 * All enums, shapes, and defaults live here.
 */

// ─── Enums ─────────────────────────────────────────────────────

/** Types of traces that can be detected in a die-cut design */
export const TraceType = Object.freeze({
  CUT: 'CUT',
  FOLD: 'FOLD',
  PERFORATION: 'PERFORATION',
  AUXILIARY: 'AUXILIARY',
});

/** Sources from which scale can be determined */
export const ScaleSource = Object.freeze({
  SVG_METADATA: 'SVG_METADATA',
  PDF_METADATA: 'PDF_METADATA',
  KNOWN_DIMENSION: 'KNOWN_DIMENSION',
  MANUAL_CALIBRATION: 'MANUAL_CALIBRATION',
  PHYSICAL_REFERENCE: 'PHYSICAL_REFERENCE',
  NONE: 'NONE',
});

/** Confidence levels for analysis results */
export const ConfidenceLevel = Object.freeze({
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
});

/** Viewer display modes */
export const ViewMode = Object.freeze({
  ORIGINAL: 'ORIGINAL',
  ANALYZED: 'ANALYZED',
  OVERLAY: 'OVERLAY',
});

/** Interactive tools available in the viewer */
export const AnalysisTool = Object.freeze({
  SELECT: 'SELECT',
  PAN: 'PAN',
  ZOOM: 'ZOOM',
  MEASURE: 'MEASURE',
  CALIBRATE: 'CALIBRATE',
  PERSPECTIVE: 'PERSPECTIVE',
});

/** Supported file types for analysis */
export const FileType = Object.freeze({
  SVG: 'SVG',
  PDF: 'PDF',
  PNG: 'PNG',
  JPG: 'JPG',
  PHOTO: 'PHOTO',
  UNKNOWN: 'UNKNOWN',
});

/** Analysis processing stages */
export const AnalysisStage = Object.freeze({
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  PARSING: 'PARSING',
  DETECTING_TRACES: 'DETECTING_TRACES',
  CALIBRATING: 'CALIBRATING',
  CALCULATING: 'CALCULATING',
  COMPLETE: 'COMPLETE',
  ERROR: 'ERROR',
});

// ─── Defaults ──────────────────────────────────────────────────

/** Default rates for quotation (S/. per cm) */
export const DEFAULT_RATES = Object.freeze({
  [TraceType.CUT]: 0.80,
  [TraceType.FOLD]: 0.50,
  [TraceType.PERFORATION]: 0.60,
});

/** Default extras for quotation */
export const DEFAULT_EXTRAS = [
  { id: 'wood_base', name: 'Base de Madera (15mm)', price: 45.00, enabled: true },
  { id: 'rubber', name: 'Gomas Expulsoras', price: 25.00, enabled: true },
  { id: 'design', name: 'Diseño / Ajustes CAD', price: 30.00, enabled: false },
];

/** Colors for each trace type */
export const TRACE_COLORS = Object.freeze({
  [TraceType.CUT]: '#ef4444',
  [TraceType.FOLD]: '#3b82f6',
  [TraceType.PERFORATION]: '#22c55e',
  [TraceType.AUXILIARY]: '#64748b',
});

/** Labels for trace types */
export const TRACE_LABELS = Object.freeze({
  [TraceType.CUT]: 'Corte',
  [TraceType.FOLD]: 'Doblez',
  [TraceType.PERFORATION]: 'Perforación',
  [TraceType.AUXILIARY]: 'Auxiliar',
});

/** Labels for analysis stages */
export const STAGE_LABELS = Object.freeze({
  [AnalysisStage.IDLE]: 'Esperando archivo',
  [AnalysisStage.LOADING]: 'Cargando archivo',
  [AnalysisStage.PARSING]: 'Procesando',
  [AnalysisStage.DETECTING_TRACES]: 'Detectando trazos',
  [AnalysisStage.CALIBRATING]: 'Calibrando escala',
  [AnalysisStage.CALCULATING]: 'Calculando longitudes',
  [AnalysisStage.COMPLETE]: 'Análisis completo',
  [AnalysisStage.ERROR]: 'Error en análisis',
});

// ─── Factory Functions ─────────────────────────────────────────

/**
 * Creates a new Trace object
 * @param {object} params
 * @returns {Trace}
 */
export function createTrace({
  id,
  type = TraceType.CUT,
  lengthPx = 0,
  lengthMm = null,
  points = [],
  pathData = '',
  svgElement = null,
  color = null,
  strokeStyle = 'solid',
  included = true,
  label = '',
}) {
  return {
    id,
    type,
    lengthPx,
    lengthMm,
    points,
    pathData,
    svgElement,
    color: color || TRACE_COLORS[type],
    strokeStyle,
    included,
    label: label || `Trazo #${String(id).padStart(2, '0')}`,
  };
}

/**
 * Creates an empty TroquelAnalysisResult
 * @returns {TroquelAnalysisResult}
 */
export function createEmptyResult() {
  return {
    fileType: FileType.UNKNOWN,
    fileName: '',
    fileSize: 0,
    analyzedAt: null,

    // Dimensions
    dimensions: { width: 0, height: 0 },
    units: 'px',
    viewBox: null,

    // Scale
    scale: null, // px per mm
    scaleSource: ScaleSource.NONE,

    // Traces by type
    traces: [],

    // Aggregated lengths (in mm, null if no scale)
    cutLengthMm: null,
    foldLengthMm: null,
    perforationLengthMm: null,
    totalLengthMm: null,

    // Lengths in px (always available)
    cutLengthPx: 0,
    foldLengthPx: 0,
    perforationLengthPx: 0,
    totalLengthPx: 0,

    // Manual overrides
    manualCutLengthMm: null,
    useManualLength: false,

    // Confidence
    confidence: {
      percentage: 0,
      level: ConfidenceLevel.LOW,
      factors: [],
    },

    // Warnings
    warnings: [],

    // SVG content for rendering
    svgContent: null,
    originalContent: null,
  };
}
