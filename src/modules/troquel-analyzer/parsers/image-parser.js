/**
 * TroquelMaster — Image / Camera Parser
 * 
 * Full browser-based computer vision pipeline for troquel analysis from photos.
 * Uses Canvas API for image processing — no backend required.
 * 
 * Pipeline:
 *   1. Load image into Canvas
 *   2. Grayscale + contrast enhancement
 *   3. Gaussian blur (noise reduction)
 *   4. Sobel edge detection
 *   5. Adaptive thresholding (binarize)
 *   6. Contour tracing (connected components)
 *   7. Scale calibration
 *   8. Measurement + trace classification
 */

import {
  TraceType, ScaleSource, ConfidenceLevel, FileType,
  createTrace, createEmptyResult, TRACE_COLORS,
} from '../types.js';

// ─── Constants ─────────────────────────────────────────────────

const MAX_CANVAS_DIM = 1800; // resize large images to avoid memory issues
const EDGE_THRESHOLD = 40;   // Sobel magnitude threshold for edge detection
const MIN_CONTOUR_PX = 20;   // Minimum contour length (px) to be a valid trace

// ─── Image Loading ──────────────────────────────────────────────

/**
 * Load an image from data URL or File into a Canvas, returns { canvas, ctx, width, height }
 */
async function loadImageToCanvas(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Resize if too large
      const maxDim = Math.max(width, height);
      const scale = maxDim > MAX_CANVAS_DIM ? MAX_CANVAS_DIM / maxDim : 1;
      width = Math.round(width * scale);
      height = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve({ canvas, ctx, width, height, originalScale: scale });
    };
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const url = URL.createObjectURL(source);
      img.onload = function () {
        URL.revokeObjectURL(url);
        img.onload(this); // re-trigger
      };
      img.src = url;
    }
  });
}

/**
 * Load image from File object into canvas
 */
async function loadFileToCanvas(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = await loadImageToCanvas(e.target.result);
        resolve({ ...result, dataUrl: e.target.result });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    reader.readAsDataURL(file);
  });
}

// ─── Image Processing Pipeline ─────────────────────────────────

/**
 * Convert pixel data to grayscale (luminance formula)
 * @returns {Float32Array} grayscale values 0–255
 */
function toGrayscale(imageData) {
  const { data, width, height } = imageData;
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return gray;
}

/**
 * Apply CLAHE-like contrast enhancement (histogram stretching)
 */
function enhanceContrast(gray, width, height) {
  let min = 255, max = 0;
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] < min) min = gray[i];
    if (gray[i] > max) max = gray[i];
  }
  const range = max - min || 1;
  const enhanced = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    enhanced[i] = ((gray[i] - min) / range) * 255;
  }
  return enhanced;
}

/**
 * Apply 5×5 Gaussian blur for noise reduction
 */
function gaussianBlur(gray, width, height) {
  // 5×5 Gaussian kernel σ≈1
  const kernel = [
    2,  4,  5,  4, 2,
    4,  9, 12,  9, 4,
    5, 12, 15, 12, 5,
    4,  9, 12,  9, 4,
    2,  4,  5,  4, 2,
  ];
  const kSum = 159;
  const blurred = new Float32Array(width * height);
  const ks = 2; // kernel size offset

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let ky = -ks; ky <= ks; ky++) {
        for (let kx = -ks; kx <= ks; kx++) {
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const px = Math.min(width - 1, Math.max(0, x + kx));
          sum += gray[py * width + px] * kernel[(ky + ks) * 5 + (kx + ks)];
        }
      }
      blurred[y * width + x] = sum / kSum;
    }
  }
  return blurred;
}

/**
 * Sobel edge detection
 * Returns { magnitude, gx, gy } — magnitude 0–255
 */
function sobelEdges(gray, width, height) {
  const magnitude = new Float32Array(width * height);
  const gx = new Float32Array(width * height);
  const gy = new Float32Array(width * height);

  const Kx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const Ky = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sx = 0, sy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const v = gray[(y + ky) * width + (x + kx)];
          const ki = (ky + 1) * 3 + (kx + 1);
          sx += v * Kx[ki];
          sy += v * Ky[ki];
        }
      }
      const mag = Math.min(255, Math.sqrt(sx * sx + sy * sy));
      const idx = y * width + x;
      magnitude[idx] = mag;
      gx[idx] = sx;
      gy[idx] = sy;
    }
  }

  return { magnitude, gx, gy };
}

/**
 * Non-maximum suppression (thinning edges to 1px)
 */
