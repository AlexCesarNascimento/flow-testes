import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/widgets/app-shell';
import { VisaoGeralPage } from '@/pages/visao-geral';
import { RecorderPage } from '@/pages/recorder';
import { FlowsPage } from '@/pages/flows';
import { AcoesPage } from '@/pages/acoes';
import { DadosPage } from '@/pages/dados';
import { ExecucaoAtualPage } from '@/pages/execucao-atual';
import { MatrizPage } from '@/pages/matriz';
import { OutOfScopePage } from '@/pages/out-of-scope';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/visao-geral" replace />} />
        <Route path="/visao-geral" element={<VisaoGeralPage />} />
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
  );
}
