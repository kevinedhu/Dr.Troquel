/**
 * TroquelMaster — Centralized Data Store
 * 
 * Manages reactive storage for Trabajos, Clientes, Insumos, Caja y métricas.
 */

const STORAGE_KEYS = {
  TRABAJOS: 'troquelmaster_trabajos',
  CLIENTES: 'troquelmaster_clientes',
  MOVIMIENTOS: 'troquelmaster_movimientos',
  MATERIALES: 'troquelmaster_materiales',
  CAJA: 'troquelmaster_caja',
};

const DEFAULT_CLIENTES = [];
const DEFAULT_TRABAJOS = [];
const DEFAULT_MOVIMIENTOS = [];
const DEFAULT_MATERIALES = [];
const DEFAULT_CAJA = [];

/**
 * Get all stored Clientes
 */
export function getClientes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTES);
    return raw ? JSON.parse(raw) : DEFAULT_CLIENTES;
  } catch {
    return DEFAULT_CLIENTES;
  }
}

export function saveClientes(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(list));
    window.dispatchEvent(new Event('troquelmaster_data_changed'));
  } catch (err) {
    console.error('Error saving clientes:', err);
  }
}

/**
 * Get all stored Trabajos
 */
export function getTrabajos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRABAJOS);
    return raw ? JSON.parse(raw) : DEFAULT_TRABAJOS;
  } catch {
    return DEFAULT_TRABAJOS;
  }
}

export function saveTrabajos(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRABAJOS, JSON.stringify(list));
    window.dispatchEvent(new Event('troquelmaster_data_changed'));
  } catch (err) {
    console.error('Error saving trabajos:', err);
  }
}

/**
 * Get stored Material Movements (Insumos)
 */
export function getMaterialMovements() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVIMIENTOS);
    return raw ? JSON.parse(raw) : DEFAULT_MOVIMIENTOS;
  } catch {
    return DEFAULT_MOVIMIENTOS;
  }
}

export function saveMaterialMovements(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS, JSON.stringify(list));
    window.dispatchEvent(new Event('troquelmaster_data_changed'));
  } catch (err) {
    console.error('Error saving movimientos:', err);
  }
}

/**
 * Get stored Materials Stock
 */
export function getMaterials() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MATERIALES);
    return raw ? JSON.parse(raw) : DEFAULT_MATERIALES;
  } catch {
    return DEFAULT_MATERIALES;
  }
}

export function saveMaterials(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.MATERIALES, JSON.stringify(list));
    window.dispatchEvent(new Event('troquelmaster_data_changed'));
  } catch (err) {
    console.error('Error saving materiales:', err);
  }
}

/**
 * Get stored Caja Transactions
 */
export function getCajaTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CAJA);
    return raw ? JSON.parse(raw) : DEFAULT_CAJA;
  } catch {
    return DEFAULT_CAJA;
  }
}

export function saveCajaTransactions(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.CAJA, JSON.stringify(list));
    window.dispatchEvent(new Event('troquelmaster_data_changed'));
  } catch (err) {
    console.error('Error saving caja:', err);
  }
}

/**
 * Sync Caja transactions with completed Trabajos
 */
export function syncCajaWithJobs() {
  const trabajos = getTrabajos();
  const existingCaja = getCajaTransactions();

  // Filter out automatically generated job incomes that might no longer exist or changed
  const customCaja = existingCaja.filter(t => !t.jobId);

  // Generate income entries for completed jobs
  const completedJobs = trabajos.filter(j => j.status === 'completado' || j.status === 'listo');
  const jobIncomes = completedJobs.map(j => {
    const method = j.paymentMethod || 'Efectivo';
    const methodIcon = method === 'Efectivo' ? 'payments' : method === 'Transferencia' ? 'account_balance' : 'phone_iphone';
    return {
      id: `caja_job_${j.id}`,
      jobId: j.id,
      date: j.date,
      concept: `Cobro: ${j.code} - ${j.type} (${j.client})`,
      category: 'Producción',
      method,
      methodIcon,
      amountVal: j.priceNumber || 0,
      amount: `+ S/ ${(j.priceNumber || 0).toFixed(2)}`,
      isIncome: true,
      timestamp: j.timestamp || Date.now(),
    };
  });

  const updatedCaja = [...jobIncomes, ...customCaja];
  saveCajaTransactions(updatedCaja);
}

