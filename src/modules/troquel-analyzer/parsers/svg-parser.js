/**
 * TroquelMaster — SVG Parser
 * 
 * Parses SVG files to extract geometric elements, resolve transforms,
 * calculate lengths, and produce a TroquelAnalysisResult.
 */

import {
  TraceType, ScaleSource, ConfidenceLevel, FileType,
  createTrace, createEmptyResult, TRACE_COLORS,
} from '../types.js';

import {
  calculatePathLength,
  lineLength,
  polylineLength,
  polygonPerimeter,
  circleCircumference,
  ellipseCircumference,
  rectPerimeter,
  parseTransformAttribute,
  multiplyMatrices,
  getTransformScale,
} from '../utils/geometry.js';


// ─── Unit Conversion ───────────────────────────────────────────

/** Convert SVG units to millimeters. Standard CSS/SVG: 1in = 96px, 1in = 25.4mm */
const UNIT_TO_MM = {
  'mm': 1,
  'cm': 10,
  'm': 1000,
  'in': 25.4,
  'pt': 25.4 / 72,
  'pc': 25.4 / 6,
  'px': 25.4 / 96,
  '': 25.4 / 96, // default px
};

/**
 * Parse a dimension string like "200mm" or "500" into { value, unit }
 */
function parseDimension(str) {
  if (!str) return null;
  str = String(str).trim();
  const match = str.match(/^(-?[\d.]+(?:e[+-]?\d+)?)\s*(mm|cm|m|in|pt|pc|px|%)?$/i);
  if (!match) return null;
  return { value: parseFloat(match[1]), unit: (match[2] || 'px').toLowerCase() };
}


// ─── SVG Document Parsing ──────────────────────────────────────

/**
 * Parse SVG string and extract metadata (viewBox, dimensions, units)
 */
export function parseSVGMetadata(svgString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  
  if (!svg) {
    throw new Error('No se encontró elemento <svg> en el archivo');
  }

  const widthAttr = svg.getAttribute('width');
  const heightAttr = svg.getAttribute('height');
  const viewBoxAttr = svg.getAttribute('viewBox');

  const width = parseDimension(widthAttr);
  const height = parseDimension(heightAttr);

  let viewBox = null;
  if (viewBoxAttr) {
    const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4) {
      viewBox = { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] };
    }
  }

  return { svg, doc, width, height, viewBox, widthAttr, heightAttr };
}

/**
 * Determine the scale factor (SVG user units → mm) from SVG metadata
 * Returns { pxPerMm, source } or null if scale cannot be determined
 */
export function determineSVGScale(metadata) {
  const { width, height, viewBox } = metadata;

  // Case 1: Width/height have physical units (mm, cm, in)
  if (width && height && width.unit !== 'px' && width.unit !== '%' && UNIT_TO_MM[width.unit]) {
    const physicalWidthMm = width.value * UNIT_TO_MM[width.unit];
    
    if (viewBox) {
      // viewBox defines the coordinate space, width defines the physical size
      const pxPerMm = viewBox.width / physicalWidthMm;
      return { pxPerMm, source: ScaleSource.SVG_METADATA };
    } else {
      // No viewBox — the coordinate system IS the physical dimensions
      // 1 user unit = 1 unit of the specified measurement
      const pxPerMm = 1 / UNIT_TO_MM[width.unit];
      return { pxPerMm, source: ScaleSource.SVG_METADATA };
    }
  }

  // Case 2: Width/height in px + viewBox — we know the mapping but not physical size
  // We can still use the px → mm conversion (96 DPI standard)
  if (width && viewBox) {
    const widthPx = width.value; // already in px
    const pxPerMm = viewBox.width / (widthPx * UNIT_TO_MM['px']);
    return { pxPerMm, source: ScaleSource.SVG_METADATA };
  }

  // Case 3: Only viewBox, no width/height — assume px units at 96 DPI
  if (viewBox) {
    return { pxPerMm: 1 / UNIT_TO_MM['px'], source: ScaleSource.SVG_METADATA };
  }

  // Cannot determine scale
  return null;
}


// ─── Element Extraction ────────────────────────────────────────

/** SVG element types we process */
const ELEMENT_SELECTORS = [
  'path', 'line', 'polyline', 'polygon', 'rect', 'circle', 'ellipse',
];

/**
 * Accumulate transformation matrices from an element up to the SVG root
 */
