"use client";

import styles from "./page.module.css";
import React, { useEffect } from "react";
import { GuestButton } from "../components/auth/GuestButton";
import Link from "next/link";
// import { HiveCanvas } from "../components/nexus-engine/rendering/HiveCanvas";
import { useSiteStats } from "@/lib/hooks/useSiteStats";
import { SiteStats } from "@/components/ui/SiteStats/SiteStats";
import HeroSection from "@/components/layout/HeroSection";

export default function Home() {
  const { stats, loading, error } = useSiteStats();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      window.location.href = "/dashboard";
    }
  }, []);

  const handleTourClick = () => {
    localStorage.removeItem('nexo-tour-completed');
    localStorage.setItem('user', JSON.stringify({ username: 'Invitado', role: 'USER', isGuest: true }));
    localStorage.removeItem('token');
    window.location.href = '/dashboard';
  };

  return (
    <>
      {/* Navbar Transparente Floating */}
      <nav className={styles.floatingNav}>
        <Link href="/" className={styles.navLogo}>
          ANINEXO
        </Link>
        <div className={styles.navActions}>
          <button className={styles.btnTour} onClick={handleTourClick}>
            Tour usuario
          </button>
          <Link href="/login" className={styles.btnText}>Iniciar Sesión</Link>
          <Link href="/register" className={styles.btnText}>Registrarse</Link>
          <GuestButton className={styles.btnPremiumNav}>Explorar sin iniciar sesión</GuestButton>
        </div>
      </nav>

      {/* Nexus Engine Full Background (Oculto Temporalmente) */}
      {/* <div className={styles.nexusFull}>
        <HiveCanvas />
      </div> */}

      {/* Hero sobre fondo animado CSS */}
      <HeroSection />

      {/* Estadísticas de la Comunidad */}
      {!loading && stats ? (
        <section className={`${styles.statsSection} animate-fadeInUp animate-delay-150`}>
          <div className={styles.welcomeInner}>
            <SiteStats users={stats.users} animes={stats.animes} upcoming={stats.upcoming} />
          </div>
        </section>
      ) : loading ? (
        <section className={`${styles.statsSection} animate-fadeInUp animate-delay-150`}>
          <div className={styles.welcomeInner}>
            <p>Cargando estadísticas...</p>
          </div>
        </section>
      ) : (
        <section className={`${styles.statsSection} animate-fadeInUp animate-delay-150`}>
          <div className={styles.welcomeInner}>
            <p>No se pudieron cargar las estadísticas. Por favor, intenta de nuevo más tarde.</p>
          </div>
        </section>
      )}

      {/* Info Section (Características) */}
      <section className={`${styles.featuresGrid} animate-fadeInUp animate-delay-300`}>
        <div className={`${styles.featureCard} animate-fadeInUp animate-delay-100`}>
          <span className={styles.featureIcon}>🧠</span>
          <h3>IA Nexo</h3>
          <p>Recomendaciones que realmente entienden tus gustos más complejos.</p>
        </div>
        <div className={`${styles.featureCard} animate-fadeInUp animate-delay-200`}>
          <span className={styles.featureIcon}>👥</span>
          <h3>Comunidad</h3>
          <p>Conecta con miles de fans en un entorno diseñado para la discusión sana.</p>
        </div>
        <div className={`${styles.featureCard} animate-fadeInUp animate-delay-300`}>
          <span className={styles.featureIcon}>⚡</span>
          <h3>Velocidad</h3>
          <p>Navegación instantánea gracias a nuestra infraestructura Enterprise.</p>
        </div>
      </section>

      {/* Footer Pro */}
      <footer className={`${styles.footerPremium} animate-fadeInUp animate-delay-400`}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <h3>ANINEXO</h3>
            <p>La plataforma definitiva para el fan de anime moderno.</p>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/about">Nosotros</Link>
            <Link href="/premium">Premium</Link>
            <Link href="/api-docs">API</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          © 2026 AniNexo Global - Desarrollado por Nexo Core
        </div>
      </footer>
    </>
  );
}
