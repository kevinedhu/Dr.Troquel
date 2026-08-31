import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getClientes, saveClientes, clearClientes } from '../services/dataStore';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Form state for new client
  const [newClient, setNewClient] = useState({
    name: '', ruc: '', contact: '', phone: '', email: '', status: 'Activo',
  });

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
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="text-headline-lg" style={{ color: 'var(--on-surface)' }}>Directorio de Clientes</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
            Gestión de clientes, historial de servicios y contactos telefónicos.
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
              placeholder="Buscar cliente, celular o RUC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 32, width: 256, backgroundColor: 'var(--surface-container)', borderRadius: 8 }}
            />
          </div>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ width: 'auto', backgroundColor: 'var(--surface-container)', borderRadius: 8, padding: '8px 32px 8px 8px' }}
          >
            <option value="Todos">Estado: Todos</option>
            <option value="Activo">Activo</option>
            <option value="VIP">VIP</option>
            <option value="Inactivo">Inactivo</option>
          </select>
          {/* Limpiar Datos Button */}
          {clientes.length > 0 && (
            <button
              className="btn-secondary"
              style={{ borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--error)', borderColor: 'var(--error)' }}
              onClick={handleClearAll}
              title="Limpiar todos los clientes"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_sweep</span>
              Limpiar
            </button>
          )}
          <button className="btn-primary" style={{ borderRadius: 8, padding: '8px 16px', fontSize: 14 }} onClick={() => setShowModal(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Metrics Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div className="card-level-1" style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'rgba(147,204,255,0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">groups</span>
          </div>
          <div>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Total Clientes</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--on-surface)', fontFamily: 'Inter' }}>{clientes.length}</div>
          </div>
        </div>
        <div className="card-level-1" style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'rgba(255,185,95,0.15)', color: 'var(--tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">star</span>
          </div>
          <div>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Clientes VIP</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--tertiary)', fontFamily: 'Inter' }}>
              {clientes.filter(c => c.status === 'VIP').length}
            </div>
          </div>
        </div>
        <div className="card-level-1" style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">shopping_cart</span>
          </div>
          <div>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Órdenes Totales</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e', fontFamily: 'Inter' }}>
              {clientes.reduce((s, c) => s + c.orders, 0)}
            </div>
          </div>
        </div>
        <div className="card-level-1" style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'rgba(148,204,255,0.15)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div>
            <div className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>Facturación Total</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--secondary)', fontFamily: 'Inter' }}>
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
        <div style={{ overflowX: 'auto' }}>
          <table className="table-industrial">
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-container-high)' }}>
                <th>Código</th>
                <th>Nombre / Cliente</th>
                <th>Número Celular</th>
                <th>Contacto</th>
                <th>Órdenes</th>
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
                  transition={{ delay: 0.05 + i * 0.03 }}
                  onClick={() => setSelectedClient(c)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="text-utility-mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.code}</td>
                  <td className="text-body-sm" style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{c.name}</td>
                  <td className="text-utility-mono" style={{ fontSize: 13, color: 'var(--primary)' }}>{c.phone || '—'}</td>
                  <td className="text-body-sm">{c.contact || c.name}</td>
                  <td className="text-utility-mono" style={{ textAlign: 'center' }}>{c.orders}</td>
                  <td className="text-utility-mono" style={{ fontWeight: 700, color: 'var(--secondary)' }}>{c.totalSpent}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
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
                  <td colSpan="8" style={{ padding: 48, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3 }}>group_off</span>
                      <p className="text-body-sm">No hay clientes registrados aún.</p>
                      <button
                        className="btn-primary"
                        style={{ borderRadius: 6, fontSize: 12, padding: '6px 12px', marginTop: 8 }}
                        onClick={() => setShowModal(true)}
                      >
                        + Agregar Primer Cliente
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* New Client Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5,20,37,0.85)', backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'relative', width: '100%', maxWidth: 480, backgroundColor: 'var(--surface)',
              border: '1px solid var(--outline-variant)', borderRadius: 12, padding: 24, zIndex: 101,
            }}
          >
            <h3 className="text-headline-md" style={{ color: 'var(--on-surface)', marginBottom: 16 }}>Nuevo Cliente</h3>
            <form onSubmit={handleAddClient} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Nombre / Razón Social *</label>
                <input type="text" required value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} className="input-field" placeholder="ej. Imprenta GrafiColor" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Número Celular / WhatsApp *</label>
                  <input type="text" required value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} className="input-field" placeholder="+51 987 654 321" />
                </div>
                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>RUC / DNI</label>
                  <input type="text" value={newClient.ruc} onChange={(e) => setNewClient({ ...newClient, ruc: e.target.value })} className="input-field" placeholder="20123456789" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Persona de Contacto</label>
                  <input type="text" value={newClient.contact} onChange={(e) => setNewClient({ ...newClient, contact: e.target.value })} className="input-field" placeholder="Juan Pérez" />
                </div>
                <div>
                  <label className="text-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Correo Electrónico</label>
                  <input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} className="input-field" placeholder="contacto@empresa.pe" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ borderRadius: 6 }}>Guardar Cliente</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5,20,37,0.85)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedClient(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'relative', width: '100%', maxWidth: 450, backgroundColor: 'var(--surface)',
              border: '1px solid var(--outline-variant)', borderRadius: 12, padding: 24, zIndex: 101,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="text-utility-mono" style={{ color: 'var(--primary)', fontWeight: 700 }}>{selectedClient.code}</span>
              <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <h2 className="text-headline-md" style={{ color: 'var(--on-surface)', marginBottom: 8 }}>{selectedClient.name}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, backgroundColor: 'var(--surface-container)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 13 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Número Celular:</strong> {selectedClient.phone}</div>
              <div style={{ fontSize: 13 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Contacto:</strong> {selectedClient.contact}</div>
              <div style={{ fontSize: 13 }}><strong style={{ color: 'var(--on-surface-variant)' }}>RUC / Doc:</strong> {selectedClient.ruc}</div>
              <div style={{ fontSize: 13 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Email:</strong> {selectedClient.email}</div>
              <div style={{ fontSize: 13 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Órdenes Realizadas:</strong> {selectedClient.orders}</div>
              <div style={{ fontSize: 14 }}><strong style={{ color: 'var(--on-surface-variant)' }}>Facturación Total:</strong> <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{selectedClient.totalSpent}</span></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setSelectedClient(null)}>Cerrar</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
