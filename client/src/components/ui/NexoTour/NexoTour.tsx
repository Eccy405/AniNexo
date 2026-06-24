'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Joyride, STATUS, EVENTS, ACTIONS, EventData } from 'react-joyride';
import { tourSteps } from './tourSteps';
import { NexoTourTooltip } from './NexoTourTooltip';

const COMPLETED_KEY = 'nexo-tour-completed';
const STEP_KEY     = 'nexo-tour-step';

/** Obtiene la URL de perfil dinámica desde localStorage, con fallback a 'mikasa' si es invitado */
function getProfileUrl(): string {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return '/dashboard/profile/mikasa';
    const user = JSON.parse(raw) as { username?: string };
    if (!user || !user.username) {
      return '/dashboard/profile/mikasa';
    }
    return `/dashboard/profile/${user.username}`;
  } catch {
    return '/dashboard/profile/mikasa';
  }
}

/** Resuelve la URL especial 'PROFILE' */
function resolveUrl(url: string): string {
  return url === 'PROFILE' ? getProfileUrl() : url;
}

export const NexoTour: React.FC = () => {
  const router   = useRouter();
  const pathname = usePathname();

  const [run,       setRun]       = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Evita que el useEffect reaccione al propio setRun inicial
  const startedRef = useRef(false);

  // Inicializar audio de fondo para el tour
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/nexo-tour/song.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.35; // Volumen idóneo de fondo
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Controlar la reproducción de audio de forma continua (no se interrumpe al cambiar de página)
  const playAudio = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch((err) => {
        console.warn('Reproducción de audio bloqueada por el navegador:', err);
      });
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    if (run) {
      playAudio();
    }
  }, [run, playAudio]);

  // Bloquear el scroll físico de la página cuando el tour está activo
  useEffect(() => {
    if (run) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [run]);

  /**
   * Se ejecuta en cada cambio de pathname (incluido el mount inicial).
   * - Si hay un paso guardado en localStorage, reanuda desde ahí.
   * - Si no hay paso guardado y estamos en /dashboard, arranca el tour.
   */
  useEffect(() => {
    const completed = localStorage.getItem(COMPLETED_KEY);
    if (completed) return; // Tour ya terminado

    const savedStep = localStorage.getItem(STEP_KEY);
    if (savedStep !== null) {
      const idx = parseInt(savedStep, 10);
      localStorage.removeItem(STEP_KEY); // Consumir inmediatamente
      setStepIndex(idx);
      setRun(false); // Reset para que Joyride reinicie en el nuevo paso
      const timer = setTimeout(() => setRun(true), 1400);
      return () => clearTimeout(timer);
    }

    // Solo arrancar el tour automáticamente al entrar al dashboard por primera vez
    if (pathname === '/dashboard' && !startedRef.current) {
      startedRef.current = true;
      const timer = setTimeout(() => setRun(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // ── Navega a otra sección guardando el índice del próximo paso ──
  const navigateToPage = useCallback(
    (url: string, nextIdx: number) => {
      setRun(false);
      localStorage.setItem(STEP_KEY, String(nextIdx));
      router.push(resolveUrl(url));
    },
    [router],
  );

  // ── Callback principal de Joyride (modo controlado) ──
  const handleEvent = useCallback(
    (data: EventData) => {
      const { status, action, index, type } = data;

      // Auto-click tab buttons in anime details page during the tour
      if (type === EVENTS.STEP_BEFORE) {
        const step = tourSteps[index];
        if (step && typeof step.target === 'string') {
          const targetStr = step.target;
          let tabId = '';
          if (targetStr.includes('anime-overview')) tabId = 'overview';
          else if (targetStr.includes('anime-characters')) tabId = 'characters';
          else if (targetStr.includes('anime-staff')) tabId = 'staff';
          else if (targetStr.includes('anime-stats')) tabId = 'stats';
          else if (targetStr.includes('anime-social')) tabId = 'social';

          if (tabId) {
            const btn = document.querySelector(`[data-tour="tab-btn-${tabId}"]`) as HTMLButtonElement;
            if (btn) {
              btn.click();
            }
          }
        }
      }

      // Tour finalizado o saltado
      if (
        type === EVENTS.TOUR_END ||
        status === STATUS.FINISHED ||
        status === STATUS.SKIPPED
      ) {
        setRun(false);
        setStepIndex(0);
        localStorage.setItem(COMPLETED_KEY, 'true');
        localStorage.removeItem(STEP_KEY);
        stopAudio();
        return;
      }

      // Avanzar al siguiente paso
      if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
        const nextIdx  = index + 1;
        const nextStep = tourSteps[nextIdx] as any;

        // Auto-click pre-render de la pestaña en el siguiente step
        if (nextStep && typeof nextStep.target === 'string') {
          const targetStr = nextStep.target;
          let tabId = '';
          if (targetStr.includes('anime-overview')) tabId = 'overview';
          else if (targetStr.includes('anime-characters')) tabId = 'characters';
          else if (targetStr.includes('anime-staff')) tabId = 'staff';
          else if (targetStr.includes('anime-stats')) tabId = 'stats';
          else if (targetStr.includes('anime-social')) tabId = 'social';

          if (tabId) {
            const btn = document.querySelector(`[data-tour="tab-btn-${tabId}"]`) as HTMLButtonElement;
            if (btn) {
              btn.click();
              // Esperar a que el DOM pinte el tab antes de avanzar el index de Joyride
              setTimeout(() => {
                setStepIndex(nextIdx);
              }, 180);
              return;
            }
          }
        }

        if (nextStep?.navigateTo) {
          // Este paso requiere cambiar de página
          navigateToPage(nextStep.navigateTo, nextIdx);
        } else {
          setStepIndex(nextIdx);
        }
        return;
      }

      // Retroceder al paso anterior
      if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
        const prevIdx = index - 1;
        const prevStep = tourSteps[prevIdx] as any;

        if (prevStep && typeof prevStep.target === 'string') {
          const targetStr = prevStep.target;
          let tabId = '';
          if (targetStr.includes('anime-overview')) tabId = 'overview';
          else if (targetStr.includes('anime-characters')) tabId = 'characters';
          else if (targetStr.includes('anime-staff')) tabId = 'staff';
          else if (targetStr.includes('anime-stats')) tabId = 'stats';
          else if (targetStr.includes('anime-social')) tabId = 'social';

          if (tabId) {
            const btn = document.querySelector(`[data-tour="tab-btn-${tabId}"]`) as HTMLButtonElement;
            if (btn) {
              btn.click();
              setTimeout(() => {
                setStepIndex(prevIdx);
              }, 180);
              return;
            }
          }
        }

        setStepIndex(prevIdx);
        return;
      }

      // Error al encontrar el target → saltar al siguiente de forma segura
      if (type === EVENTS.TARGET_NOT_FOUND) {
        const nextIdx = index + 1;
        const nextStep = tourSteps[nextIdx] as any;
        if (nextStep) {
          if (nextStep.navigateTo) {
            navigateToPage(nextStep.navigateTo, nextIdx);
          } else {
            setStepIndex(nextIdx);
          }
        } else {
          setStepIndex((prev) => Math.min(prev + 1, tourSteps.length - 1));
        }
        return;
      }
    },
    [navigateToPage],
  );

  // ── Función pública para reiniciar desde Ajustes / botón ──
  const restartTour = useCallback(() => {
    localStorage.removeItem(COMPLETED_KEY);
    localStorage.removeItem(STEP_KEY);
    startedRef.current = false;
    setStepIndex(0);
    setRun(false);
    // Ir al inicio; el useEffect lo reanudará al detectar /dashboard
    if (pathname === '/dashboard') {
      // Ya estamos aquí: arrancar directamente
      setTimeout(() => setRun(true), 400);
    } else {
      router.push('/dashboard');
    }
  }, [pathname, router]);

  // Expone la función globalmente para Ajustes / botón del landing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).startNexoTour = restartTour;
    }
  }, [restartTour]);

  return (
    <Joyride
      /* Modo controlado: nosotros gestionamos stepIndex */
      stepIndex={stepIndex}
      onEvent={handleEvent}
      continuous
      run={run}
      steps={tourSteps}
      tooltipComponent={NexoTourTooltip}
      styles={{
        spotlight: {
          /* Borde luminoso cyan alrededor del elemento destacado */
          stroke:        '#00E5FF',
          strokeWidth:   2.5,
          strokeLinecap: 'round',
          filter:        'drop-shadow(0 0 8px rgba(0,229,255,0.8))',
        } as React.SVGAttributes<SVGPathElement>,
      }}
    />
  );
};
