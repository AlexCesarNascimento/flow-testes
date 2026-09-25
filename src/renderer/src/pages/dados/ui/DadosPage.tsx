import { useParams, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAmbienteStore } from '@/entities/ambiente';
import { MOCK_DATASET_ROWS } from '@/entities/dataset';
import './dados-page.scss';

type Tab = 'datasets' | 'variaveis' | 'ambientes' | 'secrets';

const TABS: { id: Tab; label: string }[] = [
  { id: 'datasets', label: 'Datasets' },
  { id: 'variaveis', label: 'Variáveis' },
  { id: 'ambientes', label: 'Ambientes' },
  { id: 'secrets', label: 'Secrets' },
];

function TabBar({
  active,
  counts,
}: {
  active: Tab;
  counts: Record<Tab, number>;
}) {
  const navigate = useNavigate();
  return (
    <div className="tab-bar" role="tablist" aria-label="Seções de dados">
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${t.id}`}
            id={`tab-${t.id}`}
            onClick={() => navigate(`/dados/${t.id}`)}
            className={`tab-bar__tab${isActive ? ' tab-bar__tab--active' : ''}`}
          >
            {t.label}
            <span
              className={`tab-bar__count${isActive ? ' tab-bar__count--active' : ' tab-bar__count--inactive'}`}
              aria-label={`${counts[t.id]} itens`}
            >
              {counts[t.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TabDatasets() {
  const { ambiente } = useAmbienteStore();
  const datasetRows = MOCK_DATASET_ROWS;
  const activeCount = datasetRows.filter((r) => r.active).length;

  return (
    <div className="tab-datasets">
      <p className="tab-datasets__desc">
        <strong className="tab-datasets__desc-strong">clientes_varejo</strong> —
        cada linha ativa é um conjunto de dados. No Flow, o bloco "Para cada
        linha do dataset" repete os passos com uma linha por vez; na matriz,
        cada linha vira uma execução por device.
      </p>

      <div className="tab-datasets__table">
        <div className="tab-datasets__table-head">
          {['USAR', 'ID', 'LOGIN', 'SENHA', 'SAUDACAO', 'TIPO'].map((col) => (
            <div key={col} className="tab-datasets__col-header">
              {col}
            </div>
          ))}
        </div>

        {datasetRows.map((row) => (
          <div key={row.id} className="tab-datasets__table-row">
            <div className="tab-datasets__cell tab-datasets__cell--check">
              <div
                className={`tab-datasets__checkbox${row.active ? ' tab-datasets__checkbox--checked' : ' tab-datasets__checkbox--unchecked'}`}
              >
                {row.active && (
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
            </div>
            {[row.id, row.login, row.senha, row.saudacao, row.tipo].map(
              (val, vi) => (
                <div
                  key={vi}
                  className={`tab-datasets__cell${vi === 2 ? ' tab-datasets__cell--mono' : ''}`}
                >
                  {val}
                </div>
              ),
            )}
          </div>
        ))}
      </div>

      <p className="tab-datasets__footer">
        {activeCount} linhas ativas × 3 devices = {activeCount * 3} execuções no
        ambiente {ambiente}
      </p>
    </div>
  );
}

function TabVariaveis() {
  const navigate = useNavigate();
  return (
    <div className="tab-variaveis">
      <p className="tab-variaveis__desc">
        Variáveis existem no escopo do Flow. Cada parâmetro de uma Action vira
        uma variável que você liga a um valor fixo, a uma coluna do dataset ou a
        um secret.
      </p>
      <div className="tab-variaveis__empty">
        Nenhuma variável ainda. Salve uma Action com parâmetros e adicione ao
        Flow.
      </div>
      <button
        onClick={() => navigate('/flows')}
        className="tab-variaveis__goto-btn"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="22 12 18 8 14 12" />
          <line x1="18" y1="8" x2="18" y2="16" />
          <path d="M2 12h16" />
        </svg>
        Ir para o Flow
      </button>
    </div>
  );
}

function TabAmbientes() {
  const { ambientes } = useAmbienteStore();
  return (
    <div className="tab-ambientes">
      <p className="tab-ambientes__desc">
        O ambiente muda o pacote do app, a URL da API e quais secrets estão
        disponíveis. Escolher um aqui altera o seletor no topo.
      </p>
      <div className="tab-ambientes__cards">
        {ambientes.map((a) => (
          <div
            key={a.name}
            className={`tab-ambientes__card${a.active ? ' tab-ambientes__card--active' : ' tab-ambientes__card--inactive'}`}
          >
            <div className="tab-ambientes__card-header">
              <span className="tab-ambientes__env-name">{a.name}</span>
              {a.active && (
                <span className="tab-ambientes__active-badge">ATIVO</span>
              )}
            </div>
            <div className="tab-ambientes__package">{a.packageId}</div>
            <div className="tab-ambientes__api-url">{a.apiUrl}</div>
            <div className="tab-ambientes__card-desc">{a.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabSecrets() {
  const { secrets } = useAmbienteStore();
  return (
    <div className="tab-secrets">
      <p className="tab-secrets__desc">
        Secrets ficam no cofre do projeto. O valor nunca aparece em logs,
        screenshots ou relatórios — só o nome.
      </p>
      <div className="tab-secrets__list">
        {secrets.map((s) => (
          <div key={s.name} className="tab-secrets__item">
            <Lock
              size={14}
              className="tab-secrets__item-icon"
              strokeWidth={1.5}
            />
            <span className="tab-secrets__item-name">{s.name}</span>
            <span className="tab-secrets__item-mask">••••••••••</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DadosPage() {
  const { tab } = useParams<{ tab?: string }>();
  const { ambientes, secrets } = useAmbienteStore();
  const datasetRows = MOCK_DATASET_ROWS;

  const activeTab: Tab =
    tab === 'variaveis' || tab === 'ambientes' || tab === 'secrets'
      ? tab
      : 'datasets';

  const counts: Record<Tab, number> = {
    datasets: datasetRows.length,
    variaveis: 0,
    ambientes: ambientes.length,
    secrets: secrets.length,
  };

  return (
    <div className="dados-page">
      <TabBar active={activeTab} counts={counts} />
      <div className="dados-page__body">
        {activeTab === 'datasets' && <TabDatasets />}
        {activeTab === 'variaveis' && <TabVariaveis />}
        {activeTab === 'ambientes' && <TabAmbientes />}
        {activeTab === 'secrets' && <TabSecrets />}
      </div>
    </div>
  );
}
