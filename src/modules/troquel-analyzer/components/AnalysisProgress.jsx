/**
 * TroquelMaster — AnalysisProgress Component
 * 
 * Overlay shown during analysis with step-by-step progress.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AnalysisStage, STAGE_LABELS } from '../types.js';

const STAGES_ORDER = [
  AnalysisStage.LOADING,
  AnalysisStage.PARSING,
  AnalysisStage.DETECTING_TRACES,
  AnalysisStage.CALIBRATING,
  AnalysisStage.CALCULATING,
  AnalysisStage.COMPLETE,
];

export default function AnalysisProgress({ stage, progress, isVisible }) {
  if (!isVisible) return null;

  const currentIndex = STAGES_ORDER.indexOf(stage);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'absolute', inset: 0, zIndex: 20,
          backgroundColor: 'rgba(5,20,37,0.92)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          borderRadius: 12,
        }}
      >
        {/* Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{ marginBottom: 20 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--primary)' }}>
            qr_code_scanner
          </span>
        </motion.div>

        <h3 className="text-headline-md" style={{ color: 'var(--on-surface)', fontWeight: 600, marginBottom: 4, fontSize: 16 }}>
          Analizando troquel
        </h3>
        <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 20 }}>
          {STAGE_LABELS[stage] || 'Procesando...'}
        </p>

        {/* Progress bar */}
        <div style={{ width: 240, marginBottom: 20 }}>
          <div className="progress-bar" style={{ height: 6 }}>
            <motion.div
              className="progress-bar-fill"
              style={{ backgroundColor: 'var(--primary)' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
          <div className="text-utility-mono" style={{
            textAlign: 'center', marginTop: 4, fontSize: 11, color: 'var(--on-surface-variant)',
          }}>
            {Math.round(progress)}%
          </div>
        </div>

        {/* Stage indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 200 }}>
          {STAGES_ORDER.map((s, i) => {
            const isComplete = i < currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: isCurrent ? 1 : isComplete ? 0.7 : 0.3 }}>
                <span className="material-symbols-outlined" style={{
                  fontSize: 14,
                  color: isComplete ? '#22c55e' : isCurrent ? 'var(--primary)' : 'var(--on-surface-variant)',
                }}>
                  {isComplete ? 'check_circle' : isCurrent ? 'pending' : 'radio_button_unchecked'}
                </span>
                <span className="text-body-sm" style={{
                  fontSize: 11, color: 'var(--on-surface)',
                  fontWeight: isCurrent ? 600 : 400,
                }}>
                  {STAGE_LABELS[s]}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
