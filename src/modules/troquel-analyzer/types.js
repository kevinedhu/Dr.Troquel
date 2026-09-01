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

/** Two main troquel production modes */
export const TroquelMode = Object.freeze({
  /** Troquel lineal: se cobra por cm de cuchilla/pleca */
  LINEAL: 'LINEAL',
  /** Troquel con cuchillas físicas: se cobra por área de base + montaje */
  CUCHILLAS: 'CUCHILLAS',
});

/** Sources from which scale can be determined */
export const ScaleSource = Object.freeze({
  SVG_METADATA: 'SVG_METADATA',
  PDF_METADATA: 'PDF_METADATA',
  KNOWN_DIMENSION: 'KNOWN_DIMENSION',
  MANUAL_CALIBRATION: 'MANUAL_CALIBRATION',
  PHYSICAL_REFERENCE: 'PHYSICAL_REFERENCE',
  IMAGE_REFERENCE: 'IMAGE_REFERENCE',
  NONE: 'NONE',
});

/** Reference objects for image calibration */
export const CalibrationReference = Object.freeze({
  A4: 'A4',          // 210 × 297 mm
  CARTA: 'CARTA',    // 216 × 279 mm (Letter)
  A3: 'A3',          // 297 × 420 mm
  COIN_SOL: 'COIN_SOL',     // Moneda S/1 = 25.5 mm
  COIN_50: 'COIN_50',       // Moneda 50 cént = 22 mm
  RULER: 'RULER',    // Regla — usuario marca dos puntos
  CUSTOM: 'CUSTOM',  // El usuario ingresa una dimensión conocida
});

export const CALIBRATION_REFERENCE_SIZES = Object.freeze({
  [CalibrationReference.A4]:      { width: 210, height: 297 },
  [CalibrationReference.CARTA]:   { width: 216, height: 279 },
  [CalibrationReference.A3]:      { width: 297, height: 420 },
  [CalibrationReference.COIN_SOL]: { diameter: 25.5 },
  [CalibrationReference.COIN_50]: { diameter: 22 },
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

/**
 * Tarifas para TROQUEL LINEAL (S/. por cm de trazo)
 * El precio se multiplica por la longitud total de cada tipo de trazo
 */
export const DEFAULT_RATES_LINEAL = Object.freeze({
  [TraceType.CUT]: 0.80,          // S/. 0.80 por cm de cuchilla de corte
  [TraceType.FOLD]: 0.50,         // S/. 0.50 por cm de pleca de doblez
  [TraceType.PERFORATION]: 0.60,  // S/. 0.60 por cm de perforación
});

/**
 * Tarifas para TROQUEL CON CUCHILLAS (troquel físico)
 * Precio por cm² de base de madera + cuchillas individuales
 */
export const DEFAULT_RATES_CUCHILLAS = Object.freeze({
  basePerCm2: 0.35,        // S/. por cm² de base de madera (plywood)
  bladePerCm: 0.90,        // S/. por cm de cuchilla montada
  foldBladePerCm: 0.55,    // S/. por cm de pleca montada
  setupFee: 25.00,         // Costo fijo de armado/montaje
  complexitySimple: 1.0,   // Multiplicador de complejidad
  complexityMedium: 1.3,
  complexityComplex: 1.7,
});

/** Alias para compatibilidad con código existente */
export const DEFAULT_RATES = DEFAULT_RATES_LINEAL;

/** Default extras for quotation */
export const DEFAULT_EXTRAS = [
  { id: 'wood_base', name: 'Base de Madera (15mm)', price: 45.00, enabled: true },
  { id: 'rubber', name: 'Gomas Expulsoras', price: 25.00, enabled: true },
  { id: 'design', name: 'Diseño / Ajustes CAD', price: 30.00, enabled: false },
  { id: 'mounting', name: 'Montaje de Cuchillas', price: 40.00, enabled: false },
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

/** Complexity labels for CUCHILLAS mode */
export const COMPLEXITY_LABELS = Object.freeze({
  simple: 'Simple',
  medium: 'Media',
  complex: 'Compleja',
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
  lineWidth = 1,
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
    lineWidth,
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

    // Blade/die area metrics (for CUCHILLAS mode)
    bladeAreaMm2: null,       // Total bounding box area in mm²
    bladeCount: 0,            // Number of individual blade segments
    complexity: 'simple',     // 'simple' | 'medium' | 'complex'

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

    // Image preview (for camera/image analysis)
    imagePreview: null,
  };
}
