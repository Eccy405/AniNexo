'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TooltipRenderProps } from 'react-joyride';
import { motion } from 'framer-motion';
import styles from './NexoTourTooltip.module.css';

/**
 * Hook typewriter — sin bug de "undefined".
 * Usa slice en lugar de acceso por índice para evitar caracteres fantasma.
 */
function useTypewriter(text: string, speed = 22) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const idRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const safeText = typeof text === 'string' ? text : '';

  useEffect(() => {
    // Cancelar intervalo anterior
    if (idRef.current) clearInterval(idRef.current);
    setDisplayed('');
    setDone(false);

    let i = 0;
    idRef.current = setInterval(() => {
      i += 1;
      setDisplayed(safeText.slice(0, i));
      if (i >= safeText.length) {
        clearInterval(idRef.current!);
        setDone(true);
      }
    }, speed);

    return () => {
      if (idRef.current) clearInterval(idRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeText]);

  const skip = () => {
    if (idRef.current) clearInterval(idRef.current);
    setDisplayed(safeText);
    setDone(true);
  };

  return { displayed, done, skip };
}

export const NexoTourTooltip: React.FC<TooltipRenderProps> = ({
  continuous,
  index,
  size,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
}) => {
  // Propiedades extra que guardamos en el step (cast seguro)
  const emotion: string = (step as any).emotion ?? 'happy';
  // Extraer el contenido como string de forma segura
  const contentText: string =
    typeof step.content === 'string'
      ? step.content
      : React.isValidElement(step.content)
      ? ''            // si por algún motivo es JSX, no lo tipificamos
      : String(step.content ?? '');

  const { displayed, done, skip } = useTypewriter(contentText, 22);

  return (
    <div {...tooltipProps} className={styles.tooltipContainer}>
      {/* ---- Avatar de Nexo ---- */}
      <motion.img
        key={emotion}
        src={`/nexo-tour/${emotion}.png`}
        alt={`Nexo (${emotion})`}
        className={styles.avatar}
        initial={{ opacity: 0, scale: 0.85, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        draggable={false}
      />

      {/* ---- Globo de diálogo ---- */}
      <motion.div
        className={styles.dialogBox}
        onClick={!done ? skip : undefined}
        style={{ cursor: done ? 'default' : 'pointer' }}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28 }}
      >
        {/* Nombre del hablante */}
        <div className={styles.speakerName}>NEXO · IA</div>

        {/* Título del paso */}
        {step.title && (
          <h3 className={styles.stepTitle}>
            {step.title as React.ReactNode}
          </h3>
        )}

        {/* Texto animado */}
        <div className={styles.content}>
          {displayed}
          {!done && <span className={styles.typewriterCursor} />}
        </div>

        {/* Hint click-to-skip */}
        {!done && (
          <div className={styles.clickHint}>Haz clic para continuar →</div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <button {...skipProps} className={styles.skipButton}>
            Saltar guía
          </button>

          <span className={styles.stepCounter}>
            {index + 1} / {size}
          </span>

          <div className={styles.controls}>
            {index > 0 && (
              <button {...backProps} className={styles.backButton}>
                ← Atrás
              </button>
            )}

            {continuous ? (
              <button {...primaryProps} className={styles.nextButton}>
                {index === size - 1 ? '🎉 Finalizar' : 'Siguiente →'}
              </button>
            ) : (
              <button {...closeProps} className={styles.nextButton}>
                Cerrar
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