function nonMaxSuppression(magnitude, gx, gy, width, height) {
  const thinned = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const mag = magnitude[idx];
      if (mag === 0) continue;

      // Determine gradient direction (quantized to 4 directions)
      const angle = Math.atan2(gy[idx], gx[idx]) * (180 / Math.PI);
      const dir = ((Math.round(angle / 45) * 45) + 180) % 180;

      let n1, n2;
      if (dir === 0 || dir === 180) {
        n1 = magnitude[idx - 1];
        n2 = magnitude[idx + 1];
      } else if (dir === 45) {
        n1 = magnitude[(y - 1) * width + (x + 1)];
        n2 = magnitude[(y + 1) * width + (x - 1)];
      } else if (dir === 90) {
        n1 = magnitude[(y - 1) * width + x];
        n2 = magnitude[(y + 1) * width + x];
      } else {
        n1 = magnitude[(y - 1) * width + (x - 1)];
        n2 = magnitude[(y + 1) * width + (x + 1)];
      }

      if (mag >= n1 && mag >= n2) {
        thinned[idx] = mag;
      }
    }
  }

  return thinned;
}

/**
 * Hysteresis thresholding (double threshold)
 * Strong edges (>highT) → keep. Weak (>lowT) → keep only if connected to strong.
 */
function hysteresisThreshold(magnitude, width, height, lowT = EDGE_THRESHOLD, highT = EDGE_THRESHOLD * 2.5) {
  const STRONG = 255;
  const WEAK = 128;
  const binary = new Uint8Array(width * height);

  // Mark strong and weak
  for (let i = 0; i < magnitude.length; i++) {
    if (magnitude[i] >= highT) binary[i] = STRONG;
    else if (magnitude[i] >= lowT) binary[i] = WEAK;
  }

  // Propagate strong to connected weak (flood fill)
  const visited = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (binary[idx] === STRONG && !visited[idx]) {
        const stack = [idx];
        while (stack.length > 0) {
          const i = stack.pop();
          visited[i] = 1;
          const ix = i % width;
          const iy = Math.floor(i / width);
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = ix + dx, ny = iy + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const ni = ny * width + nx;
                if (!visited[ni] && binary[ni] === WEAK) {
                  binary[ni] = STRONG;
                  stack.push(ni);
                }
              }
            }
          }
        }
      }
    }
  }

  // Remove weak edges not connected to strong
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === WEAK) binary[i] = 0;
  }

  return binary;
}


// ─── Contour Tracing ───────────────────────────────────────────

/**
 * Find connected edge components using flood fill.
 * Returns array of contours, each contour is an array of {x, y} points.
 */
function findContours(edgeBinary, width, height) {
  const visited = new Uint8Array(width * height);
  const contours = [];

  const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!edgeBinary[idx] || visited[idx]) continue;

      // BFS to find all connected edge pixels
      const contour = [];
      const queue = [{ x, y }];
      visited[idx] = 1;

      while (queue.length > 0) {
        const p = queue.shift();
        contour.push(p);

        for (const [dy, dx] of dirs) {
          const nx = p.x + dx, ny = p.y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const ni = ny * width + nx;
          if (!edgeBinary[ni] || visited[ni]) continue;
          visited[ni] = 1;
          queue.push({ x: nx, y: ny });
        }
      }

      if (contour.length >= MIN_CONTOUR_PX) {
        contours.push(contour);
      }
    }
  }

  return contours;
}

/**
 * Simplify a contour by sampling key points (Douglas-Peucker lite)
 * Returns a simplified array of {x, y} points for path rendering
 */
function simplifyContour(contour, tolerance = 2) {
  if (contour.length <= 2) return contour;

  // Simple stride-based sampling
  const step = Math.max(1, Math.floor(contour.length / 100));
  return contour.filter((_, i) => i % step === 0);
}

/**
 * Calculate the approximate length of a contour in pixels
 */
function contourLength(contour) {
  let len = 0;
  for (let i = 1; i < contour.length; i++) {
    len += Math.hypot(contour[i].x - contour[i-1].x, contour[i].y - contour[i-1].y);
  }
  return len;
}

/**
 * Convert contour points to SVG path 'd' string
 */
