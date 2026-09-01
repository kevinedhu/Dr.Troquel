/**
 * TroquelMaster — PDF Parser (Real Implementation)
 * 
 * Extracts vector paths from PDF files using pdfjs-dist.
 * Converts PDF coordinates (points, 72 DPI) to millimeters.
 * Classifies traces as CUT, FOLD, or PERFORATION based on line properties.
 */

import * as pdfjsLib from 'pdfjs-dist';
import {
  TraceType, ScaleSource, ConfidenceLevel, FileType,
  createTrace, createEmptyResult, TRACE_COLORS,
} from '../types.js';

// ─── PDF.js Worker Setup ───────────────────────────────────────

// Use the bundled worker (Vite will handle the import)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href;

// PDF coordinate system: 1 point = 1/72 inch = 25.4/72 mm
const PT_TO_MM = 25.4 / 72;


// ─── Path Length Calculator ────────────────────────────────────

/**
 * Calculate length of a PDF path (list of segments in PDF operator format)
 */
function calcPathLength(segments) {
  let length = 0;
  let cx = 0, cy = 0;
  let startX = 0, startY = 0;

  for (const seg of segments) {
    const { op, args } = seg;

    switch (op) {
      case 'm': // moveto
        cx = args[0]; cy = args[1];
        startX = cx; startY = cy;
        break;

      case 'l': // lineto
        length += Math.hypot(args[0] - cx, args[1] - cy);
        cx = args[0]; cy = args[1];
        break;

      case 'c': // curveto (cubic bezier)
        // Approximate Bezier length by sampling 20 points
        length += approxBezierLength(cx, cy, args[0], args[1], args[2], args[3], args[4], args[5]);
        cx = args[4]; cy = args[5];
        break;

      case 'v': // curveto (first cp = current point)
        length += approxBezierLength(cx, cy, cx, cy, args[0], args[1], args[2], args[3]);
        cx = args[2]; cy = args[3];
        break;

      case 'y': // curveto (last cp = endpoint)
        length += approxBezierLength(cx, cy, args[0], args[1], args[2], args[3], args[2], args[3]);
        cx = args[2]; cy = args[3];
        break;

      case 're': // rect (x, y, w, h)
        length += 2 * (Math.abs(args[2]) + Math.abs(args[3]));
        cx = args[0]; cy = args[1];
        break;

      case 'h': // closepath
        length += Math.hypot(startX - cx, startY - cy);
        cx = startX; cy = startY;
        break;

      default:
        break;
    }
  }

  return length;
}

/**
 * Approximate cubic Bezier curve length via subdivision (20 segments)
 */
function approxBezierLength(x0, y0, x1, y1, x2, y2, x3, y3, steps = 20) {
  let length = 0;
  let prevX = x0, prevY = y0;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x = mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
    const y = mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
    length += Math.hypot(x - prevX, y - prevY);
    prevX = x; prevY = y;
  }

  return length;
}

/**
 * Convert path segments to SVG path 'd' string for viewer rendering
 */
function segmentsToPathD(segments) {
  const parts = [];
  for (const { op, args } of segments) {
    switch (op) {
      case 'm': parts.push(`M${args[0].toFixed(2)},${args[1].toFixed(2)}`); break;
      case 'l': parts.push(`L${args[0].toFixed(2)},${args[1].toFixed(2)}`); break;
      case 'c': parts.push(`C${args.map(v => v.toFixed(2)).join(',')}`); break;
      case 'v': parts.push(`C${args.map(v => v.toFixed(2)).join(',')}`); break;
      case 'y': parts.push(`C${args.map(v => v.toFixed(2)).join(',')}`); break;
      case 're': {
        const [x, y, w, h] = args;
        parts.push(`M${x.toFixed(2)},${y.toFixed(2)} L${(x+w).toFixed(2)},${y.toFixed(2)} L${(x+w).toFixed(2)},${(y+h).toFixed(2)} L${x.toFixed(2)},${(y+h).toFixed(2)} Z`);
        break;
      }
      case 'h': parts.push('Z'); break;
    }
  }
  return parts.join(' ');
}


// ─── Operator List Parsing ─────────────────────────────────────

