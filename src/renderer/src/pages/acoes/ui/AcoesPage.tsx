import { Zap } from 'lucide-react';
import './acoes-page.scss';

export function AcoesPage() {
  return (
    <div className="acoes-page">
      <div className="acoes-page__header">
        <div className="acoes-page__header-row">
          <span className="acoes-page__title">Ações</span>
          <span className="acoes-page__count">0</span>
        </div>
      </div>

      <div className="acoes-page__empty">
        <Zap size={32} className="acoes-page__empty-icon" strokeWidth={1.5} />
        <div className="acoes-page__empty-title">Nenhuma Action ainda</div>
        <div className="acoes-page__empty-desc">
          Grave um fluxo, parametrize os valores e salve como Action. Ela vira
          um bloco reutilizável em qualquer Flow.
        </div>
      </div>
    </div>
  );
}
