import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAmbienteStore } from '@/entities/ambiente';
import { MOCK_DATASET_ROWS } from '@/entities/dataset';
import './matriz-page.scss';

const DEVICES = [
  { id: 'pixel7', name: 'Pixel 7', os: 'Android 14' },
  { id: 'galaxy', name: 'Galaxy S23', os: 'Android 14' },
  { id: 'emulator', name: 'Emulator API 35', os: 'Android 15' },
];

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`toggle-btn toggle-btn--${value ? 'on' : 'off'}`}
    >
      <span
        className={`toggle-btn__thumb toggle-btn__thumb--${value ? 'on' : 'off'}`}
      />
    </button>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={`configurar-panel__checkbox configurar-panel__checkbox--${checked ? 'checked' : 'unchecked'}`}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4l3 3 5-6"
            stroke="#000"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

function ConfigurarPanel() {
  const { ambiente } = useAmbienteStore();
  const datasetRows = MOCK_DATASET_ROWS;
  const [selectedRows, setSelectedRows] = useState<string[]>(
    datasetRows.map((r) => r.id),
  );
  const [selectedDevices, setSelectedDevices] = useState<string[]>(
    DEVICES.map((d) => d.id),
  );
  const [continuarAposFalha, setContinuarAposFalha] = useState(true);
  const [paralelo, setParalelo] = useState(true);
  const [simularRegressao, setSimularRegressao] = useState(false);

  const toggleRow = (id: string) =>
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );

  const toggleDevice = (id: string) =>
    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );

  return (
    <div className="configurar-panel">
      <div className="configurar-panel__header">Configurar matriz</div>
      <div className="configurar-panel__body">
        <div className="configurar-panel__section">
          <div className="configurar-panel__section-title">
            DATASET · CLIENTES_VAREJO
          </div>
          <div className="configurar-panel__list">
            {datasetRows.map((row) => (
              <button
                key={row.id}
                onClick={() => toggleRow(row.id)}
                className="configurar-panel__item-btn"
              >
                <Checkbox checked={selectedRows.includes(row.id)} />
                <div>
                  <div className="configurar-panel__item-name">{row.id}</div>
                  <div className="configurar-panel__item-sub">{row.login}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="configurar-panel__section">
          <div className="configurar-panel__section-title">DEVICES</div>
          <div className="configurar-panel__list">
            {DEVICES.map((d) => (
              <button
                key={d.id}
                onClick={() => toggleDevice(d.id)}
                className="configurar-panel__item-btn"
              >
                <Checkbox checked={selectedDevices.includes(d.id)} />
                <div>
                  <div className="configurar-panel__item-name">{d.name}</div>
                  <div className="configurar-panel__item-sub">{d.os}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="configurar-panel__section">
          <div className="configurar-panel__section-title">AMBIENTE</div>
          <div className="configurar-panel__env-row">
            <span className="configurar-panel__env-dot" />
            <span className="configurar-panel__env-name">{ambiente}</span>
            <span className="configurar-panel__env-hint">troque no topo</span>
          </div>
        </div>

        <div className="configurar-panel__toggles">
          {[
            {
              label: 'Continuar após falha',
              value: continuarAposFalha,
              onChange: setContinuarAposFalha,
            },
            {
              label: 'Executar devices em paralelo',
              value: paralelo,
              onChange: setParalelo,
            },
            {
              label: 'Simular regressão no app',
              value: simularRegressao,
              onChange: setSimularRegressao,
            },
          ].map((item) => (
            <div key={item.label} className="configurar-panel__toggle-row">
              <span className="configurar-panel__toggle-label">
                {item.label}
              </span>
              <Toggle value={item.value} onChange={item.onChange} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultadoPanel() {
  const datasetRows = MOCK_DATASET_ROWS;

  return (
    <div className="resultado-panel">
      <div className="resultado-panel__header">Resultado por combinação</div>
      <div className="resultado-panel__body">
        <div className="resultado-panel__warning">
          <AlertTriangle size={16} className="resultado-panel__warning-icon" />
          <p className="resultado-panel__warning-text">
            O Flow atual falha em todas as combinações: Texto "Olá, Alex" não
            ficou visível em 10 s. Corrija no Flow antes de rodar.
          </p>
        </div>

        <div className="resultado-panel__grid">
          <div className="resultado-panel__grid-head">
            <div />
            {DEVICES.map((d) => (
              <div key={d.id} className="resultado-panel__grid-head-cell">
                <div className="resultado-panel__device-name">{d.name}</div>
                <div className="resultado-panel__device-os">{d.os}</div>
              </div>
            ))}
          </div>

          {datasetRows.map((row) => (
            <div key={row.id} className="resultado-panel__grid-row">
              <div className="resultado-panel__row-id">
                <div className="resultado-panel__row-name">{row.id}</div>
                <div className="resultado-panel__row-login">{row.login}</div>
              </div>
              {DEVICES.map((d) => (
                <div key={d.id} className="resultado-panel__cell">
                  <div className="resultado-panel__radio" />
                  <span className="resultado-panel__cell-status">pronto</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <p className="resultado-panel__note">
          Clique em uma célula para ligar ou desligar a combinação. Depois
          execute a matriz — ligue "Simular regressão" para ver uma falha por
          device.
        </p>
      </div>
    </div>
  );
}

export function MatrizPage() {
  return (
    <div className="matriz-page">
      <ConfigurarPanel />
      <ResultadoPanel />
    </div>
  );
}
