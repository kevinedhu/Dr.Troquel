import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MetricCard from '../components/shared/MetricCard';
import { getMaterials, getMaterialMovements, addMaterialMovement, clearInsumos } from '../services/dataStore';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function AlmacenPage() {
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

  // Calculate total material expenses (Gasto acumulado en insumos)
  const totalGastoInsumos = movements.reduce((sum, m) => sum + (m.priceVal || 0), 0);
  const totalEgresosInsumos = movements.filter(m => m.type === 'salida').reduce((sum, m) => sum + (m.priceVal || 0), 0);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 className="text-headline-lg" style={{ color: 'var(--on-surface)' }}>Inventario de Insumos y Materiales</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
            Control de existencias, consumo de cuchilla/pleca y reporte de gastos en insumos.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(materials.length > 0 || movements.length > 0) && (
            <button
              className="btn-secondary"
              style={{ borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--error)', borderColor: 'var(--error)' }}
              onClick={handleClearAll}
              title="Limpiar inventario y movimientos"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_sweep</span>
              Limpiar
            </button>
          )}
          <button className="btn-primary" style={{ borderRadius: 8, padding: '8px 16px', fontSize: 14 }} onClick={() => setShowModal(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Expense KPI Summary Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div className="card-level-1" style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.15)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Gasto Total en Insumos</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--error)', fontFamily: 'Inter' }}>
              S/. {totalGastoInsumos.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="card-level-1" style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'rgba(255,185,95,0.15)', color: 'var(--tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">trending_down</span>
          </div>
          <div>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Gasto por Consumo (Egresos)</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--tertiary)', fontFamily: 'Inter' }}>
              S/. {totalEgresosInsumos.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="card-level-1" style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'rgba(147,204,255,0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <div>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Materiales Registrados</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'Inter' }}>
              {materials.length}
            </div>
          </div>
        </div>

        <div className="card-level-1" style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">history</span>
          </div>
          <div>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Total Movimientos</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e', fontFamily: 'Inter' }}>
              {movements.length}
            </div>
          </div>
        </div>
      </div>

      {/* Material Stock Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
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
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${Math.min(100, (mat.value / 100) * 100)}%`, backgroundColor: mat.color }} />
              </div>
              <p className="text-utility-mono" style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 4 }}>
                {mat.min}
              </p>
            </div>
          </MetricCard>
        ))}
        {materials.length === 0 && (
          <div className="card-level-1" style={{ gridColumn: 'span 4', padding: 32, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3, marginBottom: 8 }}>inventory_2</span>
            <p className="text-body-sm">No hay materiales registrados aún. Presiona "+ Nuevo Movimiento" para agregar un insumo y su costo.</p>
          </div>
        )}
      </div>

      {/* Movement History Table with Price Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="card-level-1"
        style={{ overflow: 'hidden' }}
      >
        <div style={{
          padding: 'var(--space-md)', borderBottom: '1px solid var(--outline-variant)',
          backgroundColor: 'var(--surface-container)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderRadius: '12px 12px 0 0',
        }}>
          <h2 className="text-headline-md" style={{ color: 'var(--on-surface)' }}>Historial de Movimientos y Gastos de Insumos</h2>
          <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>{movements.length} movimientos</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-industrial">
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-variant)' }}>
                <th>Fecha/Hora</th>
                <th>Material / Insumo</th>
                <th>Movimiento</th>
                <th style={{ textAlign: 'right' }}>Cantidad</th>
                <th style={{ textAlign: 'right' }}>Precio / Costo</th>
                <th>Motivo / OT</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m, i) => (
                <motion.tr
                  key={m.id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 + i * 0.03 }}
                >
                  <td className="text-utility-mono">{m.date}</td>
                  <td style={{ fontWeight: 600 }}>{m.material}</td>
                  <td>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      color: m.type === 'salida' ? 'var(--error)' : 'var(--secondary)',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        {m.type === 'salida' ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                      {m.type === 'salida' ? 'Egreso / Consumo' : 'Entrada / Ingreso'}
                    </span>
                  </td>
                  <td className="text-utility-mono" style={{ textAlign: 'right', fontWeight: 700 }}>{m.qty}</td>
                  <td className="text-utility-mono" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--error)' }}>
                    {m.priceVal > 0 ? `S/. ${m.priceVal.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ color: 'var(--on-surface-variant)' }}>{m.reason}</td>
                </motion.tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: 32, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                    No hay movimientos de insumos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Movement Modal (Con Precio / Costo) */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5,20,37,0.85)', backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'relative', width: '100%', maxWidth: 460, backgroundColor: 'var(--surface)',
              border: '1px solid var(--outline-variant)', borderRadius: 12, padding: 24, zIndex: 101,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="text-headline-md" style={{ color: 'var(--on-surface)' }}>Registrar Insumo y Gasto</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddMovement} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                  Nombre del Material / Insumo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Fleje de corte 2pt, Pleca doblez, Madera 18mm..."
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Tipo de Movimiento</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setMovementType('salida')}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Inter', fontSize: 13, fontWeight: 600,
                      backgroundColor: movementType === 'salida' ? 'rgba(239,68,68,0.2)' : 'var(--surface-container)',
                      color: movementType === 'salida' ? 'var(--error)' : 'var(--on-surface-variant)',
                      border: movementType === 'salida' ? '1px solid var(--error)' : '1px solid var(--outline-variant)',
                    }}
                  >
                    - EGRESO / CONSUMO
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('entrada')}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Inter', fontSize: 13, fontWeight: 600,
                      backgroundColor: movementType === 'entrada' ? 'rgba(34,197,94,0.2)' : 'var(--surface-container)',
                      color: movementType === 'entrada' ? '#22c55e' : 'var(--on-surface-variant)',
                      border: movementType === 'entrada' ? '1px solid #22c55e' : '1px solid var(--outline-variant)',
                    }}
                  >
                    + ENTRADA (Compra)
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Cantidad *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="ej. 25"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Unidad</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="m">metros (m)</option>
                    <option value="planchas">planchas</option>
                    <option value="unidades">unidades</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>
                  Precio / Costo del Insumo (S/.) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--error)', fontWeight: 700, fontSize: 13, pointerEvents: 'none',
                  }}>S/.</span>
                  <input
                    type="number"
                    step="0.50"
                    placeholder="ej. 45.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="input-field text-utility-mono"
                    style={{ paddingLeft: 36, fontWeight: 700, color: 'var(--error)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Motivo / Orden de Trabajo</label>
                <input
                  type="text"
                  placeholder="ej. Producción OT-2026-005 o Compra de insumos"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ borderRadius: 6 }}>Registrar Gasto e Insumo</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
