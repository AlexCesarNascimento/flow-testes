import type { RecorderPhase } from '@/entities/recorder';
import './device-frame.scss';

interface Props {
  phase: RecorderPhase;
}

function LoginScreen() {
  return (
    <div className="login-screen">
      <div className="login-screen__header">
        <div className="login-screen__avatar">
          <div className="login-screen__avatar-dot" />
        </div>
        <div>
          <div className="login-screen__title">Olá!</div>
          <div className="login-screen__subtitle">Que bom te ver por aqui.</div>
        </div>
      </div>

      <div className="login-screen__body">
        <div>
          <div className="login-screen__field-label">
            CPF, celular ou agência/conta
          </div>
          <div className="login-screen__field-input">
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
            <span className="login-screen__field-placeholder">Digite aqui</span>
          </div>
        </div>

        <div>
          <div className="login-screen__field-label">Sua senha</div>
          <div className="login-screen__field-input">
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
            <span className="login-screen__field-placeholder">
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

        <button className="login-screen__submit-btn">Entrar</button>

        <div className="login-screen__links">
          <span className="login-screen__link">Esqueci minha senha</span>
          <span className="login-screen__link">Abrir conta</span>
        </div>
      </div>

      <div className="login-screen__bottom-nav">
        {[
          {
            label: 'Pix',
            path: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
          },
          { label: 'Ajuda', path: '' },
          { label: 'Segurança', path: '' },
        ].map((item) => (
          <div key={item.label} className="login-screen__nav-item">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555"
              strokeWidth="2"
            >
              {item.label === 'Pix' && <path d={item.path} />}
              {item.label === 'Ajuda' && (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </>
              )}
              {item.label === 'Segurança' && (
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              )}
            </svg>
            <span className="login-screen__nav-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PostLoginScreen() {
  return (
    <div className="post-login-screen">
      <div className="post-login-screen__header">
        <span className="post-login-screen__greeting">Olá, Alex</span>
        <div className="post-login-screen__avatar">A</div>
      </div>

      <div className="post-login-screen__card">
        <div className="post-login-screen__card-inner">
          <div className="post-login-screen__balance-label">
            Saldo disponível
          </div>
          <div className="post-login-screen__balance-row">
            <span className="post-login-screen__balance-value">R$ ••••••</span>
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

      <div className="post-login-screen__spacer" />

      <div className="post-login-screen__bottom-nav">
        {['Pix', 'Extrato', 'Transferir', 'Cartões'].map((label) => (
          <div key={label} className="post-login-screen__nav-item">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="post-login-screen__nav-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DeviceFrame({ phase }: Props) {
  const isLive = phase === 'gravar';

  return (
    <div className="device-frame">
      <div className="device-frame__frame">
        <div className="device-frame__notch" />
        <div className="device-frame__screen">
          {isLive ? <LoginScreen /> : <PostLoginScreen />}
        </div>
      </div>

      {isLive && (
        <button className="device-frame__demo-btn">
          Preencher e entrar (demo)
        </button>
      )}

      {isLive && (
        <div className="device-frame__controls">
          <div className="device-frame__zoom-row">
            <button className="device-frame__zoom-btn">−</button>
            <span className="device-frame__zoom-label">100%</span>
            <button className="device-frame__zoom-btn">+</button>
          </div>
          <div className="device-frame__action-row">
            {['Reiniciar', 'Screenshot', 'Voltar'].map((label) => (
              <button key={label} className="device-frame__action-btn">
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
