import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Dashboard',
  '/cotizador': 'Cotizador / Escáner',
  '/trabajos': 'Órdenes de Trabajo',
  '/clientes': 'Directorio de Clientes',
  '/almacen': 'Inventario de Insumos',
  '/caja': 'Caja / Balance',
  '/reportes': 'Reportes y Analítica',
  '/tarifas': 'Tarifas de Servicios',
  '/configuracion': 'Configuración Sistema',
};

export default function TopBar({ isMobile, onToggleMobileMenu }) {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || 'TroquelMaster';

  const today = new Date();
  const dateStr = today.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });

  return (
    <header
      style={{
        height: isMobile ? 56 : 64,
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--outline-variant)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        padding: isMobile ? '0 12px' : '0 var(--space-lg)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* Left Side (Hamburger icon on mobile + Page Title) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isMobile && (
          <button
            onClick={onToggleMobileMenu}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 26 }}>menu</span>
          </button>
        )}
        <span className="text-headline-md" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: isMobile ? 17 : 20 }}>
          {pageTitle}
        </span>
      </div>

      {/* Right Side Date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="text-utility-mono" style={{ color: 'var(--on-surface-variant)', fontSize: isMobile ? 11 : 13 }}>
          {dateStr}
        </span>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--on-surface-variant)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>account_circle</span>
        </button>
      </div>
    </header>
  );
}
