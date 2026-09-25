import { useRecorderStore } from '@/entities/recorder';
import { MOCK_STEPS } from '@/entities/step';
import { PhasesBar } from '@/widgets/recorder-phases-bar';
import { DeviceFrame } from '@/widgets/recorder-device-frame';
import { StepsPanel } from '@/widgets/recorder-steps-panel';
import { InspectorPanel } from '@/widgets/recorder-inspector';
import './recorder-page.scss';

export function RecorderPage() {
  const {
    recorderPhase,
    setRecorderPhase,
    selectedStepId,
    setSelectedStep,
    recording,
    recordingSeconds,
  } = useRecorderStore();

  const steps = MOCK_STEPS;
  const selectedStep = steps.find((s) => s.id === selectedStepId) ?? null;
  const selectedCount = steps.filter((s) => s.selected).length;

  return (
    <div className="recorder-page">
      <PhasesBar
        phase={recorderPhase}
        onPhaseChange={setRecorderPhase}
        recording={recording}
        recordingSeconds={recordingSeconds}
      />

      <div className="recorder-page__panels">
        <div className="recorder-page__device-col">
          <div className="recorder-page__panel-header">
            <span className="recorder-page__panel-title">Dispositivo</span>
            <span
              className={`recorder-page__panel-badge recorder-page__panel-badge--${recorderPhase === 'gravar' ? 'live' : 'connected'}`}
            >
              {recorderPhase === 'gravar' ? 'AO VIVO' : 'CONECTADO'}
            </span>
          </div>
          <div className="recorder-page__device-body">
            <DeviceFrame phase={recorderPhase} />
          </div>
        </div>

        <div className="recorder-page__steps-col">
          <StepsPanel
            phase={recorderPhase}
            steps={steps}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStep}
          />
        </div>

        <div className="recorder-page__inspector-col">
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
