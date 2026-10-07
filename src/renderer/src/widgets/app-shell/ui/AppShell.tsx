import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { StatusBar } from './StatusBar';
import './app-shell.scss';

export function AppShell() {
  return (
    <div className="app-shell">
      <div className="app-shell__content">
        <div className="app-shell__sidebar">
          <Sidebar />
        </div>
        <div className="app-shell__body">
          <TopBar />
          <main className="app-shell__main">
            <Outlet />
          </main>
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
