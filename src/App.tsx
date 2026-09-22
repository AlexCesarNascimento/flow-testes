import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import VisionGeral from './pages/VisionGeral';
import RecorderPage from './pages/RecorderPage';
import FlowsPage from './pages/FlowsPage';
import AcoesPage from './pages/AcoesPage';
import DadosPage from './pages/DadosPage';
import ExecucaoAtualPage from './pages/ExecucaoAtualPage';
import MatrizPage from './pages/MatrizPage';
import OutOfScopePage from './pages/OutOfScopePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/visao-geral" replace />} />
          <Route path="/visao-geral" element={<VisionGeral />} />
          <Route path="/recorder" element={<RecorderPage />} />
          <Route path="/flows" element={<FlowsPage />} />
          <Route path="/acoes" element={<AcoesPage />} />
          <Route path="/dados/:tab?" element={<DadosPage />} />
          <Route path="/execucoes/atual" element={<ExecucaoAtualPage />} />
          <Route path="/execucoes/matriz" element={<MatrizPage />} />
          <Route
            path="/execucoes/relatorios"
            element={<OutOfScopePage title="Relatórios" />}
          />
          <Route
            path="/dispositivos"
            element={<OutOfScopePage title="Dispositivos" />}
          />
          <Route path="*" element={<Navigate to="/visao-geral" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
