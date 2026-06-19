'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getAnimeDetails } from '../../../../lib/anilist';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { NexoAlert } from '../../../../components/ui/NexoAlert';
import { AnimeSocialFeed } from '../../../../components/anime/AnimeSocialFeed';
import { Users, BookOpen } from 'lucide-react';

type TabType = 'overview' | 'characters' | 'staff' | 'stats' | 'social';

export default function AnimeDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [anime, setAnime] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [visibleChars, setVisibleChars] = useState(50);
  const [syncing, setSyncing] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [addingToCollection, setAddingToCollection] = useState(false);

  useEffect(() => {
    const loadData = async (force: boolean = false) => {
      try {
        if (!params?.id) return;
        const realId = params.id.split('-')[0];
        const data = await getAnimeDetails(realId, force);
        
        if (!data) {
          setError('El anime no existe en esta línea temporal.');
          setLoading(false);
          return;
        }
        setAnime(data);
        setLoading(false);
      } catch (err) {
        setError('Error al conectar con el Nexo.');
        setLoading(false);
      }
    };
    loadData();
  }, [params.id]);

  if (loading) return (
    <div className="loading-container">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="nexo-spinner" />
      <p>Sincronizando ADN del Anime...</p>
      <style jsx>{`
        .loading-container { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #050505; color: #00E5FF; gap: 20px; font-weight: 900; letter-spacing: 2px; }
        .nexo-spinner { width: 50px; height: 50px; border: 3px solid rgba(0, 229, 255, 0.1); border-top: 3px solid #00E5FF; border-radius: 50%; }
      `}</style>
    </div>
  );

  if (error || !anime) return (
    <>
      <NexoAlert show={true} type="error" title="ERROR DIMENSIONAL" message={error || "Anime no encontrado"} onClose={() => window.location.href = '/dashboard'} />
      <div style={{ background: '#050505', height: '100vh' }} />
    </>
  );

  const title = anime.title.english || anime.title.romaji;
  const studio = anime.studios.nodes[0]?.name || 'Estudio Desconocido';

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Vista General' },
    { id: 'characters', label: 'Personajes' },
    { id: 'staff', label: 'Staff' },
    { id: 'stats', label: 'Estadísticas' },
    { id: 'social', label: 'Social' }
  ];

  return (
    <div className="anime-page">
      {/* HERO SECTION */}
      <div className="banner-section">
        <div className="banner-wrapper">
          {anime.bannerImage ? <Image src={anime.bannerImage} alt={title} fill priority className="banner-img" /> : <div className="banner-placeholder" />}
          <div className="banner-overlay" />
        </div>
        <div className="header-content-box">
          <div className="poster-main">
            <Image src={anime.coverImage.extraLarge} alt={title} fill className="poster-img" />
          </div>
<div className="header-text-main">
             <h1 className="anime-title-h1">{title}</h1>
             <div className="quick-tags">
               <span className="q-tag">{anime.season} {anime.seasonYear}</span>
               <span className="q-tag">{anime.type}</span>
               <span className="q-tag score">⭐ {anime.averageScore}%</span>
             </div>
           </div>
           
           {/* Action Buttons */}
           <div className="anime-actions">
             <button 
               className="btn-create-group"
               onClick={() => setShowGroupModal(true)}
               title="Crear grupo temático"
             >
               <Users size={20} />
               <span>Crear Grupo</span>
             </button>
             <button 
               className="btn-add-collection"
               onClick={async () => {
                 setAddingToCollection(true);
                 try {
                   const userStr = localStorage.getItem('user');
                   const token = localStorage.getItem('token');
                   if (!userStr || !token) return;
                   const user = JSON.parse(userStr);
                   
                   await fetch('/api/groups/collection/add', {
                     method: 'POST',
                     headers: {
                       'Content-Type': 'application/json',
                       'Authorization': `Bearer ${token}`
                     },
                     body: JSON.stringify({ userId: user.id, animeId: anime.id })
                   });
                 } catch (e) {
                   alert('Error al agregar a la colección');
                 } finally {
                   setAddingToCollection(false);
                 }
               }}
               disabled={addingToCollection}
               title="Agregar a mi colección"
             >
               <BookOpen size={20} />
               <span>{addingToCollection ? 'Agregando...' : 'Agregar a Colección'}</span>
             </button>
           </div>
         </div>
       </div>

      {/* TAB BAR */}
      <nav className="tab-navigation">
        <div className="tabs-container">
          {tabs.map(tab => (
            <button 
              key={tab.id} 
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {activeTab === tab.id && <motion.div layoutId="activeTab" className="tab-underline" />}
            </button>
          ))}
        </div>
      </nav>

      <div className="page-grid-layout">
        {/* SIDEBAR METADATA */}
        <aside className="anime-sidebar">
          <div className="meta-glass-card">
            <div className="meta-group"><span className="m-label">Formato</span><span className="m-value">{anime.type}</span></div>
            <div className="meta-group"><span className="m-label">Episodios</span><span className="m-value">{anime.episodes || '??'}</span></div>
            <div className="meta-group"><span className="m-label">Duración</span><span className="m-value">{anime.duration} min</span></div>
            <div className="meta-group"><span className="m-label">Estado</span><span className="m-value">{anime.status}</span></div>
            <div className="meta-group"><span className="m-label">Promedio</span><span className="m-value score">{anime.averageScore}%</span></div>
            <div className="meta-group"><span className="m-label">Popularidad</span><span className="m-value">🔥 {anime.popularity.toLocaleString()}</span></div>
            <div className="meta-group"><span className="m-label">Estudio</span><span className="m-value">{studio}</span></div>
            <div className="meta-group"><span className="m-label">Géneros</span>
              <div className="genre-pill-container">
                {anime.genres.map((g: string) => <span key={g} className="genre-pill">{g}</span>)}
              </div>
            </div>

            {anime.tags?.length > 0 && (
              <div className="meta-group"><span className="m-label">Etiquetas</span>
                <div className="tag-pill-container">
                  {anime.tags.map((t: any) => (
                    <span key={t.name} className="tag-pill" title={t.description}>
                      {t.name} <span className="tag-rank">{t.rank}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="sidebar-divider" />
            
            <div className="meta-group"><span className="m-label">Romaji</span><span className="m-value small">{anime.title.romaji}</span></div>
            <div className="meta-group"><span className="m-label">Native</span><span className="m-value small">{anime.title.native}</span></div>
            
            {anime.externalLinks?.length > 0 && (
              <>
                <div className="sidebar-divider" />
                <div className="meta-group"><span className="m-label">Enlaces</span>
                  <div className="links-grid">
                    {anime.externalLinks.map((link: any) => (
                      <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="ext-link">
                        {link.site}
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="sidebar-divider" />
            <button 
              className="btn-sync-force" 
              disabled={syncing}
              onClick={async () => {
                setSyncing(true);
                try {
                  const realId = params.id.split('-')[0];
                  const data = await getAnimeDetails(realId, true); 
                  setAnime(data);
                  setVisibleChars(50);
                } catch (e) {
                  setError('Error al resincronizar');
                } finally {
                  setSyncing(false);
                }
              }}
            >
              {syncing ? '⌛ Sincronizando elenco completo...' : '🔄 Resincronizar Datos'}
            </button>
          </div>
        </aside>

        {/* CONTENIDO DINÁMICO POR PESTAÑA */}
        <main className="anime-main-content">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <section className="info-block">
                  <h3>Sinopsis</h3>
                  <div className="description-text" dangerouslySetInnerHTML={{ __html: anime.description }} />
                </section>

                {anime.relations?.length > 0 && (
                  <section className="info-block">
                    <h3>Relaciones</h3>
                    <div className="relations-horizontal">
                      {anime.relations.map((rel: any) => (
                        <Link key={rel.id} href={`/dashboard/anime/${rel.id}`} className="rel-card-modern">
                          <div className="rel-card-img"><Image src={rel.coverImage.large} alt={rel.title.romaji} fill /></div>
                          <div className="rel-card-data">
                            <span className="rel-label">{rel.type}</span>
                            <p className="rel-title-p">{rel.title.english || rel.title.romaji}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {anime.trailerYoutubeId && (
                  <section className="info-block">
                    <h3>Tráiler Oficial</h3>
                    <div className="trailer-embed-container">
                      <iframe src={`https://www.youtube.com/embed/${anime.trailerYoutubeId}`} frameBorder="0" allowFullScreen />
                    </div>
                  </section>
                )}
                
                {anime.recommendations?.length > 0 && (
                  <section className="info-block">
                    <h3>Recomendaciones</h3>
                    <div className="recommendations-grid-layout">
                      {anime.recommendations.slice(0, 6).map((rec: any) => (
                        <Link key={rec.id} href={`/dashboard/anime/${rec.id}`} className="rec-box">
                          <div className="rec-box-img"><Image src={rec.coverImage.large} alt={rec.title.romaji} fill /></div>
                          <p className="rec-box-title">{rec.title.english || rec.title.romaji}</p>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </motion.div>
            )}

            {activeTab === 'characters' && (
              <motion.div key="characters" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="characters-dual-grid">
                  {anime.characters?.nodes?.slice(0, visibleChars).map((char: any) => (
                    <div key={char.id} className="char-dual-card">
                      <div className="char-side">
                        <div className="char-mini-portrait"><Image src={char.image} alt={char.name} fill /></div>
                        <div className="char-mini-info">
                          <p className="cm-name">{char.name}</p>
                          <p className="cm-role">{char.role === 'MAIN' ? 'Protagonista' : 'Secundario'}</p>
                        </div>
                      </div>
                      {char.voiceActors?.[0] && (
                        <div className="va-side">
                          <div className="va-mini-info">
                            <p className="vm-name">{char.voiceActors[0].name.full}</p>
                            <p className="vm-lang">Japonés</p>
                          </div>
                          <div className="va-mini-portrait"><Image src={char.voiceActors[0].image.large} alt={char.voiceActors[0].name.full} fill /></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="load-more-container">
                  {anime.characters?.nodes?.length > visibleChars ? (
                    <button className="btn-load-more" onClick={() => setVisibleChars(prev => prev + 50)}>
                      Ver más personajes (+50)
                    </button>
                  ) : (
                    <p className="no-more-label">Has llegado al final del reparto registrado.</p>
                  )}
                  <p className="char-count-info">Mostrando {Math.min(visibleChars, anime.characters?.nodes?.length || 0)} de {anime.characters?.nodes?.length || 0} personajes</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'staff' && (
              <motion.div key="staff" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="staff-full-grid">
                  {anime.staff?.map((s: any) => (
                    <div key={s.id} className="staff-entry">
                      <div className="staff-portrait"><Image src={s.image.large} alt={s.name.full} fill /></div>
                      <div className="staff-entry-info">
                        <p className="se-name">{s.name.full}</p>
                        <p className="se-job">{s.primaryOccupations?.[0] || 'Producción'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'social' && (
              <motion.div key="social" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
                <AnimeSocialFeed animeId={Number(anime.id)} animeTitle={title} />
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
                <div className="stats-container">
                  <section className="stat-card">
                    <h4>Distribución de Puntuación</h4>
                    <div className="score-bars">
                      {anime.stats?.scoreDistribution?.map((s: any) => (
                        <div key={s.score} className="score-row">
                          <span className="score-label">{s.score}0%</span>
                          <div className="score-bar-bg">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${(s.amount / Math.max(...anime.stats.scoreDistribution.map((x:any)=>x.amount))) * 100}%` }} 
                              className="score-bar-fill" 
                            />
                          </div>
                          <span className="score-count">{s.amount}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Modal para crear grupo */}
      {showGroupModal && (
        <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Crear Grupo Temático</h3>
            <input 
              type="text" 
              placeholder="Nombre del grupo" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="modal-input"
            />
            <div className="modal-actions">
              <button onClick={() => setShowGroupModal(false)} className="btn-modal-cancel">Cancelar</button>
              <button 
                onClick={async () => {
                  if (!groupName.trim()) return;
                  const userStr = localStorage.getItem('user');
                  const token = localStorage.getItem('token');
                  if (!userStr || !token) return;
                  const user = JSON.parse(userStr);
                  
                  await fetch('/api/groups/create', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                      userId: user.id, 
                      animeId: anime.id, 
                      name: groupName 
                    })
                  });
                  setShowGroupModal(false);
                  setGroupName('');
                }}
                className="btn-modal-create"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .anime-page { background: #050505; color: #fff; min-height: 100vh; font-family: 'Inter', sans-serif; }
        
        /* HERO */
        .banner-section { position: relative; height: 400px; margin-bottom: 0; }
        .banner-wrapper { position: absolute; inset: 0; }
        .banner-img { object-fit: cover; opacity: 0.4; }
        .banner-placeholder { width: 100%; height: 100%; background: #111; }
        .banner-overlay { position: absolute; inset: 0; background: linear-gradient(to top, #050505, transparent); }
        .header-content-box { position: absolute; bottom: 40px; left: 5%; right: 5%; display: flex; gap: 40px; align-items: flex-end; z-index: 10; }
        .poster-main { width: 220px; height: 320px; position: relative; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1); }
        .poster-img { object-fit: cover; }
        .header-text-main { flex: 1; padding-bottom: 20px; }
        .anime-title-h1 { font-size: 3rem; font-weight: 950; margin: 0 0 15px 0; line-height: 1.1; }
        .quick-tags { display: flex; gap: 10px; }
        .q-tag { padding: 6px 15px; background: rgba(255,255,255,0.1); border-radius: 30px; font-size: 0.85rem; font-weight: 700; }
        .q-tag.score { color: #00E5FF; background: rgba(0, 229, 255, 0.1); }

        /* TABS */
        .tab-navigation { background: #0a0a0a; border-bottom: 1px solid #1a1a1a; position: sticky; top: 0; z-index: 100; padding: 0 5%; }
        .tabs-container { display: flex; gap: 30px; }
        .tab-btn { position: relative; padding: 20px 0; background: none; border: none; color: #666; font-weight: 800; cursor: pointer; transition: 0.3s; font-size: 0.9rem; }
        .tab-btn:hover { color: #fff; }
        .tab-btn.active { color: #00E5FF; }
        .tab-underline { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #00E5FF; border-radius: 3px 3px 0 0; }

        /* GRID LAYOUT */
        .page-grid-layout { display: grid; grid-template-columns: 280px 1fr; gap: 50px; padding: 40px 5%; }

        /* SIDEBAR */
        .meta-glass-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 25px; display: flex; flex-direction: column; gap: 20px; position: sticky; top: 100px; }
        .meta-group { display: flex; flex-direction: column; gap: 4px; }
        .m-label { font-size: 0.75rem; font-weight: 900; color: #444; text-transform: uppercase; letter-spacing: 1.5px; }
        .m-value { font-size: 0.95rem; font-weight: 700; color: #ddd; }
        .m-value.score { color: #00E5FF; }
        .m-value.small { font-size: 0.75rem; color: #666; }
        .genre-pill-container { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 5px; }
        .genre-pill { padding: 4px 12px; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(255,255,255,0.08); }
        .tag-pill-container { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 5px; }
        .tag-pill { padding: 4px 10px; background: rgba(255,255,255,0.03); border-radius: 4px; font-size: 0.65rem; color: #888; border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; width: 100%; }
        .tag-rank { color: #00E5FF; opacity: 0.6; }
        .sidebar-divider { height: 1px; background: rgba(255,255,255,0.05); }
        .links-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .ext-link { font-size: 0.8rem; color: #00E5FF; text-decoration: none; padding: 5px 10px; background: rgba(0, 229, 255, 0.05); border-radius: 6px; }
        .btn-sync-force { margin-top: 10px; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #888; border-radius: 12px; font-weight: 800; cursor: pointer; font-size: 0.8rem; transition: 0.3s; width: 100%; }
        .btn-sync-force:hover { background: #00E5FF; color: #000; border-color: #00E5FF; transform: scale(1.02); }

        /* MAIN CONTENT */
        .info-block { margin-bottom: 60px; }
        .info-block h3 { font-size: 1.3rem; font-weight: 900; margin-bottom: 25px; border-left: 4px solid #00E5FF; padding-left: 15px; }
        .description-text { color: #aaa; line-height: 1.8; font-size: 1.05rem; }
        .description-text :global(br) { margin-bottom: 15px; display: block; content: ""; }

        .relations-horizontal { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 20px; scrollbar-width: none; }
        .rel-card-modern { width: 220px; flex-shrink: 0; background: #111; border-radius: 12px; overflow: hidden; border: 1px solid #222; text-decoration: none; transition: 0.3s; }
        .rel-card-modern:hover { transform: translateY(-5px); border-color: #00E5FF; }
        .rel-card-img { height: 140px; position: relative; }
        .rel-card-img :global(img) { object-fit: cover; }
        .rel-card-data { padding: 12px; }
        .rel-label { font-size: 0.65rem; font-weight: 900; color: #00E5FF; text-transform: uppercase; }
        .rel-title-p { font-size: 0.85rem; font-weight: 700; color: #fff; margin: 4px 0 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .trailer-embed-container { aspect-ratio: 16/9; width: 100%; border-radius: 20px; overflow: hidden; border: 1px solid rgba(0, 229, 255, 0.2); box-shadow: 0 0 50px rgba(0, 229, 255, 0.05); }
        .trailer-embed-container iframe { width: 100%; height: 100%; }

        .recommendations-grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
        .rec-box { text-decoration: none; transition: 0.3s; }
        .rec-box:hover { transform: scale(1.03); }
        .rec-box-img { aspect-ratio: 2/3; position: relative; border-radius: 10px; overflow: hidden; margin-bottom: 10px; }
        .rec-box-title { font-size: 0.85rem; font-weight: 700; color: #fff; text-align: center; }

        /* CHARACTERS DUAL TAB */
        .characters-dual-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 15px; }
        .char-dual-card { display: flex; justify-content: space-between; background: #111; border: 1px solid #222; border-radius: 8px; overflow: hidden; height: 80px; }
        .char-side, .va-side { display: flex; gap: 12px; align-items: center; width: 48%; }
        .char-side { padding-left: 0; }
        .va-side { flex-direction: row; justify-content: flex-end; padding-right: 0; text-align: right; }
        
        .char-mini-portrait, .va-mini-portrait { width: 60px; height: 80px; position: relative; flex-shrink: 0; }
        .char-mini-portrait :global(img), .va-mini-portrait :global(img) { object-fit: cover; }
        
        .char-mini-info, .va-mini-info { display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
        .cm-name, .vm-name { font-size: 0.85rem; font-weight: 800; color: #fff; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cm-role, .vm-lang { font-size: 0.7rem; color: #666; font-weight: 700; margin: 2px 0 0 0; }
        .vm-lang { color: #00E5FF; opacity: 0.7; }

        .load-more-container { margin-top: 40px; display: flex; flex-direction: column; align-items: center; gap: 15px; }
        .btn-load-more { padding: 15px 40px; background: #00E5FF; color: #000; border: none; border-radius: 12px; font-weight: 900; cursor: pointer; font-size: 1rem; transition: 0.3s; }
        .btn-load-more:hover { transform: scale(1.05); box-shadow: 0 0 30px rgba(0, 229, 255, 0.3); }
        .char-count-info { font-size: 0.85rem; color: #555; font-weight: 700; }

        /* STAFF TAB */
        .staff-full-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .staff-entry { display: flex; gap: 15px; background: #111; padding: 10px; border-radius: 12px; border: 1px solid #222; align-items: center; }
        .staff-portrait { width: 70px; height: 70px; position: relative; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
        .staff-portrait :global(img) { object-fit: cover; }
        .se-name { font-size: 1rem; font-weight: 800; margin: 0; color: #fff; }
        .se-job { font-size: 0.75rem; color: #00E5FF; font-weight: 700; margin: 2px 0 0 0; }

        /* STATS TAB */
        .stats-container { display: flex; flex-direction: column; gap: 30px; }
        .stat-card { background: #111; border: 1px solid #222; border-radius: 20px; padding: 30px; }
        .stat-card h4 { margin: 0 0 25px 0; font-size: 1.2rem; font-weight: 900; color: #00E5FF; }
        .score-bars { display: flex; flex-direction: column; gap: 12px; }
        .score-row { display: flex; align-items: center; gap: 15px; }
        .score-label { width: 50px; font-size: 0.8rem; font-weight: 800; color: #666; }
        .score-bar-bg { flex: 1; height: 10px; background: #1a1a1a; border-radius: 10px; overflow: hidden; }
.score-bar-fill { height: 100%; background: #00E5FF; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 229, 255, 0.4); }
         .score-count { width: 60px; font-size: 0.8rem; font-weight: 800; color: #ddd; text-align: right; }

         /* Anime Actions (Groups & Collection Buttons) */
         .anime-actions {
           display: flex;
           gap: 15px;
           margin-left: auto;
           margin-top: 40px;
         }

         .btn-create-group, .btn-add-collection {
           display: flex;
           align-items: center;
           gap: 8px;
           padding: 12px 20px;
           border-radius: 12px;
           border: none;
           font-weight: 800;
           cursor: pointer;
           transition: all 0.3s;
           font-size: 0.9rem;
         }

         .btn-create-group {
           background: rgba(255, 255, 255, 0.05);
           color: #00E5FF;
           border: 1px solid rgba(0, 229, 255, 0.2);
         }

         .btn-create-group:hover {
           background: rgba(0, 229, 255, 0.1);
           transform: translateY(-2px);
           box-shadow: 0 0 20px rgba(0, 229, 255, 0.2);
         }

         .btn-add-collection {
           background: rgba(69, 189, 98, 0.1);
           color: #45bd62;
           border: 1px solid rgba(69, 189, 98, 0.2);
         }

         .btn-add-collection:hover:not(:disabled) {
           background: rgba(69, 189, 98, 0.2);
           transform: translateY(-2px);
           box-shadow: 0 0 20px rgba(69, 189, 98, 0.2);
         }

         /* Modal */
         .modal-overlay {
           position: fixed;
           top: 0;
           left: 0;
           width: 100vw;
           height: 100vh;
           background: rgba(0, 0, 0, 0.7);
           display: flex;
           align-items: center;
           justify-content: center;
           z-index: 1000;
           backdrop-filter: blur(5px);
         }

         .modal-content {
           background: #111;
           border: 1px solid rgba(255, 255, 255, 0.1);
           border-radius: 16px;
           padding: 30px;
           min-width: 350px;
           max-width: 90%;
         }

         .modal-content h3 {
           margin: 0 0 20px 0;
           color: #00E5FF;
           font-weight: 900;
         }

         .modal-input {
           width: 100%;
           padding: 15px;
           background: rgba(255, 255, 255, 0.05);
           border: 1px solid rgba(255, 255, 255, 0.1);
           border-radius: 10px;
           color: white;
           font-size: 1rem;
           margin-bottom: 20px;
         }

         .modal-actions {
           display: flex;
           gap: 10px;
           justify-content: flex-end;
         }

         .btn-modal-cancel, .btn-modal-create {
           padding: 10px 20px;
           border-radius: 8px;
           border: none;
           font-weight: 800;
           cursor: pointer;
         }

         .btn-modal-cancel {
           background: transparent;
           color: #888;
           border: 1px solid rgba(255, 255, 255, 0.1);
         }

         .btn-modal-create {
           background: #00E5FF;
           color: #000;
         }
       `}</style>
    </div>
  );
}
