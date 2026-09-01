import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MetricCard from '../components/shared/MetricCard';
import { getMaterials, getMaterialMovements, addMaterialMovement, clearInsumos } from '../services/dataStore';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function AlmacenPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [materials, setMaterials] = useState([]);
  const [movements, setMovements] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Modal form state
  const [materialName, setMaterialName] = useState('');
  const [movementType, setMovementType] = useState('salida'); // Default egreso/consumo
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('m');
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const refreshInsumosData = () => {
    setMaterials(getMaterials());
    setMovements(getMaterialMovements());
  };

  useEffect(() => {
    refreshInsumosData();
    window.addEventListener('troquelmaster_data_changed', refreshInsumosData);
    return () => window.removeEventListener('troquelmaster_data_changed', refreshInsumosData);
  }, []);

  const handleAddMovement = (e) => {
    e.preventDefault();
    const qtyVal = parseFloat(quantity);
    if (!materialName.trim() || isNaN(qtyVal) || qtyVal <= 0) return;

    addMaterialMovement({
      materialName,
      type: movementType,
      quantity: qtyVal,
      unit,
      price: price || 0,
      reason,
    });

    setShowModal(false);
    setMaterialName('');
    setQuantity('');
    setPrice('');
    setReason('');
  };

  const handleClearAll = () => {
    if (window.confirm('¿Estás seguro de limpiar todo el inventario y movimientos de insumos?')) {
      clearInsumos();
    }
  };

  const totalGastoInsumos = movements.reduce((sum, m) => sum + (m.priceVal || 0), 0);
  const totalEgresosInsumos = movements.filter(m => m.type === 'salida').reduce((sum, m) => sum + (m.priceVal || 0), 0);

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
          <h1 className="text-headline-lg" style={{ color: 'var(--on-surface)' }}>Inventario de Insumos</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 2 }}>
            Control de existencias, consumo de cuchilla/pleca y reporte de gastos.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, width: isMobile ? '100%' : 'auto' }}>
          {(materials.length > 0 || movements.length > 0) && (
            <button
              className="btn-secondary"
              style={{
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                color: 'var(--error)',
                borderColor: 'var(--error)',
                flex: isMobile ? 1 : 'initial',
                justifyContent: 'center',
              }}
              onClick={handleClearAll}
              title="Limpiar inventario y movimientos"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete_sweep</span>
              Limpiar
            </button>
          )}
          <button
            className="btn-primary"
            style={{
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              flex: isMobile ? 2 : 'initial',
              justifyContent: 'center',
            }}
            onClick={() => setShowModal(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Expense KPI Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? 8 : 'var(--space-md)',
        marginBottom: isMobile ? 12 : 'var(--space-xl)',
      }}>
        <div className="card-level-1" style={{ padding: isMobile ? 10 : 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.15)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>payments</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Gasto Total</div>
            <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 700, color: 'var(--error)', fontFamily: 'Inter' }}>
              S/. {totalGastoInsumos.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="card-level-1" style={{ padding: isMobile ? 10 : 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,185,95,0.15)', color: 'var(--tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>trending_down</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Consumo/Egresos</div>
            <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 700, color: 'var(--tertiary)', fontFamily: 'Inter' }}>
              S/. {totalEgresosInsumos.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="card-level-1" style={{ padding: isMobile ? 10 : 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(147,204,255,0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>inventory_2</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', fontSize: 11 }}>Materiales</div>
            <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'Inter' }}>
              {materials.length}
            </div>
          </div>
        </div>

        <div className="card-level-1" style={{ padding: isMobile ? 10 : 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>history</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', fontSize: 11 }}>Movimientos</div>
            <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 700, color: '#22c55e', fontFamily: 'Inter' }}>
              {movements.length}
            </div>
          </div>
        </div>
      </div>

      {/* Material Stock Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? 8 : 'var(--space-md)',
        marginBottom: isMobile ? 12 : 'var(--space-xl)',
      }}>
        {materials.map((mat, i) => (
          <MetricCard
            key={mat.id || mat.name}
            label={mat.name}
            value={mat.value}
            unit={mat.unit}
            variant={mat.variant || 'default'}
            badge={mat.status === 'optimo' ? 'ÓPTIMO' : mat.status === 'reordenar' ? 'REORDENAR' : 'CRÍTICO'}
            badgeClass={`badge-${mat.status}`}
            index={i}
          >
            <div style={{ marginTop: 8 }}>
              <div style={{ height: 4, borderRadius: 2, backgroundColor: 'var(--surface-variant)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (mat.value / 100) * 100)}%`, backgroundColor: mat.color }} />
              </div>
              <p className="text-utility-mono" style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginTop: 4 }}>
                {mat.min}
              </p>
            </div>
          </MetricCard>
        ))}
        {materials.length === 0 && (
          <div className="card-level-1" style={{ gridColumn: isMobile ? 'span 2' : 'span 4', padding: 24, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3, marginBottom: 8 }}>inventory_2</span>
            <p className="text-body-sm">No hay materiales registrados aún. Presiona "+ Nuevo Movimiento" para agregar.</p>
          </div>
        )}
      </div>

      {/* Movement History Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="card-level-1"
        style={{ overflow: 'hidden' }}
      >
        <div style={{
          padding: '10px 14px', borderBottom: '1px solid var(--outline-variant)',
          backgroundColor: 'var(--surface-container)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderRadius: '12px 12px 0 0',
        }}>
          <h2 className="text-headline-md" style={{ color: 'var(--on-surface)', fontSize: 15 }}>Historial de Movimientos y Gastos</h2>
          <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>{movements.length} regs</span>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="table-industrial" style={{ minWidth: isMobile ? 560 : '100%' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-variant)' }}>
                <th>Fecha</th>
                <th>Insumo</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Cantidad</th>
                <th style={{ textAlign: 'right' }}>Costo</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m, i) => (
                <motion.tr
                  key={m.id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 + i * 0.02 }}
                >
                  <td className="text-utility-mono" style={{ fontSize: 12 }}>{m.date}</td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{m.material}</td>
                  <td>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                      color: m.type === 'salida' ? 'var(--error)' : 'var(--secondary)',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                        {m.type === 'salida' ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                      {m.type === 'salida' ? 'Egreso' : 'Ingreso'}
                    </span>
                  </td>
                  <td className="text-utility-mono" style={{ textAlign: 'right', fontWeight: 700 }}>{m.qty}</td>
                  <td className="text-utility-mono" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--error)' }}>
                    {m.priceVal > 0 ? `S/. ${m.priceVal.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>{m.reason}</td>
                </motion.tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: 24, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                    No hay movimientos de insumos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Movement Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 120, display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : 16,
          }}>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5,20,37,0.85)', backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ opacity: 0, y: isMobile ? 80 : 0, scale: isMobile ? 1 : 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isMobile ? 80 : 0 }}
              style={{
                position: 'relative', width: '100%', maxWidth: 460, backgroundColor: 'var(--surface)',
                border: '1px solid var(--outline-variant)',
                borderRadius: isMobile ? '16px 16px 0 0' : 12,
                padding: isMobile ? '16px 14px' : 24,
                zIndex: 121,
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                maxHeight: '90vh', overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--outline-variant)', paddingBottom: 8 }}>
                <h3 className="text-headline-md" style={{ color: 'var(--on-surface)', fontSize: 16 }}>Registrar Movimiento</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleAddMovement} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>
                    Tipo de Movimiento *
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setMovementType('salida')}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 6,
                        backgroundColor: movementType === 'salida' ? 'rgba(239,68,68,0.2)' : 'var(--surface-container)',
                        border: `1px solid ${movementType === 'salida' ? 'var(--error)' : 'var(--outline-variant)'}`,
                        color: movementType === 'salida' ? 'var(--error)' : 'var(--on-surface)',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter',
                      }}
                    >
                      ↓ Egreso / Consumo
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementType('entrada')}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 6,
                        backgroundColor: movementType === 'entrada' ? 'rgba(34,197,94,0.2)' : 'var(--surface-container)',
                        border: `1px solid ${movementType === 'entrada' ? '#22c55e' : 'var(--outline-variant)'}`,
                        color: movementType === 'entrada' ? '#22c55e' : 'var(--on-surface)',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter',
                      }}
                    >
                      ↑ Entrada / Compra
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>
                    Nombre del Insumo / Material *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Cuchilla 2pt 23.8mm o Madera 18mm"
                    value={materialName}
                    onChange={(e) => setMaterialName(e.target.value)}
                    className="input-field"
                    style={{ minHeight: 38, fontSize: 14 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="ej. 25"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="input-field text-utility-mono"
                      style={{ minHeight: 38, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>
                      Unidad *
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', minHeight: 38, fontSize: 13 }}
                    >
                      <option value="m">Metros (m)</option>
                      <option value="planchas">Planchas</option>
                      <option value="tiras">Tiras</option>
                      <option value="piezas">Piezas / Unidades</option>
                      <option value="kg">Kilos (kg)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>
                    Costo / Gasto Total (S/.)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--error)', fontWeight: 700, fontSize: 12 }}>S/.</span>
                    <input
                      type="number"
                      step="0.50"
                      placeholder="0.00 (opcional)"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="input-field text-utility-mono"
                      style={{ paddingLeft: 30, minHeight: 38, fontSize: 14, color: 'var(--error)', fontWeight: 700 }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>
                    Motivo / Detalle
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Uso en OT-2024-001 o Compra proveedor"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="input-field"
                    style={{ minHeight: 38, fontSize: 14 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, minHeight: 38, justifyContent: 'center' }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 2, minHeight: 38, justifyContent: 'center' }}>
                    Registrar Movimiento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
