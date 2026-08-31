import { useState, useCallback } from 'react';
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
  const [activeTab, setActiveTab] = useState('tarifas');
  const [showToast, setShowToast] = useState(false);

  const handleSave = useCallback(() => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="text-headline-lg" style={{ color: 'var(--on-surface)' }}>Configuración y Tarifas</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 4, maxWidth: 640 }}>
            Gestione las variables globales de cotización, impuestos aplicables y estado del sistema.
            Los cambios aquí afectan a todas las nuevas cotizaciones generadas.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>history</span>
            Historial de Cambios
          </button>
          <button className="btn-primary" style={{ borderRadius: 8, padding: '8px 16px' }} onClick={handleSave}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
            Guardar Configuración
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--outline-variant)' }}>
        <nav style={{ display: 'flex', gap: 'var(--space-lg)' }}>
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
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--on-surface)';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--on-surface-variant)';
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
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)' }}>
              {/* Variables de Cotización */}
              <div className="card-level-1" style={{ padding: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>price_change</span>
                  <h3 className="text-headline-md" style={{ color: 'var(--on-surface)' }}>Variables de Cotización</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Precio Base por CM Lineal ($)', value: '0.15' },
                    { label: 'Costo Base Madera (m²)', value: '45.00' },
                    { label: 'Costo Pleca (m)', value: '2.50' },
                    { label: 'Costo Goma Expulsora (m)', value: '1.80' },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                        {field.label}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                          color: 'var(--on-surface-variant)', fontSize: 14, pointerEvents: 'none',
                        }}>$</span>
                        <input
                          type="number"
                          defaultValue={field.value}
                          className="input-field text-utility-mono"
                          style={{ paddingLeft: 28 }}
                          step="0.01"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cargos Adicionales */}
              <div className="card-level-1" style={{ padding: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>design_services</span>
                  <h3 className="text-headline-md" style={{ color: 'var(--on-surface)' }}>Cargos Adicionales</h3>
                </div>
                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                    Tarifa de Diseño (Hora)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--on-surface-variant)', fontSize: 14, pointerEvents: 'none',
                    }}>$</span>
                    <input type="number" defaultValue="35.00" className="input-field text-utility-mono" style={{ paddingLeft: 28 }} step="1" />
                  </div>
                </div>
                <div style={{
                  marginTop: 16, padding: 8, backgroundColor: 'var(--surface)', border: '1px solid var(--outline-variant)',
                  borderRadius: 4, display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: 20, marginTop: 2 }}>info</span>
                  <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                    La tarifa de diseño se aplica manualmente en la cotización dependiendo de la complejidad del archivo CAD proporcionado por el cliente.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'impuestos' && (
          <motion.div key="impuestos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="card-level-1" style={{ padding: 'var(--space-lg)', maxWidth: 800 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--outline-variant)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>receipt_long</span>
                <h3 className="text-headline-md" style={{ color: 'var(--on-surface)' }}>Datos de Facturación</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Razón Social</label>
                  <input type="text" defaultValue="Troqueles y Suajes Industriales S.A. de C.V." className="input-field" />
                </div>
                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>RUC / NIT</label>
                  <input type="text" defaultValue="TSI-890214-H8A" className="input-field text-utility-mono" />
                </div>
                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Porcentaje IGV / IVA (%)</label>
                  <input type="number" defaultValue="16.0" step="0.1" className="input-field text-utility-mono" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Dirección Fiscal</label>
                  <textarea
                    rows={2}
                    defaultValue="Av. de la Industria 1450, Parque Industrial Norte, Nave 4."
                    className="input-field"
                    style={{ resize: 'none' }}
                  />
                </div>
                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Serie Comprobantes</label>
                  <input type="text" defaultValue="A-TRQ" className="input-field text-utility-mono" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'sistema' && (
          <motion.div key="sistema" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', maxWidth: 960 }}>
              {/* Integrations */}
              <div className="card-level-1" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>hub</span>
                    <h3 className="text-headline-md" style={{ color: 'var(--on-surface)' }}>Integraciones ERP</h3>
                  </div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary-container)', color: 'var(--on-primary-container)', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}>
                    <span className="animate-subtle-pulse" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--on-primary-container)' }} />
                    CONECTADO
                  </span>
                </div>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 16 }}>
                  El sistema está sincronizando datos maestros de inventario (madera, pleca) con SAP Business One.
                </p>
                <div style={{
                  marginTop: 'auto', backgroundColor: 'var(--surface)', border: '1px solid var(--outline-variant)',
                  borderRadius: 4, padding: 8, fontFamily: 'monospace', fontSize: 12,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--outline-variant)', paddingBottom: 4, marginBottom: 4 }}>
                    <span style={{ color: 'var(--on-surface-variant)' }}>Último Ping:</span>
                    <span style={{ color: 'var(--primary)' }}>Hace 2 min</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--on-surface-variant)' }}>Endpoint:</span>
                    <span style={{ color: 'var(--on-surface)' }}>api.sap-b1.local/v1/sync</span>
                  </div>
                </div>
              </div>

              {/* App Mode */}
              <div className="card-level-1" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)' }}>warning</span>
                    <h3 className="text-headline-md" style={{ color: 'var(--on-surface)' }}>Modo de Operación</h3>
                  </div>
                  <span style={{
                    display: 'inline-flex', padding: '4px 8px', borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}>
                    MODO DEMO
                  </span>
                </div>
                <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 16 }}>
                  El sistema está operando en entorno aislado de pruebas. Las cotizaciones generadas no afectarán el inventario real ni la facturación.
                </p>
                <div style={{ marginTop: 'auto' }}>
                  <button style={{
                    width: '100%', padding: '8px 0', border: '1px solid var(--tertiary)', color: 'var(--tertiary)',
                    backgroundColor: 'transparent', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8, fontFamily: 'Inter', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
                    textTransform: 'uppercase', transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--tertiary)';
                      e.currentTarget.style.color = 'var(--on-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--tertiary)';
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rocket_launch</span>
                    Cambiar a Producción
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <div className={`toast ${showToast ? 'visible' : ''}`}>
        <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        <div>
          <h4 className="text-label-caps" style={{ color: 'var(--on-surface)' }}>Configuración Guardada</h4>
          <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>Los cambios globales han sido aplicados al sistema.</p>
        </div>
      </div>
    </motion.div>
  );
}
