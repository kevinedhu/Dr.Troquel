/**
 * TroquelMaster — Geometry Engine
 * 
 * Pure mathematical functions for calculating lengths of SVG geometric elements.
 * No React or DOM dependencies — this is a pure computation module.
 */

// ─── Constants ─────────────────────────────────────────────────

const TAU = Math.PI * 2;
const GAUSS_LEGENDRE_POINTS = 24; // precision for arc length integration

// Gauss-Legendre quadrature weights and abscissae (24-point)
const GL_WEIGHTS = [];
const GL_ABSCISSAE = [];

// Precompute Gauss-Legendre points for numerical integration
(function initGaussLegendre() {
  // Using 12-point for practical balance of speed and accuracy
  const n = 12;
  const points = [
    [0.1252334085, 0.2491470458],
    [0.3678314990, 0.2334925365],
    [0.5873179543, 0.2031674267],
    [0.7699026742, 0.1600783285],
    [0.9041172564, 0.1069393260],
    [0.9815606342, 0.0471753364],
  ];
  for (const [x, w] of points) {
    GL_ABSCISSAE.push(-x, x);
    GL_WEIGHTS.push(w, w);
  }
})();


// ─── Basic Geometry ────────────────────────────────────────────

/**
 * Euclidean distance between two points
 */
export function lineLength(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Distance between two point objects {x, y}
 */
export function distanceBetweenPoints(p1, p2) {
  return lineLength(p1.x, p1.y, p2.x, p2.y);
}

/**
 * Circumference of a circle
 */
export function circleCircumference(r) {
  return TAU * Math.abs(r);
}

/**
 * Approximate circumference of an ellipse using Ramanujan's second approximation
 */
export function ellipseCircumference(rx, ry) {
  const a = Math.abs(rx);
  const b = Math.abs(ry);
  const h = ((a - b) * (a - b)) / ((a + b) * (a + b));
  return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

/**
 * Perimeter of a rectangle, accounting for rounded corners
 */
export function rectPerimeter(w, h, rx = 0, ry = 0) {
  w = Math.abs(w);
  h = Math.abs(h);
  rx = Math.min(Math.abs(rx), w / 2);
  ry = Math.min(Math.abs(ry), h / 2);
  
  if (rx === 0 && ry === 0) {
    return 2 * (w + h);
  }
  
  // Straight segments
  const straightH = 2 * (w - 2 * rx);
  const straightV = 2 * (h - 2 * ry);
  
  // Four quarter-ellipse corners
  const cornerLength = ellipseCircumference(rx, ry);
  
  return straightH + straightV + cornerLength;
}

/**
 * Perimeter of a polygon (closed shape)
 */
export function polygonPerimeter(points) {
  if (!points || points.length < 2) return 0;
  let len = 0;
  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length;
    len += lineLength(points[i].x, points[i].y, points[next].x, points[next].y);
  }
  return len;
}

/**
 * Length of a polyline (open shape — not closed)
 */
export function polylineLength(points) {
  if (!points || points.length < 2) return 0;
  let len = 0;
  for (let i = 0; i < points.length - 1; i++) {
    len += lineLength(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
  }
  return len;
}


// ─── Bézier Curves ────────────────────────────────────────────

/**
 * Point on a cubic Bézier curve at parameter t
 */
function cubicBezierPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
    y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y,
  };
}

/**
 * Derivative of cubic Bézier at parameter t
 */
function cubicBezierDerivative(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return {
    x: 3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  };
}

/**
 * Length of a cubic Bézier curve using Gauss-Legendre quadrature
 */
export function cubicBezierLength(p0, p1, p2, p3) {
  let length = 0;
  for (let i = 0; i < GL_ABSCISSAE.length; i++) {
    const t = 0.5 * (1 + GL_ABSCISSAE[i]); // map [-1,1] to [0,1]
    const d = cubicBezierDerivative(p0, p1, p2, p3, t);
    length += GL_WEIGHTS[i] * Math.sqrt(d.x * d.x + d.y * d.y);
  }
  return length * 0.5; // scale factor for [0,1] interval
}

/**
 * Point on a quadratic Bézier curve at parameter t
 */