/**
 * OPS codes from pdfjs-dist that correspond to path drawing
 * Reference: pdf.js src/core/evaluator.js
 */
const OPS = pdfjsLib.OPS;

/**
 * Extract individual path groups from a PDF page operator list.
 * Each "path group" is a moveto + sequence of draw ops + stroke/fill.
 */
function extractPathGroups(operatorList) {
  const groups = [];
  let currentPath = [];
  let currentState = { lineWidth: 1, strokeColor: [0, 0, 0], fillColor: null, dashPattern: [] };
  const stateStack = [];

  const ops = operatorList.fnArray;
  const args = operatorList.argsArray;

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    const arg = args[i];

    switch (op) {
      // Graphics state
      case OPS.save:
        stateStack.push({ ...currentState, dashPattern: [...currentState.dashPattern] });
        break;
      case OPS.restore:
        if (stateStack.length > 0) currentState = stateStack.pop();
        break;
      case OPS.setLineWidth:
        currentState.lineWidth = arg[0];
        break;
      case OPS.setDash:
        currentState.dashPattern = arg[0] || [];
        break;
      case OPS.setStrokeRGBColor:
        currentState.strokeColor = [arg[0], arg[1], arg[2]];
        break;
      case OPS.setFillRGBColor:
        currentState.fillColor = [arg[0], arg[1], arg[2]];
        break;
      case OPS.setStrokeGray:
        currentState.strokeColor = [arg[0], arg[0], arg[0]];
        break;
      case OPS.setFillGray:
        currentState.fillColor = [arg[0], arg[0], arg[0]];
        break;

      // Path construction
      case OPS.moveTo:
        if (currentPath.length > 0) {
          // Start of a new sub-path while another is open — save intermediate
        }
        currentPath.push({ op: 'm', args: [arg[0], arg[1]] });
        break;
      case OPS.lineTo:
        currentPath.push({ op: 'l', args: [arg[0], arg[1]] });
        break;
      case OPS.curveTo:
        currentPath.push({ op: 'c', args: [arg[0], arg[1], arg[2], arg[3], arg[4], arg[5]] });
        break;
      case OPS.curveTo2:
        currentPath.push({ op: 'v', args: [arg[0], arg[1], arg[2], arg[3]] });
        break;
      case OPS.curveTo3:
        currentPath.push({ op: 'y', args: [arg[0], arg[1], arg[2], arg[3]] });
        break;
      case OPS.rectangle:
        currentPath.push({ op: 're', args: [arg[0], arg[1], arg[2], arg[3]] });
        break;
      case OPS.closePath:
        currentPath.push({ op: 'h', args: [] });
        break;

      // Path painting — these terminate a path group
      case OPS.stroke:
      case OPS.fill:
      case OPS.eoFill:
      case OPS.fillStroke:
      case OPS.eoFillStroke:
        if (currentPath.length > 0) {
          groups.push({
            segments: [...currentPath],
            lineWidth: currentState.lineWidth,
            strokeColor: [...currentState.strokeColor],
            fillColor: currentState.fillColor ? [...currentState.fillColor] : null,
            dashPattern: [...currentState.dashPattern],
            painted: true,
          });
          currentPath = [];
        }
        break;

      case OPS.endPath:
        currentPath = [];
        break;
    }
  }

  return groups;
}


// ─── Trace Classification ───────────────────────────────────────

/**
 * Classify a path group as CUT, FOLD, PERFORATION, or AUXILIARY
 * based on its visual properties (line width, color, dash pattern)
 */
function classifyPathGroup(group) {
  const { lineWidth, strokeColor, dashPattern } = group;

  // Dashed lines → FOLD or PERFORATION
  if (dashPattern && dashPattern.length > 0) {
    const avgDash = dashPattern.reduce((a, b) => a + b, 0) / dashPattern.length;
    if (avgDash < 4) return TraceType.PERFORATION;
    return TraceType.FOLD;
  }

  // Color-based classification (normalized 0–1)
  const [r, g, b] = strokeColor;
  // Blue dominant → FOLD
  if (b > 0.6 && b > r + 0.2 && b > g + 0.2) return TraceType.FOLD;
  // Green dominant → PERFORATION
  if (g > 0.6 && g > r + 0.2 && g > b + 0.2) return TraceType.PERFORATION;
  // Light gray → AUXILIARY
  if (r > 0.6 && g > 0.6 && b > 0.6) return TraceType.AUXILIARY;
  // Dark / black / red → CUT
  return TraceType.CUT;
}


