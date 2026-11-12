'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#050505',
      color: '#fff',
      padding: '80px 24px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        maxWidth: '760px',
        width: '100%',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '40px'
      }}>
        <span style={{ color: '#00E5FF', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '1.5px' }}>
          SOBRE ANINEXO
        </span>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '10px 0 16px' }}>
          La Dimensión Social del Anime
        </h1>
        <p style={{ color: '#bbb', lineHeight: 1.7, marginBottom: '16px' }}>
          AniNexo combina una enciclopedia interactiva de anime y manga conectada en tiempo real con AniList y MangaDex,
          junto con una comunidad social, mensajería en vivo, grupos temáticos y el asistente cognitivo Nexo AI.
        </p>
        <p style={{ color: '#888', lineHeight: 1.7, marginBottom: '28px' }}>
          Construido para explorar series, guardar tus favoritos, compartir historias y conectar con fans que comparten tu mismo ADN otaku.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{
            background: '#00E5FF', color: '#000', padding: '12px 22px',
            borderRadius: '10px', fontWeight: 800, textDecoration: 'none'
          }}>
            Ir al Dashboard
          </Link>
          <Link href="/" style={{
            border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '12px 22px',
            borderRadius: '10px', fontWeight: 700, textDecoration: 'none'
          }}>
            Volver al Inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