function accumulateTransforms(element) {
  const transforms = [];
  let el = element;
  
  while (el && el.tagName !== 'svg') {
    const t = el.getAttribute('transform');
    if (t) {
      const matrix = parseTransformAttribute(t);
      if (matrix) transforms.unshift(matrix);
    }
    el = el.parentElement;
  }
  
  if (transforms.length === 0) return null;
  
  let result = transforms[0];
  for (let i = 1; i < transforms.length; i++) {
    result = multiplyMatrices(result, transforms[i]);
  }
  
  return result;
}

/**
 * Parse points attribute from polyline/polygon
 */
function parsePoints(pointsStr) {
  if (!pointsStr) return [];
  const nums = pointsStr.trim().split(/[\s,]+/).map(Number);
  const points = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    points.push({ x: nums[i], y: nums[i + 1] });
  }
  return points;
}

/**
 * Attempt to guess the trace type from element visual properties
 */
function guessTraceType(element) {
  const strokeDasharray = element.getAttribute('stroke-dasharray');
  const style = element.getAttribute('style') || '';
  
  // Check for dash patterns (often used for fold/score lines)
  if (strokeDasharray && strokeDasharray !== 'none') {
    const dashes = strokeDasharray.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    if (dashes.length > 0) {
      // Short dashes typically = perforation, longer = fold
      const avgDash = dashes.reduce((a, b) => a + b, 0) / dashes.length;
      if (avgDash < 3) return TraceType.PERFORATION;
      return TraceType.FOLD;
    }
  }
  
  // Check style attribute for dash patterns
  if (style.includes('stroke-dasharray')) {
    return TraceType.FOLD;
  }
  
  // Check stroke color conventions
  const stroke = (element.getAttribute('stroke') || '').toLowerCase();
  if (stroke.includes('blue') || stroke === '#0000ff' || stroke === '#3b82f6') {
    return TraceType.FOLD;
  }
  if (stroke.includes('green') || stroke === '#00ff00' || stroke === '#22c55e') {
    return TraceType.PERFORATION;
  }
  if (stroke.includes('gray') || stroke.includes('grey') || stroke === '#808080' || stroke === '#cccccc') {
    return TraceType.AUXILIARY;
  }
  
  // Default to cut
  return TraceType.CUT;
}

/**
 * Calculate the length of an SVG element in user units
 */
function calculateElementLength(element) {
  const tag = element.tagName.toLowerCase();
  
  switch (tag) {
    case 'path': {
      const d = element.getAttribute('d');
      return calculatePathLength(d);
    }
    
    case 'line': {
      const x1 = parseFloat(element.getAttribute('x1')) || 0;
      const y1 = parseFloat(element.getAttribute('y1')) || 0;
      const x2 = parseFloat(element.getAttribute('x2')) || 0;
      const y2 = parseFloat(element.getAttribute('y2')) || 0;
      return lineLength(x1, y1, x2, y2);
    }
    
    case 'polyline': {
      const points = parsePoints(element.getAttribute('points'));
      return polylineLength(points);
    }
    
    case 'polygon': {
      const points = parsePoints(element.getAttribute('points'));
      return polygonPerimeter(points);
    }
    
    case 'rect': {
      const w = parseFloat(element.getAttribute('width')) || 0;
      const h = parseFloat(element.getAttribute('height')) || 0;
      const rx = parseFloat(element.getAttribute('rx')) || 0;
      const ry = parseFloat(element.getAttribute('ry')) || rx;
      return rectPerimeter(w, h, rx, ry);
    }
    
    case 'circle': {
      const r = parseFloat(element.getAttribute('r')) || 0;
      return circleCircumference(r);
    }
    
    case 'ellipse': {
      const rx = parseFloat(element.getAttribute('rx')) || 0;
      const ry = parseFloat(element.getAttribute('ry')) || 0;
      return ellipseCircumference(rx, ry);
    }
    
    default:
      return 0;
  }
}

/**
 * Convert an SVG element to a path 'd' string for rendering in the viewer
 */
