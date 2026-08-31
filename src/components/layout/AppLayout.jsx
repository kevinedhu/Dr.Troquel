import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const bottomNavItems = [
  { path: '/',          icon: 'dashboard',              label: 'Dashboard' },
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
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} isMobile={isMobile} />

        {/* Main Content Area */}
        <main
          style={{
            flex: 1,
            marginLeft: isMobile ? 0 : 256,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            width: '100%',
          }}
        >
          <TopBar isMobile={isMobile} onToggleMobileMenu={() => setMobileOpen(!mobileOpen)} />
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile ? 12 : 'var(--space-lg)',
              backgroundColor: 'var(--background)',
              paddingBottom: isMobile ? 70 : 'var(--space-lg)', // Space for bottom nav on mobile
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* Sticky Bottom Navigation Bar for Mobile Cell Phones */}
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
            boxShadow: '0 -4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {bottomNavItems.map(item => {
            const isActive = location.pathname === item.path;
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
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 400,
                  padding: '4px 8px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
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
