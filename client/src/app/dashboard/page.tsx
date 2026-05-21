'use client';

import React, { useEffect, useState } from 'react';
import { HeroCarousel } from '../../components/discovery/HeroCarousel';
import { AnimeRow } from '../../components/discovery/AnimeRow';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiscovery = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const res = await fetch('http://localhost:3001/api/anime/discovery/home', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Error del servidor: ${res.status}`);
      }
      
      const json = await res.json();
      console.log('Dashboard Data:', json);

      if (json.success && json.data && (json.data.hero?.length > 0 || json.data.rows?.length > 0)) {
        setData(json.data);
      } else {
        setError('El servidor no devolvió animes en este momento.');
      }
    } catch (e: any) {
      console.error('Error cargando el Dashboard:', e);
      setError(e.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscovery();
    window.scrollTo(0, 0);
  }, []);

  if (loading) return (
    <div className="loading-state">
      <div className="spinner"></div>
      <p>Sincronizando con el servidor...</p>
      <style jsx>{`
        .loading-state {
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #050505;
          color: #00E5FF;
          gap: 20px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 229, 255, 0.1);
          border-top: 3px solid #00E5FF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  if (error || !data) return (
    <div className="error-state">
      <div className="error-card">
        <h2>🚀 ¡Casi listo!</h2>
        <p>{error || 'Estamos preparando los mejores animes para ti.'}</p>
        <button onClick={fetchDiscovery}>Actualizar Inicio</button>
      </div>
      <style jsx>{`
        .error-state {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #050505;
          color: white;
        }
        .error-card {
          text-align: center;
          background: #111;
          padding: 3rem;
          border-radius: 20px;
          border: 1px solid #333;
          max-width: 400px;
        }
        h2 { color: #00E5FF; margin-bottom: 1rem; }
        p { color: #888; margin-bottom: 2rem; }
        button {
          background: #00E5FF;
          border: none;
          padding: 12px 30px;
          border-radius: 10px;
          color: black;
          font-weight: 900;
          cursor: pointer;
          transition: all 0.2s;
        }
        button:hover { transform: scale(1.05); box-shadow: 0 0 20px rgba(0, 229, 255, 0.3); }
      `}</style>
    </div>
  );

  return (
    <div className="dashboard-container">
      {data?.hero && <HeroCarousel slides={data.hero} />}

      <main className="discovery-rows-wide">
        {data?.rows?.map((row: any, i: number) => {
          const slugMap: any = {
            '🔥 Tendencias Globales': 'trending',
            '💎 Los Más Populares': 'popular',
            '🏆 Mejor Valorados': 'top-rated',
            '📅 Próximos Estrenos': 'upcoming',
            '📺 Continuar Viendo': 'watching',
            '🕒 Vistos Recientemente': 'history'
          };
          const slug = slugMap[row.title] || row.title.toLowerCase().split(' ').pop();
          
          return (
            <AnimeRow 
              key={i} 
              title={row.title} 
              items={row.data} 
              viewAllHref={`/dashboard/explore/${slug}`}
            />
          );
        })}
      </main>

      <style jsx>{`
        .dashboard-container {
          background-color: #050505;
          min-height: 100vh;
          width: 100%;
        }

        .discovery-rows-wide {
          padding: 2rem 0;
          margin-top: -50px;
          position: relative;
          z-index: 10;
        }
      `}</style>
    </div>
  );
}
