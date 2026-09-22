import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

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

export default function VisionGeral() {
  const { steps, recorderTitle } = useStore();
  const navigate = useNavigate();
  const stepsRecorded = steps.length;

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--color-text-1)',
          marginBottom: 8,
        }}
      >
        Da gravação ao relatório, em um fluxo só
      </h1>
      <p
        style={{
          color: 'var(--color-text-2)',
          fontSize: 13,
          marginBottom: 24,
          maxWidth: 700,
        }}
      >
        Este protótipo é clicável de ponta a ponta. Siga os passos abaixo ou
        navegue livremente pela barra lateral — tudo o que você grava, edita e
        salva aparece nas outras telas.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {cards.map((c) => (
          <button
            key={c.n}
            onClick={() =>
              navigate(
                c.n <= 4
                  ? '/recorder'
                  : c.n === 5
                    ? '/flows'
                    : c.n === 6
                      ? '/dados/datasets'
                      : c.n === 7
                        ? '/execucoes/atual'
                        : '/execucoes/atual',
              )
            }
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              padding: 16,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: tagColor[c.n],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#000',
                  flexShrink: 0,
                }}
              >
                {c.n}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: tagColor[c.n],
                  letterSpacing: '0.06em',
                }}
              >
                {c.tag}
              </span>
            </div>
            <div
              style={{
                fontWeight: 600,
                color: 'var(--color-text-1)',
                marginBottom: 6,
                fontSize: 13,
              }}
            >
              {c.title}
            </div>
            <div
              style={{
                color: 'var(--color-text-2)',
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {c.body}
            </div>
          </button>
        ))}
      </div>

      <div
        style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: 'var(--color-text-3)',
            marginBottom: 12,
            textTransform: 'uppercase',
          }}
        >
          Seu projeto agora
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
          }}
        >
          {[
            {
              label: 'Steps gravados',
              value: stepsRecorded,
              sub: 'gravando agora',
            },
            { label: 'Actions salvas', value: 0, sub: 'nenhuma ainda' },
            {
              label: 'Blocos no Flow',
              value: 2,
              sub: `${recorderTitle} · 0 variáveis`,
            },
            {
              label: 'Última execução',
              value: 'Nenhuma',
              sub: 'rode o Flow para ver',
              big: true,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div
                style={{
                  color: 'var(--color-text-2)',
                  fontSize: 12,
                  marginBottom: 4,
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: stat.big ? 20 : 28,
                  fontWeight: 700,
                  color: 'var(--color-text-1)',
                  marginBottom: 4,
                }}
              >
                {stat.value}
              </div>
              <div style={{ color: 'var(--color-text-3)', fontSize: 12 }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
