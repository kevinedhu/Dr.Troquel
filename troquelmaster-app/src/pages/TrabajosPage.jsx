import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import StatusBadge from '../components/shared/StatusBadge';
import {
  getTrabajos,
  getClientes,
  addTrabajoOrder,
  editTrabajoOrder,
  updateJobStatus,
  clearTrabajos,
  SERVICIOS_LIST,
  METODOS_PAGO_LIST,
} from '../services/dataStore';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function TrabajosPage() {
  const navigate = useNavigate();
  const [trabajos, setTrabajos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null); // null if creating, job object if editing
  const [selectedJob, setSelectedJob] = useState(null);

  // Form state
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceType, setServiceType] = useState(SERVICIOS_LIST[0]);
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [meters, setMeters] = useState('');
  const [status, setStatus] = useState('en-cola');

  // Sync data from store
  const refreshData = () => {
    setTrabajos(getTrabajos());
    setClientes(getClientes());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('troquelmaster_data_changed', refreshData);
    return () => window.removeEventListener('troquelmaster_data_changed', refreshData);
  }, []);

  const handleMarkCompleted = (jobId, e) => {
    e?.stopPropagation();
    updateJobStatus(jobId, 'completado');
  };

  // Open modal for NEW job
  const handleOpenNewModal = () => {
    setEditingJob(null);
    setClientName('');
    setPhone('');
    setServiceType(SERVICIOS_LIST[0]);
    setQuantity('1');
    setPrice('');
    setPaymentMethod('Efectivo');
    setMeters('');
    setStatus('en-cola');
    setShowAddModal(true);
  };

  // Open modal for EDITING existing job
  const handleOpenEditModal = (job, e) => {
    e?.stopPropagation();
    setEditingJob(job);
    setClientName(job.client || '');
    setPhone(job.phone || '');
    setServiceType(job.type || SERVICIOS_LIST[0]);
    setQuantity(String(job.quantity || 1));
    setPrice(String(job.priceNumber || ''));
    setPaymentMethod(job.paymentMethod || 'Efectivo');
    setMeters(String(job.meters || ''));
    setStatus(job.status || 'en-cola');
    setShowAddModal(true);
  };

  // Select existing client to auto-fill phone
  const handleClientSelect = (e) => {
    const selectedName = e.target.value;
    setClientName(selectedName);
    const found = clientes.find(c => c.name === selectedName);
    if (found && found.phone && found.phone !== '—') {
      setPhone(found.phone);
    }
  };

  // Submit form (Create or Edit)
  const handleSaveJob = (e) => {
    e.preventDefault();
    if (!clientName.trim() || !price) return;

    if (editingJob) {
      // Edit mode
      editTrabajoOrder(editingJob.id || editingJob.code, {
        clientName,
        phone,
        serviceType,
        quantity: quantity || 1,
        price,
        paymentMethod,
        meters: meters || 0,
        status,
      });
    } else {
      // Create mode
      addTrabajoOrder({
        clientName,
        phone,
        serviceType,
        quantity: quantity || 1,
        price,
        paymentMethod,
        meters: meters || 0,
        status,
      });
    }

    setShowAddModal(false);
    setEditingJob(null);
  };

  const handleClearAll = () => {
    if (window.confirm('¿Estás seguro de limpiar todas las órdenes de trabajo?')) {
      clearTrabajos();
    }
  };

  // Filter jobs
  const filteredTrabajos = trabajos.filter(t => {
    const matchesSearch = t.code.toLowerCase().includes(search.toLowerCase()) ||
                          t.client.toLowerCase().includes(search.toLowerCase()) ||
                          (t.phone && t.phone.includes(search));
    const matchesStatus = statusFilter === 'Todos' || t.status === statusFilter;
    const matchesType = typeFilter === 'Todos' || t.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="text-headline-lg" style={{ color: 'var(--on-surface)' }}>Órdenes de Trabajo</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
            Gestión, edición y actualización de trabajos con sincronización directa a Caja.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', fontSize: 20, pointerEvents: 'none',
            }}>search</span>
            <input
              type="text"
              placeholder="Buscar código, cliente o celular..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 32, width: 220, backgroundColor: 'var(--surface-container)', borderRadius: 8 }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ width: 'auto', backgroundColor: 'var(--surface-container)', borderRadius: 8, padding: '8px 32px 8px 8px' }}
          >
            <option value="Todos">Estado: Todos</option>
            <option value="en-cola">En cola</option>
            <option value="completado">Completado</option>
          </select>

          {/* Service Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field"
            style={{ width: 'auto', backgroundColor: 'var(--surface-container)', borderRadius: 8, padding: '8px 32px 8px 8px' }}
          >
            <option value="Todos">Servicio: Todos</option>
            {SERVICIOS_LIST.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Limpiar Datos Button */}
          {trabajos.length > 0 && (
            <button
              className="btn-secondary"
              style={{ borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--error)', borderColor: 'var(--error)' }}
              onClick={handleClearAll}
              title="Limpiar todas las órdenes"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_sweep</span>
              Limpiar
            </button>
          )}

          <button
            className="btn-primary"
            style={{ borderRadius: 8, padding: '8px 16px', fontSize: 14 }}
            onClick={handleOpenNewModal}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Nuevo Trabajo
          </button>
        </div>
      </div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="card-level-1"
        style={{ overflow: 'hidden' }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="table-industrial">
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-container-high)' }}>
                <th>Código</th>
                <th>Cliente</th>
                <th>Celular</th>
                <th>Tipo de Servicio</th>
                <th style={{ textAlign: 'center' }}>Cant.</th>
                <th>Método Pago</th>
                <th>Precio Total</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: 'monospace', fontSize: 13 }}>
              {filteredTrabajos.map((t, i) => (
                <motion.tr
                  key={t.id || t.code}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.03 }}
                  onClick={(e) => handleOpenEditModal(t, e)}
                  style={{ cursor: 'pointer' }}
                  title="Haz clic para editar la orden"
                >
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{t.code}</td>
                  <td className="text-body-sm" style={{ fontFamily: 'Inter', fontWeight: 600 }}>{t.client}</td>
                  <td className="text-utility-mono" style={{ color: 'var(--on-surface-variant)' }}>{t.phone || '—'}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface)',
                      fontFamily: 'Inter',
                    }}>
                      {t.type}
                    </span>
                  </td>
                  <td className="text-utility-mono" style={{ textAlign: 'center', fontWeight: 600 }}>
                    {t.quantity || 1} un.
                  </td>
                  <td className="text-body-sm" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    {t.paymentMethod || 'Efectivo'}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--secondary)' }}>{t.total}</td>
                  <td><StatusBadge status={t.status} pulse={t.status === 'en-cola'} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                      {/* Toggle status button */}
                      {t.status !== 'completado' && t.status !== 'listo' ? (
                        <button
                          title="Marcar como Trabajo Completado (Cobrado en Caja)"
                          onClick={(e) => handleMarkCompleted(t.id || t.code, e)}
                          style={{
                            padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                            backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e',
                            border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Inter',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                          Completado
                        </button>
                      ) : (
                        <button
                          title="Volver a poner En Cola"
                          onClick={(e) => { e.stopPropagation(); updateJobStatus(t.id || t.code, 'en-cola'); }}
                          style={{
                            padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                            backgroundColor: 'var(--surface-variant)', color: 'var(--on-surface-variant)',
                            border: '1px solid var(--outline-variant)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Inter',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                          En Cola
                        </button>
                      )}

                      {/* Edit icon */}
                      <button
                        title="Editar Orden"
                        onClick={(e) => handleOpenEditModal(t, e)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 4 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                      </button>

                      {/* View icon */}
                      <button
                        title="Ver Detalle"
                        onClick={(e) => { e.stopPropagation(); setSelectedJob(t); }}
                        style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', padding: 4 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredTrabajos.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ padding: 48, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3 }}>inbox</span>
                      <p className="text-body-sm">No hay órdenes de trabajo registradas.</p>
                      <button
                        className="btn-primary"
                        style={{ borderRadius: 6, fontSize: 12, padding: '6px 12px', marginTop: 8 }}
                        onClick={handleOpenNewModal}
                      >
                        + Crear Primera Orden
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{
          padding: 12, borderTop: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container)',
          textAlign: 'right', borderRadius: '0 0 12px 12px',
        }}>
          <span className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
            Mostrando {filteredTrabajos.length} de {trabajos.length} órdenes registradas
          </span>
        </div>
      </motion.div>

      {/* ═══ MODAL: CREAR / EDITAR TRABAJO (Con Método de Pago e Integración a Caja) ═══ */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5,20,37,0.85)', backdropFilter: 'blur(4px)' }} onClick={() => setShowAddModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'relative', width: '100%', maxWidth: 540, backgroundColor: 'var(--surface)',
              border: '1px solid var(--outline-variant)', borderRadius: 12, padding: 24, zIndex: 101,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--outline-variant)', pb: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>
                  {editingJob ? 'edit_note' : 'precision_manufacturing'}
                </span>
                <h3 className="text-headline-md" style={{ color: 'var(--on-surface)' }}>
                  {editingJob ? `Editar Orden: ${editingJob.code}` : 'Nueva Orden de Trabajo'}
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveJob} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* SECCIÓN 1: DATOS DEL CLIENTE */}
              <div style={{
                padding: 14, borderRadius: 8, backgroundColor: 'var(--surface-container-low)',
                border: '1px solid var(--outline-variant)', display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <span className="text-label-caps" style={{ color: 'var(--primary)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person</span>
                  Datos del Cliente
                </span>

                {!editingJob && clientes.length > 0 && (
                  <div>
                    <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4, fontSize: 10 }}>
                      Seleccionar cliente existente (opcional)
                    </label>
                    <select
                      onChange={handleClientSelect}
                      className="input-field"
                      style={{ width: '100%', padding: '6px 12px', fontSize: 13 }}
                    >
                      <option value="">-- Escribir cliente nuevo abajo --</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.name}>{c.name} ({c.phone})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4, fontSize: 10 }}>
                      Nombre del Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Imprenta GrafiColor"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4, fontSize: 10 }}>
                      Número Celular / WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="ej. +51 987 654 321"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: TIPO DE SERVICIO Y CANTIDAD */}
              <div style={{
                padding: 14, borderRadius: 8, backgroundColor: 'var(--surface-container-low)',
                border: '1px solid var(--outline-variant)', display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <span className="text-label-caps" style={{ color: 'var(--primary)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>category</span>
                  Servicio y Cantidad
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div>
                    <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4, fontSize: 10 }}>
                      Tipo de Servicio *
                    </label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}
                    >
                      {SERVICIOS_LIST.map(servicio => (
                        <option key={servicio} value={servicio}>
                          {servicio}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4, fontSize: 10 }}>
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="ej. 500"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="input-field text-utility-mono"
                      style={{ fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: PRECIO Y MÉTODO DE PAGO (CONECTADO A CAJA) */}
              <div style={{
                padding: 14, borderRadius: 8, backgroundColor: 'var(--surface-container-low)',
                border: '1px solid var(--outline-variant)', display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <span className="text-label-caps" style={{ color: 'var(--primary)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>payments</span>
                  Monto y Método de Pago (Actualiza Caja)
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4, fontSize: 10 }}>
                      Precio Total (S/.) *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--primary)', fontWeight: 700, fontSize: 13, pointerEvents: 'none',
                      }}>S/.</span>
                      <input
                        type="number"
                        step="0.50"
                        required
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="input-field text-utility-mono"
                        style={{ paddingLeft: 36, fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4, fontSize: 10 }}>
                      Método de Pago *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', padding: '8px 12px', fontWeight: 600, color: 'var(--primary)' }}
                    >
                      {METODOS_PAGO_LIST.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4, fontSize: 10 }}>
                      Estado del Trabajo
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', padding: '8px 12px' }}
                    >
                      <option value="en-cola">En cola</option>
                      <option value="completado">Completado (Cobrado en Caja)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4, fontSize: 10 }}>
                      Metros (opcional)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="ej. 12.5"
                      value={meters}
                      onChange={(e) => setMeters(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ borderRadius: 6, padding: '10px 20px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>
                  {editingJob ? 'Guardar Cambios' : 'Guardar Orden y Sincronizar Caja'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ═══ MODAL: DETALLE DEL TRABAJO ═══ */}
      {selectedJob && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5,20,37,0.85)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedJob(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'relative', width: '100%', maxWidth: 460, backgroundColor: 'var(--surface)',
              border: '1px solid var(--outline-variant)', borderRadius: 12, padding: 24, zIndex: 101,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="text-utility-mono" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 16 }}>{selectedJob.code}</span>
              <button onClick={() => setSelectedJob(null)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <h2 className="text-headline-md" style={{ color: 'var(--on-surface)', marginBottom: 12 }}>{selectedJob.client}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, backgroundColor: 'var(--surface-container)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 13 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Celular:</strong> {selectedJob.phone || '—'}</div>
              <div style={{ fontSize: 13 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Tipo de Servicio:</strong> <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{selectedJob.type}</span></div>
              <div style={{ fontSize: 13 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Cantidad:</strong> <span style={{ fontWeight: 700 }}>{selectedJob.quantity || 1} un.</span></div>
              <div style={{ fontSize: 13 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Método de Pago:</strong> <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{selectedJob.paymentMethod || 'Efectivo'}</span></div>
              <div style={{ fontSize: 13 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Fecha de Registro:</strong> {selectedJob.date}</div>
              <div style={{ fontSize: 13 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Metros:</strong> {selectedJob.meters > 0 ? `${selectedJob.meters} m` : '—'}</div>
              <div style={{ fontSize: 15 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Precio del Servicio:</strong> <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{selectedJob.total}</span></div>
              <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <strong style={{ color: 'var(--on-surface-variant)' }}>Estado Actual:</strong>
                <StatusBadge status={selectedJob.status} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setSelectedJob(null)}>Cerrar</button>

              <button
                className="btn-secondary"
                style={{ borderRadius: 6, borderColor: 'var(--primary)', color: 'var(--primary)' }}
                onClick={(e) => {
                  const jobToEdit = selectedJob;
                  setSelectedJob(null);
                  handleOpenEditModal(jobToEdit, e);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                Editar Orden
              </button>

              {selectedJob.status !== 'completado' && selectedJob.status !== 'listo' ? (
                <button
                  className="btn-primary"
                  style={{ borderRadius: 6, backgroundColor: '#22c55e', borderColor: '#22c55e' }}
                  onClick={() => {
                    handleMarkCompleted(selectedJob.id || selectedJob.code);
                    setSelectedJob(null);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                  Trabajo Completado
                </button>
              ) : (
                <button
                  className="btn-secondary"
                  style={{ borderRadius: 6 }}
                  onClick={() => {
                    updateJobStatus(selectedJob.id || selectedJob.code, 'en-cola');
                    setSelectedJob(null);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>schedule</span>
                  Poner En Cola
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
