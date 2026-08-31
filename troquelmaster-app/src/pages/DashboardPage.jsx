import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Chart, registerables } from 'chart.js';
import MetricCard from '../components/shared/MetricCard';
import StatusBadge from '../components/shared/StatusBadge';
import { getTrabajos, getClientes, clearAllData } from '../services/dataStore';

Chart.register(...registerables);

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [trabajos, setTrabajos] = useState([]);
  const [clientes, setClientes] = useState([]);

  const refreshDashboardData = () => {
    setTrabajos(getTrabajos());
    setClientes(getClientes());
  };

  useEffect(() => {
    refreshDashboardData();
    window.addEventListener('troquelmaster_data_changed', refreshDashboardData);
    return () => window.removeEventListener('troquelmaster_data_changed', refreshDashboardData);
  }, []);

  const handleClearAllData = () => {
    if (window.confirm('¿Estás seguro de limpiar todos los datos del sistema (órdenes y clientes)?')) {
      clearAllData();
    }
  };

  // Calculate real financial totals — ONLY completed jobs count towards Ventas and Ganancias
  const completedJobs = trabajos.filter(t => t.status === 'completado' || t.status === 'listo');
  const totalVentas = completedJobs.reduce((sum, t) => sum + (t.priceNumber || 0), 0);
  const enCola = trabajos.filter(t => t.status === 'en-cola').length;
  const numCompletados = completedJobs.length;

  const salesChartRef = useRef(null);
  const distChartRef = useRef(null);
  const salesChartInstance = useRef(null);
  const distChartInstance = useRef(null);

  useEffect(() => {
    // Sales Trend Chart
    if (salesChartRef.current) {
      const ctx = salesChartRef.current.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 250);
      gradient.addColorStop(0, 'rgba(147, 204, 255, 0.4)');
      gradient.addColorStop(1, 'rgba(147, 204, 255, 0.0)');

      if (salesChartInstance.current) salesChartInstance.current.destroy();
      salesChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
          datasets: [{
            label: 'Ventas (S/.)',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#93ccff',
            backgroundColor: gradient,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#051425',
            pointBorderColor: '#93ccff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(18, 32, 50, 0.95)',
              titleColor: '#d5e3fc',
              bodyColor: '#d5e3fc',
              borderColor: '#3f4850',
              borderWidth: 1,
              padding: 12,
              displayColors: false,
              cornerRadius: 4,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: '#283648', drawBorder: false },
              ticks: {
                color: '#89929b',
                font: { family: 'Inter', size: 12 },
                callback: (v) => 'S/.' + v,
              },
            },
            x: {
              grid: { display: false, drawBorder: false },
              ticks: { color: '#89929b', font: { family: 'Inter', size: 12 } },
            },
          },
        },
      });
    }

    // Distribution Doughnut Chart
    if (distChartRef.current) {
      const ctx2 = distChartRef.current.getContext('2d');
      if (distChartInstance.current) distChartInstance.current.destroy();
      distChartInstance.current = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: ['Cajas', 'Etiquetas', 'Empaques', 'Cartón'],
          datasets: [{
            data: [1, 1, 1, 1],
            backgroundColor: ['#283648', '#1d2b3d', '#122032', '#0d1c2e'],
            borderWidth: 0,
            hoverOffset: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '75%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#89929b',
                padding: 16,
                usePointStyle: true,
                pointStyle: 'circle',
                font: { family: 'Inter', size: 12 },
              },
            },
            tooltip: {
              callbacks: { label: () => ' Sin datos' },
            },
          },
        },
      });
    }

    return () => {
      if (salesChartInstance.current) salesChartInstance.current.destroy();
      if (distChartInstance.current) distChartInstance.current.destroy();
    };
  }, []);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="text-headline-lg" style={{ color: 'var(--on-surface)' }}>Visión General</h1>
          <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
            Resumen operativo y estado de producción en tiempo real.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(trabajos.length > 0 || clientes.length > 0) && (
            <button
              className="btn-secondary"
              style={{ borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--error)', borderColor: 'var(--error)' }}
              onClick={handleClearAllData}
              title="Limpiar todos los datos del sistema"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_sweep</span>
              Limpiar Sistema
            </button>
          )}
          <button className="btn-primary animate-pulse-glow" onClick={() => navigate('/cotizador')}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Nuevo Trabajo
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <MetricCard label="Ventas Realizadas" value={`S/. ${totalVentas.toFixed(2)}`} icon="payments" iconColor="var(--secondary)" subtitle={`${numCompletados} cobrados`} trendIcon="trending_up" index={0} />
        <MetricCard label="Completados" value={numCompletados} icon="check_circle" iconColor="var(--secondary)" subtitle="Trabajos listos" index={1} />
        <MetricCard label="Pendientes (En cola)" value={enCola} icon="schedule" iconColor="var(--tertiary)" subtitle="En espera de pago/entrega" index={2} />
        <MetricCard label="Clientes Activos" value={clientes.length} icon="groups" iconColor="var(--secondary)" subtitle="En directorio" index={3} />
        <MetricCard label="Ganancia Est." value={`S/. ${(totalVentas * 0.7).toFixed(2)}`} icon="trending_up" iconColor="var(--secondary)" subtitle="Margen ~70%" index={4} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        {/* Sales Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="card-level-1"
          style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', height: 320 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 className="text-headline-md" style={{ color: 'var(--on-surface)' }}>Tendencia de Ventas</h2>
            <button style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <canvas ref={salesChartRef}></canvas>
          </div>
        </motion.div>

        {/* Distribution Doughnut */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="card-level-1"
          style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', height: 320 }}
        >
          <h2 className="text-headline-md" style={{ color: 'var(--on-surface)', marginBottom: 16 }}>Distribución por Servicio</h2>
          <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <canvas ref={distChartRef}></canvas>
          </div>
        </motion.div>
      </div>

      {/* Recent Jobs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="card-level-1"
        style={{ overflow: 'hidden' }}
      >
        <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="text-headline-md" style={{ color: 'var(--on-surface)' }}>Trabajos Recientes</h2>
          <button onClick={() => navigate('/trabajos')} style={{ background: 'none', border: 'none', cursor: 'pointer' }} className="text-body-sm">
            <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Ver todos <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </span>
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-industrial">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Tipo de Servicio</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {trabajos.slice(0, 5).map((t) => (
                <tr key={t.id || t.code} onClick={() => navigate('/trabajos')} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{t.code}</td>
                  <td className="text-body-sm" style={{ fontWeight: 600 }}>{t.client}</td>
                  <td className="text-body-sm">{t.type}</td>
                  <td><StatusBadge status={t.status} pulse={t.status === 'en-corte'} /></td>
                  <td className="text-utility-mono" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--secondary)' }}>{t.total}</td>
                </tr>
              ))}
              {trabajos.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: 48, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline)' }}>inbox</span>
                      <p>No hay trabajos recientes para mostrar. Agrega uno nuevo desde Órdenes de Trabajo.</p>
                      <button className="btn-primary" style={{ borderRadius: 6, fontSize: 12, padding: '6px 12px', marginTop: 8 }} onClick={() => navigate('/trabajos')}>
                        + Registrar Trabajo
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
