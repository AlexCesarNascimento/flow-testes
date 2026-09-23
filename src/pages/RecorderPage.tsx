import { useStore } from '../store';
import PhasesBar from '../components/Recorder/PhasesBar';
import DeviceFrame from '../components/Recorder/DeviceFrame';
import StepsPanel from '../components/Recorder/StepsPanel';
import InspectorPanel from '../components/Recorder/InspectorPanel';

export default function RecorderPage() {
  const {
    recorderPhase,
    setRecorderPhase,
    steps,
    selectedStepId,
    setSelectedStep,
    recording,
    recordingSeconds,
  } = useStore();

  const selectedStep = steps.find((s) => s.id === selectedStepId) ?? null;
  const selectedCount = steps.filter((s) => s.selected).length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Barra de fases */}
      <PhasesBar
        phase={recorderPhase}
        onPhaseChange={setRecorderPhase}
        recording={recording}
        recordingSeconds={recordingSeconds}
      />

      {/* Três painéis */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Painel esquerdo — Dispositivo */}
        <div
          style={{
            width: 280,
            flexShrink: 0,
            borderRight: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header do painel */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 14px',
              borderBottom: '1px solid var(--color-border)',
              gap: 8,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: 13,
                color: 'var(--color-text-1)',
              }}
            >
              Dispositivo
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.05em',
                color:
                  recorderPhase === 'gravar'
                    ? 'var(--color-accent)'
                    : 'var(--color-text-3)',
                background:
                  recorderPhase === 'gravar'
                    ? 'var(--color-accent-bg)'
                    : 'var(--color-elevated)',
                border:
                  recorderPhase === 'gravar'
                    ? '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)'
                    : '1px solid var(--color-border)',
                borderRadius: 4,
                padding: '1px 6px',
              }}
            >
              {recorderPhase === 'gravar' ? 'AO VIVO' : 'CONECTADO'}
            </span>
          </div>

          {/* Conteúdo scrollável */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <DeviceFrame phase={recorderPhase} />
          </div>
        </div>

        {/* Painel central — Steps */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            borderRight: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <StepsPanel
            phase={recorderPhase}
            steps={steps}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStep}
          />
        </div>

        {/* Painel direito — Inspector / Editor / Salvar */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <InspectorPanel
            phase={recorderPhase}
            selectedStep={selectedStep}
            totalSteps={steps.length}
            selectedCount={selectedCount}
          />
        </div>
      </div>
    </div>
  );
}
