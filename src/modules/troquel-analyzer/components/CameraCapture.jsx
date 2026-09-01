/**
 * TroquelMaster — CameraCapture Component
 * 
 * Live camera view for mobile phones to photograph troqueles.
 * Activates the rear camera, shows alignment guides, and captures on tap.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captured, setCaptured] = useState(null);
  const [error, setError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const trackRef = useRef(null);

  // Start camera stream
  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        const constraints = {
          video: {
            facingMode: { ideal: 'environment' }, // rear camera
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        trackRef.current = stream.getVideoTracks()[0];

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsReady(true);
        }
      } catch (err) {
        if (active) {
          if (err.name === 'NotAllowedError') {
            setError('Permiso de cámara denegado. Permite el acceso en tu navegador.');
          } else if (err.name === 'NotFoundError') {
            setError('No se encontró cámara en este dispositivo.');
          } else {
            setError(`Error de cámara: ${err.message}`);
          }
        }
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Toggle torch (flashlight) — available on some Android browsers
  const toggleTorch = useCallback(async () => {
    if (!trackRef.current) return;
    try {
      const newState = !torchOn;
      await trackRef.current.applyConstraints({ advanced: [{ torch: newState }] });
      setTorchOn(newState);
    } catch {
      // Torch not supported
    }
  }, [torchOn]);

  // Capture frame from video
  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isReady) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCaptured(dataUrl);
    setIsCapturing(false);
  }, [isReady]);

  // Confirm and send captured image
  const confirmCapture = useCallback(() => {
    if (!captured) return;
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    // Create File object from data URL
    fetch(captured)
      .then(r => r.blob())
      .then(blob => {
        const file = new File([blob], `camara_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture?.(file, captured);
      });
  }, [captured, onCapture]);

  // Retry — clear capture and resume camera
  const retry = useCallback(() => {
    setCaptured(null);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: '#000',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Error state */}
      {error && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff', padding: 24, textAlign: 'center', gap: 16,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#ef4444' }}>
            no_photography
          </span>
          <p style={{ fontFamily: 'Inter', fontSize: 15, lineHeight: 1.5 }}>{error}</p>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px', backgroundColor: 'var(--primary)',
              color: '#fff', border: 'none', borderRadius: 8,
              fontFamily: 'Inter', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            Volver
          </button>
        </div>
      )}

      {/* Camera view */}
      {!error && !captured && (
        <>
          {/* Video feed */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Alignment guide overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              {/* Corner guides */}
              {[
                { top: '10%', left: '8%', borderTop: '3px solid #93ccff', borderLeft: '3px solid #93ccff', borderRadius: '6px 0 0 0' },
                { top: '10%', right: '8%', borderTop: '3px solid #93ccff', borderRight: '3px solid #93ccff', borderRadius: '0 6px 0 0' },
                { bottom: '20%', left: '8%', borderBottom: '3px solid #93ccff', borderLeft: '3px solid #93ccff', borderRadius: '0 0 0 6px' },
                { bottom: '20%', right: '8%', borderBottom: '3px solid #93ccff', borderRight: '3px solid #93ccff', borderRadius: '0 0 6px 0' },
              ].map((style, i) => (
                <div key={i} style={{
                  position: 'absolute', width: 32, height: 32, ...style,
                }} />
              ))}

              {/* Center crosshair */}
              <div style={{ textAlign: 'center', marginBottom: '15%' }}>
                <div style={{
                  width: 1, height: 20, backgroundColor: 'rgba(147,204,255,0.6)',
                  margin: '0 auto',
                }} />
                <div style={{ height: 1, width: 20, backgroundColor: 'rgba(147,204,255,0.6)' }} />
              </div>
            </div>

            {/* Instruction label */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
              padding: '16px 16px 32px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <button onClick={onClose} style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
              </button>

              <span style={{
                fontFamily: 'Inter', fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500,
              }}>
                Centra el troquel
              </span>

              <button onClick={toggleTorch} style={{
                background: torchOn ? 'rgba(255,220,0,0.3)' : 'rgba(255,255,255,0.15)',
                border: 'none', borderRadius: '50%',
                width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: torchOn ? '#ffd600' : '#fff',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {torchOn ? 'flashlight_on' : 'flashlight_off'}
                </span>
              </button>
            </div>

            {/* Tips label at bottom of frame */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
              padding: '32px 16px 8px',
              textAlign: 'center',
            }}>
              <p style={{
                fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.7)',
                margin: 0,
              }}>
                Mantén la cámara paralela al troquel • Buena iluminación
              </p>
            </div>
          </div>

          {/* Capture button */}
          <div style={{
            height: 120, backgroundColor: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <motion.button
              onClick={capture}
              whileTap={{ scale: 0.92 }}
              disabled={!isReady}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                backgroundColor: '#fff', border: '4px solid rgba(147,204,255,0.5)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 4px rgba(147,204,255,0.2)',
                opacity: isReady ? 1 : 0.4,
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                backgroundColor: isCapturing ? '#ef4444' : '#fff',
                border: '2px solid #ccc',
                transition: 'background-color 0.1s',
              }} />
            </motion.button>
          </div>
        </>
      )}

      {/* Preview captured image */}
      {!error && captured && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <img
              src={captured}
              alt="Captura"
              style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}
            />
            {/* Preview label */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
              padding: '16px', textAlign: 'center',
            }}>
              <span style={{ fontFamily: 'Inter', color: '#fff', fontSize: 14, fontWeight: 600 }}>
                Vista previa — ¿Está bien la foto?
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{
            height: 100, backgroundColor: '#111',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24,
          }}>
            <button
              onClick={retry}
              style={{
                padding: '12px 28px', backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8, fontFamily: 'Inter', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>replay</span>
              Reintentar
            </button>
            <motion.button
              onClick={confirmCapture}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '12px 32px', backgroundColor: 'var(--primary)',
                color: '#fff', border: 'none',
                borderRadius: 8, fontFamily: 'Inter', fontWeight: 700, fontSize: 14,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
              Analizar
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
