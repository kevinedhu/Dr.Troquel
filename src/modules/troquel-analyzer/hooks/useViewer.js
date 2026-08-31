/**
 * TroquelMaster — useViewer Hook
 * 
 * Manages interactive viewer state: zoom, pan, view modes,
 * active tools, and pointer interactions.
 */

import { useState, useCallback, useRef } from 'react';
import { ViewMode, AnalysisTool } from '../types.js';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 20;
const ZOOM_STEP = 0.15;

export function useViewer() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState(ViewMode.OVERLAY);
  const [activeTool, setActiveTool] = useState(AnalysisTool.SELECT);
  const [selectedTraceId, setSelectedTraceId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showRuler, setShowRuler] = useState(false);

  // Pointer state for pan/drag
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  const zoomIn = useCallback(() => {
    setZoom(z => Math.min(MAX_ZOOM, z * (1 + ZOOM_STEP)));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(z => Math.max(MIN_ZOOM, z * (1 - ZOOM_STEP)));
  }, []);

  const zoomToFit = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedTraceId(null);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom(z => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * (1 + delta))));
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (activeTool === AnalysisTool.PAN || e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }, [activeTool]);

  const handlePointerMove = useCallback((e) => {
    if (isPanning.current) {
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const selectTrace = useCallback((traceId) => {
    setSelectedTraceId(prev => prev === traceId ? null : traceId);
  }, []);

  const toggleGrid = useCallback(() => setShowGrid(g => !g), []);
  const toggleRuler = useCallback(() => setShowRuler(r => !r), []);

  return {
    // State
    zoom,
    pan,
    viewMode,
    activeTool,
    selectedTraceId,
    showGrid,
    showRuler,

    // Actions
    setZoom,
    zoomIn,
    zoomOut,
    zoomToFit,
    resetView,
    setViewMode,
    setActiveTool,
    selectTrace,
    setSelectedTraceId,
    toggleGrid,
    toggleRuler,

    // Event handlers
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
