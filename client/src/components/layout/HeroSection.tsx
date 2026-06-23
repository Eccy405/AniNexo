import { motion } from "framer-motion";
import { heroVariant, fadeInUp } from "@/lib/animations";
import styles from "./HeroSection.module.css";

export default function HeroSection() {
  return (
    <motion.section 
      className={styles.heroContainer}
      variants={heroVariant}
      initial="hidden"
      animate="visible"
    >
      {/* Fondo animado de partículas CSS */}
      <div className={styles.particleContainer}>
        {[...Array(15)].map((_, i) => (
          <div key={i} className={`${styles.particle} ${styles[`p${i}`]}`} />
        ))}
      </div>

      <div className={styles.heroWrapper}>
        {/* Lado izquierdo: Información */}
        <div className={styles.heroText}>
          <motion.img 
            src="/TextLogo.png" 
            alt="AniNexo Logo" 
            className={styles.logo}
            variants={fadeInUp}
          />
          
          <motion.h1 className={styles.title} variants={fadeInUp}>
            La Dimensión Definitiva del Anime
          </motion.h1>

          <motion.p className={styles.subtitle} variants={fadeInUp}>
            Conecta, comparte y explora tu pasión en una plataforma social impulsada por Inteligencia Artificial y diseñada para la comunidad moderna.
          </motion.p>
          
          <motion.div className={styles.ctas} variants={fadeInUp}>
            <a href="/register" className={styles.btnPrimary}>
              Comenzar Ahora
            </a>
            <a href="/login" className={styles.btnSecondary}>
              Iniciar Sesión
            </a>
          </motion.div>
        </div>

        {/* Lado derecho: Banner Anime con resplandor neón */}
        <motion.div 
          className={styles.heroVisual}
          variants={fadeInUp}
        >
          <div className={styles.visualContainer}>
            <img 
              src="/aninexo_hero_banner.jpg" 
              alt="Universo AniNexo" 
              className={styles.bannerImage}
            />
            <div className={styles.glowOverlay} />
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
