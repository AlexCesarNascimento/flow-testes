import { Play, Crosshair } from 'lucide-react';
import { useAmbienteStore } from '@/entities/ambiente';
import { DeviceFrame } from '@/widgets/recorder-device-frame';
import './execucao-atual-page.scss';

function DispositivoPanel() {
  return (
    <div className="dispositivo-panel">
      <div className="dispositivo-panel__header">
        <span className="dispositivo-panel__title">Dispositivo</span>
        <span className="dispositivo-panel__badge">PRONTO</span>
      </div>
      <div className="dispositivo-panel__body">
        <DeviceFrame phase="editar" />
      </div>
    </div>
  );
}

function ExecucaoPanel() {
  const { device, ambiente } = useAmbienteStore();

  return (
    <div className="execucao-panel">
      <div className="execucao-panel__header">
        <span className="execucao-panel__status-badge">PRONTO</span>
        <span className="execucao-panel__title">Execução #24</span>
        <span className="execucao-panel__subtitle">
          {device.split(' · ')[0]} · {ambiente}
        </span>
      </div>

      <div className="execucao-panel__empty">
        <Play
          size={36}
          className="execucao-panel__empty-icon"
          strokeWidth={1.5}
        />
        <div className="execucao-panel__empty-title">
          Nenhuma execução ainda
        </div>
        <div className="execucao-panel__empty-desc">
          Monte o Flow e clique em Executar. Você acompanha cada step, pausa,
          avança passo a passo e volta no tempo.
        </div>
        <button className="execucao-panel__run-btn">
          <Play size={15} fill="currentColor" />
          Executar o Flow atual
        </button>
      </div>
    </div>
  );
}

function DetalhePanel() {
  return (
    <div className="detalhe-panel">
      <div className="detalhe-panel__header">Detalhe do step</div>
      <div className="detalhe-panel__empty">
        <Crosshair
          size={32}
          className="detalhe-panel__empty-icon"
          strokeWidth={1.5}
        />
        <div className="detalhe-panel__empty-title">Selecione um step</div>
        <div className="detalhe-panel__empty-desc">
          Clique em qualquer step da execução para ver o que o app mostrava
          antes e depois, e o que o agente encontrou enquanto ela rodava.
        </div>
      </div>
    </div>
  );
}

export function ExecucaoAtualPage() {
  return (
    <div className="execucao-atual-page">
      <DispositivoPanel />
      <ExecucaoPanel />
      <DetalhePanel />
    </div>
  );
}
