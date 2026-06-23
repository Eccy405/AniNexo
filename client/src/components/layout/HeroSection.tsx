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
      {/* Logo grande sobre el Nexus Engine */}
      <motion.img 
        src="/TextLogo.png" 
        alt="AniNexo Logo" 
        className={styles.logo}
        variants={fadeInUp}
      />
      
      {/* Subtítulo */}
      <motion.p className={styles.subtitle} variants={fadeInUp}>
        Tu universo anime impulsado por Nexo
      </motion.p>
      
      {/* CTA Buttons */}
      <motion.div className={styles.ctas} variants={fadeInUp}>
        <a href="/register" className={styles.btnPrimary}>
          Comenzar Ahora
        </a>
        <a href="/vision" className={styles.btnSecondary}>
          Conocer la Visión
        </a>
      </motion.div>
    </motion.section>
  );
}