function quadraticBezierPoint(p0, p1, p2, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

/**
 * Derivative of quadratic Bézier at parameter t
 */
function quadraticBezierDerivative(p0, p1, p2, t) {
  const mt = 1 - t;
  return {
    x: 2 * mt * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
    y: 2 * mt * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
  };
}

/**
 * Length of a quadratic Bézier curve using Gauss-Legendre quadrature
 */
export function quadraticBezierLength(p0, p1, p2) {
  let length = 0;
  for (let i = 0; i < GL_ABSCISSAE.length; i++) {
    const t = 0.5 * (1 + GL_ABSCISSAE[i]);
    const d = quadraticBezierDerivative(p0, p1, p2, t);
    length += GL_WEIGHTS[i] * Math.sqrt(d.x * d.x + d.y * d.y);
  }
  return length * 0.5;
}


// ─── SVG Arc ───────────────────────────────────────────────────

/**
 * Convert SVG arc parameters to center parameterization
 * Based on SVG spec: https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
 */
function arcEndpointToCenter(x1, y1, rx, ry, phi, fA, fS, x2, y2) {
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const dx2 = (x1 - x2) / 2;
  const dy2 = (y1 - y2) / 2;

  const x1p = cosPhi * dx2 + sinPhi * dy2;
  const y1p = -sinPhi * dx2 + cosPhi * dy2;

  // Correct radii
  let rxSq = rx * rx;
  let rySq = ry * ry;
  const x1pSq = x1p * x1p;
  const y1pSq = y1p * y1p;

  const lambda = x1pSq / rxSq + y1pSq / rySq;
  if (lambda > 1) {
    const sqrtLambda = Math.sqrt(lambda);
    rx *= sqrtLambda;
    ry *= sqrtLambda;
    rxSq = rx * rx;
    rySq = ry * ry;
  }

  let sq = Math.max(0, (rxSq * rySq - rxSq * y1pSq - rySq * x1pSq) / (rxSq * y1pSq + rySq * x1pSq));
  sq = Math.sqrt(sq) * (fA === fS ? -1 : 1);

  const cxp = sq * (rx * y1p / ry);
  const cyp = sq * -(ry * x1p / rx);

  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  const theta1 = vectorAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dTheta = vectorAngle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);

  if (!fS && dTheta > 0) dTheta -= TAU;
  if (fS && dTheta < 0) dTheta += TAU;

  return { cx, cy, rx, ry, theta1, dTheta, phi };
}

function vectorAngle(ux, uy, vx, vy) {
  const sign = ux * vy - uy * vx < 0 ? -1 : 1;
  const dot = ux * vx + uy * vy;
  const len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
  return sign * Math.acos(Math.max(-1, Math.min(1, dot / len)));
}

/**
 * Calculate the length of an SVG arc
 */
export function arcLength(x1, y1, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x2, y2) {
  if (rx === 0 || ry === 0) {
    return lineLength(x1, y1, x2, y2);
  }

  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const phi = (xAxisRotation * Math.PI) / 180;

  const { cx, cy, rx: corrRx, ry: corrRy, theta1, dTheta, phi: corrPhi } = arcEndpointToCenter(
    x1, y1, rx, ry, phi, largeArcFlag, sweepFlag, x2, y2
  );

  // Numerical integration of arc length
  const n = 64;
  let length = 0;
  for (let i = 0; i < n; i++) {
    const t1 = theta1 + (dTheta * i) / n;
    const t2 = theta1 + (dTheta * (i + 1)) / n;
    
    const cosPhi2 = Math.cos(corrPhi);
    const sinPhi2 = Math.sin(corrPhi);
    
    const x1a = cx + corrRx * Math.cos(t1) * cosPhi2 - corrRy * Math.sin(t1) * sinPhi2;
    const y1a = cy + corrRx * Math.cos(t1) * sinPhi2 + corrRy * Math.sin(t1) * cosPhi2;
    const x2a = cx + corrRx * Math.cos(t2) * cosPhi2 - corrRy * Math.sin(t2) * sinPhi2;
    const y2a = cy + corrRx * Math.cos(t2) * sinPhi2 + corrRy * Math.sin(t2) * cosPhi2;
    
    length += lineLength(x1a, y1a, x2a, y2a);
  }

  return length;
}


// ─── Transform Parsing ─────────────────────────────────────────

/**
 * Identity matrix [a, b, c, d, e, f] representing:
 * | a c e |
 * | b d f |
 * | 0 0 1 |
 */
const IDENTITY_MATRIX = [1, 0, 0, 1, 0, 0];

/**
 * Multiply two 2D transformation matrices
 */
export function multiplyMatrices(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

/**
 * Apply a transformation matrix to a point
 */
export function applyTransform(point, matrix) {
  if (!matrix || matrix === IDENTITY_MATRIX) return point;
  return {
    x: matrix[0] * point.x + matrix[2] * point.y + matrix[4],
    y: matrix[1] * point.x + matrix[3] * point.y + matrix[5],
  };
}

/**
 * Calculate the scaling factor of a transformation matrix
 * Used to adjust lengths after transformation
 */
export function getTransformScale(matrix) {
  if (!matrix) return 1;
  // Average of x and y scale factors
  const sx = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1]);
  const sy = Math.sqrt(matrix[2] * matrix[2] + matrix[3] * matrix[3]);
  return (sx + sy) / 2;
}

/**
 * Parse a single SVG transform function
 */
