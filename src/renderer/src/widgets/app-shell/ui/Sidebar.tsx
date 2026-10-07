import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLayoutStore } from '../model/layout-store';
// `useState` ainda é usado dentro de CollapsibleGroup.
import {
  Radio,
  GitBranch,
  Zap,
  Braces,
  Play,
  Timer,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import './sidebar.scss';

type NavItem = {
  label: string;
  to: string;
  icon: React.ReactNode;
};

function NavButton({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `sidebar__nav-item${isActive ? ' sidebar__nav-item--active' : ''}`
      }
    >
      {item.icon}
      <span className="sidebar__nav-item-label">{item.label}</span>
    </NavLink>
  );
}

function CollapsibleGroup({
  label,
  icon,
  items,
  defaultOpen = true,
  sidebarCollapsed,
}: {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
  defaultOpen?: boolean;
  sidebarCollapsed: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (sidebarCollapsed) {
    return (
      <>
        {items.map((item) => (
          <NavButton key={item.to} item={item} collapsed />
        ))}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="sidebar__section-label"
        aria-expanded={open}
        aria-controls={`sidebar-group-${label}`}
      >
        <span className="sidebar__section-label-left">
          {icon}
          {label}
        </span>
        {open ? (
          <ChevronDown size={12} aria-hidden="true" />
        ) : (
          <ChevronRight size={12} aria-hidden="true" />
        )}
      </button>
      <div id={`sidebar-group-${label}`} hidden={!open}>
        {items.map((item) => (
          <NavButton key={item.to} item={item} collapsed={false} />
        ))}
      </div>
    </>
  );
}

export function Sidebar() {
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);
  const project = 'App Exemplo';

  const execItems: NavItem[] = [
    {
      label: 'Execução atual',
      to: '/execucoes/atual',
      icon: <Timer size={14} />,
    },
    {
      label: 'Relatórios',
      to: '/execucoes/relatorios',
      icon: <BarChart3 size={14} />,
    },
  ];

  return (
    <aside
      className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}
      aria-label="Navegação principal"
    >
      <button
        type="button"
        className="sidebar__logo"
        onClick={toggleSidebar}
        aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        aria-pressed={collapsed}
        title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
      >
        <div className="sidebar__logo-icon">
          <Play size={14} fill="white" color="white" />
        </div>
        <span className="sidebar__logo-name">FlowTest</span>
      </button>

      <nav className="sidebar__nav">
        <NavButton
          item={{
            label: 'Recorder',
            to: '/recorder',
            icon: <Radio size={14} />,
          }}
          collapsed={collapsed}
        />
        <NavButton
          item={{ label: 'Flows', to: '/flows', icon: <GitBranch size={14} /> }}
          collapsed={collapsed}
        />
        <NavButton
          item={{ label: 'Ações', to: '/acoes', icon: <Zap size={14} /> }}
          collapsed={collapsed}
        />
        <NavButton
          item={{
            label: 'Variáveis',
            to: '/variaveis',
            icon: <Braces size={14} />,
          }}
          collapsed={collapsed}
        />

        <CollapsibleGroup
          label="Execuções"
          icon={<Play size={12} />}
          items={execItems}
          sidebarCollapsed={collapsed}
        />
      </nav>

      <div className="sidebar__footer">
        <button
          className="sidebar__settings-btn"
          disabled
          aria-label="Configurações (em breve)"
          title={collapsed ? 'Configurações' : undefined}
        >
          <Settings size={14} />
          <span className="sidebar__settings-label">Configurações</span>
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