function elementToPathD(element) {
  const tag = element.tagName.toLowerCase();
  
  switch (tag) {
    case 'path':
      return element.getAttribute('d') || '';
    
    case 'line': {
      const x1 = element.getAttribute('x1') || 0;
      const y1 = element.getAttribute('y1') || 0;
      const x2 = element.getAttribute('x2') || 0;
      const y2 = element.getAttribute('y2') || 0;
      return `M${x1},${y1} L${x2},${y2}`;
    }
    
    case 'polyline': {
      const pts = element.getAttribute('points') || '';
      const points = parsePoints(pts);
      if (points.length === 0) return '';
      return `M${points[0].x},${points[0].y} ` + points.slice(1).map(p => `L${p.x},${p.y}`).join(' ');
    }
    
    case 'polygon': {
      const pts = element.getAttribute('points') || '';
      const points = parsePoints(pts);
      if (points.length === 0) return '';
      return `M${points[0].x},${points[0].y} ` + points.slice(1).map(p => `L${p.x},${p.y}`).join(' ') + ' Z';
    }
    
    case 'rect': {
      const x = parseFloat(element.getAttribute('x')) || 0;
      const y = parseFloat(element.getAttribute('y')) || 0;
      const w = parseFloat(element.getAttribute('width')) || 0;
      const h = parseFloat(element.getAttribute('height')) || 0;
      const rx = parseFloat(element.getAttribute('rx')) || 0;
      const ry = parseFloat(element.getAttribute('ry')) || rx;
      
      if (rx === 0 && ry === 0) {
        return `M${x},${y} L${x + w},${y} L${x + w},${y + h} L${x},${y + h} Z`;
      }
      // Rounded rect
      return `M${x + rx},${y} L${x + w - rx},${y} A${rx},${ry} 0 0 1 ${x + w},${y + ry} L${x + w},${y + h - ry} A${rx},${ry} 0 0 1 ${x + w - rx},${y + h} L${x + rx},${y + h} A${rx},${ry} 0 0 1 ${x},${y + h - ry} L${x},${y + ry} A${rx},${ry} 0 0 1 ${x + rx},${y} Z`;
    }
    
    case 'circle': {
      const cx = parseFloat(element.getAttribute('cx')) || 0;
      const cy = parseFloat(element.getAttribute('cy')) || 0;
      const r = parseFloat(element.getAttribute('r')) || 0;
      return `M${cx - r},${cy} A${r},${r} 0 1 1 ${cx + r},${cy} A${r},${r} 0 1 1 ${cx - r},${cy} Z`;
    }
    
    case 'ellipse': {
      const cx = parseFloat(element.getAttribute('cx')) || 0;
      const cy = parseFloat(element.getAttribute('cy')) || 0;
      const rx = parseFloat(element.getAttribute('rx')) || 0;
      const ry = parseFloat(element.getAttribute('ry')) || 0;
      return `M${cx - rx},${cy} A${rx},${ry} 0 1 1 ${cx + rx},${cy} A${rx},${ry} 0 1 1 ${cx - rx},${cy} Z`;
    }
    
    default:
      return '';
  }
}


// ─── Main Analysis ─────────────────────────────────────────────

/**
 * Full SVG analysis pipeline:
 * 1. Parse SVG document
 * 2. Extract metadata (viewBox, dimensions, units)
 * 3. Determine scale
 * 4. Extract all geometric elements
 * 5. Resolve transforms
 * 6. Calculate lengths
 * 7. Classify traces
 * 8. Aggregate results
 * 
 * @param {string} svgString - Raw SVG file content
 * @param {string} fileName - Original file name
 * @param {number} fileSize - File size in bytes
 * @returns {TroquelAnalysisResult}
 */