function parseSingleTransform(type, args) {
  const nums = args.match(/-?[\d.]+(?:e[+-]?\d+)?/gi)?.map(Number) || [];
  
  switch (type) {
    case 'matrix':
      return nums.length >= 6 ? nums.slice(0, 6) : IDENTITY_MATRIX;
    
    case 'translate': {
      const tx = nums[0] || 0;
      const ty = nums[1] || 0;
      return [1, 0, 0, 1, tx, ty];
    }
    
    case 'scale': {
      const sx = nums[0] || 1;
      const sy = nums.length > 1 ? nums[1] : sx;
      return [sx, 0, 0, sy, 0, 0];
    }
    
    case 'rotate': {
      const angle = ((nums[0] || 0) * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      if (nums.length >= 3) {
        // rotate(angle, cx, cy)
        const cx = nums[1];
        const cy = nums[2];
        return multiplyMatrices(
          multiplyMatrices([1, 0, 0, 1, cx, cy], [cos, sin, -sin, cos, 0, 0]),
          [1, 0, 0, 1, -cx, -cy]
        );
      }
      return [cos, sin, -sin, cos, 0, 0];
    }
    
    case 'skewx': {
      const angle = ((nums[0] || 0) * Math.PI) / 180;
      return [1, 0, Math.tan(angle), 1, 0, 0];
    }
    
    case 'skewy': {
      const angle = ((nums[0] || 0) * Math.PI) / 180;
      return [1, Math.tan(angle), 0, 1, 0, 0];
    }
    
    default:
      return IDENTITY_MATRIX;
  }
}

/**
 * Parse a complete SVG transform attribute string into a matrix
 * Handles chained transforms: "translate(10, 20) rotate(45) scale(2)"
 */
export function parseTransformAttribute(str) {
  if (!str || !str.trim()) return null;
  
  const regex = /(\w+)\s*\(([^)]*)\)/gi;
  let match;
  let matrix = [...IDENTITY_MATRIX];
  
  while ((match = regex.exec(str)) !== null) {
    const type = match[1].toLowerCase();
    const args = match[2];
    const m = parseSingleTransform(type, args);
    matrix = multiplyMatrices(matrix, m);
  }
  
  return matrix;
}


// ─── SVG Path Parsing ──────────────────────────────────────────

/**
 * Tokenize an SVG path 'd' attribute into commands
 * Returns array of { command, args[] }
 */
export function parsePathD(d) {
  if (!d || typeof d !== 'string') return [];

  const commands = [];
  // Match command letter followed by its numeric arguments
  const regex = /([MmZzLlHhVvCcSsQqTtAa])([^MmZzLlHhVvCcSsQqTtAa]*)/g;
  let match;

  while ((match = regex.exec(d)) !== null) {
    const cmd = match[1];
    const argsStr = match[2].trim();
    
    // Parse numbers (including negative, decimal, scientific notation)
    const nums = argsStr.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi)?.map(Number) || [];
    
    commands.push({ command: cmd, args: nums });
  }

  return commands;
}

/**
 * Calculate the total length of an SVG path from its 'd' attribute
 * Handles all SVG path commands: M, L, H, V, C, S, Q, T, A, Z (and lowercase)
 * 
 * @param {string} d - The SVG path 'd' attribute
 * @returns {number} Total path length in SVG user units
 */
