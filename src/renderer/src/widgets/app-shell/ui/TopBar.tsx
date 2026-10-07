import {
  ChevronRight,
  Sparkles,
  Tag,
  Settings,
  PanelLeft,
  PanelRight,
  PanelBottom,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useRecorderStore } from '@/entities/recorder';
import { useAmbienteStore } from '@/entities/ambiente';
import { useDeviceStore } from '@/entities/device';
import { useLayoutStore } from '../model/layout-store';
import './top-bar.scss';

type BreadcrumbSegment = { label: string };

function useBreadcrumb(): { segments: BreadcrumbSegment[]; hint: string } {
  const { pathname } = useLocation();
  const recorderTitle = useRecorderStore((s) => s.recorderTitle);
  const recorderPhase = useRecorderStore((s) => s.recorderPhase);

  if (pathname.startsWith('/recorder')) {
    return {
      segments: [{ label: 'Recorder' }, { label: recorderTitle }],
      hint:
        recorderPhase === 'gravar'
          ? 'Gravando: toque nos campos do dispositivo e digite, ou use "Preencher e entrar (demo)"'
          : recorderPhase === 'editar'
            ? 'Clique em um step para editar · use ▶ para testar no device'
            : 'Dê um nome e salve — a Action vira um bloco do Flow',
    };
  }
  if (pathname.startsWith('/flows'))
    return {
      segments: [{ label: 'Flows' }],
      hint: 'Selecione um bloco salvo no Recorder para revisar seus steps e parâmetros.',
    };
  if (pathname.startsWith('/acoes'))
    return {
      segments: [{ label: 'Ações' }],
      hint: 'Ações reutilizáveis salvas a partir do Recorder',
    };
  if (pathname.startsWith('/variaveis'))
    return {
      segments: [{ label: 'Variáveis' }],
      hint: 'Variáveis e massas de teste do projeto',
    };
  if (pathname.startsWith('/execucoes/atual'))
    return {
      segments: [{ label: 'Execuções' }, { label: '#24' }],
      hint: 'Selecione um step para inspecionar',
    };
  if (pathname.startsWith('/execucoes/relatorios'))
    return { segments: [{ label: 'Relatórios' }], hint: '' };
  return {
    segments: [{ label: 'Visão geral' }],
    hint: 'Siga a jornada abaixo ou navegue pela barra lateral',
  };
}

export function TopBar() {
  const ambiente = useAmbienteStore((s) => s.ambiente);
  const deviceName = useDeviceStore((s) => s.deviceName);
  const deviceStatus = useDeviceStore((s) => s.status);
  const { segments, hint } = useBreadcrumb();

  const deviceLabel =
    deviceStatus === 'streaming' || deviceStatus === 'connecting'
      ? (deviceName ?? 'Conectando…')
      : 'Nenhum device';

  return (
    <header className="top-bar">
      <div className="top-bar__breadcrumb">
        {segments.map((seg, i) => (
          <span key={i} className="top-bar__breadcrumb-segment">
            {i > 0 && (
              <ChevronRight size={12} className="top-bar__breadcrumb-sep" />
            )}
            <span
              className={`top-bar__breadcrumb-label${i === segments.length - 1 ? ' top-bar__breadcrumb-label--current' : ''}`}
            >
              {seg.label}
            </span>
          </span>
        ))}
      </div>

      {hint && (
        <div className="top-bar__hint">
          <Sparkles size={12} className="top-bar__hint-icon" />
          <span className="top-bar__hint-text">{hint}</span>
        </div>
      )}

      <div className="top-bar__controls">
        <button
          className="top-bar__button"
          disabled
          aria-label={`Ambiente: ${ambiente}`}
        >
          <Tag size={12} aria-hidden="true" />
          <span className="top-bar__button-label">Ambiente</span>
          <span className="top-bar__button-value">{ambiente}</span>
          <ChevronRight
            size={11}
            className="top-bar__chevron-down"
            aria-hidden="true"
          />
        </button>

        <button
          className="top-bar__button"
          disabled
          aria-label={`Dispositivo: ${deviceLabel}`}
        >
          <span
            className={`top-bar__device-dot${deviceStatus === 'streaming' ? ' top-bar__device-dot--connected' : ''}`}
            aria-hidden="true"
          />
          {deviceLabel}
        </button>

        <SidesheetToggles />

        <button
          className="top-bar__button top-bar__button--icon-only"
          disabled
          aria-label="Configurações"
        >
          <Settings size={13} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

function SidesheetToggles() {
  const leftTrayCollapsed = useLayoutStore((s) => s.leftTrayCollapsed);
  const rightTrayCollapsed = useLayoutStore((s) => s.rightTrayCollapsed);
  const toggleLeftTray = useLayoutStore((s) => s.toggleLeftTray);
  const toggleRightTray = useLayoutStore((s) => s.toggleRightTray);
  return (
    <div className="top-bar__sidesheets" role="group" aria-label="Painéis">
      <button
        type="button"
        className={`top-bar__sidesheet${!leftTrayCollapsed ? ' top-bar__sidesheet--on' : ''}`}
        onClick={toggleLeftTray}
        aria-pressed={!leftTrayCollapsed}
        aria-label={
          leftTrayCollapsed
            ? 'Mostrar bandeja esquerda'
            : 'Recolher bandeja esquerda'
        }
        title={
          leftTrayCollapsed
            ? 'Mostrar bandeja esquerda'
            : 'Recolher bandeja esquerda'
        }
      >
        <PanelLeft size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="top-bar__sidesheet"
        disabled
        aria-disabled="true"
        aria-label="Painel inferior (em breve)"
        title="Painel inferior (em breve)"
      >
        <PanelBottom size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`top-bar__sidesheet${!rightTrayCollapsed ? ' top-bar__sidesheet--on' : ''}`}
        onClick={toggleRightTray}
        aria-pressed={!rightTrayCollapsed}
        aria-label={
          rightTrayCollapsed
            ? 'Mostrar bandeja direita'
            : 'Recolher bandeja direita'
        }
        title={
          rightTrayCollapsed
            ? 'Mostrar bandeja direita'
            : 'Recolher bandeja direita'
        }
      >
        <PanelRight size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
