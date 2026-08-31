import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': null,
  '/cotizador': 'Cotización Nueva',
  '/trabajos': null,
  '/clientes': 'Clientes',
  '/almacen': null,
  '/caja': null,
  '/reportes': 'Reportes',
  '/tarifas': 'Tarifas',
  '/configuracion': 'Configuración Sistema',
};

export default function TopBar() {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname];

  const today = new Date();
  const dateStr = today.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <header
      style={{
        height: 64,
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--outline-variant)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 var(--space-lg)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* Left Side */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        {pageTitle ? (
          <span className="text-headline-md" style={{ fontWeight: 700, color: 'var(--primary)' }}>
            {pageTitle}
          </span>
        ) : (
          <div style={{ position: 'relative', width: 256 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--on-surface-variant)',
                fontSize: 18,
              }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Buscar trabajos, clientes..."
              className="input-field"
              style={{
                borderRadius: 'var(--radius-full)',
                paddingLeft: 36,
                paddingTop: 6,
                paddingBottom: 6,
                fontSize: 14,
                backgroundColor: 'var(--surface-container)',
              }}
            />
          </div>
        )}
      </div>

      {/* Right Side Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <span className="text-utility-mono" style={{ color: 'var(--on-surface-variant)' }}>
          {dateStr}
        </span>
        {['notifications', 'settings_suggest', 'account_circle'].map((icon) => (
          <button
            key={icon}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--on-surface-variant)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: '50%',
              display: 'flex',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--on-surface-variant)')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: icon === 'account_circle' ? 28 : 24 }}>
              {icon}
            </span>
          </button>
        ))}
      </div>
    </header>
  );
}
