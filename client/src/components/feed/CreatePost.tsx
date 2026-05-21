import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button/Button';
import { Card } from '../ui/Card/Card';

export function CreatePost({ onPostCreated, defaultAnimeId }: { onPostCreated: () => void, defaultAnimeId?: number }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [animeSearch, setAnimeSearch] = useState('');
  const [animeResults, setAnimeResults] = useState<any[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<any>(null);
  const [showAnimeSearch, setShowAnimeSearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (animeSearch.length > 2) {
      const delay = setTimeout(async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/anime/search-external?q=${animeSearch}`);
          const data = await res.json();
          setAnimeResults(data.data || []);
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

      const res = await fetch('http://localhost:3001/api/feed/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId: user.id, 
          content, 
          mediaUrl, 
          animeId: selectedAnime?.id || defaultAnimeId 
        })
      });

      if (!res.ok) throw new Error('Error al publicar');

      setContent('');
      setMediaUrl(null);
      setSelectedAnime(null);
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
            placeholder={`¿Qué anime estás viendo hoy, ${user?.username || 'otaku'}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
      </div>

      {selectedAnime && (
        <div className="selected-anime-tag">
          🏷️ Mencionado: <strong>{selectedAnime.titleRomaji}</strong>
          <button onClick={() => setSelectedAnime(null)}>×</button>
        </div>
      )}

      {mediaUrl && (
        <div className="composer-preview">
          <img src={mediaUrl} alt="Preview" />
          <button className="remove-media" onClick={() => setMediaUrl(null)}>×</button>
        </div>
      )}

      {showAnimeSearch && (
        <div className="anime-search-box">
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
                  <span>{a.titleRomaji}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="composer-divider" />

      <div className="composer-actions">
        <div className="action-item" onClick={() => setShowAnimeSearch(!showAnimeSearch)}>
          <span className="action-icon">🏷️</span>
          <span className="action-label">Mencionar Anime</span>
        </div>
        <div className="action-item" onClick={() => fileInputRef.current?.click()}>
          <span className="action-icon">🖼️</span>
          <span className="action-label">Foto/video</span>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} hidden accept="image/*" />
        </div>
        <div className="action-item">
          <span className="action-icon">😊</span>
          <span className="action-label">Sentimiento</span>
        </div>
      </div>

      {content.trim() || mediaUrl || selectedAnime ? (
        <div className="composer-footer">
          <Button 
            onClick={handleSubmit} 
            disabled={loading} 
            style={{ width: '100%', marginTop: '10px', fontWeight: '900' }}
          >
            {loading ? 'Publicando...' : 'Publicar en el Nexo'}
          </Button>
        </div>
      ) : null}

      <style jsx>{`
        .fb-composer-card { padding: 15px !important; background: rgba(20, 20, 20, 0.6) !important; backdrop-filter: blur(20px); border-radius: 12px; }
        .composer-top { display: flex; gap: 12px; align-items: center; }
        .composer-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
        .composer-input-wrapper { 
          flex: 1; background: rgba(255,255,255,0.05); border-radius: 20px; 
          padding: 10px 15px; cursor: text; transition: background 0.3s;
        }
        .composer-input-wrapper:hover { background: rgba(255,255,255,0.08); }
        .composer-input-wrapper textarea { 
          width: 100%; border: none; background: transparent; color: white; 
          resize: none; outline: none; font-size: 1rem; font-family: inherit;
          min-height: 24px;
        }
        .composer-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 15px 0 10px 0; }
        .composer-actions { display: flex; justify-content: space-around; }
        .action-item { 
          display: flex; align-items: center; gap: 8px; padding: 8px 12px; 
          border-radius: 8px; cursor: pointer; transition: background 0.3s;
        }
        .action-item:hover { background: rgba(255,255,255,0.05); }
        .action-icon { font-size: 1.2rem; }
        .action-label { color: #b0b3b8; font-size: 0.9rem; font-weight: 600; }
        
        .selected-anime-tag { 
          background: rgba(0, 229, 255, 0.1); border: 1px solid rgba(0, 229, 255, 0.2); 
          border-radius: 8px; padding: 8px 12px; margin-top: 15px; display: flex; 
          justify-content: space-between; align-items: center; color: #00E5FF;
        }
        .selected-anime-tag button { background: none; border: none; color: #00E5FF; font-size: 1.2rem; cursor: pointer; }

        .anime-search-box { margin-top: 15px; position: relative; }
        .anime-search-box input { 
          width: 100%; background: #1c1e21; border: 1px solid rgba(255,255,255,0.1); 
          padding: 10px; border-radius: 8px; color: white; 
        }
        .anime-results-list { 
          position: absolute; top: 100%; left: 0; right: 0; background: #242526; 
          border: 1px solid #3e4042; border-radius: 8px; z-index: 100; max-height: 200px; overflow-y: auto;
          box-shadow: 0 12px 24px rgba(0,0,0,0.5);
        }
        .anime-result-item { 
          padding: 10px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: background 0.2s;
        }
        .anime-result-item:hover { background: #3a3b3c; }
        .anime-result-item img { width: 30px; height: 40px; object-fit: cover; border-radius: 4px; }
        
        .composer-preview { position: relative; margin-top: 15px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
        .composer-preview img { width: 100%; max-height: 300px; object-fit: cover; }
        .remove-media { 
          position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); 
          border: none; color: white; width: 30px; height: 30px; border-radius: 50%; 
          cursor: pointer; font-size: 20px; 
        }
      `}</style>
    </Card>
  );
}
