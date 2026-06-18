'use client';

import { useState, useRef, useEffect } from 'react';
import { BookOpen, Image as ImageIcon, Smile, X, Lock } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { Card } from '../ui/Card/Card';

interface AnimeOption {
  id: number;
  title?: string;
  titleRomaji?: string;
  coverImage?: string;
}

export function CreatePost({ onPostCreated, defaultAnimeId, defaultAnime }: { onPostCreated: () => void, defaultAnimeId?: number, defaultAnime?: AnimeOption }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [animeSearch, setAnimeSearch] = useState('');
  const [animeResults, setAnimeResults] = useState<any[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<AnimeOption | null>(defaultAnime || null);
  const [showAnimeSearch, setShowAnimeSearch] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAnimeLocked = !!defaultAnime; // When coming from anime page, tag is fixed
  
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (animeSearch.length > 2) {
      const delay = setTimeout(async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/search/global?q=${encodeURIComponent(animeSearch)}`);
          const data = await res.json();
          if (data.success) {
            setAnimeResults(data.data.animes || []);
          }
        } catch (e) { console.error(e); }
      }, 500);
      return () => clearTimeout(delay);
    } else {
      setAnimeResults([]);
    }
  }, [animeSearch]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!user || !token) throw new Error('No estás autenticado');

const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/feed/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId: user.id, 
          content, 
          mediaUrl, 
          animeId: selectedAnime?.id || defaultAnimeId,
          isPrivate
        })
      });

      if (!res.ok) throw new Error('Error al publicar');

      setContent('');
      setMediaUrl(null);
      setSelectedAnime(defaultAnime || null); // restore lock if from anime page
      setShowAnimeSearch(false);
      onPostCreated();
    } catch (error) {
      console.error(error);
      alert('Error al crear el post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="fb-composer-card">
      <div className="composer-top">
        <img 
          src={user?.avatarUrl || 'https://ui-avatars.com/api/?name=User'} 
          className="composer-avatar" 
          alt="" 
        />
        <div className="composer-input-wrapper" onClick={() => (document.getElementById('post-textarea') as any)?.focus()}>
          <textarea
            id="post-textarea"
            placeholder={`¿Qué estás pensando, ${user?.username || 'otaku'}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
      </div>

      {selectedAnime && (
        <div className={`selected-anime-tag animate-fade-in ${isAnimeLocked ? 'locked' : ''}`}>
          <span className="tag-label">🏷️ Anime Mencionado:</span>
          <strong className="tag-name">{selectedAnime.title || selectedAnime.titleRomaji}</strong>
          {isAnimeLocked 
            ? <span className="tag-lock" title="Auto-etiquetado desde esta página"><Lock size={12} /></span>
            : <button className="tag-remove-btn" onClick={() => setSelectedAnime(null)}><X size={14} /></button>
          }
        </div>
      )}

      {mediaUrl && (
        <div className="composer-preview animate-fade-in">
          <img src={mediaUrl} alt="Preview" />
          <button className="remove-media" onClick={() => setMediaUrl(null)}><X size={18} /></button>
        </div>
      )}

      {showAnimeSearch && (
        <div className="anime-search-box animate-fade-in">
          <input 
            type="text" 
            placeholder="Buscar anime para mencionar..." 
            value={animeSearch}
            onChange={(e) => setAnimeSearch(e.target.value)}
            autoFocus
          />
          {animeResults.length > 0 && (
            <div className="anime-results-list">
              {animeResults.map(a => (
                <div key={a.id} className="anime-result-item" onClick={() => {
                  setSelectedAnime(a);
                  setShowAnimeSearch(false);
                  setAnimeSearch('');
                }}>
                  <img src={a.coverImage} alt="" />
                  <span>{a.title || a.titleRomaji}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="composer-divider" />

      <div className="composer-actions">
        {!isAnimeLocked && (
          <div className="action-item" onClick={() => setShowAnimeSearch(!showAnimeSearch)}>
            <BookOpen size={20} className="action-icon icon-blue" />
            <span className="action-label">Mencionar Anime</span>
          </div>
        )}
        {isAnimeLocked && (
          <div className="action-item disabled">
            <BookOpen size={20} className="action-icon icon-blue" />
            <span className="action-label" style={{ color: '#00E5FF', opacity: 0.7 }}>Anime auto-etiquetado</span>
          </div>
        )}
        <div className="action-item" onClick={() => fileInputRef.current?.click()}>
          <ImageIcon size={20} className="action-icon icon-green" />
          <span className="action-label">Foto/video</span>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} hidden accept="image/*" />
        </div>
        <div className="action-item">
          <Smile size={20} className="action-icon icon-yellow" />
          <span className="action-label">Sentimiento</span>
        </div>
        <div className="action-item privacy-toggle" onClick={() => setIsPrivate(!isPrivate)}>
          <Lock size={20} className="action-icon" style={{ color: isPrivate ? '#ff6b6b' : '#888' }} />
          <span className="action-label" style={{ color: isPrivate ? '#ff6b6b' : '#888' }}>
            {isPrivate ? 'Privada' : 'Pública'}
          </span>
        </div>
      </div>

      {(content.trim() || mediaUrl || selectedAnime) && (
        <div className="composer-footer animate-fade-in">
          <button 
            className="btn-publish-post" 
            onClick={handleSubmit} 
            disabled={loading}
          >
            {loading ? 'Publicando...' : 'Publicar en la Comunidad'}
          </button>
        </div>
      )}

      <style jsx>{`
        .fb-composer-card { 
          padding: 14px 16px !important; 
          background: rgba(15, 15, 15, 0.75) !important; 
          backdrop-filter: blur(25px); 
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px; 
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }

        .composer-top { 
          display: flex; 
          gap: 12px; 
          align-items: center; 
        }

        .composer-avatar { 
          width: 40px; 
          height: 40px; 
          border-radius: 50%; 
          object-fit: cover; 
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .composer-input-wrapper { 
          flex: 1; 
          background: rgba(255, 255, 255, 0.05); 
          border-radius: 20px; 
          padding: 10px 16px; 
          cursor: text; 
          transition: background-color 0.2s;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .composer-input-wrapper:hover { 
          background: rgba(255, 255, 255, 0.08); 
        }

        .composer-input-wrapper textarea { 
          width: 100%; 
          border: none; 
          background: transparent; 
          color: white; 
          resize: none; 
          outline: none; 
          font-size: 0.95rem; 
          font-family: inherit;
          min-height: 24px;
          line-height: 1.4;
        }

        .composer-divider { 
          height: 1px; 
          background: rgba(255, 255, 255, 0.08); 
          margin: 12px 0 8px 0; 
        }

        .composer-actions { 
          display: flex; 
          justify-content: space-around; 
        }

        .action-item { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          padding: 8px 12px; 
          border-radius: 8px; 
          cursor: pointer; 
          transition: background-color 0.2s;
          flex: 1;
          justify-content: center;
        }

        .action-item:hover { 
          background-color: rgba(255, 255, 255, 0.05); 
        }

        .action-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-blue {
          color: #00E5FF;
          filter: drop-shadow(0 0 4px rgba(0, 229, 255, 0.2));
        }

        .icon-green {
          color: #45bd62;
          filter: drop-shadow(0 0 4px rgba(69, 189, 98, 0.2));
        }

        .icon-yellow {
          color: #f7b928;
          filter: drop-shadow(0 0 4px rgba(247, 185, 40, 0.2));
        }

        .action-label { 
          color: #b0b3b8; 
          font-size: 0.85rem; 
          font-weight: 600; 
        }
        
        .selected-anime-tag { 
          background: rgba(0, 229, 255, 0.06); 
          border: 1px solid rgba(0, 229, 255, 0.15); 
          border-radius: 8px; 
          padding: 6px 12px; 
          margin-top: 12px; 
          display: flex; 
          align-items: center; 
          gap: 6px;
          color: #00E5FF;
        }

        .selected-anime-tag.locked {
          background: rgba(0, 229, 255, 0.04);
          border-style: dashed;
          border-color: rgba(0, 229, 255, 0.2);
        }

        .tag-label {
          font-size: 0.8rem;
          opacity: 0.8;
        }

        .tag-name {
          font-size: 0.85rem;
          flex: 1;
        }

        .tag-remove-btn { 
          background: transparent; 
          border: none; 
          color: #00E5FF; 
          cursor: pointer; 
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }

        .tag-remove-btn:hover {
          background-color: rgba(0, 229, 255, 0.1);
        }

        .tag-lock {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          color: rgba(0, 229, 255, 0.5);
        }

        .action-item.disabled {
          cursor: default;
          opacity: 0.8;
          pointer-events: none;
        }

        .anime-search-box { 
          margin-top: 12px; 
          position: relative; 
        }

        .anime-search-box input { 
          width: 100%; 
          background: rgba(255, 255, 255, 0.05); 
          border: 1px solid rgba(255, 255, 255, 0.08); 
          padding: 10px 14px; 
          border-radius: 10px; 
          color: white; 
          outline: none;
          font-size: 0.9rem;
          transition: border-color 0.2s;
        }

        .anime-search-box input:focus {
          border-color: #00E5FF;
        }

        .anime-results-list { 
          position: absolute; 
          top: 100%; 
          left: 0; 
          right: 0; 
          background: #18191a; 
          border: 1px solid rgba(255, 255, 255, 0.1); 
          border-radius: 10px; 
          z-index: 100; 
          max-height: 220px; 
          overflow-y: auto;
          box-shadow: 0 12px 24px rgba(0,0,0,0.6);
          margin-top: 6px;
        }

        .anime-result-item { 
          padding: 8px 12px; 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          cursor: pointer; 
          transition: background-color 0.2s;
        }

        .anime-result-item:hover { 
          background-color: rgba(255, 255, 255, 0.05); 
        }

        .anime-result-item img { 
          width: 32px; 
          height: 44px; 
          object-fit: cover; 
          border-radius: 6px; 
        }

        .anime-result-item span {
          color: #e4e6eb;
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        .composer-preview { 
          position: relative; 
          margin-top: 12px; 
          border-radius: 10px; 
          overflow: hidden; 
          border: 1px solid rgba(255, 255, 255, 0.08); 
        }

        .composer-preview img { 
          width: 100%; 
          max-height: 280px; 
          object-fit: cover; 
        }

        .remove-media { 
          position: absolute; 
          top: 8px; 
          right: 8px; 
          background: rgba(0, 0, 0, 0.7); 
          border: none; 
          color: white; 
          width: 28px; 
          height: 28px; 
          border-radius: 50%; 
          cursor: pointer; 
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .remove-media:hover {
          background-color: rgba(0,0,0,0.9);
        }

        .composer-footer {
          margin-top: 12px;
        }

        .btn-publish-post {
          width: 100%;
          background-color: #00E5FF;
          color: black;
          border: none;
          padding: 10px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: filter 0.2s, transform 0.1s;
        }

        .btn-publish-post:hover {
          filter: brightness(1.1);
        }

        .btn-publish-post:active {
          transform: scale(0.99);
        }

        .animate-fade-in {
          animation: fadeIn 0.25s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 480px) {
          .action-label {
            display: none;
          }
        }
      `}</style>
    </Card>
  );
}
