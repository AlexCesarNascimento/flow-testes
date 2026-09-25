import { Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './out-of-scope-page.scss';

export function OutOfScopePage({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <div className="out-of-scope-page">
      <Layers size={32} strokeWidth={1.5} className="out-of-scope-page__icon" />
      <div className="out-of-scope-page__title">{title}</div>
      <div className="out-of-scope-page__desc">
        Esta área fica fora do escopo deste protótipo. O foco é o ciclo gravar →
        editar → parametrizar → executar → depurar.
      </div>
      <button
        onClick={() => navigate('/recorder')}
        className="out-of-scope-page__back-btn"
      >
        Voltar ao Recorder
      </button>
    </div>
  );
}
