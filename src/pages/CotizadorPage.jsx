/**
 * TroquelMaster — Cotizador Page (Rewritten)
 * 
 * Full integration of the troquel analyzer engine.
 * Supports PDF, SVG, and camera image analysis.
 * Two quotation modes: LINEAL and CUCHILLAS.
 */

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Analyzer module
import { useAnalyzer } from '../modules/troquel-analyzer/hooks/useAnalyzer.js';
import { useViewer } from '../modules/troquel-analyzer/hooks/useViewer.js';
import { useScale } from '../modules/troquel-analyzer/hooks/useScale.js';
import { useMeasure } from '../modules/troquel-analyzer/hooks/useMeasure.js';
import { useQuotation } from '../modules/troquel-analyzer/hooks/useQuotation.js';
import {
  ViewMode, AnalysisTool, AnalysisStage, ScaleSource,
  TRACE_COLORS, TRACE_LABELS, TraceType, TroquelMode, FileType,
} from '../modules/troquel-analyzer/types.js';
import { saveAnalysis } from '../modules/troquel-analyzer/services/storage-service.js';

// Components
import FileUploader from '../modules/troquel-analyzer/components/FileUploader.jsx';
import TroquelViewer from '../modules/troquel-analyzer/components/TroquelViewer.jsx';
import TraceList from '../modules/troquel-analyzer/components/TraceList.jsx';
import LengthSummary from '../modules/troquel-analyzer/components/LengthSummary.jsx';
import ConfidenceIndicator from '../modules/troquel-analyzer/components/ConfidenceIndicator.jsx';
import ScalePanel from '../modules/troquel-analyzer/components/ScalePanel.jsx';
import QuotationPanel from '../modules/troquel-analyzer/components/QuotationPanel.jsx';
import AnalysisProgress from '../modules/troquel-analyzer/components/AnalysisProgress.jsx';
import CameraCalibration from '../modules/troquel-analyzer/components/CameraCalibration.jsx';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function CotizadorPage() {
  // ── Hooks ──
  const analyzer = useAnalyzer();
  const viewer = useViewer();
  const scaleHook = useScale();
  const measure = useMeasure(analyzer.result?.scale);
  const quotation = useQuotation(analyzer.result);

  // ── Troquel Mode (LINEAL vs CUCHILLAS) ──
  const [troquelMode, setTroquelMode] = useState(TroquelMode.LINEAL);

  // ── Camera Calibration ──
  const [showCalibration, setShowCalibration] = useState(false);
  const [imagePxPerMm, setImagePxPerMm] = useState(null);

  // Sync scale from analysis result
  useEffect(() => {
    if (analyzer.result?.scale) {
      scaleHook.setAutoScale(analyzer.result.scale, analyzer.result.scaleSource);
    }
  }, [analyzer.result?.scale, analyzer.result?.scaleSource]);

  // When image analyzed without scale, prompt calibration
  useEffect(() => {
    if (
      analyzer.hasResult &&
      analyzer.result?.scaleSource === 'NONE' &&
      [FileType.PNG, FileType.JPG, FileType.PHOTO].includes(analyzer.fileType)
    ) {
      setShowCalibration(true);
    }
  }, [analyzer.hasResult, analyzer.result?.scaleSource, analyzer.fileType]);

  // ── Handlers ──
  const handleFileSelected = useCallback((file) => {
    analyzer.loadFile(file);
    viewer.resetView();
    setImagePxPerMm(null);
  }, [analyzer, viewer]);

  const handleCalibrated = useCallback(({ pxPerMm }) => {
    setImagePxPerMm(pxPerMm);
    setShowCalibration(false);
    // Apply scale to analyzer result
    analyzer.updateScale(pxPerMm, 'IMAGE_REFERENCE');
  }, [analyzer]);

  const handleTraceClick = useCallback((traceId) => {
    viewer.selectTrace(traceId);
  }, [viewer]);

  const handleMeasureClick = useCallback((point) => {
    measure.setPoint(point);
  }, [measure]);

  const handleCalibrationClick = useCallback((point) => {
    scaleHook.addCalibrationPoint(point);
  }, [scaleHook]);

  const handleCompleteCalibration = useCallback((distanceMm) => {
    const newScale = scaleHook.completeCalibration(distanceMm);
    if (newScale) {
      analyzer.updateScale(newScale, ScaleSource.MANUAL_CALIBRATION);
    }
  }, [scaleHook, analyzer]);

  const handleSetKnownDimension = useCallback((px, mm) => {
    const newScale = scaleHook.calibrateFromDimension(px, mm);
    if (newScale) {
      analyzer.updateScale(newScale, ScaleSource.KNOWN_DIMENSION);
    }
  }, [scaleHook, analyzer]);

  const handleStartCalibration = useCallback(() => {
    scaleHook.startCalibration();
    viewer.setActiveTool(AnalysisTool.CALIBRATE);
  }, [scaleHook, viewer]);

  const handleSave = useCallback(() => {
    if (analyzer.result) {
      const id = saveAnalysis({
        ...analyzer.result,
        quotation: quotation.quotation,
      });
      if (id) {
        alert('Cotización guardada correctamente');
      }
    }
  }, [analyzer.result, quotation.quotation]);

  const handleToolChange = useCallback((tool) => {
    viewer.setActiveTool(tool);
    if (tool === AnalysisTool.MEASURE) {
      measure.startMeasure();
    } else {
      measure.stop();
    }
    if (tool !== AnalysisTool.CALIBRATE) {
      scaleHook.cancelCalibration();
    }
  }, [viewer, measure, scaleHook]);

  const handleReset = useCallback(() => {
    analyzer.reset();
    viewer.resetView();
    measure.stop();
    scaleHook.cancelCalibration();
  }, [analyzer, viewer, measure, scaleHook]);

  const hasResult = analyzer.hasResult;
  const isAnalyzing = analyzer.isAnalyzing;

  // ── VIEW MODES ──
  const viewModes = [
    { mode: ViewMode.ORIGINAL, icon: 'image', label: 'Original' },
    { mode: ViewMode.ANALYZED, icon: 'polyline', label: 'Analizado' },
    { mode: ViewMode.OVERLAY, icon: 'layers', label: 'Superposición' },
  ];

  const tools = [
    { tool: AnalysisTool.SELECT, icon: 'near_me', label: 'Seleccionar' },
    { tool: AnalysisTool.PAN, icon: 'pan_tool', label: 'Mover' },
    { tool: AnalysisTool.MEASURE, icon: 'straighten', label: 'Medir' },
    { tool: AnalysisTool.CALIBRATE, icon: 'square_foot', label: 'Calibrar' },
  ];

  return (
    <motion.div
      variants={pageVariants} initial="initial" animate="animate"
      style={{
        display: 'flex', gap: 'var(--space-gutter)',
        height: 'calc(100vh - 64px - 48px)', overflow: 'hidden',
      }}
    >
      {/* ═══ LEFT: Viewer + Upload ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-gutter)', overflow: 'hidden' }}>

        {/* Viewer Container */}
        <div className="card-level-1" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

          {/* Toolbar */}
          <div style={{
            height: 44, borderBottom: '1px solid var(--outline-variant)',
            backgroundColor: 'var(--surface-container)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 10px', flexShrink: 0, borderRadius: '12px 12px 0 0',
          }}>
            {/* Left: View modes */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {hasResult && viewModes.map(({ mode, icon, label }) => (
                <ToolButton
                  key={mode}
                  icon={icon}
                  label={label}
                  active={viewer.viewMode === mode}
                  onClick={() => viewer.setViewMode(mode)}
                />
              ))}
              {!hasResult && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>
                    qr_code_scanner
                  </span>
                  <span className="text-label-caps" style={{ color: 'var(--on-surface)', fontSize: 11 }}>
                    Visor del Troquel
                  </span>
                </div>
              )}
            </div>

            {/* Center: Tools */}
            {hasResult && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {tools.map(({ tool, icon, label }) => (
                  <ToolButton
                    key={tool}
                    icon={icon}
                    label={label}
                    active={viewer.activeTool === tool}
                    onClick={() => handleToolChange(tool)}
                  />
                ))}

                <div style={{ width: 1, height: 20, backgroundColor: 'var(--outline-variant)', margin: '0 4px' }} />

                <ToolButton
                  icon="grid_on"
                  label="Grid"
                  active={viewer.showGrid}
                  onClick={viewer.toggleGrid}
                />
              </div>
            )}

            {/* Right: Zoom controls + reset */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {hasResult && (
                <>
                  <ToolButton icon="zoom_out" onClick={viewer.zoomOut} />
                  <ToolButton icon="zoom_in" onClick={viewer.zoomIn} />
                  <ToolButton icon="center_focus_strong" label="Ajustar" onClick={viewer.zoomToFit} />
                </>
              )}
              {hasResult && (
                <>
                  <div style={{ width: 1, height: 20, backgroundColor: 'var(--outline-variant)', margin: '0 4px' }} />
                  <ToolButton icon="restart_alt" label="Nuevo" onClick={handleReset} accent />
                </>
              )}
            </div>
          </div>

          {/* Viewer Canvas */}
          <TroquelViewer
            result={analyzer.result}
            viewer={viewer}
            onTraceClick={handleTraceClick}
            measureState={measure}
            onMeasureClick={handleMeasureClick}
            scaleState={scaleHook}
            onCalibrationClick={handleCalibrationClick}
          />

          {/* Analysis Progress Overlay */}
          <AnalysisProgress
            stage={analyzer.stage}
            progress={analyzer.progress}
            isVisible={isAnalyzing}
          />

          {/* Error overlay */}
          {analyzer.stage === AnalysisStage.ERROR && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 20,
              backgroundColor: 'rgba(5,20,37,0.92)', backdropFilter: 'blur(8px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              borderRadius: 12,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--error)', marginBottom: 12 }}>
                error
              </span>
              <h3 className="text-headline-md" style={{ color: 'var(--error)', fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                Error en el análisis
              </h3>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 16, maxWidth: 300, textAlign: 'center' }}>
                {analyzer.error}
              </p>
              <button className="btn-secondary" onClick={handleReset}>
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* Measure result floating card */}
          {measure.isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                position: 'absolute', top: 56, left: 12, zIndex: 10,
                backgroundColor: 'rgba(18,32,50,0.95)', backdropFilter: 'blur(8px)',
                border: '1px solid #fbbf24', borderRadius: 6,
                padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#fbbf24' }}>
                straighten
              </span>
              <span className="text-utility-mono" style={{ color: '#fbbf24', fontWeight: 600 }}>
                {measure.distanceCm !== null
                  ? `${measure.distanceCm.toFixed(2)} cm`
                  : `${measure.distancePx?.toFixed(1)} px`
                }
              </span>
              <button
                onClick={measure.clear}
                style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', display: 'flex', padding: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
              </button>
            </motion.div>
          )}
        </div>

        {/* Bottom Panel */}
        <div style={{
          height: hasResult ? 'auto' : 192, flexShrink: 0,
          display: 'flex', gap: 'var(--space-gutter)',
          minHeight: hasResult ? 0 : 192,
          maxHeight: hasResult ? 0 : 192,
          overflow: 'hidden',
          transition: 'all 0.4s ease',
        }}>
          {!hasResult && (
            <>
              <FileUploader onFileSelected={handleFileSelected} />
              {/* Quick info card */}
              <div className="card-level-1" style={{ width: '45%', padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
                <h3 className="text-label-caps" style={{ color: 'var(--on-surface-variant)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>info</span>
                  Formatos soportados
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {[
                    { fmt: 'SVG', desc: 'Análisis vectorial completo', status: '✓', color: '#22c55e' },
                    { fmt: 'PDF', desc: 'Extracción de paths vectoriales', status: '✓', color: '#22c55e' },
                    { fmt: 'PNG/JPG', desc: 'Visión computacional (Sobel/Canny)', status: '✓', color: '#22c55e' },
                    { fmt: 'Cámara', desc: 'Foto directa + calibración de escala', status: '✓', color: '#22c55e' },
                  ].map(item => (
                    <div key={item.fmt} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: item.color, fontSize: 12, fontWeight: 700, width: 14, textAlign: 'center' }}>
                        {item.status}
                      </span>
                      <span className="text-body-sm" style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: 12 }}>
                        {item.fmt}
                      </span>
                      <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)', fontSize: 11 }}>
                        — {item.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* File info bar (when result is loaded) */}
        {hasResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ flexShrink: 0, display: 'flex', gap: 'var(--space-gutter)', marginTop: -8 }}
          >
            <div className="card-level-1" style={{
              flex: 1, padding: '6px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>description</span>
                <span className="text-body-sm" style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: 12 }}>
                  {analyzer.file?.name}
                </span>
                <span style={{
                  padding: '1px 6px', fontSize: 9, fontWeight: 700, fontFamily: 'Inter',
                  backgroundColor: 'var(--secondary-container)', color: 'var(--on-secondary-container)',
                  borderRadius: 3, textTransform: 'uppercase',
                }}>
                  {analyzer.fileType}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="text-utility-mono" style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                  {analyzer.result?.traces?.length || 0} trazos
                </span>
                {analyzer.result?.warnings?.length > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--tertiary)' }} title={analyzer.result.warnings.join('\n')}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
                    <span className="text-body-sm" style={{ fontSize: 11 }}>{analyzer.result.warnings.length}</span>
                  </span>
                )}
                <button
                  onClick={handleReset}
                  style={{
                    padding: '2px 8px', fontSize: 11, fontWeight: 600,
                    backgroundColor: 'transparent', color: 'var(--on-surface-variant)',
                    border: '1px solid var(--outline-variant)', borderRadius: 4,
                    cursor: 'pointer', fontFamily: 'Inter',
                  }}
                >
                  Nuevo análisis
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ═══ RIGHT PANEL ═══ */}
      <div style={{ width: 310, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-gutter)', overflow: 'hidden' }}>

        {hasResult ? (
          <>
            {/* Trace List Panel */}
            <div className="card-level-1" style={{ flex: '0 0 auto', maxHeight: '35%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <TraceList
                traces={analyzer.result?.traces || []}
                selectedTraceId={viewer.selectedTraceId}
                onSelectTrace={handleTraceClick}
                onToggleTrace={analyzer.toggleTrace}
                onClassifyTrace={analyzer.classifyTrace}
                onRemoveTrace={analyzer.removeTrace}
                scale={analyzer.result?.scale}
              />
            </div>

            {/* Analysis Info Panel */}
            <div className="card-level-1" style={{ flex: '0 0 auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
              <LengthSummary
                result={analyzer.result}
                onSetManualLength={analyzer.setManualLength}
                onToggleManualLength={analyzer.toggleManualLength}
              />
              <ScalePanel
                scale={analyzer.result?.scale}
                scaleSource={analyzer.result?.scaleSource}
                isCalibrating={scaleHook.isCalibrating}
                calibrationPoints={scaleHook.calibrationPoints}
                onStartCalibration={handleStartCalibration}
                onCompleteCalibration={handleCompleteCalibration}
                onCancelCalibration={scaleHook.cancelCalibration}
                onSetKnownDimension={handleSetKnownDimension}
              />
              <ConfidenceIndicator confidence={analyzer.result?.confidence} />
            </div>

            {/* Troquel Mode Selector */}
            <div className="card-level-1" style={{ flexShrink: 0, padding: '8px 12px' }}>
              <div style={{ marginBottom: 6, fontSize: 10, fontWeight: 700, fontFamily: 'Inter', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Modo de Cotización
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { mode: TroquelMode.LINEAL, label: 'Lineal', icon: 'linear_scale', desc: 'Por cm de cuchilla' },
                  { mode: TroquelMode.CUCHILLAS, label: 'Cuchillas', icon: 'hardware', desc: 'Por área + montaje' },
                ].map(({ mode, label, icon, desc }) => (
                  <button
                    key={mode}
                    onClick={() => setTroquelMode(mode)}
                    style={{
                      flex: 1, padding: '6px 8px', borderRadius: 6,
                      backgroundColor: troquelMode === mode ? 'rgba(147,204,255,0.15)' : 'var(--surface)',
                      border: `1px solid ${troquelMode === mode ? 'rgba(147,204,255,0.4)' : 'var(--outline-variant)'}`,
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: troquelMode === mode ? 'var(--primary)' : 'var(--on-surface-variant)' }}>{icon}</span>
                    <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: troquelMode === mode ? 'var(--primary)' : 'var(--on-surface)' }}>{label}</span>
                    <span style={{ fontFamily: 'Inter', fontSize: 9, color: 'var(--on-surface-variant)' }}>{desc}</span>
                  </button>
                ))}
              </div>
              {/* Calibration button for images */}
              {analyzer.hasResult && [FileType.PNG, FileType.JPG, FileType.PHOTO].includes(analyzer.fileType) && (
                <button
                  onClick={() => setShowCalibration(true)}
                  style={{
                    marginTop: 8, width: '100%', padding: '6px', borderRadius: 5,
                    backgroundColor: imagePxPerMm ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)',
                    border: `1px solid ${imagePxPerMm ? 'rgba(34,197,94,0.3)' : 'rgba(251,191,36,0.3)'}`,
                    color: imagePxPerMm ? '#22c55e' : '#fbbf24',
                    fontFamily: 'Inter', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>straighten</span>
                  {imagePxPerMm ? `Calibrado: ${imagePxPerMm.toFixed(2)} px/mm` : 'Calibrar escala de imagen'}
                </button>
              )}
            </div>

            {/* Quotation Panel */}
            <div className="card-level-1" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <QuotationPanel
                quotation={quotation.quotation}
                rates={quotation.rates}
                extras={quotation.extras}
                includeTypes={quotation.includeTypes}
                onSetRate={quotation.setRate}
                onToggleExtra={quotation.toggleExtra}
                onUpdateExtraPrice={quotation.updateExtraPrice}
                onAddExtra={quotation.addExtra}
                onRemoveExtra={quotation.removeExtra}
                onToggleType={quotation.toggleType}
                formatCurrency={quotation.formatCurrency}
                onSave={handleSave}
                troquelMode={troquelMode}
                analysisResult={analyzer.result}
              />
            </div>
          </>
        ) : (
          /* Pre-analysis panel */
          <div className="card-level-1" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              padding: '12px 14px', borderBottom: '1px solid var(--outline-variant)',
              backgroundColor: 'var(--surface-container-high)', borderRadius: '12px 12px 0 0',
            }}>
              <h2 className="text-headline-md" style={{
                fontWeight: 600, color: 'var(--on-surface)', fontSize: 16,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>calculate</span>
                Motor de Cálculo
              </h2>
            </div>
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: 24, textAlign: 'center',
            }}>
              <span className="material-symbols-outlined" style={{
                fontSize: 48, color: 'var(--on-surface-variant)', opacity: 0.3, marginBottom: 12,
              }}>
                precision_manufacturing
              </span>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', maxWidth: 200 }}>
                Carga un diseño de troquel para iniciar el análisis y generar una cotización automática
              </p>
              <div style={{
                marginTop: 20, padding: '8px 12px', borderRadius: 6,
                backgroundColor: 'var(--surface)', border: '1px solid var(--outline-variant)',
                width: '100%',
              }}>
                <div className="text-label-caps" style={{ color: 'var(--on-surface-variant)', fontSize: 10, marginBottom: 8 }}>
                  Flujo de análisis
                </div>
                {['Subir archivo', 'Analizar geometría', 'Detectar trazos', 'Calibrar escala', 'Medir longitudes', 'Cotizar'].map((step, i) => (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{
                      width: 16, height: 16, borderRadius: '50%',
                      backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface-variant)',
                      fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Inter', flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <span className="text-body-sm" style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Calibration Overlay */}
      <AnimatePresence>
        {showCalibration && analyzer.result?.imagePreview && (
          <CameraCalibration
            imagePreview={analyzer.result.imagePreview}
            imageWidth={analyzer.result.dimensions?.width || 800}
            imageHeight={analyzer.result.dimensions?.height || 600}
            onCalibrated={handleCalibrated}
            onClose={() => setShowCalibration(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Reusable toolbar button */
function ToolButton({ icon, label, active, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        padding: '4px 6px', borderRadius: 4,
        backgroundColor: active ? 'rgba(147,204,255,0.15)' : 'transparent',
        color: active ? 'var(--primary)' : accent ? 'var(--tertiary)' : 'var(--on-surface-variant)',
        border: active ? '1px solid rgba(147,204,255,0.3)' : '1px solid transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
        transition: 'all 0.15s ease', fontSize: 11, fontFamily: 'Inter', fontWeight: 600,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{icon}</span>
      {label && <span style={{ fontSize: 10 }}>{label}</span>}
    </button>
  );
}
