import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/',              icon: 'dashboard',              label: 'Dashboard' },
  { path: '/cotizador',     icon: 'qr_code_scanner',        label: 'Cotizador / Escáner' },
  { path: '/trabajos',      icon: 'precision_manufacturing', label: 'Trabajos' },
  { path: '/clientes',      icon: 'groups',                 label: 'Clientes' },
  { path: '/almacen',       icon: 'inventory_2',            label: 'Almacén' },
  { path: '/caja',          icon: 'payments',               label: 'Caja' },
  { path: '/reportes',      icon: 'analytics',              label: 'Reportes' },
  { path: '/tarifas',       icon: 'payments',               label: 'Tarifas' },
  { path: '/configuracion', icon: 'settings',               label: 'Configuración' },
];

export default function Sidebar({ isMobile, mobileOpen, setMobileOpen }) {
  const location = useLocation();

  if (isMobile && !mobileOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop for Mobile */}
      {isMobile && mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5,20,37,0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 90,
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <nav
        style={{
          width: 256,
          minWidth: 256,
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          backgroundColor: 'var(--surface-container)',
          borderRight: '1px solid var(--outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-md)',
          zIndex: isMobile ? 100 : 50,
          overflowY: 'auto',
          boxShadow: isMobile ? '8px 0 24px rgba(0,0,0,0.6)' : 'none',
        }}
      >
        {/* Brand Header */}
        <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--primary-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--on-primary-container)',
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                precision_manufacturing
              </span>
            </div>
            <div>
              <div className="text-headline-md" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                TroquelMaster
              </div>
              <div className="text-label-caps" style={{ color: 'var(--on-surface-variant)', fontSize: 11 }}>
                Gestión de Troqueles
              </div>
            </div>
          </div>

          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink key={item.path} to={item.path} onClick={() => isMobile && setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: isActive ? 'var(--secondary-container)' : 'transparent',
                    color: isActive ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)',
                    fontWeight: isActive ? 700 : 400,
                    fontSize: 14,
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 22,
                      fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </motion.div>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
