import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const bottomNavItems = [
  { path: '/',          icon: 'dashboard',              label: 'Inicio' },
  { path: '/cotizador', icon: 'qr_code_scanner',        label: 'Cotizar' },
  { path: '/trabajos',  icon: 'precision_manufacturing', label: 'Trabajos' },
  { path: '/almacen',   icon: 'inventory_2',            label: 'Almacén' },
  { path: '/caja',      icon: 'payments',               label: 'Caja' },
];

export default function AppLayout() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [location.pathname, isMobile]);

  const mainPaddingBottom = isMobile ? 72 : 'var(--space-lg)';

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', flexDirection: 'column', maxWidth: '100vw' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* Sidebar (desktop only or mobile drawer) */}
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} isMobile={isMobile} />

        {/* Main Content Area */}
        <main
          style={{
            flex: 1,
            marginLeft: isMobile ? 0 : 256,
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh',
            overflow: 'hidden',
            width: '100%',
            maxWidth: '100vw',
            minWidth: 0,
          }}
        >
          <TopBar isMobile={isMobile} onToggleMobileMenu={() => setMobileOpen(!mobileOpen)} />
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: isMobile ? '10px 10px' : 'var(--space-lg)',
              paddingBottom: mainPaddingBottom,
              backgroundColor: 'var(--background)',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Navigation Bar — mobile only */}
      {isMobile && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            backgroundColor: 'var(--surface-container-high)',
            borderTop: '1px solid var(--outline-variant)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 60,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
            paddingBottom: 'env(safe-area-inset-bottom, 0)',
          }}
        >
          {bottomNavItems.map(item => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                  fontSize: 9,
                  fontWeight: isActive ? 700 : 400,
                  fontFamily: 'Inter',
                  padding: '6px 12px',
                  flex: 1,
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 24,
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                    transition: 'all 0.2s',
                    color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                  }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}
