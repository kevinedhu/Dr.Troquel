/**
 * TroquelMaster — FileUploader Component
 * 
 * Drag & drop file upload zone with camera support.
 */

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileType } from '../types.js';
import { detectFileType } from '../services/analysis-provider.js';

const ACCEPTED_TYPES = '.svg,.pdf,.png,.jpg,.jpeg';
const FILE_TYPE_LABELS = {
  [FileType.SVG]: 'SVG Vectorial',
  [FileType.PDF]: 'PDF',
  [FileType.PNG]: 'Imagen PNG',
  [FileType.JPG]: 'Imagen JPG',
  [FileType.PHOTO]: 'Fotografía',
};

export default function FileUploader({ onFileSelected, compact = false }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    const type = detectFileType(file);
    setSelectedFile({ file, type });
    onFileSelected?.(file);
  }, [onFileSelected]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  }, [handleFile]);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (compact && selectedFile) {
    return (
      <div className="upload-zone-compact">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>
            description
          </span>
          <div>
            <div className="text-body-sm" style={{ fontWeight: 600, color: 'var(--on-surface)' }}>
              {selectedFile.file.name}
            </div>
            <div className="text-body-sm" style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
              {FILE_TYPE_LABELS[selectedFile.type] || 'Archivo'} · {formatSize(selectedFile.file.size)}
            </div>
          </div>
        </div>
        <button
          onClick={() => { setSelectedFile(null); fileInputRef.current?.click(); }}
          style={{
            padding: '4px 12px', fontSize: 12, fontWeight: 600, fontFamily: 'Inter',
            backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface)',
            border: '1px solid var(--outline-variant)', borderRadius: 4, cursor: 'pointer',
          }}
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className={`upload-zone ${isDragOver ? 'upload-zone--active' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      whileHover={{ borderColor: 'rgba(147,204,255,0.5)' }}
      style={{
        flex: 1, border: '2px dashed var(--outline-variant)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: compact ? 'var(--space-md)' : 'var(--space-xl)',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        borderRadius: 12, backgroundColor: isDragOver ? 'rgba(147,204,255,0.05)' : 'transparent',
        transition: 'all 0.3s ease',
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {/* Upload icon */}
      <motion.span
        className="material-symbols-outlined"
        style={{ fontSize: compact ? 32 : 48, color: isDragOver ? 'var(--primary)' : 'var(--on-surface-variant)', marginBottom: 8 }}
        animate={{ y: isDragOver ? -4 : 0 }}
      >
        cloud_upload
      </motion.span>

      <h3 className="text-body-lg" style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: 4 }}>
        {isDragOver ? 'Suelta el archivo aquí' : 'Subir Diseño de Troquel'}
      </h3>

      <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', textAlign: 'center', maxWidth: 280, marginBottom: 16 }}>
        Arrastra un archivo SVG, PDF o imagen, o haz clic para explorar
      </p>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          style={{
            padding: '6px 16px', backgroundColor: 'var(--primary)', color: 'var(--on-primary)',
            fontSize: 13, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer',
            fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>folder_open</span>
          Explorar
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
          style={{
            padding: '6px 16px', backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface)',
            fontSize: 13, fontWeight: 600, borderRadius: 6, border: '1px solid var(--outline-variant)',
            cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>photo_camera</span>
          Cámara
        </button>
      </div>

      {/* Supported formats */}
      <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['SVG', 'PDF', 'PNG', 'JPG'].map(fmt => (
          <span key={fmt} style={{
            padding: '1px 6px', fontSize: 10, fontWeight: 700, fontFamily: 'Inter',
            backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface-variant)',
            borderRadius: 3, letterSpacing: '0.05em',
          }}>
            {fmt}
          </span>
        ))}
      </div>

      {/* Drag overlay */}
      {isDragOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute', inset: 0, backgroundColor: 'rgba(147,204,255,0.08)',
            border: '2px solid var(--primary)', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        />
      )}
    </motion.div>
  );
}
