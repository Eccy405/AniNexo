'use client';

import React, { useEffect } from 'react';
import { GuestButton } from '../components/auth/GuestButton';
import Link from 'next/link';

export default function Home() {
  useEffect(() => {
    // Redirigir si ya está autenticado
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      window.location.href = '/dashboard';
    }
  }, []);

  return (
    <main className="landing-main">
      {/* Navbar Transparente Floating */}
      <nav className="floating-nav">
        <Link href="/" className="nav-logo">ANINEXO</Link>
        <div className="nav-actions">
           <Link href="/login" className="btn-text">Iniciar Sesión</Link>
           <Link href="/register" className="btn-text">Registrarse</Link>
           <GuestButton className="btn-premium-nav">Explorar sin iniciar sesión</GuestButton>
        </div>
      </nav>

      {/* BRAND HERO (Pure Marketing) */}
      <section className="welcome-banner">
        <div className="welcome-inner">
           <div className="vision-badge">LA EVOLUCIÓN DEL ANIME</div>
           <h1>Tu universo anime impulsado por <span className="nexo-glow">Nexo</span></h1>
           <p>Personalización inteligente. Comunidad apasionada. Metadata infinita. Una experiencia diseñada para el fan del futuro.</p>
           
           <div className="hero-cta">
              <Link href="/register" className="btn-hero-primary">Comenzar Ahora</Link>
              <Link href="/about" className="btn-hero-secondary">Conocer la Visión</Link>
           </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="features-grid">
        <div className="feature-card">
          <span className="feature-icon">🧠</span>
          <h3>IA Nexo</h3>
          <p>Recomendaciones que realmente entienden tus gustos más complejos.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🌍</span>
          <h3>Comunidad</h3>
          <p>Conecta con miles de fans en un entorno diseñado para la discusión sana.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">⚡</span>
          <h3>Velocidad</h3>
          <p>Navegación instantánea gracias a nuestra infraestructura Enterprise.</p>
        </div>
      </section>

      {/* Footer Pro */}
      <footer className="footer-premium">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>ANINEXO</h3>
            <p>La plataforma definitiva para el fan de anime moderno.</p>
          </div>
          <div className="footer-links">
            <Link href="/about">Nosotros</Link>
            <Link href="/premium">Premium</Link>
            <Link href="/api-docs">API</Link>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 AniNexo Global - Desarrollado por Nexo Core
        </div>
      </footer>

      <style jsx>{`
        .landing-main {
          background-color: var(--color-background);
          min-height: 100vh;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          color: var(--color-text-main);
          font-family: var(--font-family-base);
        }

        .floating-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 80px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 5%;
          z-index: 100;
          background: rgba(5, 5, 5, 0.7);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .nav-logo {
          font-size: 1.6rem;
          font-weight: 900;
          color: var(--color-text-main);
          letter-spacing: -1.5px;
          text-decoration: none;
          text-transform: uppercase;
        }

        .nav-actions {
          display: flex;
          gap: 32px;
          align-items: center;
        }

        .btn-text {
          color: var(--color-text-muted);
          text-decoration: none;
          font-weight: 500;
          font-size: 14px;
          transition: color 0.3s;
          letter-spacing: 0.5px;
        }

        .btn-text:hover { color: var(--color-text-main); }

        .btn-premium-nav {
          background: var(--color-primary);
          color: #000;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .btn-premium-nav:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 30px rgba(0, 229, 255, 0.5);
        }

        .welcome-banner {
          padding: 14rem 5% 12rem;
          text-align: center;
          background: radial-gradient(circle closest-corner at 50% 50%, rgba(0, 229, 255, 0.08), rgba(5, 5, 5, 0) 60%);
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .welcome-banner::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(0, 229, 255, 0.03) 1px, transparent 0);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .vision-badge {
          background: rgba(0, 229, 255, 0.03);
          color: var(--color-primary);
          padding: 8px 16px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2.5px;
          display: inline-block;
          margin-bottom: 32px;
          border: 1px solid rgba(0, 229, 255, 0.15);
          text-transform: uppercase;
        }

        .welcome-inner h1 {
          font-size: clamp(3.5rem, 12vw, 88px);
          font-weight: 400;
          color: var(--color-text-main);
          margin-bottom: 32px;
          line-height: 0.8;
          letter-spacing: -0.07em;
        }

        .nexo-glow {
          color: var(--color-primary);
          text-shadow: 0 0 60px rgba(0, 229, 255, 0.7);
        }

        .welcome-inner p {
          color: var(--color-text-muted);
          font-size: 24px;
          max-width: 850px;
          margin: 0 auto 64px;
          line-height: 1.5;
          letter-spacing: -0.24px;
          font-weight: 400;
        }

        .hero-cta {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .btn-hero-primary {
          background: var(--color-primary);
          color: #000;
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: 700;
          text-decoration: none;
          transition: 0.3s;
          box-shadow: 0 0 40px rgba(0, 229, 255, 0.3);
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .btn-hero-secondary {
          background: rgba(255, 255, 255, 0.03);
          color: var(--color-text-main);
          padding: 16px 32px;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: 0.3s;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .btn-hero-primary:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 0 60px rgba(0, 229, 255, 0.5); 
        }
        .btn-hero-secondary:hover { 
          background: rgba(255, 255, 255, 0.08); 
          border-color: var(--color-primary);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 32px;
          padding: 128px 10%;
          background: var(--color-background);
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .feature-card {
          text-align: left;
          padding: 64px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 19.2px;
          border: 1px solid rgba(255,255,255,0.05);
          transition: 0.5s;
          position: relative;
        }

        .feature-card:hover {
          border-color: var(--color-primary);
          transform: translateY(-8px);
          background: rgba(0, 229, 255, 0.02);
        }

        .feature-icon { 
          font-size: 24px; 
          display: block; 
          margin-bottom: 32px; 
          filter: drop-shadow(0 0 15px rgba(0, 229, 255, 0.4));
        }

        .feature-card h3 { 
          color: var(--color-text-main); 
          margin-bottom: 16px; 
          font-size: 24px; 
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .feature-card p { 
          color: var(--color-text-muted); 
          line-height: 1.6; 
          font-size: 16px;
        }

        .footer-premium {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 128px 10% 64px;
          background-color: var(--color-background);
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          margin-bottom: 96px;
        }

        .footer-brand h3 { 
          color: var(--color-text-main); 
          margin-bottom: 16px; 
          font-size: 1.8rem;
          font-weight: 900;
          letter-spacing: -2px;
        }

        .footer-brand p { color: var(--color-text-muted); max-width: 400px; font-size: 16px; }

        .footer-links { display: flex; flex-direction: column; gap: 24px; }
        .footer-links a { color: var(--color-text-muted); text-decoration: none; font-size: 14px; font-weight: 500; transition: 0.3s; }
        .footer-links a:hover { color: var(--color-primary); }

        .footer-bottom {
          text-align: left;
          color: #222;
          font-size: 12px;
          padding-top: 48px;
          border-top: 1px solid rgba(255,255,255,0.02);
          text-transform: uppercase;
          letter-spacing: 2px;
        }
      `}</style>
    </main>
  );
}