function contourToPathD(simplified) {
  if (simplified.length === 0) return '';
  const pts = simplified.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`);
  return pts.join(' ');
}

/**
 * Classify a contour as CUT, FOLD, or PERFORATION based on its properties
 * For image analysis: we use length and aspect ratio as heuristics
 */
function classifyImageContour(contour, width, height) {
  const len = contourLength(contour);

  // Calculate bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of contour) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const bboxW = maxX - minX;
  const bboxH = maxY - minY;
  const aspectRatio = bboxW > 0 && bboxH > 0 ? Math.max(bboxW, bboxH) / Math.min(bboxW, bboxH) : 1;

  // Very long straight lines → likely CUT (outer boundary or straight blade)
  if (aspectRatio > 8) return TraceType.CUT;

  // Medium complexity → FOLD
  if (len > width * 0.3) return TraceType.FOLD;

  // Short, rounded → PERFORATION or CUT
  return TraceType.CUT;
}

/**
 * Build a synthetic SVG for the viewer showing detected edges
 */
function buildEdgeSVG(traces, imagePreview, width, height) {
  const paths = traces.map(t => {
    const color = TRACE_COLORS[t.type];
    return `<path d="${t.pathData}" stroke="${color}" stroke-width="1.5" fill="none" opacity="0.85"/>`;
  }).join('\n');

  // Background: the original image
  const bg = imagePreview
    ? `<image href="${imagePreview}" x="0" y="0" width="${width}" height="${height}" opacity="0.3"/>`
    : `<rect width="${width}" height="${height}" fill="#0f172a"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${bg}
  ${paths}
</svg>`;
}


// ─── Main Analysis Function ─────────────────────────────────────

/**
 * Analyze an image (from file or camera) for troquel traces.
 * 
 * @param {string|File} source - data URL string or File object
 * @param {string} fileName
 * @param {number} fileSize
 * @param {object} options
 * @param {number|null} options.pxPerMm - Scale (pixels per mm), from calibration
 * @param {function} options.onProgress - Progress callback (stage, %)
 * @returns {Promise<TroquelAnalysisResult>}
 */
export async function analyzeImage(source, fileName = '', fileSize = 0, options = {}) {
  const { pxPerMm = null, onProgress } = options;

  const result = createEmptyResult();
  result.fileType = FileType.PHOTO;
  result.fileName = fileName;
  result.fileSize = fileSize;
  result.analyzedAt = new Date().toISOString();

  const progress = (stage, pct) => onProgress?.(stage, pct);

  try {
    // ── 1. Load image ──
    progress('Cargando imagen', 10);

    let canvas, ctx, width, height, dataUrl;

    if (typeof source === 'string') {
      // data URL
      dataUrl = source;
      const loaded = await loadImageToCanvas(source);
      canvas = loaded.canvas; ctx = loaded.ctx;
      width = loaded.width; height = loaded.height;
    } else {
      // File object
      const loaded = await loadFileToCanvas(source);
      canvas = loaded.canvas; ctx = loaded.ctx;
      width = loaded.width; height = loaded.height;
      dataUrl = loaded.dataUrl;
    }

    result.imagePreview = dataUrl;
    result.dimensions = { width, height };

    // ── 2. Get image data ──
    progress('Procesando imagen', 20);
    const imageData = ctx.getImageData(0, 0, width, height);

    // ── 3. Grayscale ──
    progress('Escala de grises', 30);
    let gray = toGrayscale(imageData);

    // ── 4. Contrast enhancement ──
    progress('Mejorando contraste', 40);
    gray = enhanceContrast(gray, width, height);

    // ── 5. Gaussian blur ──
    progress('Reduciendo ruido', 50);
    const blurred = gaussianBlur(gray, width, height);

    // ── 6. Sobel edges ──
    progress('Detectando bordes (Sobel)', 60);
    const { magnitude, gx, gy } = sobelEdges(blurred, width, height);

    // ── 7. Non-max suppression + hysteresis ──
    progress('Refinando bordes (Canny)', 70);
    const thinned = nonMaxSuppression(magnitude, gx, gy, width, height);
    const edgeBinary = hysteresisThreshold(thinned, width, height);

    // ── 8. Find contours ──
    progress('Trazando contornos', 80);
    const contours = findContours(edgeBinary, width, height);

    // ── 9. Scale setup ──
    if (pxPerMm && pxPerMm > 0) {
      result.scale = pxPerMm;
      result.scaleSource = ScaleSource.IMAGE_REFERENCE;
    } else {
      result.scaleSource = ScaleSource.NONE;
      result.warnings.push('Sin calibración de escala — las medidas están en píxeles. Use el panel de calibración.');
    }

    // ── 10. Convert contours to traces ──
    progress('Calculando longitudes', 90);
    let traceId = 1;
    for (const contour of contours) {
      const lengthPx = contourLength(contour);
      if (lengthPx < MIN_CONTOUR_PX) continue;

      const simplified = simplifyContour(contour);
      const pathData = contourToPathD(simplified);
      const type = classifyImageContour(contour, width, height);
      const lengthMm = result.scale ? lengthPx / result.scale : null;

      const trace = createTrace({
        id: traceId++,
        type,
        lengthPx,
        lengthMm,
        pathData,
        svgElement: 'path',
        strokeStyle: 'solid',
        included: type !== TraceType.AUXILIARY,
      });

      result.traces.push(trace);
    }

    // ── 11. Aggregation ──
    aggregateImageLengths(result);

    // ── 12. Blade area metrics ──
    result.bladeAreaMm2 = result.scale
      ? (width / result.scale) * (height / result.scale)
      : null;
    result.bladeCount = result.traces.filter(t => t.type === TraceType.CUT).length;
    result.complexity = determineComplexityFromTraces(result.traces);

    // ── 13. SVG for viewer ──
    result.svgContent = buildEdgeSVG(result.traces, dataUrl, width, height);

    // ── 14. Confidence ──
    result.confidence = calculateImageConfidence(result, contours.length);

    // ── Warnings ──
    if (result.traces.length === 0) {
      result.warnings.push('No se detectaron bordes claros en la imagen.');
      result.warnings.push('Asegúrese de que el troquel esté bien iluminado y en contraste con el fondo.');
    } else if (result.traces.length > 200) {
      result.warnings.push('Se detectaron muchos trazos — posible ruido en la imagen. Intente con mejor iluminación.');
    }

    progress('Completo', 100);

  } catch (error) {
    result.warnings.push(`Error al analizar la imagen: ${error.message}`);
  }

  return result;
}

/**
 * Aggregate lengths for image-based analysis
 */
function aggregateImageLengths(result) {
  let cutPx = 0, foldPx = 0, perfPx = 0;
  let cutMm = 0, foldMm = 0, perfMm = 0;

  for (const trace of result.traces) {
    if (!trace.included) continue;
    switch (trace.type) {
      case TraceType.CUT:
        cutPx += trace.lengthPx;
        cutMm += trace.lengthMm || 0;
        break;
      case TraceType.FOLD:
        foldPx += trace.lengthPx;
        foldMm += trace.lengthMm || 0;
        break;
      case TraceType.PERFORATION:
        perfPx += trace.lengthPx;
        perfMm += trace.lengthMm || 0;
        break;
    }
  }

  result.cutLengthPx = cutPx;
  result.foldLengthPx = foldPx;
  result.perforationLengthPx = perfPx;
  result.totalLengthPx = cutPx + foldPx + perfPx;

  if (result.scale) {
    result.cutLengthMm = cutMm;
    result.foldLengthMm = foldMm;
    result.perforationLengthMm = perfMm;
    result.totalLengthMm = cutMm + foldMm + perfMm;
  }
}

function determineComplexityFromTraces(traces) {
  const n = traces.length;
  if (n > 50) return 'complex';
  if (n > 15) return 'medium';
  return 'simple';
}

function calculateImageConfidence(result, totalContours) {
  let score = 0;
  const factors = [];

  // Image source = medium base (less reliable than vector)
  factors.push({ label: 'Fuente fotográfica', impact: 15 });
  score += 15;

  if (result.traces.length > 0) {
    factors.push({ label: `${result.traces.length} contornos detectados`, impact: 25 });
    score += 25;
  }

  if (result.scale) {
    factors.push({ label: 'Escala calibrada', impact: 30 });
    score += 30;
  } else {
    factors.push({ label: 'Sin calibración de escala', impact: -15 });
    score -= 15;
  }

  // Reasonable trace count (not too many = noisy)
  if (result.traces.length > 0 && result.traces.length < 150) {
    factors.push({ label: 'Cantidad de trazos razonable', impact: 15 });
    score += 15;
  }

  const percentage = Math.max(0, Math.min(100, score));
  let level = 'LOW';
  if (percentage >= 70) level = 'HIGH';
  else if (percentage >= 40) level = 'MEDIUM';

  return { percentage, level, factors };
}

/**
 * Pipeline stages enum (kept for compatibility)
 */
export const PipelineStages = Object.freeze({
  CORRECT_ILLUMINATION: 'correctIllumination',
  REDUCE_NOISE: 'reduceNoise',
  TO_GRAYSCALE: 'toGrayscale',
  ENHANCE_CONTRAST: 'enhanceContrast',
  BINARIZE: 'binarize',
  DETECT_EDGES: 'detectEdges',
  FIND_CONTOURS: 'findContours',
  SKELETONIZE: 'skeletonize',
  VECTORIZE: 'vectorize',
});

/**
 * ImageProcessingPipeline (kept for compatibility)
 */
export class ImageProcessingPipeline {
  constructor() {
    this.stages = new Map();
    this.results = new Map();
  }
  registerStage(name, handler) { this.stages.set(name, handler); }
  async execute(imageData, onProgress) {
    const stageNames = Object.values(PipelineStages);
    for (let i = 0; i < stageNames.length; i++) {
      const stageName = stageNames[i];
      const handler = this.stages.get(stageName);
      onProgress?.(stageName, ((i + 1) / stageNames.length) * 100);
      if (handler) {
        imageData = await handler(imageData);
        this.results.set(stageName, imageData);
      }
    }
    return imageData;
  }
}
