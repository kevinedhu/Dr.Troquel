/**
 * TroquelMaster — Troquel Analyzer Module
 * 
 * Barrel export — single entry point for all module functionality.
 */

// Types & constants
export * from './types.js';

// Geometry engine
export * from './utils/geometry.js';

// Parsers
export { analyzeSVG, parseSVGMetadata, determineSVGScale, aggregateLengths } from './parsers/svg-parser.js';
export { analyzePDF, isPDFVectorial } from './parsers/pdf-parser.js';
export { analyzeImage, ImageProcessingPipeline, PipelineStages } from './parsers/image-parser.js';

// Services
export { getAnalysisProvider, detectFileType, readFileContent } from './services/analysis-provider.js';
export * from './services/scale-service.js';
export * from './services/confidence-service.js';
export * from './services/quotation-service.js';
export * from './services/storage-service.js';

// Hooks
export { useAnalyzer } from './hooks/useAnalyzer.js';
export { useViewer } from './hooks/useViewer.js';
export { useScale } from './hooks/useScale.js';
export { useMeasure } from './hooks/useMeasure.js';
export { useQuotation } from './hooks/useQuotation.js';

// Components
export { default as FileUploader } from './components/FileUploader.jsx';
export { default as TroquelViewer } from './components/TroquelViewer.jsx';
export { default as TraceList } from './components/TraceList.jsx';
export { default as LengthSummary } from './components/LengthSummary.jsx';
export { default as ConfidenceIndicator } from './components/ConfidenceIndicator.jsx';
export { default as ScalePanel } from './components/ScalePanel.jsx';
export { default as QuotationPanel } from './components/QuotationPanel.jsx';
export { default as AnalysisProgress } from './components/AnalysisProgress.jsx';
export { default as CameraCapture } from './components/CameraCapture.jsx';
export { default as CameraCalibration } from './components/CameraCalibration.jsx';
