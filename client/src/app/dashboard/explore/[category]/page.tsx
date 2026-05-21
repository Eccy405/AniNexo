'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AnimeCard } from '../../../../components/discovery/AnimeCard';

export default function ExplorePage() {
  const params = useParams();
  const category = params.category as string;
  
  const [animes, setAnimes] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);

  // Elemento que activará la carga de la siguiente página
  const lastAnimeElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const fetchData = async (pageNum: number) => {
    setLoading(true);
    try {
      const isGenre = !['trending', 'popular', 'top-rated', 'upcoming'].includes(category.toLowerCase());
      const baseUrl = isGenre 
        ? `http://localhost:3001/api/anime/discovery/genre/${category}`
        : `http://localhost:3001/api/anime/discovery/category/${category}`;

      const res = await fetch(`${baseUrl}?page=${pageNum}&perPage=50`);
      const json = await res.json();
      
      if (json.success) {
        const newData = json.data || [];
        if (newData.length < 50) setHasMore(false);
        
        setAnimes(prev => {
          // Evitar duplicados por ID
          const existingIds = new Set(prev.map(a => a.id));
          const filteredNewData = newData.filter((a: any) => !existingIds.has(a.id));
          return [...prev, ...filteredNewData];
        });
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
      setHasMore(false);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Reset y carga inicial al cambiar de categoría
  useEffect(() => {
    setAnimes([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
    fetchData(1);
  }, [category]);

  // Carga de páginas adicionales
  useEffect(() => {
    if (page > 1) {
      fetchData(page);
    }
  }, [page]);

  const displayTitle = category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');

  if (initialLoading) return (
    <div className="loading-fullscreen">
      <div className="spinner"></div>
      <span>Sincronizando con el catálogo infinito...</span>
      <style jsx>{`
        .loading-fullscreen {
          height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--color-primary);
          gap: 20px;
          font-weight: 800;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(0, 229, 255, 0.1);
          border-left-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  return (
    <div className="explore-container">
      <header className="explore-header">
        <h1>Explorando: <span>{displayTitle}</span></h1>
        <p>Catálogo masivo enriquecido por AniNexo & Nexo AI.</p>
      </header>

      <div className="anime-grid">
        {animes.map((anime, index) => {
          if (animes.length === index + 1) {
            return (
              <div ref={lastAnimeElementRef} key={anime.id}>
                <AnimeCard {...anime} title={anime.title.romaji} coverImage={anime.coverImage.extraLarge} score={anime.averageScore} />
              </div>
            );
          } else {
            return (
              <AnimeCard key={anime.id} {...anime} title={anime.title.romaji} coverImage={anime.coverImage.extraLarge} score={anime.averageScore} />
            );
          }
        })}
      </div>

      {loading && !initialLoading && (
        <div className="loading-more">
           <div className="spinner-small"></div>
           Cargando más resultados...
        </div>
      )}

      {!hasMore && animes.length > 0 && (
        <div className="end-message">Has llegado al final del multiverso anime.</div>
      )}

      <style jsx>{`
        .explore-container {
          padding: 4rem 5%;
          background-color: #050505;
          min-height: 100vh;
        }

        .explore-header {
          margin-bottom: 4rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 2rem;
        }

        .explore-header h1 {
          font-size: 3.5rem;
          font-weight: 950;
          color: #fff;
          margin: 0;
          letter-spacing: -2px;
        }

        .explore-header span {
          color: var(--color-primary);
          text-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
        }

        .explore-header p {
          color: #666;
          font-size: 1.2rem;
          margin-top: 15px;
        }

        .anime-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 35px;
        }

        .loading-more {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          padding: 4rem;
          color: var(--color-primary);
          font-weight: bold;
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(0, 229, 255, 0.1);
          border-left-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .end-message {
          text-align: center;
          padding: 4rem;
          color: #444;
          font-weight: 800;
          letter-spacing: 1px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .anime-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .explore-header h1 { font-size: 2.2rem; }
        }
      `}</style>
    </div>
  );
}
