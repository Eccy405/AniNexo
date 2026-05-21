'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  {
    id: 'genres',
    title: '¿Qué géneros te apasionan?',
    subtitle: 'Elige tu camino entre todas las posibilidades.',
    type: 'multiple',
    options: [
      { id: 'Shonen', label: 'Shonen', icon: '⚔️' },
      { id: 'Seinen', label: 'Seinen', icon: '💀' },
      { id: 'Romance', label: 'Romance', icon: '❤️' },
      { id: 'Isekai', label: 'Isekai', icon: '🌀' },
      { id: 'Psicologico', label: 'Psicologico', icon: '🧠' },
      { id: 'Acción', label: 'Acción', icon: '💥' },
      { id: 'Horror', label: 'Horror', icon: '🩸' },
      { id: 'Mecha', label: 'Mecha', icon: '🤖' },
      { id: 'Slice of Life', label: 'Slice of Life', icon: '🍵' },
      { id: 'Misterio', label: 'Misterio', icon: '🔍' },
      { id: 'Fantasia', label: 'Fantasia', icon: '🐉' },
      { id: 'Ecchi', label: 'Ecchi', icon: '🍑' },
      { id: 'Deportes', label: 'Deportes', icon: '⚽' },
      { id: 'Comedia', label: 'Comedia', icon: '🤣' },
      { id: 'Cyberpunk', label: 'Cyberpunk', icon: '💾' },
      { id: 'Steampunk', label: 'Steampunk', icon: '⚙️' },
      { id: 'Sobrenatural', label: 'Sobrenatural', icon: '👻' },
      { id: 'Musical', label: 'Musical', icon: '🎸' },
      { id: 'Thriller', label: 'Thriller', icon: '🔪' },
      { id: 'Gore', label: 'Gore', icon: '🥩' },
      { id: 'Mahou Shoujo', label: 'Mahou Shoujo', icon: '🪄' },
      { id: 'Histórico', label: 'Histórico', icon: '📜' },
      { id: 'Militar', label: 'Militar', icon: '🎖️' },
      { id: 'Avant Garde', label: 'Avant Garde', icon: '🎨' },
      { id: 'Shoujo', label: 'Shoujo', icon: '🎀' },
      { id: 'Josei', label: 'Josei', icon: '💄' },
      { id: 'Sci-Fi', label: 'Sci-Fi', icon: '🚀' },
      { id: 'Drama', label: 'Drama', icon: '🎭' },
      { id: 'Suspense', label: 'Suspense', icon: '🧗' },
      { id: 'BL', label: 'Boys Love', icon: '👬' },
      { id: 'GL', label: 'Girls Love', icon: '👭' }
    ]
  },
  {
    id: 'emotions',
    title: '¿Qué buscas sentir hoy?',
    subtitle: 'Tu alma busca una frecuencia específica.',
    type: 'multiple',
    options: [
      { id: 'Adrenalina', label: 'Adrenalina', icon: '⚡' },
      { id: 'Llorar', label: 'Llorar', icon: '😭' },
      { id: 'Relajarme', label: 'Relajarme', icon: '🧘' },
      { id: 'Reírme', label: 'Reírme', icon: '😂' },
      { id: 'Pensar', label: 'Pensar', icon: '🌌' },
      { id: 'Superación', label: 'Superación', icon: '🔥' },
      { id: 'Miedo', label: 'Miedo', icon: '👻' },
      { id: 'Curiosidad', label: 'Curiosidad', icon: '🧐' },
      { id: 'Nostalgia', label: 'Nostalgia', icon: '📻' },
      { id: 'Éxtasis', label: 'Éxtasis', icon: '🌈' },
      { id: 'Melancolía', label: 'Melancolía', icon: '🌧️' },
      { id: 'Desolación', label: 'Desolación', icon: '🏚️' },
      { id: 'Empoderamiento', label: 'Empoderamiento', icon: '👑' },
      { id: 'Intriga', label: 'Intriga', icon: '🎭' },
      { id: 'Asombro', label: 'Asombro', icon: '🤩' },
      { id: 'Confusión', label: 'Confusión', icon: '🌀' },
      { id: 'Esperanza', label: 'Esperanza', icon: '🕊️' },
      { id: 'Euforia', label: 'Euforia', icon: '🎊' },
      { id: 'Venganza', label: 'Venganza', icon: '🗡️' },
      { id: 'Paz', label: 'Paz', icon: '🌊' },
      { id: 'Tensión', label: 'Tensión', icon: '🌩️' }
    ]
  },
  {
    id: 'favorites',
    title: 'Tus Leyendas Personales',
    subtitle: 'Busca y selecciona tus pilares en el anime.',
    type: 'favorites'
  },
  {
    id: 'esthetic',
    title: 'Tu Estética Preferida',
    subtitle: '¿Qué estilo visual te cautiva más?',
    type: 'single',
    options: [
      { id: 'Classic', label: 'Clásico (90s)', icon: '🎞️' },
      { id: 'Modern', label: 'Moderno (Mappa/Ufotable)', icon: '✨' },
      { id: 'CGI', label: 'CGI de Vanguardia', icon: '🦾' },
      { id: 'Artistic', label: 'Artístico/Autor', icon: '🖌️' }
    ]
  },
  {
    id: 'identity',
    title: 'Tu Identidad Nexo',
    subtitle: 'Completa tu ficha de explorador dimensional.',
    type: 'identity'
  },
  {
    id: 'visual',
    title: 'Estilo Visual',
    subtitle: 'Elige tu color de alma y avatar.',
    type: 'custom'
  }
];

