'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import styles from './HeroSection.module.css';

export const HeroSection = () => {
  const titleAnimation = {
    hidden: { opacity: 0, y: 60, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.15,
        duration: 0.8,
        ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number]
      }
    })
  };

  const letterAnimation = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.6,
        ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number]
      }
    })
  };

  const title = "AniNexo";

  return (
    <section className={styles.hero}>
      {/* Partículas de fondo */}
      <div className={styles.particles}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={styles.particle}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Contenido principal */}
      <div className={styles.content}>
        {/* Badge */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={titleAnimation}
          className={styles.badge}
        >
          <span className={styles.badgeIcon}>✦</span>
          <span>La plataforma definitiva para fans de anime</span>
        </motion.div>

        {/* Título animado */}
        <motion.h1
          className={styles.title}
          initial="hidden"
          animate="visible"
        >
          {title.split('').map((letter, i) => (
            <motion.span
              key={i}
              custom={i}
              variants={letterAnimation}
              className={styles.letter}
              style={{
                display: 'inline-block',
                textShadow: '0 0 40px rgba(0, 229, 255, 0.5), 0 0 80px rgba(0, 229, 255, 0.3)'
              }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={titleAnimation}
          className={styles.subtitle}
        >
          Descubre, comparte y conecta con el mundo del anime.
          <br />
          Recomendaciones impulsadas por IA para ti.
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={titleAnimation}
          className={styles.ctas}
        >
          <Link href="/register" className={styles.btnPrimary}>
            <span>Comenzar Ahora</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/login" className={styles.btnSecondary}>
            <span>Iniciar Sesión</span>
          </Link>
        </motion.div>

        {/* Stats rápidos */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={titleAnimation}
          className={styles.quickStats}
        >
          <div className={styles.statItem}>
            <span className={styles.statNumber}>10K+</span>
            <span className={styles.statLabel}>Animes</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>50K+</span>
            <span className={styles.statLabel}>Usuarios</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>IA</span>
            <span className={styles.statLabel}>Nexo</span>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className={styles.scrollIndicator}
      >
        <div className={styles.scrollDot} />
      </motion.div>
    </section>
  );
};
