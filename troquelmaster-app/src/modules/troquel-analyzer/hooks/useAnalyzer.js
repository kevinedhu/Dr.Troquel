/**
 * TroquelMaster — useAnalyzer Hook
 * 
 * Main orchestration hook for the analysis flow.
 * Manages file loading, analysis execution, trace manipulation,
 * and manual corrections.
 */

import { useState, useCallback, useRef } from 'react';
import { AnalysisStage, TraceType, createEmptyResult, TRACE_COLORS } from '../types.js';
import { getAnalysisProvider, detectFileType, readFileContent } from '../services/analysis-provider.js';
import { aggregateLengths } from '../parsers/svg-parser.js';

export function useAnalyzer() {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [result, setResult] = useState(null);
  const [stage, setStage] = useState(AnalysisStage.IDLE);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const abortRef = useRef(false);

  /**
   * Load a file and run analysis
   */
  const loadFile = useCallback(async (inputFile) => {
    if (!inputFile) return;

    abortRef.current = false;
    setError(null);
    setFile(inputFile);
    setStage(AnalysisStage.LOADING);
    setProgress(0);

    try {
      // 1. Detect type
      const type = detectFileType(inputFile);
      setFileType(type);

      if (abortRef.current) return;

      // 2. Read content
      setStage(AnalysisStage.LOADING);
      setProgress(10);
      const content = await readFileContent(inputFile, type);

      if (abortRef.current) return;

      // 3. Get provider and analyze
      const provider = getAnalysisProvider(type);
      const analysisResult = await provider.analyze(
        { content, fileName: inputFile.name, fileSize: inputFile.size },
        (s, p) => {
          if (!abortRef.current) {
            setStage(s);
            setProgress(p);
          }
        }
      );

      if (abortRef.current) return;

      setResult(analysisResult);
      setStage(AnalysisStage.COMPLETE);
      setProgress(100);
    } catch (err) {
      setError(err.message || 'Error desconocido durante el análisis');
      setStage(AnalysisStage.ERROR);
    }
  }, []);

  /**
   * Update a specific trace
   */
  const updateTrace = useCallback((traceId, updates) => {
    setResult(prev => {
      if (!prev) return prev;
      const newResult = { ...prev };
      newResult.traces = prev.traces.map(t =>
        t.id === traceId ? { ...t, ...updates } : t
      );
      aggregateLengths(newResult);
      return newResult;
    });
  }, []);

  /**
   * Toggle trace inclusion in quotation
   */
  const toggleTrace = useCallback((traceId) => {
    setResult(prev => {
      if (!prev) return prev;
      const newResult = { ...prev };
      newResult.traces = prev.traces.map(t =>
        t.id === traceId ? { ...t, included: !t.included } : t
      );
      aggregateLengths(newResult);
      return newResult;
    });
  }, []);

  /**
   * Classify a trace to a different type
   */
  const classifyTrace = useCallback((traceId, type) => {
    setResult(prev => {
      if (!prev) return prev;
      const newResult = { ...prev };
      newResult.traces = prev.traces.map(t =>
        t.id === traceId ? { ...t, type, color: TRACE_COLORS[type] } : t
      );
      aggregateLengths(newResult);
      return newResult;
    });
  }, []);

  /**
   * Remove a trace
   */
  const removeTrace = useCallback((traceId) => {
    setResult(prev => {
      if (!prev) return prev;
      const newResult = { ...prev };
      newResult.traces = prev.traces.filter(t => t.id !== traceId);
      aggregateLengths(newResult);
      return newResult;
    });
  }, []);

  /**
   * Set manual length override
   */
  const setManualLength = useCallback((valueMm) => {
    setResult(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        manualCutLengthMm: valueMm,
        useManualLength: valueMm !== null && valueMm !== undefined,
      };
    });
  }, []);

  /**
   * Toggle using manual vs automatic length
   */
  const toggleManualLength = useCallback(() => {
    setResult(prev => {
      if (!prev) return prev;
      return { ...prev, useManualLength: !prev.useManualLength };
    });
  }, []);

  /**
   * Update the scale (from calibration)
   */
  const updateScale = useCallback((pxPerMm, source) => {
    setResult(prev => {
      if (!prev) return prev;
      const newResult = { ...prev, scale: pxPerMm, scaleSource: source };
      // Recalculate all trace mm lengths
      for (const trace of newResult.traces) {
        trace.lengthMm = trace.lengthPx / pxPerMm;
      }
      aggregateLengths(newResult);
      // Remove the "no scale" warning
      newResult.warnings = newResult.warnings.filter(w => !w.includes('escala física'));
      return newResult;
    });
  }, []);

  /**
   * Reset everything
   */
  const reset = useCallback(() => {
    abortRef.current = true;
    setFile(null);
    setFileType(null);
    setResult(null);
    setStage(AnalysisStage.IDLE);
    setProgress(0);
    setError(null);
  }, []);

  return {
    // State
    file,
    fileType,
    result,
    stage,
    progress,
    error,
    isAnalyzing: stage !== AnalysisStage.IDLE && stage !== AnalysisStage.COMPLETE && stage !== AnalysisStage.ERROR,
    hasResult: result !== null && stage === AnalysisStage.COMPLETE,

    // Actions
    loadFile,
    updateTrace,
    toggleTrace,
    classifyTrace,
    removeTrace,
    setManualLength,
    toggleManualLength,
    updateScale,
    reset,
  };
}
