import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/widgets/app-shell';
import { RecorderPage } from '@/pages/recorder';
import { FlowsPage } from '@/pages/flows';
import { AcoesPage } from '@/pages/acoes';
import { VariaveisPage } from '@/pages/variaveis';
import { ExecucaoAtualPage } from '@/pages/execucao-atual';
import { OutOfScopePage } from '@/pages/out-of-scope';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/recorder" replace />} />
        <Route path="/recorder" element={<RecorderPage />} />
        <Route path="/flows" element={<FlowsPage />} />
        <Route path="/acoes" element={<AcoesPage />} />
        <Route path="/variaveis" element={<VariaveisPage />} />
        <Route path="/execucoes/atual" element={<ExecucaoAtualPage />} />
        <Route
          path="/execucoes/relatorios"
          element={<OutOfScopePage title="Relatórios" />}
        />
        <Route path="*" element={<Navigate to="/recorder" replace />} />
      </Route>
    </Routes>
  );
}
