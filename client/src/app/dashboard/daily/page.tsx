'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gift, History, Sparkles, Compass, Trophy, MessageSquare } from 'lucide-react';

export default function DailyNexosPage() {
  const [memories, setMemories] = useState<any[]>([]);
  const [dailyAnime, setDailyAnime] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDaily = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        const [homeRes, memRes] = await Promise.all([
          fetch(`${apiUrl}/anime/discovery/home`).then(r => r.json()).catch(() => null),
          user?.id
            ? fetch(`${apiUrl}/feed/memories/${user.id}`).then(r => r.json()).catch(() => null)
            : Promise.resolve(null)
        ]);

        if (homeRes?.success && homeRes.data?.hero?.length > 0) {
          const dayIdx = new Date().getDate() % homeRes.data.hero.length;
          setDailyAnime(homeRes.data.hero[dayIdx]);
        }
        if (memRes?.success) {
          setMemories(memRes.data || []);
        }
      } finally {
        setLoading(false);
      }
    };
    loadDaily();
  }, []);

  return (
    <div className="daily-page">
      <div className="daily-container">
        <header className="daily-header">
          <div className="badge"><Gift size={16} /> NEXOS DIARIOS</div>
          <h1>Tu Pulso del Nexo Hoy</h1>
          <p>Recomendación destacada del día, recuerdos guardados y accesos rápidos.</p>
        </header>

        {loading ? (
          <div className="card">Sincronizando actividad diaria...</div>
        ) : (
          <div className="daily-grid">
            {/* Destacado del día */}
            <section className="card spotlight">
              <h2><Sparkles size={18} color="#00E5FF" /> Destacado del Día</h2>
              {dailyAnime ? (
                <div className="spotlight-body">
                  <img src={dailyAnime.coverImage || dailyAnime.bannerImage} alt={dailyAnime.titleEnglish || dailyAnime.titleRomaji} />
                  <div className="spotlight-info">
                    <h3>{dailyAnime.titleEnglish || dailyAnime.titleRomaji}</h3>
                    <p>{dailyAnime.averageScore ? `Puntuación: ${dailyAnime.averageScore}%` : 'Tendencia en AniNexo'}</p>
                    <Link href={`/dashboard/anime/${dailyAnime.id}`} className="primary-btn">
                      Ver Ficha del Anime
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="muted">Explora el catálogo para descubrir nuevas series hoy.</p>
              )}
            </section>

            {/* Accesos rápidos */}
            <section className="card">
              <h2><Compass size={18} color="#00E5FF" /> Rutas del Día</h2>
              <div className="quick-links">
                <Link href="/dashboard/community" className="q-link"><MessageSquare size={16} /> Publicar o ver Historias</Link>
                <Link href="/dashboard/search" className="q-link"><Compass size={16} /> Explorar Animes y Mangas</Link>
                <Link href="/rankings" className="q-link"><Trophy size={16} /> Ver Rankings Globales</Link>
                <Link href="/dashboard/saved" className="q-link"><Gift size={16} /> Revisar Guardados</Link>
              </div>
            </section>

            {/* Recuerdos */}
            <section className="card full">
              <h2><History size={18} color="#ffa500" /> Tus Recuerdos en AniNexo</h2>
              {memories.length === 0 ? (
                <p className="muted">Todavía no tienes recuerdos registrados. Sigue compartiendo publicaciones en Comunidad.</p>
              ) : (
                <div className="memories-list">
                  {memories.map((m: any) => (
                    <div key={m.id} className="memory-item">
                      <span className="mem-date">{new Date(m.createdAt).toLocaleDateString()}</span>
                      <p>{m.post?.content || m.note || 'Recuerdo guardado'}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <style jsx>{`
        .daily-page { min-height: 100vh; background: #050505; color: #fff; padding: 96px 20px 48px; }
        .daily-container { max-width: 960px; margin: 0 auto; }
        .daily-header { margin-bottom: 28px; }
        .badge {
          display: inline-flex; align-items: center; gap: 6px;
          color: #00E5FF; font-size: 0.75rem; font-weight: 800; letter-spacing: 1px;
          background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.25);
          padding: 5px 12px; border-radius: 999px; margin-bottom: 10px;
        }
        .daily-header h1 { margin: 0; font-size: 2rem; font-weight: 900; }
        .daily-header p { margin: 6px 0 0; color: #888; }
        .daily-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; }
        .card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px; padding: 22px;
        }
        .card.full { grid-column: 1 / -1; }
        .card h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 16px; font-size: 1.1rem; }
        .spotlight-body { display: flex; gap: 16px; align-items: center; }
        .spotlight-body img { width: 96px; height: 136px; object-fit: cover; border-radius: 12px; flex-shrink: 0; }
        .spotlight-info h3 { margin: 0 0 6px; font-size: 1.05rem; }
        .spotlight-info p { margin: 0 0 14px; color: #999; font-size: 0.85rem; }
        .primary-btn {
          display: inline-block; background: #00E5FF; color: #000; font-weight: 800;
          padding: 9px 16px; border-radius: 10px; text-decoration: none; font-size: 0.85rem;
        }
        .quick-links { display: flex; flex-direction: column; gap: 10px; }
        .q-link {
          display: flex; align-items: center; gap: 10px; padding: 11px 14px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; color: #ddd; text-decoration: none; font-size: 0.9rem; font-weight: 600;
        }
        .q-link:hover { border-color: #00E5FF; color: #00E5FF; }
        .muted { color: #777; margin: 0; font-size: 0.9rem; }
        .memories-list { display: flex; flex-direction: column; gap: 10px; }
        .memory-item {
          padding: 12px 14px; border-radius: 10px; background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .mem-date { font-size: 0.75rem; color: #ffa500; font-weight: 700; }
        .memory-item p { margin: 4px 0 0; color: #ddd; font-size: 0.9rem; }
      `}</style>
    </div>
  );
}
