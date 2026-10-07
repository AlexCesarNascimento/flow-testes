import { useEffect, useState } from 'react';
import { useRecorderStore } from '@/entities/recorder';
import { useDatasetStore } from '@/entities/dataset';
import type { Step } from '@/entities/step';
import { normalizeStep } from '@/features/flow-export';
import { CopyButton } from './CopyButton';
import './step-details.scss';

export function StepDetails({
  step,
  index,
  disabled,
  onShowCode,
  onSave,
  onConvertPassword,
  passwordTapCount,
  passwordStepPresent,
}: {
  step: Step;
  index: number;
  disabled: boolean;
  onShowCode: () => void;
  onSave: () => void;
  onConvertPassword: (column: string) => void;
  passwordTapCount: number;
  passwordStepPresent: boolean;
}) {
  const update = useRecorderStore((s) => s.updateStep);
  const datasetColumns = useDatasetStore((s) => s.columns);
  const [passwordColumn, setPasswordColumn] = useState('');
  const dynamicKeypad =
    step.type === 'waitForPage' &&
    step.screenSignature?.anchors.some(
      (anchor) =>
        anchor.type === 'resourceId' &&
        /:id\/btns_keyboard$/.test(anchor.value),
    ) &&
    [1, 2, 3, 4, 5].every((number) =>
      step.screenSignature?.anchors.some(
        (anchor) =>
          anchor.type === 'resourceId' &&
          anchor.value.endsWith(`/btn${number}`),
      ),
    );
  const [timeout, setTimeoutValue] = useState(
    step.timeoutMs === undefined ? '' : String(step.timeoutMs / 1000),
  );
  useEffect(
    () =>
      setTimeoutValue(
        step.timeoutMs === undefined ? '' : String(step.timeoutMs / 1000),
      ),
    [step.timeoutMs],
  );
  const invalid =
    timeout !== '' &&
    (!Number.isFinite(Number(timeout)) ||
      Number(timeout) < 1 ||
      Number(timeout) > 120);
  const selectors =
    step.type === 'waitForPage' && step.screenSignature
      ? step.screenSignature.anchors.map((anchor) => ({
          ...anchor,
          stability:
            anchor.type === 'text' ? ('medium' as const) : ('stable' as const),
          recommended: false,
        }))
      : step.selectors.filter((s) => s.type !== 'coordinates');
  return (
    <div className="step-details" id={`step-details-${step.id}`}>
      <dl className="step-details__properties">
        <div>
          <dt>Tipo</dt>
          <dd>
            <code>{step.type}</code>
          </dd>
        </div>
        {step.value !== undefined && (
          <div>
            <dt>{step.type === 'launchApp' ? 'App' : 'Valor'}</dt>
            <dd>
              <code>
                {step.type === 'secureKeypad'
                  ? (step.value?.match(/^\{\{[a-zA-Z0-9_]+\}\}$/)?.[0] ??
                    '(variável inválida)')
                  : step.value || '(vazio)'}
              </code>
            </dd>
          </div>
        )}
        {step.screenSignature && (
          <div>
            <dt>Assinatura da tela</dt>
            <dd>
              {step.screenSignature.packageName} ·{' '}
              {step.screenSignature.anchors.length} âncoras
            </dd>
          </div>
        )}
      </dl>
      {step.type === 'secureKeypad' && (
        <label className="step-details__keypad-variable">
          Coluna da senha
          <select
            aria-label={`Coluna da senha do step ${step.id}`}
            value={step.value?.match(/^\{\{([a-zA-Z0-9_]+)\}\}$/)?.[1] ?? ''}
            disabled={disabled}
            onChange={(event) => {
              if (!event.target.value) return;
              update(step.id, {
                value: `{{${event.target.value}}}`,
                label: `Digitar senha no teclado · {{${event.target.value}}}`,
              });
            }}
          >
            <option value="">Escolha uma coluna…</option>
            {datasetColumns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </label>
      )}
      {dynamicKeypad && (
        <div className="step-details__keypad">
          <strong>Teclado de senha dinâmico</strong>
          {passwordStepPresent ? (
            <p>O step de senha está configurado logo abaixo.</p>
          ) : (
            <>
              <p>
                Os pares de números mudam. Substitua os toques gravados por uma
                variável; o Play localizará cada número na tela atual.
              </p>
              <p>
                {passwordTapCount} toque{passwordTapCount === 1 ? '' : 's'}{' '}
                consecutivo{passwordTapCount === 1 ? '' : 's'} do teclado ser
                {passwordTapCount === 1 ? 'á' : 'ão'} substituído
                {passwordTapCount === 1 ? '' : 's'}.
              </p>
              <label>
                Coluna com a senha
                <select
                  value={passwordColumn}
                  onChange={(event) => setPasswordColumn(event.target.value)}
                  disabled={disabled || datasetColumns.length === 0}
                  aria-label="Coluna da senha do teclado dinâmico"
                >
                  <option value="">Escolha uma coluna…</option>
                  {datasetColumns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </label>
              {datasetColumns.length === 0 && (
                <p>Crie uma coluna em Dados › Datasets antes de converter.</p>
              )}
              <button
                type="button"
                disabled={disabled || !passwordColumn}
                onClick={() => onConvertPassword(passwordColumn)}
              >
                Substituir toques por step de senha
              </button>
            </>
          )}
        </div>
      )}
      <h4>
        {step.type === 'waitForPage' && step.screenSignature
          ? 'Âncoras da tela'
          : 'Seletores'}{' '}
        <span>{selectors.length}</span>
      </h4>
      {step.pending ? (
        <p role="status">Identificando o elemento…</p>
      ) : selectors.length === 0 ? (
        <p className="step-details__hint">
          {step.type === 'secureKeypad'
            ? 'O Play lê os pares numéricos atuais do device antes de cada toque.'
            : step.type === 'inputText'
              ? 'Sem seletor: o playback exige um campo editável focado.'
              : step.type === 'launchApp'
                ? 'Abertura pelo pacote do app.'
                : 'Sem identidade de elemento. Grave novamente ou configure o seletor no Inspector.'}
        </p>
      ) : (
        <ul className="step-details__selectors">
          {selectors.map((selector, i) => (
            <li key={`${selector.type}-${i}`}>
              <div className="step-details__selector-heading">
                <strong>{selector.type}</strong>
                <span
                  className={`step-details__stability step-details__stability--${selector.stability}`}
                >
                  {
                    { stable: 'Estável', medium: 'Média', fragile: 'Frágil' }[
                      selector.stability
                    ]
                  }
                </span>
                {selector.recommended && <span>Recomendado</span>}
              </div>
              <code>{selector.value}</code>
              <CopyButton
                text={selector.value}
                label={`Copiar seletor ${i + 1} do step ${step.id}`}
              />
            </li>
          ))}
        </ul>
      )}
      <label className="step-details__timeout">
        <span>
          Delay máximo até o próximo passo
          <small>Avança antes se a tela ou o elemento estiver pronto</small>
        </span>
        <input
          type="number"
          min="0"
          max="300"
          step="0.1"
          aria-label={`Delay máximo até o próximo passo após step ${step.id}, em segundos`}
          disabled={disabled}
          value={(step.delayAfterMs ?? 0) / 1000}
          onChange={(event) => {
            const seconds = event.target.valueAsNumber;
            if (Number.isFinite(seconds) && seconds >= 0 && seconds <= 300)
              update(step.id, { delayAfterMs: Math.round(seconds * 1000) });
          }}
        />
      </label>
      <label className="step-details__timeout">
        <span>
          Timeout do step <small>Limite da ação, em segundos</small>
        </span>
        <input
          type="number"
          min="1"
          max="120"
          step="0.5"
          placeholder="Padrão"
          value={timeout}
          disabled={disabled}
          aria-label={`Timeout do step ${step.id}, em segundos`}
          aria-invalid={invalid}
          aria-describedby={`timeout-hint-${step.id}`}
          onChange={(event) => {
            const value = event.target.value;
            setTimeoutValue(value);
            if (value === '') update(step.id, { timeoutMs: undefined });
            else if (
              Number.isFinite(Number(value)) &&
              Number(value) >= 1 &&
              Number(value) <= 120
            )
              update(step.id, { timeoutMs: Math.round(Number(value) * 1000) });
          }}
        />
      </label>
      <p
        id={`timeout-hint-${step.id}`}
        className="step-details__hint"
        role={invalid ? 'alert' : undefined}
      >
        {invalid
          ? 'Use um valor entre 1 e 120 segundos.'
          : step.type === 'secureKeypad'
            ? 'Vazio usa 60 s para toda a sequência. A cada dígito, o teclado é lido novamente.'
            : 'Vazio mantém o limite padrão. Se a condição ficar pronta antes, a ação continua imediatamente.'}
      </p>
      <div className="step-details__actions">
        <CopyButton
          text={JSON.stringify(normalizeStep(step, index), null, 2)}
          label={`Copiar JSON do step ${step.id}`}
        />
        <button type="button" onClick={onShowCode}>
          Ver JSON deste step
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={disabled || step.pending}
        >
          Salvar este step como bloco
        </button>
      </div>
    </div>
  );
}
