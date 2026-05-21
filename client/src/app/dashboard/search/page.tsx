'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AnimeCard } from '../../../components/discovery/AnimeCard';
import Link from 'next/link';

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", 
  "Mahou Shoujo", "Mecha", "Music", "Mystery", "Psychological", "Romance", 
  "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"
];

const YEARS = Array.from({ length: 55 }, (_, i) => 2025 - i);
const STATUS = ["FINISHED", "RELEASING", "NOT_YET_RELEASED", "CANCELLED", "HIATUS"];
const FORMATS = ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"];
const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [animes, setAnimes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const observer = useRef<IntersectionObserver | null>(null);

  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(searchParams.get('genres')?.split(',').filter(Boolean) || []);
  const [year, setYear] = useState(searchParams.get('year') || '');
  const [season, setSeason] = useState(searchParams.get('season') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [format, setFormat] = useState(searchParams.get('format') || '');

  const lastAnimeElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const fetchResults = async (pageNum: number, isNewSearch: boolean = false) => {
    if (loading && !isNewSearch) return;
    setLoading(true);
    
    try {
      if (pageNum === 1 && query) {
        try {
          const resUser = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/search/global?q=${encodeURIComponent(query)}`);
          const userData = await resUser.json();
          if (userData.success) setUsers(userData.data.users || []);
        } catch (err) { console.error(err); }
      } else if (!query) {
        setUsers([]);
      }

      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (selectedGenres.length > 0) params.append('genres', selectedGenres.join(','));
      if (year) params.append('year', year);
      if (season) params.append('season', season);
      if (status) params.append('status', status);
      if (format) params.append('format', format);
      params.append('page', pageNum.toString());
      params.append('perPage', '50');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/anime/discovery/search?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        const newData = json.data || [];
        if (newData.length < 50) setHasMore(false);
        else setHasMore(true);

        setAnimes(prev => {
          if (isNewSearch) return newData;
          const existingIds = new Set(prev.map(a => a.id));
          const filtered = newData.filter((a: any) => !existingIds.has(a.id));
          return [...prev, ...filtered];
        });
      } else { setHasMore(false); }
    } catch (e) {
      console.error(e);
      setHasMore(false);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimes([]);
      setPage(1);
      setHasMore(true);
      fetchResults(1, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setAnimes([]);
    setPage(1);
    setHasMore(true);
    fetchResults(1, true);
    
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (selectedGenres.length > 0) params.append('genres', selectedGenres.join(','));
    if (year) params.append('year', year);
    if (season) params.append('season', season);
    if (status) params.append('status', status);
    if (format) params.append('format', format);
    router.replace(`/dashboard/search?${params.toString()}`, { scroll: false });
  }, [selectedGenres, year, season, status, format]);

  useEffect(() => {
    if (page > 1) fetchResults(page);
  }, [page]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  };

  return (
    <div className="search-page">
      <aside className="filter-sidebar">
        <div className="filter-section">
          <h3>Dimensiones Nexo</h3>
          <p className="subtitle">Filtra el multiverso anime</p>
          <div className="search-input-wrapper">
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-section">
          <h4>Géneros Totales</h4>
          <div className="genre-cloud">
            {GENRES.map(g => (
              <button 
                key={g} 
                className={selectedGenres.includes(g) ? 'active' : ''}
                onClick={() => toggleGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-item">
            <h4>Año</h4>
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">Todos</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <h4>Temporada</h4>
            <select value={season} onChange={(e) => setSeason(e.target.value)}>
              <option value="">Todas</option>
              {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-item">
            <h4>Estado</h4>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos</option>
              {STATUS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="filter-item">
            <h4>Formato</h4>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="">Todos</option>
              {FORMATS.map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>

        <button className="reset-btn" onClick={() => {
          setQuery('');
          setSelectedGenres([]);
          setYear('');
          setSeason('');
          setStatus('');
          setFormat('');
        }}>
          Reiniciar Multiverso
        </button>
      </aside>

      <main className="search-results">
        {users.length > 0 && (
          <section className="community-results">
            <h3 className="section-title-alt">Nexo Comunidad</h3>
            <div className="users-grid-horizontal">
              {users.map(u => (
                <Link href={`/dashboard/profile/${u.username}`} key={u.id} className="user-search-card">
                  <div className="user-avatar-wrap">
                    <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.username}`} alt={u.username} />
                  </div>
                  <div className="user-search-info">
                    <p className="u-name">@{u.username}</p>
                    <p className="u-arch">{u.archetype || 'Explorador'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <header className="results-header">
          <div className="header-content">
             <h2>Catálogo Global</h2>
             <div className="badge">{animes.length} Animes</div>
          </div>
          <p>Explorando resultados de AniNexo & AniList con filtros avanzados.</p>
        </header>

        <div className="results-grid">
          {animes.map((anime, index) => {
            const animeProps = {
              id: anime.id,
              title: anime.title.romaji,
              coverImage: anime.coverImage.extraLarge,
              score: anime.averageScore,
              episodes: anime.episodes,
              status: anime.status,
              genres: anime.genres
            };
            
            if (animes.length === index + 1) {
              return (
                <div ref={lastAnimeElementRef} key={anime.id}>
                  <AnimeCard {...animeProps} />
                </div>
              );
            }
            return <AnimeCard key={anime.id} {...animeProps} />;
          })}
        </div>

        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Sincronizando con la API...</span>
          </div>
        )}

        {!hasMore && animes.length > 0 && (
          <div className="end-msg">Has llegado al final de esta dimensión.</div>
        )}
        
        {animes.length === 0 && users.length === 0 && !loading && !isInitialLoad && (
          <div className="no-results">
            <div className="no-results-content">
               <span className="icon">🌌</span>
               <h3>No hay coincidencias en esta línea temporal</h3>
               <p>Intenta ampliar tus criterios o reinicia los filtros.</p>
               <button onClick={() => setQuery('')}>Limpiar Búsqueda</button>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .search-page { display: grid; grid-template-columns: 320px 1fr; min-height: 100vh; background: #050505; padding-top: 75px; }
        .filter-sidebar { padding: 2.5rem 1.5rem; background: rgba(10, 10, 10, 0.95); backdrop-filter: blur(10px); border-right: 1px solid rgba(255,255,255,0.03); height: calc(100vh - 75px); position: sticky; top: 75px; overflow-y: auto; }
        .filter-section { margin-bottom: 2.5rem; }
        .filter-section h3 { font-size: 1.4rem; font-weight: 900; color: #fff; margin-bottom: 5px; }
        .subtitle { font-size: 0.8rem; color: #555; margin-bottom: 1.5rem; }
        .filter-section h4 { font-size: 0.75rem; color: #444; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem; font-weight: 800; }
        .search-input-wrapper input { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 14px 18px; border-radius: 12px; color: white; outline: none; transition: all 0.3s; }
        .genre-cloud { display: flex; flex-wrap: wrap; gap: 6px; }
        .genre-cloud button { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 5px 10px; border-radius: 6px; color: #777; font-size: 0.75rem; cursor: pointer; }
        .genre-cloud button.active { background: #00E5FF; color: #000; font-weight: 800; }
        .filter-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 1.2rem; }
        .filter-item select { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 10px; border-radius: 8px; color: #ccc; }
        .reset-btn { width: 100%; padding: 14px; margin-top: 1rem; background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); color: #666; border-radius: 12px; cursor: pointer; }
        
        .search-results { padding: 3rem 5%; }
        .section-title-alt { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; color: #00E5FF; margin-bottom: 20px; font-weight: 900; }
        .community-results { margin-bottom: 50px; padding-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .users-grid-horizontal { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 10px; }
        .user-search-card { min-width: 200px; background: rgba(255,255,255,0.03); padding: 20px; border-radius: 20px; display: flex; align-items: center; gap: 15px; text-decoration: none; border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s; }
        .user-search-card:hover { transform: translateY(-5px); background: rgba(255,255,255,0.06); border-color: #00E5FF; }
        .user-avatar-wrap { width: 50px; height: 50px; border-radius: 50%; overflow: hidden; }
        .user-avatar-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .u-name { color: #fff; font-weight: 700; margin: 0; font-size: 0.95rem; }
        .u-arch { color: #555; font-size: 0.75rem; margin: 2px 0 0 0; }

        .results-header { margin-bottom: 4rem; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 2rem; }
        .header-content { display: flex; align-items: center; gap: 20px; margin-bottom: 10px; }
        .results-header h2 { font-size: 3rem; font-weight: 950; color: #fff; margin: 0; }
        .badge { background: #00E5FF; color: #000; padding: 4px 12px; border-radius: 20px; font-weight: 900; }
        .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 40px; }
        .loading-spinner { display: flex; flex-direction: column; align-items: center; gap: 15px; padding: 5rem; }
        .spinner { width: 35px; height: 35px; border: 3px solid rgba(0, 229, 255, 0.05); border-left-color: #00E5FF; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