/**
 * Add a new Trabajo order and automatically register/update the Cliente and Caja
 */
export function addTrabajoOrder({ clientName, phone, serviceType, quantity = 1, price, meters = 0, paymentMethod = 'Efectivo', status = 'en-cola' }) {
  const trabajos = getTrabajos();
  const clientes = getClientes();

  const numCode = trabajos.length + 1;
  const code = `TRQ-${new Date().getFullYear()}-${String(numCode).padStart(3, '0')}`;
  const now = new Date();
  const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

  const numPrice = parseFloat(price) || 0;
  const numQty = parseInt(quantity, 10) || 1;

  const newJob = {
    id: `job_${Date.now()}`,
    code,
    client: clientName.trim(),
    phone: phone.trim(),
    type: serviceType,
    quantity: numQty,
    date: dateStr,
    meters: parseFloat(meters) || 0,
    paymentMethod,
    total: `S/. ${numPrice.toFixed(2)}`,
    priceNumber: numPrice,
    status,
    timestamp: Date.now(),
  };

  const updatedTrabajos = [newJob, ...trabajos];
  saveTrabajos(updatedTrabajos);

  const isCompleted = status === 'completado' || status === 'listo';

  // Update or Create Cliente
  let updatedClientes = [...clientes];
  const existingIndex = updatedClientes.findIndex(
    c => c.name.toLowerCase() === clientName.trim().toLowerCase()
  );

  if (existingIndex >= 0) {
    const existing = updatedClientes[existingIndex];
    const prevSpent = (existing.totalSpentRaw || 0) + (isCompleted ? numPrice : 0);
    updatedClientes[existingIndex] = {
      ...existing,
      phone: phone.trim() || existing.phone,
      orders: existing.orders + 1,
      totalSpentRaw: prevSpent,
      totalSpent: `S/. ${prevSpent.toFixed(2)}`,
    };
  } else {
    const numCli = updatedClientes.length + 1;
    const cliCode = `CLI-${String(numCli).padStart(3, '0')}`;
    const initialSpent = isCompleted ? numPrice : 0;
    updatedClientes.unshift({
      id: `cli_${Date.now()}`,
      code: cliCode,
      name: clientName.trim(),
      ruc: '—',
      contact: clientName.trim(),
      phone: phone.trim() || '—',
      email: '—',
      orders: 1,
      totalSpentRaw: initialSpent,
      totalSpent: `S/. ${initialSpent.toFixed(2)}`,
      status: 'Activo',
    });
  }

  saveClientes(updatedClientes);
  syncCajaWithJobs();
  return newJob;
}

/**
 * Edit an existing Trabajo order
 */
export function editTrabajoOrder(jobId, fields) {
  const trabajos = getTrabajos();
  const updated = trabajos.map(j => {
    if (j.id === jobId || j.code === jobId) {
      const numPrice = fields.price !== undefined ? parseFloat(fields.price) : j.priceNumber;
      return {
        ...j,
        client: fields.clientName !== undefined ? fields.clientName.trim() : j.client,
        phone: fields.phone !== undefined ? fields.phone.trim() : j.phone,
        type: fields.serviceType !== undefined ? fields.serviceType : j.type,
        quantity: fields.quantity !== undefined ? parseInt(fields.quantity, 10) : j.quantity,
        priceNumber: numPrice,
        total: `S/. ${numPrice.toFixed(2)}`,
        meters: fields.meters !== undefined ? parseFloat(fields.meters) : j.meters,
        paymentMethod: fields.paymentMethod !== undefined ? fields.paymentMethod : (j.paymentMethod || 'Efectivo'),
        status: fields.status !== undefined ? fields.status : j.status,
      };
    }
    return j;
  });
  saveTrabajos(updated);
  syncClientesSpent();
  syncCajaWithJobs();
}

/**
 * Add a new material movement with price/cost tracking
 */
