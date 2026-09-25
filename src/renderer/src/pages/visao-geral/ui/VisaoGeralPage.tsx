import { useNavigate } from 'react-router-dom';
import { useRecorderStore } from '@/entities/recorder';
import { MOCK_STEPS } from '@/entities/step';
import './visao-geral-page.scss';

const cards = [
  {
    n: 1,
    tag: 'GRAVAR',
    title: 'Grave no dispositivo',
    body: 'Toque, digite e navegue no app. Cada gesto vira um step com o melhor selector.',
  },
  {
    n: 2,
    tag: 'EDITAR',
    title: 'Ajuste os steps',
    body: 'Reordene, exclua, troque selectors e adicione asserts e waits. Teste um step, até aqui ou a partir daqui.',
  },
  {
    n: 3,
    tag: 'PARAMETRIZAR',
    title: 'Valores viram variáveis',
    body: 'Em um Input text, use "Transformar em variável". A senha pode ser um secret.',
  },
  {
    n: 4,
    tag: 'SALVAR',
    title: 'Salve como Action',
    body: 'Escolha os steps, dê um nome e reaproveite em qualquer Flow.',
  },
  {
    n: 5,
    tag: 'FLOW',
    title: 'Monte o Flow com blocos',
    body: 'Encaixe blocos como no Scratch: Actions, repetições, se/senão e dados por linha do dataset.',
  },
  {
    n: 6,
    tag: 'DADOS × DEVICE × ENV',
    title: 'Combine dados, devices e ambientes',
    body: 'Datasets e secrets por ambiente. A matriz roda cada combinação.',
  },
  {
    n: 7,
    tag: 'EXECUTAR',
    title: 'Rode e acompanhe ao vivo',
    body: 'Pause, avance passo a passo e veja o Smart wait trabalhar.',
  },
  {
    n: 8,
    tag: 'DEPURAR',
    title: 'Falhou? Corrija e repita.',
    body: 'Simula uma regressão do self-healing e re-executa.',
  },
];

const tagColor: Record<number, string> = {
  1: 'var(--color-accent)',
  2: 'var(--color-blue)',
  3: 'var(--color-purple)',
  4: 'var(--color-amber)',
  5: 'var(--color-accent)',
  6: 'var(--color-blue)',
  7: 'var(--color-purple)',
  8: 'var(--color-amber)',
};

export function VisaoGeralPage() {
  const { recorderTitle } = useRecorderStore();
  const navigate = useNavigate();
  const stepsRecorded = MOCK_STEPS.length;

  return (
    <div className="visao-geral-page">
      <h1 className="visao-geral-page__title">
        Da gravação ao relatório, em um fluxo só
      </h1>
      <p className="visao-geral-page__subtitle">
        Este protótipo é clicável de ponta a ponta. Siga os passos abaixo ou
        navegue livremente pela barra lateral — tudo o que você grava, edita e
        salva aparece nas outras telas.
      </p>

      <div className="visao-geral-page__cards">
        {cards.map((c) => (
          <button
            key={c.n}
            className="visao-geral-page__card"
            onClick={() =>
              navigate(
                c.n <= 4
                  ? '/recorder'
                  : c.n === 5
                    ? '/flows'
                    : c.n === 6
                      ? '/dados/datasets'
                      : '/execucoes/atual',
              )
            }
          >
            <div className="visao-geral-page__card-header">
              <span
                className="visao-geral-page__card-number"
                style={{ ['--tag-color' as string]: tagColor[c.n] }}
              >
                {c.n}
              </span>
              <span
                className="visao-geral-page__card-tag"
                style={{ ['--tag-color' as string]: tagColor[c.n] }}
              >
                {c.tag}
              </span>
            </div>
            <div className="visao-geral-page__card-title">{c.title}</div>
            <div className="visao-geral-page__card-body">{c.body}</div>
          </button>
        ))}
      </div>

      <div className="visao-geral-page__stats-section">
        <div className="visao-geral-page__stats-label">Seu projeto agora</div>
        <div className="visao-geral-page__stats-grid">
          {[
            {
              label: 'Steps gravados',
              value: stepsRecorded,
              sub: 'gravando agora',
              big: false,
            },
            {
              label: 'Actions salvas',
              value: 0,
              sub: 'nenhuma ainda',
              big: false,
            },
            {
              label: 'Blocos no Flow',
              value: 2,
              sub: `${recorderTitle} · 0 variáveis`,
              big: false,
            },
            {
              label: 'Última execução',
              value: 'Nenhuma',
              sub: 'rode o Flow para ver',
              big: true,
            },
          ].map((stat) => (
            <div key={stat.label} className="visao-geral-page__stat-card">
              <div className="visao-geral-page__stat-label">{stat.label}</div>
              <div
                className={`visao-geral-page__stat-value${stat.big ? ' visao-geral-page__stat-value--small' : ' visao-geral-page__stat-value--large'}`}
              >
                {stat.value}
              </div>
              <div className="visao-geral-page__stat-sub">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
