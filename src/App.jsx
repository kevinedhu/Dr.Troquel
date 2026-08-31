import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import CotizadorPage from './pages/CotizadorPage';
import TrabajosPage from './pages/TrabajosPage';
import AlmacenPage from './pages/AlmacenPage';
import CajaPage from './pages/CajaPage';
import ConfiguracionPage from './pages/ConfiguracionPage';

import ClientesPage from './pages/ClientesPage';
import ReportesPage from './pages/ReportesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/cotizador" element={<CotizadorPage />} />
          <Route path="/trabajos" element={<TrabajosPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/almacen" element={<AlmacenPage />} />
          <Route path="/caja" element={<CajaPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/tarifas" element={<ConfiguracionPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
