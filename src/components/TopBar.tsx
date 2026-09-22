import { ChevronRight, Sparkles, Tag, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store';

type BreadcrumbSegment = { label: string; icon?: React.ReactNode };

function useBreadcrumb(): { segments: BreadcrumbSegment[]; hint: string } {
  const { pathname } = useLocation();
  const { recorderTitle, recorderPhase } = useStore();

  if (pathname.startsWith('/recorder')) {
    return {
      segments: [{ label: 'Recorder', icon: null }, { label: recorderTitle }],
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
      {
        datasets: 'Datasets',
        variaveis: 'Variáveis',
        ambientes: 'Ambientes',
        secrets: 'Secrets',
      }[tab] ?? 'Dados';
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

export default function TopBar() {
  const { ambiente, device } = useStore();
  const { segments, hint } = useBreadcrumb();

  return (
    <header
      style={{
        height: 44,
        background: 'var(--color-sidebar)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 8,
        flexShrink: 0,
      }}
    >
      {/* Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          color: 'var(--color-text-2)',
          fontSize: 13,
        }}
      >
        {segments.map((seg, i) => (
          <span
            key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {i > 0 && (
              <ChevronRight
                size={12}
                style={{ color: 'var(--color-text-3)' }}
              />
            )}
            <span
              style={{
                color:
                  i === segments.length - 1
                    ? 'var(--color-text-1)'
                    : 'var(--color-text-2)',
                fontWeight: i === segments.length - 1 ? 500 : 400,
              }}
            >
              {seg.label}
            </span>
          </span>
        ))}
      </div>

      {/* Hint */}
      {hint && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: 'var(--color-text-3)',
            fontSize: 12,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <Sparkles size={12} style={{ flexShrink: 0 }} />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {hint}
          </span>
        </div>
      )}

      {/* Right controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginLeft: 'auto',
        }}
      >
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--color-border-strong)',
            background: 'var(--color-elevated)',
            color: 'var(--color-text-2)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          <Tag size={12} />
          <span style={{ color: 'var(--color-text-3)' }}>Ambiente</span>
          <span style={{ color: 'var(--color-text-1)', fontWeight: 600 }}>
            {ambiente}
          </span>
          <ChevronRight
            size={11}
            style={{ transform: 'rotate(90deg)', color: 'var(--color-text-3)' }}
          />
        </button>

        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--color-border-strong)',
            background: 'var(--color-elevated)',
            color: 'var(--color-text-2)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--color-accent)',
              flexShrink: 0,
            }}
          />
          {device}
        </button>

        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 6,
            border: '1px solid var(--color-border-strong)',
            background: 'var(--color-elevated)',
            color: 'var(--color-text-2)',
            cursor: 'pointer',
          }}
        >
          <Settings size={13} />
        </button>
      </div>
    </header>
  );
}