export const OnboardingWizard = ({ onComplete, initialData }: { onComplete: () => void, initialData?: any }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animeResults, setAnimeResults] = useState<any[]>([]);
  const [charResults, setCharResults] = useState<any[]>([]);
  const [isSearchingAnime, setIsSearchingAnime] = useState(false);
  const [isSearchingChar, setIsSearchingChar] = useState(false);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [selections, setSelections] = useState<any>({
    genres: initialData?.genres?.map((g: any) => g.name) || [],
    emotions: initialData?.intelligence?.emotionProfile ? Object.keys(initialData.intelligence.emotionProfile) : [],
    favAnime: initialData?.intelligence?.socialProfile?.favAnime || { id: null, title: '', image: '' },
    favCharacter: initialData?.intelligence?.socialProfile?.favCharacter || { id: null, name: '', image: '' },
    esthetic: 'Modern',
    themeColor: initialData?.themeColor || '#00E5FF',
    avatar: initialData?.avatarUrl || null,
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    bio: initialData?.bio || '',
    country: initialData?.country || ''
  });
  const [animeSearch, setAnimeSearch] = useState(selections.favAnime?.title || '');
  const [charSearch, setCharSearch] = useState(selections.favCharacter?.name || '');

  const stepData = STEPS[currentStep];

  // Buscador de Animes
  React.useEffect(() => {
    if (animeSearch.length < 2) { setAnimeResults([]); setIsSearchingAnime(false); return; }
    setIsSearchingAnime(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/search/global?q=${animeSearch}`);
        const json = await res.json();
        setAnimeResults(json.data.animes || []);
      } catch (e) {
        console.error("Error buscando anime:", e);
      } finally {
        setIsSearchingAnime(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [animeSearch]);

  // Buscador de Personajes
  React.useEffect(() => {
    if (charSearch.length < 2) { setCharResults([]); setIsSearchingChar(false); return; }
    setIsSearchingChar(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/search/characters?q=${charSearch}`);
        const json = await res.json();
        setCharResults(json.data || []);
      } catch (e) {
        console.error("Error buscando personaje:", e);
      } finally {
        setIsSearchingChar(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [charSearch]);

  const toggleSelection = (id: string, category: string) => {
    setSelections((prev: any) => {
      const current = prev[category];
      const next = current.includes(id) 
        ? current.filter((x: string) => x !== id)
        : [...current, id];
      return { ...prev, [category]: next };
    });
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsSubmitting(true);
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/profile/onboarding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            avatarUrl: selections.avatar,
            themeColor: selections.themeColor,
            favAnime: selections.favAnime,
            favCharacter: selections.favCharacter,
            genres: selections.genres,
            emotions: selections.emotions,
            esthetic: selections.esthetic,
            firstName: selections.firstName,
            lastName: selections.lastName,
            bio: selections.bio,
            country: selections.country
          })
        });

        if (res.ok) {
          const updatedUser = { ...user, avatarUrl: selections.avatar, themeColor: selections.themeColor };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          onComplete();
        } else {
          const errorData = await res.json();
          console.error('[OnboardingWizard] Error del servidor:', errorData);
          alert(`Error: ${errorData.message || 'Hubo un error al guardar tu perfil. Inténtalo de nuevo.'}`);
          setIsSubmitting(false);
        }
      } catch (e) {
        console.error(e);
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="onboarding-wizard">
      <AnimatePresence>
        {hoveredImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            className="wizard-bg-ambient"
            style={{ backgroundImage: `url(${hoveredImage})` }}
          />
        )}
      </AnimatePresence>
      <div className="progress-container">
        <div className="progress-bar">
          <motion.div 
            className="progress-fill"
            style={{ backgroundColor: selections.themeColor }}
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <span className="step-indicator">Paso {currentStep + 1} de {STEPS.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="step-content"
        >
          <header className="step-header">
            <h2 className="step-title">{stepData.title}</h2>
            <p className="step-subtitle">{stepData.subtitle}</p>
          </header>

          <div className="step-body">
            {stepData.type === 'multiple' && (
              <div className="options-grid">
                {stepData.options?.map(opt => (
                  <button 
                    key={opt.id}
                    className={`option-card ${selections[stepData.id].includes(opt.id) ? 'selected' : ''}`}
                    style={{ 
                      borderColor: selections[stepData.id].includes(opt.id) ? selections.themeColor : '',
                    }}
                    onClick={() => toggleSelection(opt.id, stepData.id)}
                  >
                    <span className="option-icon">{opt.icon}</span>
                    <span className="option-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {stepData.type === 'single' && (
              <div className="options-grid">
                {stepData.options?.map(opt => (
                  <button 
                    key={opt.id}
                    className={`option-card ${selections[stepData.id] === opt.id ? 'selected' : ''}`}
                    style={{ 
                      borderColor: selections[stepData.id] === opt.id ? selections.themeColor : '',
                    }}
                    onClick={() => setSelections({...selections, [stepData.id]: opt.id})}
                  >
                    <span className="option-icon">{opt.icon}</span>
                    <span className="option-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {stepData.type === 'favorites' && (
              <div className="favorites-step">
                <div className="fav-field">
                  <label>Tu Anime Favorito</label>
                  {selections.favAnime?.id ? (
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="selected-banner"
                    >
                      <div className="banner-bg">
                        <img src={selections.favAnime.image} alt="Selected" />
                      </div>
                      <div className="banner-overlay">
                        <span className="banner-label" style={{ color: selections.themeColor }}>ANIME DE CULTO</span>
                        <h3 className="banner-title">{selections.favAnime.title}</h3>
                        <button className="btn-change-banner" onClick={() => {
                          setSelections({...selections, favAnime: { id: null, title: '', image: '' }});
                          setAnimeSearch('');
                        }}>Cambiar Anime</button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="search-container">
                      <div className="search-wrapper">
                        <input 
                          type="text" 
                          placeholder="Escribe el nombre de tu anime..." 
                          value={animeSearch}
                          onChange={(e) => setAnimeSearch(e.target.value)}
                          className="nexo-input"
                        />
                        {isSearchingAnime && <div className="search-loader-bar" style={{ backgroundColor: selections.themeColor }}></div>}
                      </div>
                      <AnimatePresence>
                        {animeResults.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="results-gallery"
                          >
                            {animeResults.slice(0, 6).map(a => (
                              <div 
                                key={a.id} 
                                className="result-poster-card" 
                                onMouseEnter={() => setHoveredImage(a.coverImage)}
                                onMouseLeave={() => setHoveredImage(null)}
                                onClick={() => setPreviewItem({ type: 'anime', id: a.id, title: a.title, image: a.coverImage })}
                              >
                                <img src={a.coverImage} alt={a.title} />
                                <div className="poster-overlay">
                                  <span>{a.title}</span>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                
                <div className="fav-field">
                  <label>Tu Personaje Favorito</label>
                  {selections.favCharacter?.id ? (
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="selected-banner"
                    >
                      <div className="banner-bg">
                        <img src={selections.favCharacter.image} alt="Selected" />
                      </div>
                      <div className="banner-overlay">
                        <span className="banner-label" style={{ color: selections.themeColor }}>ESPÍRITU AFÍN</span>
                        <h3 className="banner-title">{selections.favCharacter.name}</h3>
                        <button className="btn-change-banner" onClick={() => {
                          setSelections({...selections, favCharacter: { id: null, name: '', image: '' }});
                          setCharSearch('');
                        }}>Cambiar Personaje</button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="search-container">
                      <div className="search-wrapper">
                        <input 
                          type="text" 
                          placeholder="Busca a tu héroe o villano..." 
                          value={charSearch}
                          onChange={(e) => setCharSearch(e.target.value)}
                          className="nexo-input"
                        />
                        {isSearchingChar && <div className="search-loader-bar" style={{ backgroundColor: selections.themeColor }}></div>}
                      </div>
                      <AnimatePresence>
                        {charResults.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="results-gallery"
                          >
                            {charResults.slice(0, 6).map((c: any) => (
                              <div 
                                key={c.id} 
                                className="result-poster-card" 
                                onMouseEnter={() => setHoveredImage(c.image.large)}
                                onMouseLeave={() => setHoveredImage(null)}
                                onClick={() => setPreviewItem({ type: 'character', id: c.id, name: c.name.full, image: c.image.large })}
                              >
                                <img src={c.image.large} alt={c.name.full} />
                                <div className="poster-overlay">
                                  <span>{c.name.full}</span>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            )}

            {stepData.type === 'identity' && (
              <div className="favorites-form">
                {(initialData?.firstName || initialData?.lastName || initialData?.country) && (
                  <div className="support-notice">
                    🛡️ Tu identidad oficial está verificada. Para cambios, contacta a Soporte.
                  </div>
                )}
                <div className="form-row">
                  <div className="fav-field">
                    <label>Nombre</label>
                    <input 
                      type="text" 
                      placeholder="Tu nombre..." 
                      value={selections.firstName}
                      disabled={!!initialData?.firstName}
                      onChange={(e) => setSelections({...selections, firstName: e.target.value})}
                      className={!!initialData?.firstName ? 'locked-input' : ''}
                    />
                  </div>
                  <div className="fav-field">
                    <label>Apellido</label>
                    <input 
                      type="text" 
                      placeholder="Tu apellido..." 
                      value={selections.lastName}
                      disabled={!!initialData?.lastName}
                      onChange={(e) => setSelections({...selections, lastName: e.target.value})}
                      className={!!initialData?.lastName ? 'locked-input' : ''}
                    />
                  </div>
                </div>
                <div className="fav-field">
                  <label>Biografía</label>
                  <textarea 
                    placeholder="Cuéntanos sobre ti..." 
                    value={selections.bio}
                    rows={3}
                    onChange={(e) => setSelections({...selections, bio: e.target.value})}
                    className="nexo-textarea"
                    style={{ 
                      borderColor: selections.themeColor + '44'
                    }}
                  />
                </div>
                <div className="fav-field">
                  <label>País / Dimensión</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Colombia, Konoha..." 
                    value={selections.country}
                    disabled={!!initialData?.country}
                    onChange={(e) => setSelections({...selections, country: e.target.value})}
                    className={!!initialData?.country ? 'locked-input' : ''}
                  />
                </div>
              </div>
            )}

            {stepData.type === 'custom' && (
              <div className="custom-setup">
                <div className="avatar-upload-section">
                  <div className="avatar-upload-circle" style={{ borderColor: selections.themeColor, boxShadow: `0 0 20px ${selections.themeColor}33` }}>
                    {selections.avatar ? (
                      <img src={selections.avatar} alt="Avatar Preview" className="avatar-preview" />
                    ) : (
                      <div className="avatar-placeholder">📸</div>
                    )}
                    <input 
                      type="file" 
                      className="file-input" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                             const img = new (window as any).Image();
                             img.onload = () => {
                               const canvas = document.createElement('canvas');
                               canvas.width = 512;
                               canvas.height = 512;
                               const ctx = canvas.getContext('2d');
                               ctx?.drawImage(img, 0, 0, 512, 512);
                               setSelections({ ...selections, avatar: canvas.toDataURL('image/jpeg', 0.8) });
                             };
                             img.src = event.target?.result;
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </div>
                  <p className="upload-tip">Haz clic para subir tu foto</p>
                </div>
                
                <div className="color-selector">
                   <p className="selector-label">Color de tu Alma Anime</p>
                   <div className="colors">
                      {[
                        '#00E5FF', '#FF00E5', '#E5FF00', '#FF4D4D', '#A14DFF', 
                        '#00FF88', '#FF8800', '#0066FF', '#FF66CC', '#FFFFFF',
                        '#FFD700', '#808080'
                      ].map(c => (
                        <div 
                          key={c} 
                          className={`color-dot ${selections.themeColor === c ? 'active' : ''}`}
                          style={{ 
                            backgroundColor: c,
                            boxShadow: selections.themeColor === c ? `0 0 15px ${c}aa` : 'none'
                          }}
                          onClick={() => setSelections({...selections, themeColor: c})}
                        />
                      ))}
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* QUICK VIEW MODAL */}
          <AnimatePresence>
            {previewItem && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="quick-view-overlay"
                onClick={() => setPreviewItem(null)}
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="quick-view-modal"
                  style={{ borderColor: selections.themeColor }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="modal-poster">
                    <img src={previewItem.image} alt={previewItem.title || previewItem.name} />
                  </div>
                  <div className="modal-content">
                    <div className="modal-header">
                      <span className="modal-label">{previewItem.type === 'anime' ? 'Detalles del Anime' : 'Ficha de Personaje'}</span>
                      <h3>{previewItem.title || previewItem.name}</h3>
                    </div>
                    <div className="modal-body">
                       <p className="modal-desc">
                         {previewItem.type === 'anime' 
                           ? `Este anime se convertirá en uno de tus pilares fundamentales en el Nexo. Se guardará como parte de tu identidad visual.`
                           : `Este personaje representa una parte esencial de tu espíritu. Su imagen aparecerá en tu perfil como vínculo afín.`}
                       </p>
                    </div>
                    <div className="modal-footer">
                      <button className="btn-cancel-modal" onClick={() => setPreviewItem(null)}>Cerrar</button>
                      <button 
                        className="btn-confirm-modal" 
                        style={{ backgroundColor: selections.themeColor }}
                        onClick={() => {
                          if (previewItem.type === 'anime') {
                            setSelections({...selections, favAnime: { id: previewItem.id, title: previewItem.title, image: previewItem.image }});
                          } else {
                            setSelections({...selections, favCharacter: { id: previewItem.id, name: previewItem.name, image: previewItem.image }});
                          }
                          setPreviewItem(null);
                          setAnimeResults([]);
                          setCharResults([]);
                          setHoveredImage(null);
                        }}
                      >
                        Seleccionar Leyenda
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <footer className="wizard-footer">
        {currentStep > 0 && (
          <button className="btn-back" onClick={() => setCurrentStep(currentStep - 1)}>
            Atrás
          </button>
        )}
        <button 
          className={`btn-wizard-next ${isSubmitting ? 'loading' : ''}`} 
          onClick={handleNext}
          disabled={isSubmitting}
          style={{ backgroundColor: selections.themeColor }}
        >
          {isSubmitting ? 'Sincronizando ADN...' : (currentStep === STEPS.length - 1 ? 'Finalizar Perfil ✨' : 'Siguiente →')}
        </button>
      </footer>

      <style jsx>{`
        .onboarding-wizard {
          background: rgba(10, 10, 10, 0.85);
          backdrop-filter: blur(25px);
          border-radius: 24px;
          padding: 30px;
          border: 1px solid rgba(255,255,255,0.1);
          width: 95%;
          max-width: 550px;
          min-height: 520px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          position: relative;
          overflow: hidden;
        }

        .wizard-bg-ambient {
          position: absolute;
          inset: -20px;
          background-size: cover;
          background-position: center;
          filter: blur(40px);
          z-index: -1;
          transition: background-image 0.5s ease;
        }

        .progress-bar { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; margin-bottom: 8px; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .step-indicator { font-size: 0.75rem; color: #555; font-weight: 700; text-transform: uppercase; }
        .step-header { margin-bottom: 25px; }
        .step-title { font-size: 1.8rem; font-weight: 900; color: white; margin: 0 0 5px 0; }
        .step-subtitle { color: #666; font-size: 0.95rem; }
        .step-body { flex: 1; margin-bottom: 30px; overflow-y: auto; padding-right: 5px; }
        .step-body::-webkit-scrollbar { width: 4px; }
        .step-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        
        .nexo-textarea {
          background: #111; 
          border: 1px solid #222; 
          padding: 15px; 
          border-radius: 12px; 
          color: white; 
          outline: none; 
          font-size: 1rem;
          transition: border-color 0.3s;
          resize: none;
        }
        .nexo-textarea:focus { border-color: ${selections.themeColor} !important; }
        
        .options-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
        .option-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 15px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .option-card.selected { background: rgba(255,255,255,0.1); }
        .option-icon { font-size: 1.4rem; }
        .option-label { font-weight: 700; color: #fff; font-size: 0.8rem; }

        .favorites-form { display: flex; flex-direction: column; gap: 20px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .fav-field { display: flex; flex-direction: column; gap: 8px; }
        .fav-field label { color: #666; font-size: 0.8rem; font-weight: 700; }
        .fav-field input { background: #111; border: 1px solid #222; padding: 15px; border-radius: 12px; color: white; outline: none; font-size: 1.1rem; }
        .fav-field input:focus { border-color: #00E5FF; }
        
        .search-wrapper { position: relative; margin-bottom: 15px; }
        .nexo-input { width: 100%; background: #111; border: 1px solid #222; padding: 15px; border-radius: 12px; color: white; outline: none; font-size: 1rem; transition: all 0.3s; }
        .nexo-input:focus { border-color: ${selections.themeColor}; box-shadow: 0 0 15px ${selections.themeColor}22; }
        
        .search-loader-bar { height: 2px; position: absolute; bottom: 0; left: 0; width: 100%; border-radius: 0 0 12px 12px; animation: search-pulse 1s infinite; z-index: 5; }
        @keyframes search-pulse { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
        
        .results-gallery { 
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          padding: 10px 0;
          overflow: hidden;
        }
        .result-poster-card { 
          position: relative; border-radius: 14px; overflow: hidden; height: 180px; cursor: pointer; 
          border: 1px solid rgba(255,255,255,0.05); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 10px 20px rgba(0,0,0,0.4);
        }
        .result-poster-card:hover { border-color: ${selections.themeColor}; transform: translateY(-8px) scale(1.05); z-index: 10; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
        .result-poster-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .result-poster-card:hover img { transform: scale(1.1); }
        
        .poster-overlay { 
          position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 70%); 
          display: flex; align-items: flex-end; padding: 12px; opacity: 0.9;
        }
        .poster-overlay span { font-size: 0.7rem; font-weight: 800; color: white; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }

        .quick-view-overlay { 
          position: absolute; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); 
          display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px;
        }
        .quick-view-modal { 
          background: #0a0a0a; border: 2px solid; border-radius: 24px; display: flex; 
          width: 100%; max-width: 480px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.8);
        }
        .modal-poster { width: 180px; height: 260px; }
        .modal-poster img { width: 100%; height: 100%; object-fit: cover; }
        .modal-content { flex: 1; padding: 25px; display: flex; flex-direction: column; }
        .modal-label { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; opacity: 0.5; color: white; }
        .modal-header h3 { font-size: 1.5rem; font-weight: 900; color: white; margin: 5px 0 15px 0; line-height: 1.1; }
        .modal-body { flex: 1; }
        .modal-desc { font-size: 0.85rem; color: #888; line-height: 1.5; }
        .modal-footer { display: flex; gap: 10px; margin-top: 20px; }
        .btn-cancel-modal { background: transparent; border: 1px solid #333; color: #666; padding: 8px 15px; border-radius: 10px; cursor: pointer; font-weight: 700; }
        .btn-confirm-modal { flex: 1; border: none; color: black; padding: 8px 15px; border-radius: 10px; cursor: pointer; font-weight: 900; }

        .custom-setup { display: flex; flex-direction: column; align-items: center; gap: 30px; }
        .avatar-upload-circle { width: 140px; height: 140px; border-radius: 50%; background: #000; border: 2px dashed #444; position: relative; cursor: pointer; overflow: hidden; }
        .avatar-preview { width: 100%; height: 100%; object-fit: cover; }
        .file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .colors { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; max-width: 300px; margin: 0 auto; }
        .color-dot { width: 35px; height: 35px; border-radius: 50%; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 2px solid transparent; }
        .color-dot.active { transform: scale(1.15); border-color: white; }
        .color-dot:hover { transform: scale(1.1); }

        .locked-input { background: rgba(255,255,255,0.02) !important; color: #555 !important; cursor: not-allowed; border-color: #222 !important; }
        .support-notice { 
          background: rgba(0, 229, 255, 0.05); 
          color: #00E5FF; 
          padding: 12px; 
          border-radius: 12px; 
          font-size: 0.8rem; 
          font-weight: 700; 
          text-align: center; 
          border: 1px dashed rgba(0, 229, 255, 0.3);
          margin-bottom: 10px;
        }

        .wizard-footer { display: flex; justify-content: space-between; gap: 15px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); }
        .btn-back { background: transparent; color: #888; border: 1px solid #333; padding: 12px 25px; border-radius: 12px; font-weight: 700; cursor: pointer; }
        .btn-wizard-next { flex: 1; color: black; border: none; padding: 14px; border-radius: 12px; font-weight: 900; cursor: pointer; transition: all 0.3s; }
        .btn-wizard-next.loading { opacity: 0.7; cursor: wait; }
      `}</style>
    </div>
  );
};
