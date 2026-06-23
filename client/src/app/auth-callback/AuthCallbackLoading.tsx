'use client';

export default function AuthCallbackLoading() {
  return (
    <div className="auth-callback-page">
      <div className="spinner"></div>
      <h2>Sincronizando con AniNexo...</h2>
      <p>Casi listo, estamos preparando tu aventura.</p>

      <style jsx>{`
        .auth-callback-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--color-background);
          color: white;
          font-family: var(--font-family-base);
          text-align: center;
          gap: 1rem;
        }

        .auth-callback-page h2 {
          color: var(--color-primary);
          margin: 0;
          font-size: 1.3rem;
        }

        .auth-callback-page p {
          color: var(--color-text-muted);
          margin: 0;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(0, 229, 255, 0.1);
          border-top-color: #00E5FF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          box-shadow: 0 0 24px rgba(0, 229, 255, 0.22);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
