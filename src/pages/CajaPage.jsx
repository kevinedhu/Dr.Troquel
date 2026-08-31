import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Chart, registerables } from 'chart.js';
import MetricCard from '../components/shared/MetricCard';
import { getCajaTransactions, saveCajaTransactions, syncCajaWithJobs, clearCaja } from '../services/dataStore';

Chart.register(...registerables);

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function CajaPage() {
  const [txList, setTxList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  // Form state
  const [concept, setConcept] = useState('');
  const [category, setCategory] = useState('Producción');
  const [method, setMethod] = useState('Efectivo');
  const [amount, setAmount] = useState('');
  const [isIncome, setIsIncome] = useState(true);

  const refreshCajaData = () => {
    syncCajaWithJobs();
    setTxList(getCajaTransactions());
  };

  useEffect(() => {
    refreshCajaData();
    window.addEventListener('troquelmaster_data_changed', refreshCajaData);
    return () => window.removeEventListener('troquelmaster_data_changed', refreshCajaData);
  }, []);

  // Add custom manual transaction
  const handleAddTx = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!concept.trim() || isNaN(val) || val <= 0) return;

    const now = new Date();
    const timeStr = `${now.getDate()}/${now.getMonth() + 1} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newTx = {
      id: `tx_custom_${Date.now()}`,
      date: timeStr,
      concept: concept.trim(),
      category,
      method,
      methodIcon: method === 'Efectivo' ? 'payments' : method === 'Transferencia' ? 'account_balance' : 'phone_iphone',
      amountVal: val,
      amount: `${isIncome ? '+' : '-'} S/ ${val.toFixed(2)}`,
      isIncome,
      timestamp: Date.now(),
    };

    const updated = [newTx, ...txList];
    saveCajaTransactions(updated);
    setShowAddModal(false);
    setConcept('');
    setAmount('');
  };

  // Toggle selection checkbox
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === txList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(txList.map(t => t.id));
    }
  };

  // Delete checked transactions
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`¿Estás seguro de eliminar ${selectedIds.length} transacción(es) seleccionada(s)?`)) {
      const updated = txList.filter(t => !selectedIds.includes(t.id));
      saveCajaTransactions(updated);
      setSelectedIds([]);
    }
  };

  // Clear all caja
  const handleClearAll = () => {
    if (window.confirm('¿Estás seguro de limpiar el registro de caja?')) {
      clearCaja();
      setSelectedIds([]);
    }
  };

  // Calculate dynamic financial metrics
  const totalIngresos = txList.filter(t => t.isIncome).reduce((sum, t) => sum + (t.amountVal || 0), 0);
  const totalEgresos = txList.filter(t => !t.isIncome).reduce((sum, t) => sum + (t.amountVal || 0), 0);
  const balance = totalIngresos - totalEgresos;

  // Dynamic Payment Method breakdown (Yape, Efectivo, Plin, Transferencia)
  const incomesOnly = txList.filter(t => t.isIncome);
  const yapeTotal = incomesOnly.filter(t => t.method === 'Yape').reduce((s, t) => s + t.amountVal, 0);
  const efectivoTotal = incomesOnly.filter(t => t.method === 'Efectivo').reduce((s, t) => s + t.amountVal, 0);
  const plinTotal = incomesOnly.filter(t => t.method === 'Plin').reduce((s, t) => s + t.amountVal, 0);
  const transfTotal = incomesOnly.filter(t => t.method === 'Transferencia').reduce((s, t) => s + t.amountVal, 0);

  const getPct = (val) => totalIngresos > 0 ? ((val / totalIngresos) * 100).toFixed(0) + '%' : '0%';

  const barChartRef = useRef(null);
  const barChartInstance = useRef(null);

  useEffect(() => {
    if (barChartRef.current) {
      const ctx = barChartRef.current.getContext('2d');
      if (barChartInstance.current) barChartInstance.current.destroy();
      barChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
          datasets: [
            {
              label: 'Ingresos',
              data: [totalIngresos > 0 ? totalIngresos : 0, 0, 0, 0, 0, 0],
              backgroundColor: 'rgba(148, 204, 255, 0.8)',
              borderRadius: 4,
            },
            {
              label: 'Egresos',
              data: [totalEgresos > 0 ? totalEgresos : 0, 0, 0, 0, 0, 0],
              backgroundColor: 'rgba(255, 180, 171, 0.8)',
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: '#283648' }, ticks: { color: '#89929b', callback: v => 'S/ ' + v } },
            x: { grid: { display: false }, ticks: { color: '#89929b' } },
          },
        },
      });
    }
    return () => { if (barChartInstance.current) barChartInstance.current.destroy(); };
  }, [totalIngresos, totalEgresos]);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-lg)' }}>
        <div>
          <h1 className="text-headline-lg" style={{ color: 'var(--on-surface)' }}>Caja y Flujo de Cobros</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
            Sincronizado automáticamente con los métodos de pago de las Órdenes de Trabajo.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {txList.length > 0 && (
            <button
              className="btn-secondary"
              style={{ borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--error)', borderColor: 'var(--error)' }}
              onClick={handleClearAll}
              title="Limpiar todas las transacciones de caja"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_sweep</span>
              Limpiar
            </button>
          )}
          <button className="btn-primary" style={{ borderRadius: 8, padding: '8px 16px' }} onClick={() => setShowAddModal(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Registrar Movimiento
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-gutter)', marginBottom: 'var(--space-xl)' }}>
        <MetricCard label="Total Ingresos Cobrados" value={`S/ ${totalIngresos.toFixed(2)}`} icon="arrow_upward" iconColor="var(--secondary)" subtitle={`${incomesOnly.length} cobros`} trendIcon="trending_up" index={0} />
        <MetricCard label="Total Egresos" value={`S/ ${totalEgresos.toFixed(2)}`} icon="arrow_downward" iconColor="var(--error)" subtitle={`${txList.filter(t => !t.isIncome).length} egresos`} index={1} />
        <MetricCard label="Balance Neto en Caja" value={`S/ ${balance.toFixed(2)}`} icon="account_balance_wallet" iconColor="var(--primary)" subtitle="Saldos disponibles" variant="highlight" index={2} />
        <MetricCard label="Total Operaciones" value={txList.length} icon="receipt_long" subtitle="" index={3}>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, backgroundColor: 'var(--surface-variant)', padding: '2px 8px', borderRadius: 4, color: 'var(--on-surface-variant)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--secondary)' }} /> {incomesOnly.length} Ingresos
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, backgroundColor: 'var(--surface-variant)', padding: '2px 8px', borderRadius: 4, color: 'var(--on-surface-variant)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--error)' }} /> {txList.filter(t => !t.isIncome).length} Egresos
            </span>
          </div>
        </MetricCard>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-gutter)', marginBottom: 'var(--space-xl)' }}>
        <motion.div className="card-level-1" style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
          <h3 className="text-headline-md" style={{ color: 'var(--on-surface)', marginBottom: 16 }}>Flujo Semanal de Caja</h3>
          <div style={{ flex: 1, position: 'relative', minHeight: 200 }}>
            <canvas ref={barChartRef}></canvas>
          </div>
        </motion.div>

        {/* Dynamic Payment Method breakdown */}
        <motion.div className="card-level-1" style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column' }}>
          <h3 className="text-headline-md" style={{ color: 'var(--on-surface)', marginBottom: 16 }}>Desglose Métodos de Pago</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Efectivo', amount: efectivoTotal, pct: getPct(efectivoTotal), color: '#22c55e', icon: 'payments' },
                { label: 'Yape', amount: yapeTotal, pct: getPct(yapeTotal), color: '#93ccff', icon: 'phone_iphone' },
                { label: 'Plin', amount: plinTotal, pct: getPct(plinTotal), color: '#ca8100', icon: 'phone_iphone' },
                { label: 'Transferencia', amount: transfTotal, pct: getPct(transfTotal), color: '#0284c7', icon: 'account_balance' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderRadius: 6, backgroundColor: 'var(--surface-container-low)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: m.color }} />
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: m.color }}>{m.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>{m.label}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>S/. {m.amount.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>{m.pct}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Transaction Ledger Table with Checkboxes for Selection & Delete */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-level-1" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: 16, borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', backgroundColor: 'var(--surface-container-high)', borderRadius: '12px 12px 0 0',
        }}>
          <h3 className="text-headline-md" style={{ color: 'var(--on-surface)' }}>Registro de Transacciones de Caja</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                style={{
                  padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6,
                  backgroundColor: 'rgba(239,68,68,0.2)', color: 'var(--error)',
                  border: '1px solid var(--error)', cursor: 'pointer', fontFamily: 'Inter',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                Eliminar ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table-industrial">
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-container-lowest)' }}>
                <th style={{ width: 40, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={txList.length > 0 && selectedIds.length === txList.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th>Fecha</th>
                <th>Concepto / Orden</th>
                <th>Categoría</th>
                <th>Método de Pago</th>
                <th style={{ textAlign: 'right' }}>Monto (S/.)</th>
                <th style={{ textAlign: 'center' }}>Boleta</th>
              </tr>
            </thead>
            <tbody>
              {txList.map((t) => {
                const isChecked = selectedIds.includes(t.id);
                return (
                  <tr key={t.id} style={{ backgroundColor: isChecked ? 'rgba(147,204,255,0.06)' : 'transparent' }}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(t.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td className="text-utility-mono" style={{ fontSize: 12 }}>{t.date}</td>
                    <td style={{ fontWeight: 600 }}>{t.concept}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                        backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface-variant)',
                      }}>
                        {t.category}
                      </span>
                    </td>
                    <td className="text-body-sm" style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t.methodIcon}</span>
                      {t.method}
                    </td>
                    <td className="text-utility-mono" style={{
                      textAlign: 'right', fontWeight: 700,
                      color: t.isIncome ? 'var(--secondary)' : 'var(--error)',
                    }}>
                      {t.amount}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => { setSelectedTx(t); setShowModal(true); }}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                        title="Ver Boleta"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>receipt_long</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {txList.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: 48, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3 }}>account_balance_wallet</span>
                      <p className="text-body-sm">No hay transacciones registradas aún en caja.</p>
                      <button className="btn-primary" style={{ borderRadius: 6, fontSize: 12, padding: '6px 12px', marginTop: 8 }} onClick={() => setShowAddModal(true)}>
                        + Registrar Movimiento
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* New Transaction Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5,20,37,0.85)', backdropFilter: 'blur(4px)' }} onClick={() => setShowAddModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'relative', width: '100%', maxWidth: 440, backgroundColor: 'var(--surface)',
              border: '1px solid var(--outline-variant)', borderRadius: 12, padding: 24, zIndex: 101,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="text-headline-md" style={{ color: 'var(--on-surface)' }}>Registrar Movimiento Manual de Caja</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddTx} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Tipo de Operación</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setIsIncome(true)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Inter', fontSize: 13, fontWeight: 600,
                      backgroundColor: isIncome ? 'rgba(34,197,94,0.2)' : 'var(--surface-container)',
                      color: isIncome ? '#22c55e' : 'var(--on-surface-variant)',
                      border: isIncome ? '1px solid #22c55e' : '1px solid var(--outline-variant)',
                    }}
                  >
                    + INGRESO
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsIncome(false)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Inter', fontSize: 13, fontWeight: 600,
                      backgroundColor: !isIncome ? 'rgba(239,68,68,0.2)' : 'var(--surface-container)',
                      color: !isIncome ? 'var(--error)' : 'var(--on-surface-variant)',
                      border: !isIncome ? '1px solid var(--error)' : '1px solid var(--outline-variant)',
                    }}
                  >
                    - EGRESO
                  </button>
                </div>
              </div>

              <div>
                <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Concepto / Descripción *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Cobro de troquel u otro ingreso"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px' }}
                  >
                    <option value="Producción">Producción</option>
                    <option value="Materiales">Materiales</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Método de Pago</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px' }}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Yape">Yape</option>
                    <option value="Plin">Plin</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Monto (S/.) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ borderRadius: 6 }}>Registrar Movimiento</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Receipt Modal */}
      {showModal && selectedTx && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5,20,37,0.85)', backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'relative', width: '100%', maxWidth: 448, backgroundColor: 'var(--surface)',
              border: '1px solid var(--outline-variant)', borderRadius: 12, padding: 24, zIndex: 101,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="text-headline-md" style={{ color: 'var(--on-surface)' }}>Boleta / Comprobante</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div style={{ padding: 16, backgroundColor: 'var(--surface-container)', borderRadius: 8, fontFamily: 'monospace', fontSize: 13 }}>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)' }}>TroquelMaster S.A.C.</h4>
                <p style={{ color: 'var(--on-surface-variant)' }}>REGISTRO DE CAJA</p>
              </div>
              <p><strong>Concepto:</strong> {selectedTx.concept}</p>
              <p><strong>Método de Pago:</strong> {selectedTx.method}</p>
              <p><strong>Monto:</strong> {selectedTx.amount}</p>
              <p><strong>Fecha:</strong> {selectedTx.date}</p>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
