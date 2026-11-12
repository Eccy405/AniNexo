'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface EditProfileModalProps {
  profile: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

const getApiBase = () =>
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://aninexo.onrender.com/api'
    : 'http://localhost:3001/api');

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ profile, onClose, onSave }) => {
  const initialFavAnime = profile.favAnime || profile.intelligence?.socialProfile?.favAnime || null;
  const initialFavChar = profile.favCharacter || profile.intelligence?.socialProfile?.favCharacter || null;

  const [formData, setFormData] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    bio: profile.bio || '',
    country: profile.country || '',
    themeColor: profile.themeColor || '#00E5FF'
  });

  const [favAnime, setFavAnime] = useState<{ id?: number | null; title: string; image: string; coverImage?: string } | null>(
    initialFavAnime?.title || initialFavAnime?.image || initialFavAnime?.coverImage
      ? {
          id: initialFavAnime.id || null,
          title: initialFavAnime.title || '',
          image: initialFavAnime.coverImage || initialFavAnime.image || '',
          coverImage: initialFavAnime.coverImage || initialFavAnime.image || ''
        }
      : null
  );
  const [favCharacter, setFavCharacter] = useState<{ id?: number | null; name: string; image: string } | null>(
    initialFavChar?.name || initialFavChar?.image
      ? {
          id: initialFavChar.id || null,
          name: initialFavChar.name || '',
          image: initialFavChar.image || ''
        }
      : null
  );

  const [animeQuery, setAnimeQuery] = useState('');
  const [animeResults, setAnimeResults] = useState<any[]>([]);
  const [searchingAnime, setSearchingAnime] = useState(false);

  const [charQuery, setCharQuery] = useState('');
  const [charResults, setCharResults] = useState<any[]>([]);
  const [searchingChar, setSearchingChar] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (animeQuery.trim().length < 2) {
      setAnimeResults([]);
      return;
    }
    setSearchingAnime(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${getApiBase()}/search/global?q=${encodeURIComponent(animeQuery.trim())}`);
        const json = await res.json();
        setAnimeResults(json.data?.animes || []);
      } catch {
        setAnimeResults([]);
      } finally {
        setSearchingAnime(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [animeQuery]);

  useEffect(() => {
    if (charQuery.trim().length < 2) {
      setCharResults([]);
      return;
    }
    setSearchingChar(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${getApiBase()}/search/characters?q=${encodeURIComponent(charQuery.trim())}`);
        const json = await res.json();
        setCharResults(Array.isArray(json.data) ? json.data : []);
      } catch {
        setCharResults([]);
      } finally {
        setSearchingChar(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [charQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${getApiBase()}/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          favAnime: favAnime || null,
          favCharacter: favCharacter || null
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        onSave(result.data);
        onClose();
      } else {
        setErrorMsg(result.message || 'Error al actualizar el perfil');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="edit-modal-content"
        style={{ borderColor: formData.themeColor }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 style={{ color: formData.themeColor }}>Personalizar Identidad</h2>
          <button type="button" className="btn-close" onClick={onClose}>✕</button>
        </header>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-row">
            <div className="input-group">
              <label>Nombre</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Tu nombre..."
              />
            </div>
            <div className="input-group">
              <label>Apellido</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Tu apellido..."
              />
            </div>
          </div>

          <div className="input-group">
            <label>Biografía Nexo</label>
            <textarea
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Cuéntale al mundo sobre tu camino..."
              rows={3}
            />
          </div>

          <div className="input-group">
            <label>País / Ubicación</label>
            <input
              type="text"
              value={formData.country}
              onChange={e => setFormData({ ...formData, country: e.target.value })}
              placeholder="Ej: Colombia, Japón..."
            />
          </div>

          {/* Anime Favorito */}
          <div className="input-group">
            <label>📺 Anime Favorito</label>
            {favAnime ? (
              <div className="selected-fav-row">
                {favAnime.coverImage || favAnime.image ? (
                  <img src={favAnime.coverImage || favAnime.image} alt={favAnime.title} className="fav-thumb-rect" />
                ) : (
                  <div className="fav-thumb-rect placeholder">🎬</div>
                )}
                <div className="fav-meta">
                  <strong>{favAnime.title}</strong>
                  <span>Anime seleccionado</span>
                </div>
                <button type="button" className="btn-clear-fav" onClick={() => setFavAnime(null)}>
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="picker-box">
                <input
                  type="text"
                  value={animeQuery}
                  onChange={e => setAnimeQuery(e.target.value)}
                  placeholder="Buscar anime por nombre (ej: Frieren, Naruto)..."
                />
                {searchingAnime && <span className="picker-status">Buscando en el Nexo...</span>}
                {animeResults.length > 0 && (
                  <div className="picker-results">
                    {animeResults.slice(0, 5).map((a: any) => (
                      <button
                        key={a.id}
                        type="button"
                        className="picker-item"
                        onClick={() => {
                          setFavAnime({
                            id: a.id,
                            title: a.title,
                            image: a.coverImage || '',
                            coverImage: a.coverImage || ''
                          });
                          setAnimeQuery('');
                          setAnimeResults([]);
                        }}
                      >
                        {a.coverImage && <img src={a.coverImage} alt={a.title} />}
                        <span>{a.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Personaje Favorito */}
          <div className="input-group">
            <label>🎭 Personaje Favorito</label>
            {favCharacter ? (
              <div className="selected-fav-row">
                {favCharacter.image ? (
                  <img src={favCharacter.image} alt={favCharacter.name} className="fav-thumb-circle" />
                ) : (
                  <div className="fav-thumb-circle placeholder">🎭</div>
                )}
                <div className="fav-meta">
                  <strong>{favCharacter.name}</strong>
                  <span>Personaje seleccionado</span>
                </div>
                <button type="button" className="btn-clear-fav" onClick={() => setFavCharacter(null)}>
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="picker-box">
                <input
                  type="text"
                  value={charQuery}
                  onChange={e => setCharQuery(e.target.value)}
                  placeholder="Buscar personaje (ej: Luffy, Gojo, Levi)..."
                />
                {searchingChar && <span className="picker-status">Buscando personaje...</span>}
                {charResults.length > 0 && (
                  <div className="picker-results">
                    {charResults.slice(0, 5).map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        className="picker-item"
                        onClick={() => {
                          setFavCharacter({
                            id: c.id,
                            name: c.name?.full || c.name || 'Personaje',
                            image: c.image?.large || ''
                          });
                          setCharQuery('');
                          setCharResults([]);
                        }}
                      >
                        {c.image?.large && <img src={c.image.large} alt={c.name?.full} />}
                        <span>{c.name?.full || c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="color-section">
            <label>Color de tu Aura</label>
            <div className="color-options">
              {['#00E5FF', '#FF00E5', '#E5FF00', '#FF4D4D', '#A14DFF', '#FFFFFF'].map(c => (
                <div
                  key={c}
                  className={`color-pill ${formData.themeColor === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setFormData({ ...formData, themeColor: c })}
                />
              ))}
            </div>
          </div>

          {errorMsg && <div className="form-error-msg">{errorMsg}</div>}

          <button
            type="submit"
            className="btn-save-profile"
            style={{ backgroundColor: formData.themeColor }}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Actualizar Nexo ✨'}
          </button>
        </form>
      </motion.div>

      <style jsx>{`
        .edit-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
          overflow-y: auto;
        }
        .edit-modal-content {
          background: #0a0a0a;
          border: 1px solid;
          border-radius: 28px;
          width: 100%;
          max-width: 540px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 28px;
          box-shadow: 0 0 50px rgba(0,0,0,0.6);
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-header h2 { margin: 0; font-size: 1.4rem; font-weight: 900; }
        .btn-close { background: transparent; border: none; color: #777; font-size: 1.2rem; cursor: pointer; }
        
        .edit-form { display: flex; flex-direction: column; gap: 16px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .input-group { display: flex; flex-direction: column; gap: 6px; }
        .input-group label, .color-section label { font-size: 0.75rem; font-weight: 800; color: #888; text-transform: uppercase; }
        .input-group input, .input-group textarea {
          background: #111;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 11px 12px;
          color: white;
          outline: none;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }
        .input-group input:focus, .input-group textarea:focus { border-color: rgba(255,255,255,0.35); }

        .selected-fav-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 14px;
          background: #12151f;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .fav-thumb-rect { width: 42px; height: 58px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .fav-thumb-circle { width: 46px; height: 46px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .fav-thumb-rect.placeholder, .fav-thumb-circle.placeholder {
          display: flex; align-items: center; justify-content: center; background: #1d2230;
        }
        .fav-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .fav-meta strong { color: #fff; font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fav-meta span { color: #888; font-size: 0.75rem; }
        .btn-clear-fav {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: #ddd;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
        }

        .picker-box { position: relative; display: flex; flex-direction: column; gap: 6px; }
        .picker-status { font-size: 0.78rem; color: #00E5FF; }
        .picker-results {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: #111520;
          border: 1px solid #262c3d;
          border-radius: 12px;
          padding: 6px;
          max-height: 200px;
          overflow-y: auto;
        }
        .picker-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 8px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: #eee;
          cursor: pointer;
          text-align: left;
          font-size: 0.88rem;
          font-weight: 600;
        }
        .picker-item:hover { background: rgba(0, 229, 255, 0.12); }
        .picker-item img { width: 32px; height: 42px; object-fit: cover; border-radius: 6px; }

        .color-options { display: flex; gap: 10px; margin-top: 6px; }
        .color-pill { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: transform 0.2s; border: 2px solid transparent; }
        .color-pill.active { transform: scale(1.18); border-color: white; }

        .form-error-msg { color: #ff6b6b; font-size: 0.85rem; font-weight: 700; }

        .btn-save-profile {
          margin-top: 4px;
          padding: 14px;
          border-radius: 12px;
          border: none;
          color: black;
          font-weight: 900;
          font-size: 0.98rem;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .btn-save-profile:hover { transform: translateY(-2px); }
        .btn-save-profile:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
};
