import { motion } from 'framer-motion';

/**
 * MetricCard — KPI card component matching the Stitch design.
 * @param {string} label - Uppercase label text
 * @param {string} value - Display metric value
 * @param {string} [unit] - Unit suffix (m, planchas, etc.)
 * @param {string} [icon] - Material Symbol icon name
 * @param {string} [iconColor] - CSS color for the icon
 * @param {string} [subtitle] - Bottom descriptor text
 * @param {string} [variant] - 'default' | 'error' | 'success' | 'highlight'
 * @param {React.ReactNode} [children] - Optional extra content (progress bars, etc.)
 * @param {number} [index] - For stagger animation
 */
export default function MetricCard({
  label,
  value,
  unit,
  icon,
  iconColor = 'var(--secondary)',
  subtitle,
  variant = 'default',
  children,
  index = 0,
  trend,
  trendIcon,
  badge,
  badgeClass,
}) {
  const isError = variant === 'error';
  const isHighlight = variant === 'highlight';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      style={{
        backgroundColor: 'var(--surface-container-high)',
        border: `1px solid ${isError ? 'rgba(255, 180, 171, 0.5)' : 'var(--outline-variant)'}`,
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-md)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Highlight gradient overlay */}
      {isHighlight && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(147, 204, 255, 0.1), transparent)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="text-label-caps"
            style={{ color: isError ? 'var(--error)' : 'var(--on-surface-variant)' }}
          >
            {label}
          </span>
          {badge && <span className={`badge ${badgeClass || ''}`}>{badge}</span>}
        </div>
        {icon && (
          <span
            className="material-symbols-outlined"
            style={{ color: isError ? 'var(--error)' : iconColor, fontSize: 22 }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div style={{ marginTop: 16, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span
            className="text-display-metrics"
            style={{
              color: isError ? 'var(--error)' : isHighlight ? 'var(--primary)' : 'var(--on-surface)',
            }}
          >
            {value}
          </span>
          {unit && (
            <span className="text-utility-mono" style={{ color: 'var(--on-surface-variant)' }}>
              {unit}
            </span>
          )}
        </div>

        {/* Subtitle / Trend */}
        {(subtitle || trend) && (
          <div
            className="text-body-sm"
            style={{
              marginTop: 4,
              color: isError ? 'rgba(255,180,171,0.8)' : 'var(--on-surface-variant)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {trendIcon && (
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: trend?.startsWith('+') ? 'var(--secondary)' : 'var(--on-surface-variant)' }}>
                {trendIcon}
              </span>
            )}
            <span>{trend || subtitle}</span>
          </div>
        )}

        {/* Extra content (progress bars, etc.) */}
        {children}
      </div>
    </motion.div>
  );
}
