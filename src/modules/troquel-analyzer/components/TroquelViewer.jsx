/**
 * TroquelMaster — TroquelViewer Component
 * 
 * Interactive SVG/image viewer with zoom, pan, trace overlay,
 * grid, rulers, and measurement tools.
 */

import { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ViewMode, AnalysisTool, TRACE_COLORS, TraceType } from '../types.js';

const GRID_SIZE = 20;

export default function TroquelViewer({
  result,
  viewer,
  onTraceClick,
  measureState,
  onMeasureClick,
  scaleState,
  onCalibrationClick,
}) {
  const containerRef = useRef(null);
  const {
    zoom, pan, viewMode, activeTool, selectedTraceId,
    showGrid, handleWheel, handlePointerDown, handlePointerMove, handlePointerUp,
  } = viewer;

  // Parse SVG content for display
  const svgContent = useMemo(() => {
    if (!result?.svgContent) return null;
    return result.svgContent;
  }, [result?.svgContent]);

  // Determine viewBox
  const viewBox = useMemo(() => {
    if (result?.viewBox) {
      return `${result.viewBox.minX} ${result.viewBox.minY} ${result.viewBox.width} ${result.viewBox.height}`;
    }
    if (result?.dimensions) {
      return `0 0 ${result.dimensions.width} ${result.dimensions.height}`;
    }
    return '0 0 400 300';
  }, [result]);

  const dims = useMemo(() => {
    if (result?.viewBox) return { w: result.viewBox.width, h: result.viewBox.height };
    if (result?.dimensions) return { w: result.dimensions.width, h: result.dimensions.height };
    return { w: 400, h: 300 };
  }, [result]);

  // Handle click on viewer for measure/calibrate tools
  const handleViewerClick = (e) => {
    if (activeTool === AnalysisTool.MEASURE && measureState?.isActive) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Convert screen coordinates to SVG coordinates
      const svgX = ((e.clientX - rect.left - rect.width / 2 - pan.x) / zoom + dims.w / 2);
      const svgY = ((e.clientY - rect.top - rect.height / 2 - pan.y) / zoom + dims.h / 2);
      onMeasureClick?.({ x: svgX, y: svgY });
    }
    if (activeTool === AnalysisTool.CALIBRATE && scaleState?.isCalibrating) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const svgX = ((e.clientX - rect.left - rect.width / 2 - pan.x) / zoom + dims.w / 2);
      const svgY = ((e.clientY - rect.top - rect.height / 2 - pan.y) / zoom + dims.h / 2);
      onCalibrationClick?.({ x: svgX, y: svgY });
    }
  };

  const cursorStyle = activeTool === AnalysisTool.PAN ? 'grab' :
    activeTool === AnalysisTool.MEASURE || activeTool === AnalysisTool.CALIBRATE ? 'crosshair' :
    activeTool === AnalysisTool.ZOOM ? 'zoom-in' : 'default';

  return (
    <div
      ref={containerRef}
      className={showGrid ? 'viewer-grid' : ''}
      style={{
        flex: 1, backgroundColor: 'var(--surface-container-lowest)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        borderRadius: '0 0 12px 12px', cursor: cursorStyle,
        touchAction: 'none',
      }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleViewerClick}
    >
      {/* SVG Canvas */}
      {result && (
        <div style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'none',
        }}>
          <svg
            viewBox={viewBox}
            width={Math.min(dims.w, 800)}
            height={Math.min(dims.h, 600)}
            style={{
              maxWidth: '100%',
              filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.03))',
            }}
          >
            {/* ORIGINAL mode: render original SVG */}
            {(viewMode === ViewMode.ORIGINAL || viewMode === ViewMode.OVERLAY) && svgContent && (
              <g
                opacity={viewMode === ViewMode.OVERLAY ? 0.3 : 1}
                dangerouslySetInnerHTML={{
                  __html: extractSVGInnerContent(svgContent)
                }}
              />
            )}

            {/* ANALYZED / OVERLAY mode: render detected traces */}
            {(viewMode === ViewMode.ANALYZED || viewMode === ViewMode.OVERLAY) && result.traces && (
              <g>
                {result.traces.map(trace => {
                  const isSelected = trace.id === selectedTraceId;
                  const color = TRACE_COLORS[trace.type] || TRACE_COLORS[TraceType.CUT];
                  const opacity = trace.included ? 1 : 0.25;

                  return (
                    <g key={trace.id}>
                      {/* Hit area (wider invisible stroke for easier clicking) */}
                      <path
                        d={trace.pathData}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={12 / zoom}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); onTraceClick?.(trace.id); }}
                        transform={trace.transform || undefined}
                      />
                      {/* Glow for selected */}
                      {isSelected && (
                        <path
                          d={trace.pathData}
                          fill="none"
                          stroke={color}
                          strokeWidth={6 / zoom}
                          opacity={0.3}
                          style={{ filter: `drop-shadow(0 0 ${4 / zoom}px ${color})` }}
                          transform={trace.transform || undefined}
                        />
                      )}
                      {/* Actual trace */}
                      <path
                        d={trace.pathData}
                        fill="none"
                        stroke={color}
                        strokeWidth={(isSelected ? 3 : 2) / zoom}
                        opacity={opacity}
                        strokeDasharray={
                          trace.type === TraceType.FOLD ? `${6 / zoom} ${4 / zoom}` :
                          trace.type === TraceType.PERFORATION ? `${2 / zoom} ${3 / zoom}` :
                          'none'
                        }
                        style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                        onClick={(e) => { e.stopPropagation(); onTraceClick?.(trace.id); }}
                        transform={trace.transform || undefined}
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* Measure line */}
            {measureState?.point1 && (
              <>
                <circle
                  cx={measureState.point1.x} cy={measureState.point1.y}
                  r={4 / zoom} fill="#fbbf24" stroke="#f59e0b" strokeWidth={1 / zoom}
                />
                {measureState.point2 && (
                  <>
                    <line
                      x1={measureState.point1.x} y1={measureState.point1.y}
                      x2={measureState.point2.x} y2={measureState.point2.y}
                      stroke="#fbbf24" strokeWidth={2 / zoom}
                      strokeDasharray={`${4 / zoom} ${2 / zoom}`}
                    />
                    <circle
                      cx={measureState.point2.x} cy={measureState.point2.y}
                      r={4 / zoom} fill="#fbbf24" stroke="#f59e0b" strokeWidth={1 / zoom}
                    />
                    {/* Distance label */}
                    <text
                      x={(measureState.point1.x + measureState.point2.x) / 2}
                      y={(measureState.point1.y + measureState.point2.y) / 2 - 8 / zoom}
                      textAnchor="middle"
                      fill="#fbbf24"
                      fontSize={12 / zoom}
                      fontFamily="Inter"
                      fontWeight="700"
                    >
                      {measureState.distanceCm !== null
                        ? `${measureState.distanceCm.toFixed(2)} cm`
                        : `${measureState.distancePx?.toFixed(1)} px`
                      }
                    </text>
                  </>
                )}
              </>
            )}

            {/* Calibration points */}
            {scaleState?.calibrationPoints?.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x} cy={pt.y}
                r={5 / zoom} fill="#22c55e" stroke="#16a34a" strokeWidth={1.5 / zoom}
              />
            ))}
            {scaleState?.calibrationPoints?.length === 2 && (
              <line
                x1={scaleState.calibrationPoints[0].x} y1={scaleState.calibrationPoints[0].y}
                x2={scaleState.calibrationPoints[1].x} y2={scaleState.calibrationPoints[1].y}
                stroke="#22c55e" strokeWidth={2 / zoom}
                strokeDasharray={`${4 / zoom} ${2 / zoom}`}
              />
            )}
          </svg>
        </div>
      )}

      {/* Empty state */}
      {!result && (
        <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)', padding: 32 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 64, opacity: 0.3, marginBottom: 8, display: 'block' }}>
            qr_code_scanner
          </span>
          <p className="text-body-sm">Carga un archivo para visualizar el troquel</p>
        </div>
      )}

      {/* Legend */}
      {result && result.traces.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          backgroundColor: 'rgba(18,32,50,0.92)', backdropFilter: 'blur(8px)',
          border: '1px solid var(--outline-variant)', borderRadius: 6,
          padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {[
            { type: TraceType.CUT, label: 'Corte' },
            { type: TraceType.FOLD, label: 'Doblez' },
            { type: TraceType.PERFORATION, label: 'Perforación' },
          ].map(({ type, label }) => {
            const count = result.traces.filter(t => t.type === type && t.included).length;
            if (count === 0) return null;
            const lengthMm = result.traces
              .filter(t => t.type === type && t.included)
              .reduce((s, t) => s + (t.lengthMm || 0), 0);
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 14, height: 2, backgroundColor: TRACE_COLORS[type],
                  borderStyle: type === TraceType.FOLD ? 'dashed' : type === TraceType.PERFORATION ? 'dotted' : 'solid',
                }} />
                <span className="text-utility-mono" style={{ fontSize: 11, color: 'var(--on-surface)' }}>
                  {label}: {lengthMm > 0 ? `${(lengthMm / 10).toFixed(1)} cm` : `${count} trazos`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Zoom indicator */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        backgroundColor: 'rgba(18,32,50,0.8)',
        padding: '2px 8px', borderRadius: 4,
        fontSize: 11, fontFamily: 'Inter', fontWeight: 600,
        color: 'var(--on-surface-variant)',
      }}>
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}

/**
 * Extract inner content from an SVG string (everything inside <svg>...</svg>)
 */
function extractSVGInnerContent(svgString) {
  const match = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  return match ? match[1] : '';
}
