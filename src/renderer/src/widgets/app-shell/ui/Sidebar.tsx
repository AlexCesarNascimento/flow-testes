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
import { useAmbienteStore } from '@/entities/ambiente';
import './sidebar.scss';

type NavItem = {
  label: string;
  to: string;
  icon: React.ReactNode;
};

function NavButton({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `sidebar__nav-item${isActive ? ' sidebar__nav-item--active' : ''}`
      }
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
      <button onClick={() => setOpen(!open)} className="sidebar__section-label">
        <span className="sidebar__section-label-left">
          {icon}
          {label}
        </span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && items.map((item) => <NavButton key={item.to} item={item} />)}
    </>
  );
}

export function Sidebar() {
  const { ambientes } = useAmbienteStore();
  const project = 'App Exemplo';
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

  void ambientes;

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <Play size={14} fill="white" color="white" />
        </div>
        <span className="sidebar__logo-name">FlowTest</span>
      </div>

      <nav className="sidebar__nav">
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

      <div className="sidebar__footer">
        <button
          onClick={() => navigate('/visao-geral')}
          className="sidebar__settings-btn"
        >
          <Settings size={14} />
          Configurações
        </button>

        <div className="sidebar__project-info">
          <div className="sidebar__project-label">Projeto atual</div>
          <div className="sidebar__project-name">{project}</div>
        </div>

        <div className="sidebar__user">
          <div className="sidebar__user-avatar">A</div>
          <span className="sidebar__user-name">Alex Nascimento</span>
        </div>
      </div>
    </aside>
  );
}
