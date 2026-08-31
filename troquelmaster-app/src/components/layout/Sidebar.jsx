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

export default function Sidebar() {
  const location = useLocation();

  return (
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
        zIndex: 50,
        overflowY: 'auto',
      }}
    >
      {/* Brand Header */}
      <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
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
          <div className="text-label-caps" style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 11 }}>
            Gestión de Troqueles
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', paddingRight: 4 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
              <motion.div
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: isActive ? 'var(--secondary-container)' : 'transparent',
                  color: isActive ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)',
                  fontWeight: isActive ? 700 : 400,
                  fontSize: 14,
                  lineHeight: '20px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease, color 0.2s ease',
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--surface-variant)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
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
  );
}
