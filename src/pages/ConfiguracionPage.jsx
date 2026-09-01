import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

const tabs = [
  { id: 'tarifas', label: 'Tarifas Globales' },
  { id: 'impuestos', label: 'Ajustes Fiscales' },
  { id: 'sistema', label: 'Estado del Sistema' },
];

export default function ConfiguracionPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState('tarifas');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleSave = useCallback(() => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" style={{ paddingBottom: 16 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: isMobile ? 12 : 'var(--space-xl)',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 12,
      }}>
        <div>
          <h1 className="text-headline-lg" style={{ color: 'var(--on-surface)' }}>Configuración y Tarifas</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 2, maxWidth: 640 }}>
            Variables globales de cotización, impuestos aplicables y estado del sistema.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, width: isMobile ? '100%' : 'auto' }}>
          <button className="btn-primary" style={{ borderRadius: 8, padding: '8px 16px', minHeight: 40, width: isMobile ? '100%' : 'auto', justifyContent: 'center' }} onClick={handleSave}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
            Guardar Configuración
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: isMobile ? 12 : 'var(--space-lg)', borderBottom: '1px solid var(--outline-variant)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <nav style={{ display: 'flex', gap: isMobile ? 16 : 'var(--space-lg)', minWidth: 'max-content' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="text-label-caps"
              style={{
                paddingBottom: 8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--on-surface-variant)',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.2s ease',
                fontFamily: 'Inter',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'tarifas' && (
          <motion.div key="tarifas" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
              gap: isMobile ? 10 : 'var(--space-lg)',
            }}>
              {/* Variables de Cotización */}
              <div className="card-level-1" style={{ padding: isMobile ? 12 : 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>price_change</span>
                  <h3 className="text-headline-md" style={{ color: 'var(--on-surface)', fontSize: 16 }}>Variables de Cotización</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Precio Base por CM Lineal (S/.)', value: '0.90' },
                    { label: 'Costo Base Madera Troquel (S/./cm²)', value: '0.35' },
                    { label: 'Costo Pleca Doblez (S/./cm)', value: '0.55' },
                    { label: 'Costo Armado / Setup Fijo (S/.)', value: '25.00' },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>
                        {field.label}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                          color: 'var(--primary)', fontSize: 12, fontWeight: 700, pointerEvents: 'none',
                        }}>S/.</span>
                        <input
                          type="number"
                          defaultValue={field.value}
                          className="input-field text-utility-mono"
                          style={{ paddingLeft: 32, minHeight: 38, fontSize: 14 }}
                          step="0.01"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cargos Adicionales */}
              <div className="card-level-1" style={{ padding: isMobile ? 12 : 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>design_services</span>
                  <h3 className="text-headline-md" style={{ color: 'var(--on-surface)', fontSize: 16 }}>Cargos Adicionales</h3>
                </div>
                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>
                    Tarifa de Diseño CAD (Hora)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--primary)', fontSize: 12, fontWeight: 700, pointerEvents: 'none',
                    }}>S/.</span>
                    <input type="number" defaultValue="35.00" className="input-field text-utility-mono" style={{ paddingLeft: 32, minHeight: 38, fontSize: 14 }} step="1" />
                  </div>
                </div>
                <div style={{
                  marginTop: 12, padding: 8, backgroundColor: 'var(--surface)', border: '1px solid var(--outline-variant)',
                  borderRadius: 6, display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: 18, marginTop: 1 }}>info</span>
                  <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                    Se aplica en la cotización según la complejidad del archivo del cliente.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'impuestos' && (
          <motion.div key="impuestos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="card-level-1" style={{ padding: isMobile ? 12 : 'var(--space-lg)', maxWidth: 800 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--outline-variant)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>receipt_long</span>
                <h3 className="text-headline-md" style={{ color: 'var(--on-surface)', fontSize: 16 }}>Datos de Facturación</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>Razón Social</label>
                  <input type="text" defaultValue="Dr. Troquel S.A.C." className="input-field" style={{ minHeight: 38, fontSize: 14 }} />
                </div>
                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>RUC</label>
                  <input type="text" defaultValue="20601234567" className="input-field text-utility-mono" style={{ minHeight: 38, fontSize: 14 }} />
                </div>
                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>IGV (%)</label>
                  <input type="number" defaultValue="18.0" step="0.1" className="input-field text-utility-mono" style={{ minHeight: 38, fontSize: 14 }} />
                </div>
                <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>Dirección Fiscal</label>
                  <input
                    type="text"
                    defaultValue="Lima, Perú"
                    className="input-field"
                    style={{ minHeight: 38, fontSize: 14 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'sistema' && (
          <motion.div key="sistema" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 10 : 'var(--space-lg)',
              maxWidth: 960,
            }}>
              {/* Integrations */}
              <div className="card-level-1" style={{ padding: isMobile ? 12 : 'var(--space-lg)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>hub</span>
                    <h3 className="text-headline-md" style={{ color: 'var(--on-surface)', fontSize: 16 }}>Almacenamiento Local</h3>
                  </div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 10, fontWeight: 700,
                  }}>
                    ACTIVO
                  </span>
                </div>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 12, fontSize: 13 }}>
                  Todas las cotizaciones, órdenes y movimientos de insumos se guardan automáticamente en tu navegador.
                </p>
              </div>

              {/* App Mode */}
              <div className="card-level-1" style={{ padding: isMobile ? 12 : 'var(--space-lg)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>devices</span>
                    <h3 className="text-headline-md" style={{ color: 'var(--on-surface)', fontSize: 16 }}>Modo Móvil / PWA</h3>
                  </div>
                  <span style={{
                    display: 'inline-flex', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(147,204,255,0.15)', color: 'var(--primary)', fontSize: 10, fontWeight: 700,
                  }}>
                    RESPONSIVE
                  </span>
                </div>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 12, fontSize: 13 }}>
                  Optimizado para celulares con cámara integrada y visor táctil.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'var(--surface-container-highest)', color: 'var(--on-surface)',
          padding: '10px 20px', borderRadius: 8, border: '1px solid var(--primary)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span className="material-symbols-outlined" style={{ color: '#22c55e' }}>check_circle</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Configuración guardada</span>
        </div>
      )}
    </motion.div>
  );
}
