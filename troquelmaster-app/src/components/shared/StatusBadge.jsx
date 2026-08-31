/**
 * StatusBadge — Color-coded status badge for work orders & inventory.
 * @param {string} status - 'en-corte' | 'listo' | 'en-cola' | 'en-armado' | 'critico' | 'optimo' | 'reordenar'
 * @param {string} [label] - Override display label
 * @param {boolean} [pulse] - Show pulsing dot indicator
 */

const statusConfig = {
  'en-corte': { label: 'EN CORTE', bg: '#0284C7', color: '#fff' },
  'listo': { label: 'LISTO', bg: '#22C55E', color: '#fff' },
  'completado': { label: 'COMPLETADO', bg: '#22C55E', color: '#fff' },
  'en-cola': { label: 'EN COLA', bg: '#64748B', color: '#fff' },
  'en-armado': { label: 'EN ARMADO', bg: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)' },
  'critico': { label: 'CRÍTICO', bg: 'var(--error-container)', color: 'var(--on-error-container)' },
  'optimo': { label: 'ÓPTIMO', bg: 'rgba(34, 197, 94, 0.2)', color: '#fff' },
  'reordenar': { label: 'REORDENAR', bg: 'rgba(234, 179, 8, 0.2)', color: '#000' },
};

export default function StatusBadge({ status, label, pulse = false }) {
  const config = statusConfig[status] || statusConfig['en-cola'];
  const displayLabel = label || config.label;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 2,
        backgroundColor: config.bg,
        color: config.color,
        fontFamily: "'Inter', sans-serif",
        fontSize: 10,
        fontWeight: 700,
        lineHeight: '16px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {pulse && (
        <span
          className="animate-subtle-pulse"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: config.color,
            flexShrink: 0,
          }}
        />
      )}
      {displayLabel}
    </span>
  );
}
