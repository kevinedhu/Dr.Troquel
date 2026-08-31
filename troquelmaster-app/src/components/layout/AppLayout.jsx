import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          marginLeft: 256,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <TopBar />
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-lg)',
            backgroundColor: 'var(--background)',
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