export function analyzeSVG(svgString, fileName = '', fileSize = 0) {
  const result = createEmptyResult();
  result.fileType = FileType.SVG;
  result.fileName = fileName;
  result.fileSize = fileSize;
  result.analyzedAt = new Date().toISOString();
  result.svgContent = svgString;
  result.originalContent = svgString;

  try {
    // 1. Parse SVG
    const metadata = parseSVGMetadata(svgString);
    const { svg, viewBox } = metadata;

    // 2. Set dimensions
    if (viewBox) {
      result.viewBox = viewBox;
      result.dimensions = { width: viewBox.width, height: viewBox.height };
    } else if (metadata.width && metadata.height) {
      result.dimensions = { width: metadata.width.value, height: metadata.height.value };
    }

    // 3. Determine scale
    const scaleInfo = determineSVGScale(metadata);
    if (scaleInfo) {
      result.scale = scaleInfo.pxPerMm;
      result.scaleSource = scaleInfo.source;
      result.units = metadata.width?.unit || 'px';
    }

    // 4. Extract elements
    const elements = [];
    for (const selector of ELEMENT_SELECTORS) {
      svg.querySelectorAll(selector).forEach(el => {
        // Skip elements with no visual stroke
        const stroke = el.getAttribute('stroke') || '';
        const style = el.getAttribute('style') || '';
        const hasStroke = stroke && stroke !== 'none';
        const hasStyleStroke = style.includes('stroke') && !style.includes('stroke:none') && !style.includes('stroke: none');
        const hasFill = el.getAttribute('fill') && el.getAttribute('fill') !== 'none';
        
        // Include element if it has a stroke or is a shape with fill
        if (hasStroke || hasStyleStroke || hasFill || (!stroke && !el.hasAttribute('fill'))) {
          elements.push(el);
        }
      });
    }

    // 5. Convert to traces
    let traceId = 1;
    for (const el of elements) {
      const transform = accumulateTransforms(el);
      const scaleFactor = transform ? getTransformScale(transform) : 1;
      const rawLength = calculateElementLength(el);
      const lengthPx = rawLength * scaleFactor;

      // Skip zero-length elements
      if (lengthPx < 0.01) continue;

      const type = guessTraceType(el);
      const pathData = elementToPathD(el);
      const transformAttr = transform ? `matrix(${transform.join(',')})` : '';

      const trace = createTrace({
        id: traceId++,
        type,
        lengthPx,
        lengthMm: result.scale ? lengthPx / result.scale : null,
        pathData,
        svgElement: el.tagName.toLowerCase(),
        color: null, // will use default from type
        strokeStyle: el.getAttribute('stroke-dasharray') ? 'dashed' : 'solid',
        included: type !== TraceType.AUXILIARY,
      });

      // Store transform for rendering
      trace.transform = transformAttr;

      result.traces.push(trace);
    }

    // 6. Aggregate lengths
    aggregateLengths(result);

    // 7. Calculate confidence
    result.confidence = calculateSVGConfidence(result, metadata);

    // 8. Add warnings
    if (result.scaleSource === ScaleSource.NONE) {
      result.warnings.push('No se pudo determinar la escala física. Las medidas están en unidades SVG (px).');
    }
    if (result.traces.length === 0) {
      result.warnings.push('No se detectaron trazos geométricos en el archivo SVG.');
    }

  } catch (error) {
    result.warnings.push(`Error durante el análisis: ${error.message}`);
  }

  return result;
}

/**
 * Aggregate trace lengths by type into the result
 */
export function aggregateLengths(result) {
  let cutPx = 0, foldPx = 0, perfPx = 0;

  for (const trace of result.traces) {
    if (!trace.included) continue;
    
    switch (trace.type) {
      case TraceType.CUT: cutPx += trace.lengthPx; break;
      case TraceType.FOLD: foldPx += trace.lengthPx; break;
      case TraceType.PERFORATION: perfPx += trace.lengthPx; break;
    }
  }

  result.cutLengthPx = cutPx;
  result.foldLengthPx = foldPx;
  result.perforationLengthPx = perfPx;
  result.totalLengthPx = cutPx + foldPx + perfPx;

  if (result.scale) {
    result.cutLengthMm = cutPx / result.scale;
    result.foldLengthMm = foldPx / result.scale;
    result.perforationLengthMm = perfPx / result.scale;
    result.totalLengthMm = (cutPx + foldPx + perfPx) / result.scale;

    // Update individual traces
    for (const trace of result.traces) {
      trace.lengthMm = trace.lengthPx / result.scale;
    }
  }
}

/**
 * Calculate confidence for SVG analysis
 */
function calculateSVGConfidence(result, metadata) {
  const factors = [];
  let score = 0;

  // Source is vector = high base
  factors.push({ label: 'Fuente vectorial (SVG)', impact: 30 });
  score += 30;

  // Scale determination
  if (result.scaleSource !== ScaleSource.NONE) {
    factors.push({ label: 'Escala determinada automáticamente', impact: 30 });
    score += 30;
  } else {
    factors.push({ label: 'Escala no determinada', impact: -20 });
    score -= 20;
  }

  // Has traces
  if (result.traces.length > 0) {
    factors.push({ label: `${result.traces.length} trazos detectados`, impact: 20 });
    score += 20;
  }

  // Has viewBox
  if (metadata.viewBox) {
    factors.push({ label: 'ViewBox definido', impact: 10 });
    score += 10;
  }

  // Explicit units
  if (metadata.width && metadata.width.unit !== 'px') {
    factors.push({ label: `Unidades físicas (${metadata.width.unit})`, impact: 10 });
    score += 10;
  }

  const percentage = Math.max(0, Math.min(100, score));
  let level = ConfidenceLevel.LOW;
  if (percentage >= 70) level = ConfidenceLevel.HIGH;
  else if (percentage >= 40) level = ConfidenceLevel.MEDIUM;

  return { percentage, level, factors };
}
