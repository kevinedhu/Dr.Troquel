/**
 * TroquelMaster — Analysis Provider (Abstraction Layer)
 * 
 * Provides a unified interface for different analysis backends.
 * React components depend on this interface, not on specific implementations.
 */

import { FileType, AnalysisStage, createEmptyResult } from '../types.js';
import { analyzeSVG } from '../parsers/svg-parser.js';

// ─── Provider Interface ────────────────────────────────────────

/**
 * Base analysis provider interface.
 * All providers must implement the `analyze` method.
 */
class AnalysisProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * @param {object} input - { file, content, fileType }
   * @param {function} onProgress - Progress callback (stage, percent)
   * @returns {Promise<TroquelAnalysisResult>}
   */
  async analyze(input, onProgress) {
    throw new Error(`${this.name}: analyze() not implemented`);
  }

  /** Check if this provider can handle the given file type */
  canHandle(fileType) {
    return false;
  }
}


// ─── Local Vector Analysis Provider ────────────────────────────

class LocalVectorAnalysisProvider extends AnalysisProvider {
  constructor() {
    super('LocalVectorAnalysis');
  }

  canHandle(fileType) {
    return fileType === FileType.SVG;
  }

  async analyze({ content, fileName, fileSize }, onProgress) {
    onProgress?.(AnalysisStage.PARSING, 10);
    
    // Small delay to allow UI to update
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


// ─── Local Image Analysis Provider (Stub) ──────────────────────

class LocalImageAnalysisProvider extends AnalysisProvider {
  constructor() {
    super('LocalImageAnalysis');
  }

  canHandle(fileType) {
    return [FileType.PNG, FileType.JPG, FileType.PHOTO].includes(fileType);
  }

  async analyze({ content, fileName, fileSize }, onProgress) {
    onProgress?.(AnalysisStage.PARSING, 10);
    await new Promise(r => setTimeout(r, 100));
    
    // Phase 2: This will connect to OpenCV.js or a Python API
    const result = createEmptyResult();
    result.fileType = FileType.PNG;
    result.fileName = fileName;
    result.fileSize = fileSize;
    result.warnings.push(
      'El análisis de imágenes requiere el motor de visión computacional (fase 2).',
      'Actualmente solo se soporta análisis vectorial (SVG).'
    );
    
    onProgress?.(AnalysisStage.COMPLETE, 100);
    return result;
  }
}


// ─── Cloud Analysis Provider (Stub) ────────────────────────────

class CloudAnalysisProvider extends AnalysisProvider {
  constructor(apiUrl) {
    super('CloudAnalysis');
    this.apiUrl = apiUrl;
  }

  canHandle(fileType) {
    return true; // Cloud can handle anything
  }

  async analyze({ content, fileName, fileSize }, onProgress) {
    // Phase 3: This will send the file to a Python/OpenCV backend
    const result = createEmptyResult();
    result.fileName = fileName;
    result.warnings.push(
      'El análisis en la nube no está configurado todavía.',
      'Configure la URL del servidor en Configuración.'
    );
    
    onProgress?.(AnalysisStage.COMPLETE, 100);
    return result;
  }
}


// ─── Provider Factory ──────────────────────────────────────────

const providers = {
  vector: new LocalVectorAnalysisProvider(),
  image: new LocalImageAnalysisProvider(),
  // cloud: new CloudAnalysisProvider('http://localhost:8000/api/analyze'),
};

/**
 * Get the appropriate analysis provider for a file type
 * @param {string} fileType - FileType enum value
 * @returns {AnalysisProvider}
 */
export function getAnalysisProvider(fileType) {
  if (fileType === FileType.SVG) return providers.vector;
  if ([FileType.PNG, FileType.JPG, FileType.PHOTO].includes(fileType)) return providers.image;
  if (fileType === FileType.PDF) return providers.vector; // Will be replaced when PDF parser is ready
  return providers.vector;
}

/**
 * Detect file type from a File object
 * @param {File} file
 * @returns {string} FileType enum value
 */
export function detectFileType(file) {
  if (!file) return FileType.UNKNOWN;
  
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  
  if (name.endsWith('.svg') || type === 'image/svg+xml') return FileType.SVG;
  if (name.endsWith('.pdf') || type === 'application/pdf') return FileType.PDF;
  if (name.endsWith('.png') || type === 'image/png') return FileType.PNG;
  if (name.endsWith('.jpg') || name.endsWith('.jpeg') || type === 'image/jpeg') return FileType.JPG;
  
  // Check if it came from camera (typically JPEG with specific metadata)
  if (type.startsWith('image/')) return FileType.PHOTO;
  
  return FileType.UNKNOWN;
}

/**
 * Read file content based on its type
 * @param {File} file
 * @param {string} fileType
 * @returns {Promise<string|ArrayBuffer>}
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
      // Images — read as data URL for display, and ArrayBuffer for processing
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    }
  });
}

export { AnalysisProvider, LocalVectorAnalysisProvider, LocalImageAnalysisProvider, CloudAnalysisProvider };
