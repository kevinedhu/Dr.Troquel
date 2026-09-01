/**
 * TroquelMaster — Analysis Provider (Abstraction Layer)
 * 
 * Provides a unified interface for different analysis backends.
 * React components depend on this interface, not on specific implementations.
 */

import { FileType, AnalysisStage, createEmptyResult } from '../types.js';
import { analyzeSVG } from '../parsers/svg-parser.js';
import { analyzePDF } from '../parsers/pdf-parser.js';
import { analyzeImage } from '../parsers/image-parser.js';

// ─── Provider Interface ────────────────────────────────────────

class AnalysisProvider {
  constructor(name) {
    this.name = name;
  }

  /** @returns {Promise<TroquelAnalysisResult>} */
  async analyze(input, onProgress) {
    throw new Error(`${this.name}: analyze() not implemented`);
  }

  canHandle(fileType) { return false; }
}


// ─── SVG Vector Provider ────────────────────────────────────────

class LocalVectorAnalysisProvider extends AnalysisProvider {
  constructor() { super('LocalVectorAnalysis'); }

  canHandle(fileType) { return fileType === FileType.SVG; }

  async analyze({ content, fileName, fileSize }, onProgress) {
    onProgress?.(AnalysisStage.PARSING, 10);
    await new Promise(r => setTimeout(r, 50));

    onProgress?.(AnalysisStage.DETECTING_TRACES, 30);
    await new Promise(r => setTimeout(r, 50));

    const result = analyzeSVG(content, fileName, fileSize);

    onProgress?.(AnalysisStage.CALIBRATING, 60);
    await new Promise(r => setTimeout(r, 50));

    onProgress?.(AnalysisStage.CALCULATING, 80);
    await new Promise(r => setTimeout(r, 50));

    onProgress?.(AnalysisStage.COMPLETE, 100);
    return result;
  }
}


// ─── PDF Vector Provider ────────────────────────────────────────

class LocalPDFAnalysisProvider extends AnalysisProvider {
  constructor() { super('LocalPDFAnalysis'); }

  canHandle(fileType) { return fileType === FileType.PDF; }

  async analyze({ content, fileName, fileSize }, onProgress) {
    onProgress?.(AnalysisStage.PARSING, 10);
    await new Promise(r => setTimeout(r, 100));

    onProgress?.(AnalysisStage.DETECTING_TRACES, 30);

    // content is an ArrayBuffer for PDF
    const result = await analyzePDF(content, fileName, fileSize);

    onProgress?.(AnalysisStage.CALCULATING, 90);
    await new Promise(r => setTimeout(r, 50));

    onProgress?.(AnalysisStage.COMPLETE, 100);
    return result;
  }
}


// ─── Image / Camera Provider ────────────────────────────────────

class LocalImageAnalysisProvider extends AnalysisProvider {
  constructor() { super('LocalImageAnalysis'); }

  canHandle(fileType) {
    return [FileType.PNG, FileType.JPG, FileType.PHOTO].includes(fileType);
  }

  async analyze({ content, fileName, fileSize, pxPerMm }, onProgress) {
    onProgress?.(AnalysisStage.PARSING, 5);

    const result = await analyzeImage(content, fileName, fileSize, {
      pxPerMm: pxPerMm || null,
      onProgress: (label, pct) => {
        // Map image pipeline progress to analysis stages
        if (pct < 30) onProgress?.(AnalysisStage.LOADING, pct);
        else if (pct < 60) onProgress?.(AnalysisStage.DETECTING_TRACES, pct);
        else if (pct < 85) onProgress?.(AnalysisStage.CALIBRATING, pct);
        else onProgress?.(AnalysisStage.CALCULATING, pct);
      },
    });

    onProgress?.(AnalysisStage.COMPLETE, 100);
    return result;
  }
}


// ─── Provider Factory ──────────────────────────────────────────

const providers = {
  vector: new LocalVectorAnalysisProvider(),
  pdf: new LocalPDFAnalysisProvider(),
  image: new LocalImageAnalysisProvider(),
};

/**
 * Get the appropriate analysis provider for a file type
 */
export function getAnalysisProvider(fileType) {
  if (fileType === FileType.SVG) return providers.vector;
  if (fileType === FileType.PDF) return providers.pdf;
  if ([FileType.PNG, FileType.JPG, FileType.PHOTO].includes(fileType)) return providers.image;
  // fallback
  return providers.vector;
}

/**
 * Detect file type from a File object
 */
export function detectFileType(file) {
  if (!file) return FileType.UNKNOWN;

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (name.endsWith('.svg') || type === 'image/svg+xml') return FileType.SVG;
  if (name.endsWith('.pdf') || type === 'application/pdf') return FileType.PDF;
  if (name.endsWith('.png') || type === 'image/png') return FileType.PNG;
  if (name.endsWith('.jpg') || name.endsWith('.jpeg') || type === 'image/jpeg') return FileType.JPG;
  if (type.startsWith('image/')) return FileType.PHOTO;

  return FileType.UNKNOWN;
}

/**
 * Read file content based on its type
 */
export async function readFileContent(file, fileType) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo'));

    if (fileType === FileType.SVG) {
      reader.onload = () => resolve(reader.result);
      reader.readAsText(file);
    } else if (fileType === FileType.PDF) {
      reader.onload = () => resolve(reader.result);
      reader.readAsArrayBuffer(file);
    } else {
      // Images — read as data URL
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    }
  });
}

export {
  AnalysisProvider,
  LocalVectorAnalysisProvider,
  LocalPDFAnalysisProvider,
  LocalImageAnalysisProvider,
};