// ─── Main Analysis Function ────────────────────────────────────

/**
 * Analyze a PDF file and extract troquel measurement data.
 * @param {ArrayBuffer} arrayBuffer - PDF file as ArrayBuffer
 * @param {string} fileName
 * @param {number} fileSize
 * @returns {Promise<TroquelAnalysisResult>}
 */
export async function analyzePDF(arrayBuffer, fileName = '', fileSize = 0) {
  const result = createEmptyResult();
  result.fileType = FileType.PDF;
  result.fileName = fileName;
  result.fileSize = fileSize;
  result.analyzedAt = new Date().toISOString();

  try {
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const numPages = pdf.numPages;
    let allGroups = [];
    let pageWidthPt = 0, pageHeightPt = 0;

    // Process all pages (usually a troquel is 1 page)
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });

      // Store page dimensions (in PDF points)
      pageWidthPt = Math.max(pageWidthPt, viewport.width);
      pageHeightPt = Math.max(pageHeightPt, viewport.height);

      const operatorList = await page.getOperatorList();
      const groups = extractPathGroups(operatorList);
      allGroups = allGroups.concat(groups);
    }

    // ── Scale: PDF uses 72 DPI (1 point = 1/72 inch = 0.3528 mm) ──
    // So: pxPerMm = 1 / PT_TO_MM = 72/25.4 ≈ 2.8346
    result.scale = 1 / PT_TO_MM; // points per mm
    result.scaleSource = ScaleSource.PDF_METADATA;
    result.units = 'pt';
    result.dimensions = {
      width: pageWidthPt * PT_TO_MM,
      height: pageHeightPt * PT_TO_MM,
    };

    // ── Convert path groups to traces ──
    let traceId = 1;
    for (const group of allGroups) {
      const lengthPt = calcPathLength(group.segments);

      // Skip very short or invisible paths (< 1pt = ~0.35mm)
      if (lengthPt < 1) continue;

      const lengthMm = lengthPt * PT_TO_MM;
      const lengthPx = lengthPt; // In our system, pts = "px" for PDF

      const type = classifyPathGroup(group);

      // Skip auxiliary unless it has significant length
      if (type === TraceType.AUXILIARY && lengthMm < 5) continue;

      const pathData = segmentsToPathD(group.segments);

      const trace = createTrace({
        id: traceId++,
        type,
        lengthPx,
        lengthMm,
        pathData,
        svgElement: 'path',
        strokeStyle: group.dashPattern?.length > 0 ? 'dashed' : 'solid',
        included: type !== TraceType.AUXILIARY,
        lineWidth: group.lineWidth,
      });

      result.traces.push(trace);
    }

    // ── Aggregate totals ──
    aggregatePDFLengths(result);

    // ── Blade area metrics ──
    result.bladeAreaMm2 = result.dimensions.width * result.dimensions.height;
    result.bladeCount = result.traces.filter(t => t.type === TraceType.CUT).length;
    result.complexity = determineComplexity(result);

    // ── Generate SVG for viewer ──
    result.svgContent = buildViewerSVG(result, pageWidthPt, pageHeightPt);

    // ── Confidence ──
    result.confidence = calculatePDFConfidence(result, numPages);

    // ── Warnings ──
    if (result.traces.length === 0) {
      result.warnings.push('No se detectaron trazos vectoriales en el PDF. El archivo puede ser solo imagen (PDF escaneado).');
      result.warnings.push('Para mejores resultados, exporte desde Illustrator/Inkscape como SVG.');
    }
    if (numPages > 1) {
      result.warnings.push(`El PDF tiene ${numPages} páginas — se analizaron todas.`);
    }

  } catch (error) {
    result.warnings.push(`Error al procesar el PDF: ${error.message}`);
  }

  return result;
}

/**
 * Aggregate trace lengths into the result object
 */