export function addMaterialMovement({ materialName, type, quantity, unit, price = 0, reason }) {
  const movements = getMaterialMovements();
  const materials = getMaterials();

  const qtyVal = parseFloat(quantity) || 0;
  const priceVal = parseFloat(price) || 0;

  const now = new Date();
  const timeStr = `${now.getDate()}/${now.getMonth() + 1} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newMov = {
    id: `mov_${Date.now()}`,
    date: timeStr,
    material: materialName.trim().toUpperCase(),
    type,
    qtyVal,
    unit,
    qty: `${type === 'salida' ? '-' : '+'} ${qtyVal} ${unit}`,
    priceVal,
    totalCost: `S/. ${priceVal.toFixed(2)}`,
    reason: reason || 'Registro de movimiento',
    timestamp: Date.now(),
  };

  const updatedMovements = [newMov, ...movements];
  saveMaterialMovements(updatedMovements);

  let updatedMaterials = [...materials];
  const idx = updatedMaterials.findIndex(m => m.name.toLowerCase() === materialName.trim().toLowerCase());
  if (idx >= 0) {
    const currentVal = updatedMaterials[idx].value;
    const newVal = type === 'entrada' ? currentVal + qtyVal : Math.max(0, currentVal - qtyVal);
    updatedMaterials[idx] = {
      ...updatedMaterials[idx],
      value: newVal,
      totalSpentOnMaterial: (updatedMaterials[idx].totalSpentOnMaterial || 0) + (type === 'salida' || type === 'entrada' ? priceVal : 0),
    };
  } else {
    const newVal = type === 'entrada' ? qtyVal : 0;
    updatedMaterials.unshift({
      id: `mat_${Date.now()}`,
      name: materialName.trim().toUpperCase(),
      value: newVal,
      unit,
      min: `Min: 10 ${unit}`,
      status: newVal > 10 ? 'optimo' : 'reordenar',
      color: newVal > 10 ? 'var(--secondary)' : 'var(--tertiary)',
      totalSpentOnMaterial: priceVal,
    });
  }

  saveMaterials(updatedMaterials);
  return newMov;
}

/**
 * Recalculate each client's total spent based on completed jobs
 */
export function syncClientesSpent() {
  const trabajos = getTrabajos();
  const clientes = getClientes();
  const updatedClientes = clientes.map(c => {
    const clientJobs = trabajos.filter(j => j.client.toLowerCase() === c.name.toLowerCase());
    const completedJobs = clientJobs.filter(j => j.status === 'completado' || j.status === 'listo');
    const spent = completedJobs.reduce((sum, j) => sum + (j.priceNumber || 0), 0);
    return {
      ...c,
      orders: clientJobs.length,
      totalSpentRaw: spent,
      totalSpent: `S/. ${spent.toFixed(2)}`,
    };
  });
  saveClientes(updatedClientes);
}

/**
 * Update status of a specific job
 */
export function updateJobStatus(jobId, newStatus) {
  const trabajos = getTrabajos();
  const updated = trabajos.map(j => (j.id === jobId || j.code === jobId) ? { ...j, status: newStatus } : j);
  saveTrabajos(updated);
  syncClientesSpent();
  syncCajaWithJobs();
}

/**
 * Clear functions
 */
export function clearTrabajos() {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRABAJOS);
    window.dispatchEvent(new Event('troquelmaster_data_changed'));
  } catch (err) {
    console.error('Error clearing trabajos:', err);
  }
}

export function clearClientes() {
  try {
    localStorage.removeItem(STORAGE_KEYS.CLIENTES);
    window.dispatchEvent(new Event('troquelmaster_data_changed'));
  } catch (err) {
    console.error('Error clearing clientes:', err);
  }
}

export function clearInsumos() {
  try {
    localStorage.removeItem(STORAGE_KEYS.MOVIMIENTOS);
    localStorage.removeItem(STORAGE_KEYS.MATERIALES);
    window.dispatchEvent(new Event('troquelmaster_data_changed'));
  } catch (err) {
    console.error('Error clearing insumos:', err);
  }
}

export function clearCaja() {
  try {
    localStorage.removeItem(STORAGE_KEYS.CAJA);
    window.dispatchEvent(new Event('troquelmaster_data_changed'));
  } catch (err) {
    console.error('Error clearing caja:', err);
  }
}

export function clearAllData() {
  clearTrabajos();
  clearClientes();
  clearInsumos();
  clearCaja();
}

/**
 * List of available service types for die-cutting workshop
 */
export const SERVICIOS_LIST = [
  'Troquelado completo',
  'Troquelado semi corte',
  'Doblez',
  'Pan de oro',
  'Troquel',
  'Encolado',
  'Boleado',
  'Perforación remache',
  'Perforación hueco circular',
];

/**
 * List of payment methods
 */
export const METODOS_PAGO_LIST = [
  'Efectivo',
  'Yape',
  'Plin',
  'Transferencia',
];
