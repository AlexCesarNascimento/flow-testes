import type { RecorderPhase } from '../../store';

interface Props {
  phase: RecorderPhase;
}

function LoginScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#fff',
        fontFamily: 'inherit',
      }}
    >
      {/* Header verde */}
      <div
        style={{
          background: '#1a5c45',
          padding: '28px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#fff',
            }}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.2,
            }}
          >
            Olá!
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
            Que bom te ver por aqui.
          </div>
        </div>
      </div>

      {/* Corpo branco */}
      <div
        style={{
          flex: 1,
          background: '#fff',
          padding: '16px 16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* Campo CPF */}
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>
            CPF, celular ou agência/conta
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: '6px 10px',
              background: '#fafafa',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#999"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            <span style={{ fontSize: 11, color: '#bbb' }}>Digite aqui</span>
          </div>
        </div>

        {/* Campo Senha */}
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>
            Sua senha
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: '6px 10px',
              background: '#fafafa',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#999"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <circle cx="12" cy="16" r="1.5" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span style={{ fontSize: 11, color: '#bbb', flex: 1 }}>
              Digite sua senha
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#999"
              strokeWidth="2"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </div>

        {/* Botão Entrar */}
        <button
          style={{
            background: '#f0b429',
            border: 'none',
            borderRadius: 8,
            padding: '10px',
            fontWeight: 700,
            fontSize: 13,
            color: '#1a1a1a',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Entrar
        </button>

        {/* Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              fontSize: 11,
              color: '#1a5c45',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Esqueci minha senha
          </span>
          <span
            style={{
              fontSize: 11,
              color: '#1a5c45',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Abrir conta
          </span>
        </div>
      </div>

      {/* Bottom nav */}
      <div
        style={{
          background: '#fff',
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '8px 0 6px',
        }}
      >
        {[
          {
            label: 'Pix',
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#555"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            ),
          },
          {
            label: 'Ajuda',
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#555"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            ),
          },
          {
            label: 'Segurança',
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#555"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            ),
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {item.icon}
            <span style={{ fontSize: 9, color: '#777' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostLoginScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#f5f5f5',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#1a5c45',
          padding: '20px 16px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
          Olá, Alex
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#e06c2a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          A
        </div>
      </div>

      {/* Card saldo */}
      <div style={{ padding: '12px 12px 0' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 10,
            padding: '12px 14px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>
            Saldo disponível
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
              R$ ••••••
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#999"
              strokeWidth="2"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Bottom nav */}
      <div
        style={{
          background: '#fff',
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '8px 0 6px',
        }}
      >
        {[
          {
            label: 'Pix',
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#555"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            ),
          },
          {
            label: 'Extrato',
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#555"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
            ),
          },
          {
            label: 'Transferir',
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#555"
                strokeWidth="2"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            ),
          },
          {
            label: 'Cartões',
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#555"
                strokeWidth="2"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            ),
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {item.icon}
            <span style={{ fontSize: 9, color: '#777' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DeviceFrame({ phase }: Props) {
  const isLive = phase === 'gravar';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Phone frame */}
      <div
        style={{
          width: 220,
          height: 400,
          borderRadius: 28,
          border: '2px solid #333',
          background: '#111',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 60,
            height: 8,
            background: '#111',
            borderBottomLeftRadius: 6,
            borderBottomRightRadius: 6,
            zIndex: 10,
          }}
        />
        <div style={{ height: '100%', paddingTop: 8 }}>
          {isLive ? <LoginScreen /> : <PostLoginScreen />}
        </div>
      </div>

      {/* Botão demo (só fase Gravar) */}
      {isLive && (
        <button
          style={{
            background: 'var(--color-accent)',
            border: 'none',
            borderRadius: 8,
            padding: '8px 12px',
            color: '#000',
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Preencher e entrar (demo)
        </button>
      )}

      {/* Controles (só fase Gravar) */}
      {isLive && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <button
              style={{
                background: 'var(--color-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                color: 'var(--color-text-2)',
                fontSize: 14,
                width: 28,
                height: 26,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              −
            </button>
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text-2)',
                flex: 1,
                textAlign: 'center',
              }}
            >
              100%
            </span>
            <button
              style={{
                background: 'var(--color-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                color: 'var(--color-text-2)',
                fontSize: 14,
                width: 28,
                height: 26,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              +
            </button>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['Reiniciar', 'Screenshot', 'Voltar'].map((label) => (
              <button
                key={label}
                style={{
                  flex: 1,
                  background: 'var(--color-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  color: 'var(--color-text-2)',
                  fontSize: 10,
                  padding: '4px 2px',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