function aggregatePDFLengths(result) {
  let cutMm = 0, foldMm = 0, perfMm = 0;
  let cutPx = 0, foldPx = 0, perfPx = 0;

  for (const trace of result.traces) {
    if (!trace.included) continue;
    switch (trace.type) {
      case TraceType.CUT:
        cutMm += trace.lengthMm || 0;
        cutPx += trace.lengthPx;
        break;
      case TraceType.FOLD:
        foldMm += trace.lengthMm || 0;
        foldPx += trace.lengthPx;
        break;
      case TraceType.PERFORATION:
        perfMm += trace.lengthMm || 0;
        perfPx += trace.lengthPx;
        break;
    }
  }

  result.cutLengthMm = cutMm;
  result.foldLengthMm = foldMm;
  result.perforationLengthMm = perfMm;
  result.totalLengthMm = cutMm + foldMm + perfMm;
  result.cutLengthPx = cutPx;
  result.foldLengthPx = foldPx;
  result.perforationLengthPx = perfPx;
  result.totalLengthPx = cutPx + foldPx + perfPx;
}

/**
 * Determine geometric complexity based on trace count and variety
 */
function determineComplexity(result) {
  const traceCount = result.traces.length;
  const hasMultipleTypes = new Set(result.traces.map(t => t.type)).size > 1;

  if (traceCount > 50 || (traceCount > 20 && hasMultipleTypes)) return 'complex';
  if (traceCount > 15 || hasMultipleTypes) return 'medium';
  return 'simple';
}

/**
 * Build an SVG string for the viewer from PDF path data
 * (Y-axis is flipped because PDF origin is bottom-left)
 */
function buildViewerSVG(result, pageWidthPt, pageHeightPt) {
  if (result.traces.length === 0) return null;

  const paths = result.traces.map(t => {
    const color = TRACE_COLORS[t.type] || '#ef4444';
    const dash = t.strokeStyle === 'dashed' ? 'stroke-dasharray="8,4"' : '';
    const w = Math.max(0.5, (t.lineWidth || 1) * 0.8);
    // Flip Y: PDF y=0 is at bottom, SVG y=0 is at top
    return `<path d="${t.pathData}" stroke="${color}" stroke-width="${w}" fill="none" ${dash} transform="scale(1,-1) translate(0,-${pageHeightPt})" opacity="0.9"/>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pageWidthPt} ${pageHeightPt}" width="${pageWidthPt}" height="${pageHeightPt}">
  <rect width="${pageWidthPt}" height="${pageHeightPt}" fill="#0f172a"/>
  ${paths}
</svg>`;
}

/**
 * Calculate confidence for PDF analysis
 */
function calculatePDFConfidence(result, numPages) {
  let score = 0;
  const factors = [];

  // Vector source = high base
  factors.push({ label: 'Fuente PDF (vectorial)', impact: 25 });
  score += 25;

  // Has traces
  if (result.traces.length > 0) {
    factors.push({ label: `${result.traces.length} trazos detectados`, impact: 30 });
    score += 30;
  } else {
    factors.push({ label: 'Sin trazos vectoriales (PDF escaneado?)', impact: -20 });
    score -= 20;
  }

  // Has scale (PDF always has it)
  factors.push({ label: 'Escala física conocida (72 DPI)', impact: 25 });
  score += 25;

  // Single page = better
  if (numPages === 1) {
    factors.push({ label: 'Una sola página', impact: 10 });
    score += 10;
  }

  // Has multiple trace types
  const types = new Set(result.traces.map(t => t.type));
  if (types.size > 1) {
    factors.push({ label: `${types.size} tipos de trazo detectados`, impact: 10 });
    score += 10;
  }

  const percentage = Math.max(0, Math.min(100, score));
  let level = 'LOW';
  if (percentage >= 70) level = 'HIGH';
  else if (percentage >= 40) level = 'MEDIUM';

  return { percentage, level, factors };
}

/**
 * Quick check: does this PDF have vector content (not just images)?
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<boolean>}
 */
export async function isPDFVectorial(arrayBuffer) {
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const opList = await page.getOperatorList();
    // Check for path construction operators
    const pathOps = [OPS.moveTo, OPS.lineTo, OPS.curveTo, OPS.rectangle];
    return opList.fnArray.some(op => pathOps.includes(op));
  } catch {
    return false;
  }
}