export function calculatePathLength(d) {
  const commands = parsePathD(d);
  if (commands.length === 0) return 0;

  let totalLength = 0;
  let currentX = 0, currentY = 0;
  let startX = 0, startY = 0; // for Z command
  let lastControlX = 0, lastControlY = 0; // for S and T commands
  let lastCommand = '';

  for (const { command, args } of commands) {
    const isRelative = command === command.toLowerCase();
    const cmd = command.toUpperCase();

    switch (cmd) {
      case 'M': {
        // MoveTo — may have implicit LineTo args after first pair
        if (args.length >= 2) {
          if (isRelative) {
            currentX += args[0];
            currentY += args[1];
          } else {
            currentX = args[0];
            currentY = args[1];
          }
          startX = currentX;
          startY = currentY;

          // Additional pairs are implicit LineTo
          for (let i = 2; i + 1 < args.length; i += 2) {
            const x = isRelative ? currentX + args[i] : args[i];
            const y = isRelative ? currentY + args[i + 1] : args[i + 1];
            totalLength += lineLength(currentX, currentY, x, y);
            currentX = x;
            currentY = y;
          }
        }
        break;
      }

      case 'L': {
        for (let i = 0; i + 1 < args.length; i += 2) {
          const x = isRelative ? currentX + args[i] : args[i];
          const y = isRelative ? currentY + args[i + 1] : args[i + 1];
          totalLength += lineLength(currentX, currentY, x, y);
          currentX = x;
          currentY = y;
        }
        break;
      }

      case 'H': {
        for (let i = 0; i < args.length; i++) {
          const x = isRelative ? currentX + args[i] : args[i];
          totalLength += Math.abs(x - currentX);
          currentX = x;
        }
        break;
      }

      case 'V': {
        for (let i = 0; i < args.length; i++) {
          const y = isRelative ? currentY + args[i] : args[i];
          totalLength += Math.abs(y - currentY);
          currentY = y;
        }
        break;
      }

      case 'C': {
        for (let i = 0; i + 5 < args.length; i += 6) {
          const x1 = isRelative ? currentX + args[i] : args[i];
          const y1 = isRelative ? currentY + args[i + 1] : args[i + 1];
          const x2 = isRelative ? currentX + args[i + 2] : args[i + 2];
          const y2 = isRelative ? currentY + args[i + 3] : args[i + 3];
          const x = isRelative ? currentX + args[i + 4] : args[i + 4];
          const y = isRelative ? currentY + args[i + 5] : args[i + 5];

          totalLength += cubicBezierLength(
            { x: currentX, y: currentY },
            { x: x1, y: y1 },
            { x: x2, y: y2 },
            { x, y }
          );

          lastControlX = x2;
          lastControlY = y2;
          currentX = x;
          currentY = y;
        }
        break;
      }

      case 'S': {
        for (let i = 0; i + 3 < args.length; i += 4) {
          // Reflect last control point
          let x1, y1;
          if (lastCommand === 'C' || lastCommand === 'S' || lastCommand === 'c' || lastCommand === 's') {
            x1 = 2 * currentX - lastControlX;
            y1 = 2 * currentY - lastControlY;
          } else {
            x1 = currentX;
            y1 = currentY;
          }

          const x2 = isRelative ? currentX + args[i] : args[i];
          const y2 = isRelative ? currentY + args[i + 1] : args[i + 1];
          const x = isRelative ? currentX + args[i + 2] : args[i + 2];
          const y = isRelative ? currentY + args[i + 3] : args[i + 3];

          totalLength += cubicBezierLength(
            { x: currentX, y: currentY },
            { x: x1, y: y1 },
            { x: x2, y: y2 },
            { x, y }
          );

          lastControlX = x2;
          lastControlY = y2;
          currentX = x;
          currentY = y;
        }
        break;
      }

      case 'Q': {
        for (let i = 0; i + 3 < args.length; i += 4) {
          const x1 = isRelative ? currentX + args[i] : args[i];
          const y1 = isRelative ? currentY + args[i + 1] : args[i + 1];
          const x = isRelative ? currentX + args[i + 2] : args[i + 2];
          const y = isRelative ? currentY + args[i + 3] : args[i + 3];

          totalLength += quadraticBezierLength(
            { x: currentX, y: currentY },
            { x: x1, y: y1 },
            { x, y }
          );

          lastControlX = x1;
          lastControlY = y1;
          currentX = x;
          currentY = y;
        }
        break;
      }

      case 'T': {
        for (let i = 0; i + 1 < args.length; i += 2) {
          let x1, y1;
          if (lastCommand === 'Q' || lastCommand === 'T' || lastCommand === 'q' || lastCommand === 't') {
            x1 = 2 * currentX - lastControlX;
            y1 = 2 * currentY - lastControlY;
          } else {
            x1 = currentX;
            y1 = currentY;
          }

          const x = isRelative ? currentX + args[i] : args[i];
          const y = isRelative ? currentY + args[i + 1] : args[i + 1];

          totalLength += quadraticBezierLength(
            { x: currentX, y: currentY },
            { x: x1, y: y1 },
            { x, y }
          );

          lastControlX = x1;
          lastControlY = y1;
          currentX = x;
          currentY = y;
        }
        break;
      }

      case 'A': {
        for (let i = 0; i + 6 < args.length; i += 7) {
          const rx = args[i];
          const ry = args[i + 1];
          const xAxisRotation = args[i + 2];
          const largeArcFlag = args[i + 3];
          const sweepFlag = args[i + 4];
          const x = isRelative ? currentX + args[i + 5] : args[i + 5];
          const y = isRelative ? currentY + args[i + 6] : args[i + 6];

          totalLength += arcLength(currentX, currentY, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y);

          currentX = x;
          currentY = y;
        }
        break;
      }

      case 'Z': {
        totalLength += lineLength(currentX, currentY, startX, startY);
        currentX = startX;
        currentY = startY;
        break;
      }
    }

    lastCommand = command;
  }

  return totalLength;
}

/**
 * Calculate the length of a path with a transformation applied
 * Note: For non-uniform transforms, this applies the average scale factor
 */
export function calculateTransformedPathLength(d, transformMatrix) {
  const rawLength = calculatePathLength(d);
  if (!transformMatrix) return rawLength;
  
  const scale = getTransformScale(transformMatrix);
  return rawLength * scale;
}
