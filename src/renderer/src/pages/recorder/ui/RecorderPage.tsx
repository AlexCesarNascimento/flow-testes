import { useEffect } from 'react';
import { useRecorderStore } from '@/entities/recorder';
import type { RecorderPhase } from '@/entities/recorder';
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
    startRecording,
    stopRecording,
    tickRecording,
    steps,
    inspectorOpen,
  } = useRecorderStore();

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => tickRecording(), 1000);
    return () => clearInterval(id);
  }, [recording, tickRecording]);

  const selectedStep = steps.find((s) => s.id === selectedStepId) ?? null;
  const selectedCount = steps.filter((s) => s.selected).length;

  const handlePhaseChange = (p: RecorderPhase) => {
    if (p === 'salvar') stopRecording();
    setRecorderPhase(p);
  };

  const handleFinishRecording = () => {
    // Pausa a captura mas mantém a fase gravar — user pode editar, adicionar
    // steps, executar, e depois clicar "Iniciar gravação" pra continuar
    // gravando (steps existentes são preservados).
    stopRecording();
  };

  return (
    <div className="recorder-page">
      <PhasesBar
        phase={recorderPhase}
        onPhaseChange={handlePhaseChange}
        recording={recording}
        recordingSeconds={recordingSeconds}
        onStartRecording={startRecording}
        onFinishRecording={handleFinishRecording}
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

        {inspectorOpen && (
          <div className="recorder-page__inspector-col">
            <InspectorPanel
              phase={recorderPhase}
              selectedStep={selectedStep}
              totalSteps={steps.length}
              selectedCount={selectedCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
