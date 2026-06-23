'use client';

import { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card/Card';
import { useUIStore } from '../../../store/uiStore';

const backgroundOptions = [
  {
    value: 'full',
    label: 'Completo',
    description: 'Más partículas y conexiones. Recomendado para escritorio potente.',
  },
  {
    value: 'reduced',
    label: 'Reducido',
    description: 'Movimiento más suave y menos densidad para mejor rendimiento.',
  },
  {
    value: 'static',
    label: 'Estático',
    description: 'Mantiene la estética del fondo sin ejecutar animación.',
  },
] as const;

export default function DashboardSettingsPage() {
  const backgroundMode = useUIStore((state) => state.backgroundMode);
  const setBackgroundMode = useUIStore((state) => state.setBackgroundMode);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener('change', updateMotionPreference);

    return () => mediaQuery.removeEventListener('change', updateMotionPreference);
  }, []);

  return (
    <div className="settings-page">
      <div className="settings-header">
        <span className="settings-kicker">Preferencias</span>
        <h1>Configuración</h1>
        <p>Controla cómo se comporta el fondo interactivo de AniNexo.</p>
      </div>

      <Card className="settings-card">
        <div className="settings-card-header">
          <div>
            <h2>Fondo interactivo</h2>
            <p>Elige la intensidad del fondo de partículas tipo Plexus.</p>
          </div>
        </div>

        <div className="mode-grid">
          {backgroundOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`mode-option ${backgroundMode === option.value ? 'active' : ''}`}
              onClick={() => setBackgroundMode(option.value)}
            >
              <span className="mode-option-top">
                <span className="mode-dot" />
                <span className="mode-label">{option.label}</span>
              </span>
              <span className="mode-description">{option.description}</span>
            </button>
          ))}
        </div>

        {reducedMotion && backgroundMode !== 'static' && (
          <div className="motion-note">
            Tu sistema pidió menos movimiento, por eso AniNexo está usando automáticamente el modo reducido.
          </div>
        )}
      </Card>

      <style jsx>{`
        .settings-page {
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
          padding: 2rem 1rem 5rem;
        }

        .settings-header {
          margin-bottom: 2rem;
          animation: aninexo-enter var(--motion-duration-cinematic) var(--motion-ease-emphasized) both;
        }

        .settings-kicker {
          display: inline-block;
          color: var(--color-primary);
          font-size: 0.75rem;
          font-weight: 950;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          margin-bottom: 0.7rem;
        }

        .settings-header h1 {
          color: var(--color-text-main);
          font-size: clamp(2rem, 5vw, 3.6rem);
          line-height: 1;
          letter-spacing: -0.06em;
          margin-bottom: 0.8rem;
        }

        .settings-header p {
          color: var(--color-text-muted);
          line-height: 1.7;
          max-width: 620px;
        }

        .settings-card {
          padding: 1.4rem;
          animation: aninexo-enter var(--motion-duration-cinematic) var(--motion-ease-emphasized) 120ms both;
        }

        .settings-card-header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.4rem;
        }

        .settings-card-header h2 {
          color: var(--color-text-main);
          font-size: 1.35rem;
          margin-bottom: 0.4rem;
        }

        .settings-card-header p {
          color: var(--color-text-muted);
          line-height: 1.6;
        }

        .mode-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .mode-option {
          min-height: 170px;
          text-align: left;
          padding: 1rem;
          border-radius: var(--border-radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.035);
          color: var(--color-text-main);
          cursor: pointer;
          transition: transform var(--motion-duration-normal) var(--motion-ease-standard), border-color var(--motion-duration-normal) var(--motion-ease-standard), background var(--motion-duration-normal) var(--motion-ease-standard), box-shadow var(--motion-duration-normal) var(--motion-ease-standard);
        }

        .mode-option:hover {
          transform: translateY(-2px);
          border-color: rgba(0, 229, 255, 0.24);
          background: rgba(0, 229, 255, 0.045);
        }

        .mode-option.active {
          border-color: rgba(0, 229, 255, 0.48);
          background: linear-gradient(180deg, rgba(0, 229, 255, 0.1), rgba(255, 255, 255, 0.035));
          box-shadow: 0 0 28px rgba(0, 229, 255, 0.12);
        }

        .mode-option-top {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 1rem;
        }

        .mode-dot {
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 999px;
          background: var(--color-primary);
          box-shadow: 0 0 18px rgba(0, 229, 255, 0.45);
        }

        .mode-label {
          font-size: 1rem;
          font-weight: 950;
        }

        .mode-description {
          display: block;
          color: var(--color-text-muted);
          line-height: 1.6;
          font-size: 0.9rem;
        }

        .motion-note {
          margin-top: 1rem;
          padding: 0.9rem 1rem;
          border-radius: var(--border-radius-md);
          border: 1px solid rgba(0, 229, 255, 0.22);
          background: rgba(0, 229, 255, 0.07);
          color: rgba(248, 251, 255, 0.86);
          line-height: 1.6;
        }

        @media (max-width: 820px) {
          .mode-grid {
            grid-template-columns: 1fr;
          }

          .mode-option {
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
}
