/**
 * TroquelMaster — FileUploader Component
 * 
 * Drag & drop file upload zone with live camera and calibration support.
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileType } from '../types.js';
import { detectFileType } from '../services/analysis-provider.js';
import CameraCapture from './CameraCapture.jsx';

const ACCEPTED_TYPES = '.svg,.pdf,.png,.jpg,.jpeg';
const FILE_TYPE_LABELS = {
  [FileType.SVG]: 'SVG Vectorial',
  [FileType.PDF]: 'PDF',
  [FileType.PNG]: 'Imagen PNG',
  [FileType.JPG]: 'Imagen JPG',
  [FileType.PHOTO]: 'Fotografía',
};

const FILE_TYPE_ICONS = {
  [FileType.SVG]: 'polyline',
  [FileType.PDF]: 'picture_as_pdf',
  [FileType.PNG]: 'image',
  [FileType.JPG]: 'image',
  [FileType.PHOTO]: 'photo_camera',
};

const FILE_TYPE_QUALITY = {
  [FileType.SVG]: { label: 'Recomendado', color: '#22c55e' },
  [FileType.PDF]: { label: 'Muy bueno', color: '#3b82f6' },
  [FileType.PNG]: { label: 'Bueno', color: '#f59e0b' },
  [FileType.JPG]: { label: 'Bueno', color: '#f59e0b' },
  [FileType.PHOTO]: { label: 'Requiere calibración', color: '#f59e0b' },
};

export default function FileUploader({ onFileSelected, compact = false }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    const type = detectFileType(file);
    setSelectedFile({ file, type });
    onFileSelected?.(file);
  }, [onFileSelected]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer?.files?.[0]);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragOver(false), []);
  const handleInputChange = useCallback((e) => handleFile(e.target.files?.[0]), [handleFile]);

  const handleCameraCapture = useCallback((file, _dataUrl) => {
    setShowCamera(false);
    handleFile(file);
  }, [handleFile]);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Compact view when file is already selected
  if (compact && selectedFile) {
    const quality = FILE_TYPE_QUALITY[selectedFile.type];
    return (
      <div className="upload-zone-compact" style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>
          {FILE_TYPE_ICONS[selectedFile.type] || 'description'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Inter', fontWeight: 600, fontSize: 13,
            color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {selectedFile.file.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontFamily: 'Inter', fontSize: 11, color: 'var(--on-surface-variant)' }}>
              {FILE_TYPE_LABELS[selectedFile.type] || 'Archivo'} · {formatSize(selectedFile.file.size)}
            </span>
            {quality && (
              <span style={{
                fontFamily: 'Inter', fontSize: 10, fontWeight: 700,
                color: quality.color, opacity: 0.9,
              }}>
                · {quality.label}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => { setSelectedFile(null); fileInputRef.current?.click(); }}
          style={{
            padding: '4px 10px', fontSize: 12, fontWeight: 600, fontFamily: 'Inter',
            backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface)',
            border: '1px solid var(--outline-variant)', borderRadius: 4, cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Cambiar
        </button>
        <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} onChange={handleInputChange} style={{ display: 'none' }} />
      </div>
    );
  }

  return (
    <>
      {/* Camera overlay */}
      <AnimatePresence>
        {showCamera && (
          <CameraCapture
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        className={`upload-zone ${isDragOver ? 'upload-zone--active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          flex: 1,
          border: `2px dashed ${isDragOver ? 'var(--primary)' : 'var(--outline-variant)'}`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: compact ? 'var(--space-md)' : 'var(--space-xl)',
          cursor: 'pointer', position: 'relative', overflow: 'hidden',
          borderRadius: 12,
          backgroundColor: isDragOver ? 'rgba(147,204,255,0.05)' : 'transparent',
          transition: 'all 0.3s ease',
        }}
        onClick={() => fileInputRef.current?.click()}
        whileHover={{ borderColor: 'rgba(147,204,255,0.5)' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />

        {/* Icon */}
        <motion.span
          className="material-symbols-outlined"
          style={{
            fontSize: compact ? 36 : 52,
            color: isDragOver ? 'var(--primary)' : 'var(--on-surface-variant)',
            marginBottom: 10,
          }}
          animate={{ y: isDragOver ? -6 : 0, scale: isDragOver ? 1.1 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          cloud_upload
        </motion.span>

        <h3 style={{
          fontFamily: 'Inter', fontWeight: 700, fontSize: 16,
          color: 'var(--on-surface)', marginBottom: 6,
        }}>
          {isDragOver ? 'Suelta el archivo aquí' : 'Subir Diseño de Troquel'}
        </h3>

        <p style={{
          fontFamily: 'Inter', fontSize: 13, color: 'var(--on-surface-variant)',
          textAlign: 'center', maxWidth: 300, marginBottom: 20, lineHeight: 1.5,
        }}>
          Arrastra un archivo SVG, PDF o imagen, o usa la cámara del celular
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            style={{
              padding: '8px 18px', backgroundColor: 'var(--primary)', color: 'var(--on-primary)',
              fontSize: 13, fontWeight: 700, borderRadius: 7, border: 'none', cursor: 'pointer',
              fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>folder_open</span>
            Explorar Archivos
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setShowCamera(true); }}
            style={{
              padding: '8px 18px',
              background: 'linear-gradient(135deg, rgba(147,204,255,0.15), rgba(59,130,246,0.1))',
              color: 'var(--primary)',
              fontSize: 13, fontWeight: 600, borderRadius: 7,
              border: '1px solid rgba(147,204,255,0.3)',
              cursor: 'pointer', fontFamily: 'Inter',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>photo_camera</span>
            Cámara
          </button>
        </div>

        {/* Format badges */}
        <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { fmt: 'SVG', color: '#22c55e', tip: 'Mejor calidad' },
            { fmt: 'PDF', color: '#3b82f6', tip: 'Vectorial' },
            { fmt: 'PNG', color: '#f59e0b', tip: 'Imagen' },
            { fmt: 'JPG', color: '#f59e0b', tip: 'Imagen' },
            { fmt: 'CAM', color: '#a78bfa', tip: 'Cámara' },
          ].map(({ fmt, color, tip }) => (
            <span key={fmt} title={tip} style={{
              padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'Inter',
              backgroundColor: `${color}18`, color,
              borderRadius: 4, letterSpacing: '0.05em',
              border: `1px solid ${color}40`,
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
              position: 'absolute', inset: 0,
              backgroundColor: 'rgba(147,204,255,0.06)',
              border: '2px solid var(--primary)', borderRadius: 12,
            }}
          />
        )}
      </motion.div>
    </>
  );
}
