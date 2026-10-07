import { useLocation } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CircleAlert,
  CircleCheck,
  Smartphone,
  Tag,
} from 'lucide-react';
import { useFlowStore } from '@/entities/flow';
import { useDeviceStore } from '@/entities/device';
import { useAmbienteStore } from '@/entities/ambiente';
import './status-bar.scss';

function pageLabel(pathname: string): string {
  if (pathname.startsWith('/recorder')) return 'Recorder';
  if (pathname.startsWith('/flows')) return 'Flows';
  if (pathname.startsWith('/acoes')) return 'Ações';
  if (pathname.startsWith('/variaveis')) return 'Variáveis';
  if (pathname.startsWith('/execucoes/atual')) return 'Execução atual';
  if (pathname.startsWith('/execucoes/relatorios')) return 'Relatórios';
  return 'FlowTest';
}

export function StatusBar() {
  const { pathname } = useLocation();
  const isPlaying = useFlowStore((s) => s.isPlaying);
  const currentNodeId = useFlowStore((s) => s.currentNodeId);
  const currentNode = useFlowStore((s) =>
    currentNodeId ? s.nodes.find((n) => n.id === currentNodeId) : null,
  );
  const nodesCount = useFlowStore((s) => s.nodes.length);
  const edgesCount = useFlowStore((s) => s.edges.length);
  const errors = useFlowStore(
    (s) => s.logs.filter((l) => l.level === 'error').length,
  );
  const warnings = useFlowStore(
    (s) => s.logs.filter((l) => l.level === 'warn').length,
  );
  const deviceName = useDeviceStore((s) => s.deviceName);
  const deviceStatus = useDeviceStore((s) => s.status);
  const ambiente = useAmbienteStore((s) => s.ambiente);

  return (
    <footer
      className="status-bar"
      role="contentinfo"
      aria-label="Barra de status"
    >
      <div className="status-bar__group">
        <span className="status-bar__item status-bar__item--page">
          {pageLabel(pathname)}
        </span>
        <span className="status-bar__item" title="Blocos no fluxo">
          <Activity size={11} aria-hidden="true" />
          {nodesCount} blocos · {edgesCount} conexões
        </span>
        {isPlaying && currentNode && (
          <span
            className="status-bar__item status-bar__item--playing"
            title="Executando bloco"
          >
            <span className="status-bar__dot" aria-hidden="true" />
            Executando: {currentNode.data.label}
          </span>
        )}
      </div>

      <div className="status-bar__spacer" />

      <div className="status-bar__group">
        {errors > 0 && (
          <span className="status-bar__item status-bar__item--error">
            <CircleAlert size={11} aria-hidden="true" />
            {errors} {errors === 1 ? 'erro' : 'erros'}
          </span>
        )}
        {warnings > 0 && (
          <span className="status-bar__item status-bar__item--warn">
            <AlertTriangle size={11} aria-hidden="true" />
            {warnings} {warnings === 1 ? 'aviso' : 'avisos'}
          </span>
        )}
        {errors === 0 && warnings === 0 && (
          <span className="status-bar__item status-bar__item--ok">
            <CircleCheck size={11} aria-hidden="true" />
            Sem erros
          </span>
        )}
        <span className="status-bar__item" title={`Ambiente: ${ambiente}`}>
          <Tag size={11} aria-hidden="true" />
          {ambiente}
        </span>
        <span
          className="status-bar__item"
          title={`Device: ${deviceName ?? '—'} (${deviceStatus})`}
        >
          <Smartphone size={11} aria-hidden="true" />
          {deviceStatus === 'streaming' || deviceStatus === 'connecting'
            ? (deviceName ?? 'Conectando…')
            : 'Nenhum device'}
        </span>
      </div>
    </footer>
  );
}
