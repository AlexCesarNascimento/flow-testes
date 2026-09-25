import { ChevronRight, Sparkles, Tag, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useRecorderStore } from '@/entities/recorder';
import { useAmbienteStore } from '@/entities/ambiente';
import './top-bar.scss';

type BreadcrumbSegment = { label: string };

function useBreadcrumb(): { segments: BreadcrumbSegment[]; hint: string } {
  const { pathname } = useLocation();
  const { recorderTitle, recorderPhase } = useRecorderStore();

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
      hint: 'Arraste blocos da paleta e encaixe uns nos outros · dentro de "Para cada..."',
    };
  if (pathname.startsWith('/acoes'))
    return {
      segments: [{ label: 'Ações' }],
      hint: 'Ações reutilizáveis salvas a partir do Recorder',
    };
  if (pathname.startsWith('/dados')) {
    const tab = pathname.split('/')[2] ?? 'datasets';
    const tabLabel =
      (
        {
          datasets: 'Datasets',
          variaveis: 'Variáveis',
          ambientes: 'Ambientes',
          secrets: 'Secrets',
        } as Record<string, string>
      )[tab] ?? 'Dados';
    return {
      segments: [{ label: 'Dados' }, { label: tabLabel }],
      hint: 'Datasets, variáveis, ambientes e secrets do projeto',
    };
  }
  if (pathname.startsWith('/execucoes/atual'))
    return {
      segments: [{ label: 'Execuções' }, { label: '#24' }],
      hint: 'Selecione um step para inspecionar',
    };
  if (pathname.startsWith('/execucoes/matriz'))
    return {
      segments: [{ label: 'Execuções' }, { label: 'Matriz' }],
      hint: 'Dataset × device × ambiente — cada célula é uma execução',
    };
  if (pathname.startsWith('/execucoes/relatorios'))
    return { segments: [{ label: 'Relatórios' }], hint: '' };
  if (pathname.startsWith('/dispositivos'))
    return { segments: [{ label: 'Dispositivos' }], hint: '' };
  return {
    segments: [{ label: 'Visão geral' }],
    hint: 'Siga a jornada abaixo ou navegue pela barra lateral',
  };
}

export function TopBar() {
  const { ambiente, device } = useAmbienteStore();
  const { segments, hint } = useBreadcrumb();

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
        <button className="top-bar__button">
          <Tag size={12} />
          <span className="top-bar__button-label">Ambiente</span>
          <span className="top-bar__button-value">{ambiente}</span>
          <ChevronRight size={11} className="top-bar__chevron-down" />
        </button>

        <button className="top-bar__button">
          <span className="top-bar__device-dot" />
          {device}
        </button>

        <button className="top-bar__button top-bar__button--icon-only">
          <Settings size={13} />
        </button>
      </div>
    </header>
  );
}
