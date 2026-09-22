import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  GitBranch,
  Zap,
  Database,
  Braces,
  Table2,
  Globe2,
  Lock,
  Play,
  Timer,
  Grid3X3,
  BarChart3,
  Smartphone,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '../store';

type NavItem = {
  label: string;
  to: string;
  icon: React.ReactNode;
};

const groupStyle: React.CSSProperties = {
  color: 'var(--color-text-3)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  padding: '12px 12px 4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  userSelect: 'none',
};

function NavButton({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 6,
        margin: '1px 6px',
        color: isActive ? 'var(--color-accent-text)' : 'var(--color-text-2)',
        background: isActive ? 'var(--color-accent-bg)' : 'transparent',
        fontWeight: isActive ? 500 : 400,
        textDecoration: 'none',
        fontSize: 13,
        transition: 'background 0.1s, color 0.1s',
        cursor: 'pointer',
      })}
    >
      {item.icon}
      {item.label}
    </NavLink>
  );
}

function CollapsibleGroup({
  label,
  icon,
  items,
  defaultOpen = true,
}: {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          ...groupStyle,
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {icon}
          {label}
        </span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && items.map((item) => <NavButton key={item.to} item={item} />)}
    </>
  );
}

export default function Sidebar() {
  const { project } = useStore();
  const navigate = useNavigate();

  const dadosItems: NavItem[] = [
    { label: 'Variáveis', to: '/dados/variaveis', icon: <Braces size={14} /> },
    { label: 'Datasets', to: '/dados/datasets', icon: <Table2 size={14} /> },
    { label: 'Ambientes', to: '/dados/ambientes', icon: <Globe2 size={14} /> },
    { label: 'Secrets', to: '/dados/secrets', icon: <Lock size={14} /> },
  ];

  const execItems: NavItem[] = [
    {
      label: 'Execução atual',
      to: '/execucoes/atual',
      icon: <Timer size={14} />,
    },
    { label: 'Matriz', to: '/execucoes/matriz', icon: <Grid3X3 size={14} /> },
    {
      label: 'Relatórios',
      to: '/execucoes/relatorios',
      icon: <BarChart3 size={14} />,
    },
  ];

  return (
    <aside
      style={{
        width: 200,
        minWidth: 200,
        background: 'var(--color-sidebar)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '14px 14px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Play size={14} fill="white" color="white" />
        </div>
        <span
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--color-text-1)',
          }}
        >
          FlowTest
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingTop: 6 }}>
        <NavButton
          item={{
            label: 'Visão geral',
            to: '/visao-geral',
            icon: <LayoutDashboard size={14} />,
          }}
        />
        <NavButton
          item={{
            label: 'Recorder',
            to: '/recorder',
            icon: <Radio size={14} />,
          }}
        />
        <NavButton
          item={{ label: 'Flows', to: '/flows', icon: <GitBranch size={14} /> }}
        />
        <NavButton
          item={{ label: 'Ações', to: '/acoes', icon: <Zap size={14} /> }}
        />

        <CollapsibleGroup
          label="Dados"
          icon={<Database size={12} />}
          items={dadosItems}
        />

        <CollapsibleGroup
          label="Execuções"
          icon={<Play size={12} />}
          items={execItems}
        />

        <NavButton
          item={{
            label: 'Dispositivos',
            to: '/dispositivos',
            icon: <Smartphone size={14} />,
          }}
        />
      </nav>

      {/* Bottom */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: '8px 6px',
        }}
      >
        <button
          onClick={() => navigate('/visao-geral')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 6,
            width: '100%',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-2)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          <Settings size={14} />
          Configurações
        </button>

        <div style={{ padding: '6px 12px' }}>
          <div style={{ color: 'var(--color-text-3)', fontSize: 11 }}>
            Projeto atual
          </div>
          <div
            style={{
              color: 'var(--color-text-2)',
              fontWeight: 500,
              marginTop: 1,
            }}
          >
            {project}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-text-1)',
              flexShrink: 0,
            }}
          >
            A
          </div>
          <span
            style={{
              color: 'var(--color-text-2)',
              fontSize: 13,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Alex Nascimento
          </span>
        </div>
      </div>
    </aside>
  );
}
