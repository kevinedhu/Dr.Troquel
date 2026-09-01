import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getClientes, saveClientes, clearClientes } from '../services/dataStore';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function ClientesPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Form state for new client
  const [newClient, setNewClient] = useState({
    name: '', ruc: '', contact: '', phone: '', email: '', status: 'Activo',
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const refreshClientes = () => {
    setClientes(getClientes());
  };

  useEffect(() => {
    refreshClientes();
    window.addEventListener('troquelmaster_data_changed', refreshClientes);
    return () => window.removeEventListener('troquelmaster_data_changed', refreshClientes);
  }, []);

  const handleClearAll = () => {
    if (window.confirm('¿Estás seguro de limpiar la lista de clientes?')) {
      clearClientes();
    }
  };

  const filteredClientes = clientes.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          (c.ruc && c.ruc.includes(search)) ||
                          (c.phone && c.phone.includes(search)) ||
                          (c.contact && c.contact.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddClient = (e) => {
    e.preventDefault();
    if (!newClient.name.trim()) return;
    const numCli = clientes.length + 1;
    const created = {
      id: `cli_${Date.now()}`,
      code: `CLI-${String(numCli).padStart(3, '0')}`,
      name: newClient.name.trim(),
      ruc: newClient.ruc || '—',
      contact: newClient.contact || newClient.name.trim(),
      phone: newClient.phone || '—',
      email: newClient.email || '—',
      orders: 0,
      totalSpentRaw: 0,
      totalSpent: 'S/. 0.00',
      status: newClient.status || 'Activo',
    };

    const updated = [created, ...clientes];
    saveClientes(updated);
    setShowModal(false);
    setNewClient({ name: '', ruc: '', contact: '', phone: '', email: '', status: 'Activo' });
  };

  const totalSpentAll = clientes.reduce((s, c) => s + (c.totalSpentRaw || 0), 0);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" style={{ paddingBottom: 16 }}>
      {/* Header & Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: isMobile ? 12 : 'var(--space-xl)',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 12,
      }}>
        <div>
          <h1 className="text-headline-lg" style={{ color: 'var(--on-surface)' }}>Directorio de Clientes</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 2 }}>
            Gestión de clientes, historial de servicios y contactos.
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: isMobile ? '1 1 100%' : 'initial' }}>
            <span className="material-symbols-outlined" style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', fontSize: 18, pointerEvents: 'none',
            }}>search</span>
            <input
              type="text"
              placeholder="Buscar cliente, celular o RUC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 34, width: isMobile ? '100%' : 240, backgroundColor: 'var(--surface-container)', borderRadius: 8, minHeight: 40, fontSize: 14 }}
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ flex: isMobile ? 1 : 'initial', width: 'auto', backgroundColor: 'var(--surface-container)', borderRadius: 8, padding: '6px 28px 6px 8px', minHeight: 40, fontSize: 13 }}
          >
            <option value="Todos">Estado: Todos</option>
            <option value="Activo">Activo</option>
            <option value="VIP">VIP</option>
            <option value="Inactivo">Inactivo</option>
          </select>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6, flex: isMobile ? 1 : 'initial', width: isMobile ? 'auto' : 'auto' }}>
            {clientes.length > 0 && (
              <button
                className="btn-secondary"
                style={{ borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--error)', borderColor: 'var(--error)', minHeight: 40 }}
                onClick={handleClearAll}
                title="Limpiar clientes"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete_sweep</span>
                Limpiar
              </button>
            )}
            <button
              className="btn-primary"
              style={{ borderRadius: 8, padding: '8px 16px', fontSize: 13, minHeight: 40, flex: 1, justifyContent: 'center' }}
              onClick={() => setShowModal(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
              Nuevo
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? 8 : 'var(--space-md)',
        marginBottom: isMobile ? 12 : 'var(--space-xl)',
      }}>
        <div className="card-level-1" style={{ padding: isMobile ? 10 : 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(147,204,255,0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>groups</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', fontSize: 11 }}>Clientes</div>
            <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'Inter' }}>{clientes.length}</div>
          </div>
        </div>

        <div className="card-level-1" style={{ padding: isMobile ? 10 : 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,185,95,0.15)', color: 'var(--tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>star</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', fontSize: 11 }}>Clientes VIP</div>
            <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700, color: 'var(--tertiary)', fontFamily: 'Inter' }}>
              {clientes.filter(c => c.status === 'VIP').length}
            </div>
          </div>
        </div>

        <div className="card-level-1" style={{ padding: isMobile ? 10 : 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>shopping_cart</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', fontSize: 11 }}>Órdenes</div>
            <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700, color: '#22c55e', fontFamily: 'Inter' }}>
              {clientes.reduce((s, c) => s + c.orders, 0)}
            </div>
          </div>
        </div>

        <div className="card-level-1" style={{ padding: isMobile ? 10 : 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(148,204,255,0.15)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>payments</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)', fontSize: 11 }}>Facturación</div>
            <div style={{ fontSize: isMobile ? 15 : 20, fontWeight: 700, color: 'var(--secondary)', fontFamily: 'Inter' }}>
              S/. {totalSpentAll.toFixed(2)}
            </div>
          </div>
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
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="table-industrial" style={{ minWidth: isMobile ? 540 : '100%' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-container-high)' }}>
                <th>Código</th>
                <th>Cliente</th>
                <th>Celular</th>
                <th>Contacto</th>
                <th style={{ textAlign: 'center' }}>Órdenes</th>
                <th>Facturación</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.02 }}
                  onClick={() => setSelectedClient(c)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="text-utility-mono" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 12 }}>{c.code}</td>
                  <td className="text-body-sm" style={{ fontWeight: 600, color: 'var(--on-surface)', fontSize: 13 }}>{c.name}</td>
                  <td className="text-utility-mono" style={{ fontSize: 12, color: 'var(--primary)' }}>{c.phone || '—'}</td>
                  <td className="text-body-sm" style={{ fontSize: 12 }}>{c.contact || c.name}</td>
                  <td className="text-utility-mono" style={{ textAlign: 'center' }}>{c.orders}</td>
                  <td className="text-utility-mono" style={{ fontWeight: 700, color: 'var(--secondary)' }}>{c.totalSpent}</td>
                  <td>
                    <span style={{
                      padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                      backgroundColor: c.status === 'VIP' ? 'rgba(255,185,95,0.2)' : c.status === 'Activo' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                      color: c.status === 'VIP' ? 'var(--tertiary)' : c.status === 'Activo' ? '#22c55e' : 'var(--error)',
                      fontFamily: 'Inter', letterSpacing: '0.05em', textTransform: 'uppercase',
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedClient(c); }}
                      style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', padding: 4 }}
                      title="Ver Ficha"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
                    </button>
                  </td>
                </motion.tr>
              ))}
              {filteredClientes.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ padding: 32, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3, marginBottom: 8 }}>group_off</span>
                    <p className="text-body-sm">No hay clientes registrados aún.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* New Client Modal */}
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
                position: 'relative', width: '100%', maxWidth: 480, backgroundColor: 'var(--surface)',
                border: '1px solid var(--outline-variant)',
                borderRadius: isMobile ? '16px 16px 0 0' : 12,
                padding: isMobile ? '16px 14px' : 24,
                zIndex: 121,
                maxHeight: '90vh', overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--outline-variant)', paddingBottom: 8 }}>
                <h3 className="text-headline-md" style={{ color: 'var(--on-surface)', fontSize: 16 }}>Nuevo Cliente</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>Nombre / Razón Social *</label>
                  <input type="text" required value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} className="input-field" placeholder="ej. Imprenta GrafiColor" style={{ minHeight: 38, fontSize: 14 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
                  <div>
                    <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>Celular / WhatsApp *</label>
                    <input type="text" required value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} className="input-field" placeholder="+51 987 654 321" style={{ minHeight: 38, fontSize: 14 }} />
                  </div>
                  <div>
                    <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>RUC / DNI</label>
                    <input type="text" value={newClient.ruc} onChange={(e) => setNewClient({ ...newClient, ruc: e.target.value })} className="input-field" placeholder="20123456789" style={{ minHeight: 38, fontSize: 14 }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
                  <div>
                    <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>Contacto</label>
                    <input type="text" value={newClient.contact} onChange={(e) => setNewClient({ ...newClient, contact: e.target.value })} className="input-field" placeholder="Juan Pérez" style={{ minHeight: 38, fontSize: 14 }} />
                  </div>
                  <div>
                    <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 2, fontSize: 10 }}>Email</label>
                    <input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} className="input-field" placeholder="contacto@empresa.pe" style={{ minHeight: 38, fontSize: 14 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, minHeight: 38, justifyContent: 'center' }}>Cancelar</button>
                  <button type="submit" className="btn-primary" style={{ flex: 2, minHeight: 38, justifyContent: 'center' }}>Guardar Cliente</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Client Detail Modal */}
      <AnimatePresence>
        {selectedClient && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 120, display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : 16,
          }}>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5,20,37,0.85)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedClient(null)} />
            <motion.div
              initial={{ opacity: 0, y: isMobile ? 60 : 0, scale: isMobile ? 1 : 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isMobile ? 60 : 0 }}
              style={{
                position: 'relative', width: '100%', maxWidth: 450, backgroundColor: 'var(--surface)',
                border: '1px solid var(--outline-variant)',
                borderRadius: isMobile ? '16px 16px 0 0' : 12,
                padding: isMobile ? '16px 14px' : 24,
                zIndex: 121,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="text-utility-mono" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>{selectedClient.code}</span>
                <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <h2 className="text-headline-md" style={{ color: 'var(--on-surface)', marginBottom: 8, fontSize: 17 }}>{selectedClient.name}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, backgroundColor: 'var(--surface-container)', padding: 12, borderRadius: 8, marginBottom: 14 }}>
                <div style={{ fontSize: 13 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Celular:</strong> {selectedClient.phone}</div>
                <div style={{ fontSize: 13 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Contacto:</strong> {selectedClient.contact}</div>
                <div style={{ fontSize: 13 }}><strong style={{ color: 'var(--on-surface-variant)' }}>RUC / Doc:</strong> {selectedClient.ruc}</div>
                <div style={{ fontSize: 13 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Email:</strong> {selectedClient.email}</div>
                <div style={{ fontSize: 13 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Órdenes:</strong> {selectedClient.orders}</div>
                <div style={{ fontSize: 14 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Facturación:</strong> <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{selectedClient.totalSpent}</span></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => setSelectedClient(null)} style={{ width: '100%', justifyContent: 'center', minHeight: 38 }}>Cerrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
