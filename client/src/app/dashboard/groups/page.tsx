'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../../components/ui/Card/Card';
import { Users, Plus, Compass, BookOpen } from 'lucide-react';
import { AnimeSocialFeed } from '../../../components/anime/AnimeSocialFeed';

interface Group {
  id: string;
  name: string;
  description?: string;
  animeId: number;
  coverImage?: string;
  createdBy: string;
  _count: {
    members: number;
  };
}

export default function GroupsPage() {
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [animeSearch, setAnimeSearch] = useState('');
  const [animeResults, setAnimeResults] = useState<any[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch (e) {
        console.error('Error parsing user', e);
      }
    }
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/groups`);
      const data = await res.json();
      if (data.success) {
        setGroups(data.data);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchAnime = async (query: string) => {
    if (!query || query.length < 2) {
      setAnimeResults([]);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/search/global?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setAnimeResults(data.data.animes || []);
      }
    } catch (err) {
      console.error('Error searching anime:', err);
    }
  };

  const handleCreateGroup = async () => {
    if (!user?.id || !groupName.trim() || !selectedAnime) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/groups/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          animeId: selectedAnime.id,
          name: groupName.trim(),
          description: groupDescription.trim() || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setGroups(prev => [...prev, data.data]);
        setShowCreateModal(false);
        setGroupName('');
        setGroupDescription('');
        setSelectedAnime(null);
        setAnimeSearch('');
      }
    } catch (err) {
      console.error('Error creating group:', err);
    }
  };

  const animeSearchTimeout = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (animeSearchTimeout.current) clearTimeout(animeSearchTimeout.current);
    animeSearchTimeout.current = setTimeout(() => searchAnime(animeSearch), 300);
    return () => { if (animeSearchTimeout.current) clearTimeout(animeSearchTimeout.current); };
  }, [animeSearch]);

  return (
    <div className="groups-page">
      <div className="groups-header">
        <h1>Grupos Temáticos</h1>
        <button className="btn-create-group" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} />
          <span>Crear Grupo
          </span>
        </button>
      </div>

      <div className="groups-grid">
        {loading ? (
          <div className="loading">Cargando grupos...</div>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <p>No hay grupos temáticos creados aún</p>
            <span>¡Sé el primero en crear un grupo!
            </span>
          </div>
        ) : (
          groups.map((group) => (
            <Card key={group.id} className="group-card">
              <div className="group-cover">
                {group.coverImage ? (
                  <img src={group.coverImage} alt={group.name} />
                ) : (
                  <div className="group-placeholder" />
                )}
              </div>
              <div className="group-info">
                <h3>{group.name}</h3>
                <p className="group-desc">{group.description || 'Sin descripción'}</p>
                <div className="group-meta">
                  <Users size={16} />
                  <span>{group._count.members} miembros</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <Card className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Crear Grupo Temático</h3>
            
            <input
              type="text"
              placeholder="Nombre del grupo"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="modal-input"
            />
            
            <textarea
              placeholder="Descripción (opcional)"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="modal-textarea"
            />

            <div className="anime-selector">
              <label>Selecciona un anime para el grupo:</label>
              <input
                type="text"
                placeholder="Buscar anime..."
                value={animeSearch}
                onChange={(e) => setAnimeSearch(e.target.value)}
                className="modal-input"
              />
              
              {selectedAnime && (
                <div className="selected-anime">
                  <BookOpen size={16} />
                  <span>{selectedAnime.title}</span>
                  <button onClick={() => setSelectedAnime(null)}>×</button>
                </div>
              )}

              {animeSearch.length > 0 && !selectedAnime && (
                <div className="anime-search-results">
                  {animeResults.map((anime) => (
                    <button
                      key={anime.id}
                      className="anime-result-item"
                      onClick={() => {
                        setSelectedAnime(anime);
                        setAnimeSearch('');
                      }}
                    >
                      <img src={anime.coverImage} alt={anime.title} />
                      <span>{anime.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="btn-cancel">Cancelar</button>
              <button 
                onClick={handleCreateGroup} 
                disabled={!groupName.trim() || !selectedAnime}
                className="btn-create"
              >
                Crear Grupo
              </button>
            </div>
          </Card>
        </div>
      )}

      <style jsx>{`
        .groups-page {
          padding: 40px;
          min-height: 100vh;
          background: #090909;
        }

        .groups-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .groups-header h1 {
          color: white;
          font-size: 2rem;
          font-weight: 900;
          margin: 0;
        }

        .btn-create-group {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--color-primary);
          color: black;
          border: none;
          border-radius: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-create-group:hover {
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
        }

        .groups-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .group-card {
          overflow: hidden;
          padding: 0 !important;
          transition: transform 0.2s;
        }

        .group-card:hover {
          transform: translateY(-5px);
        }

        .group-cover {
          height: 140px;
          overflow: hidden;
        }

        .group-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .group-placeholder {
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.05);
        }

        .group-info {
          padding: 16px;
        }

        .group-info h3 {
          margin: 0 0 8px 0;
          color: white;
          font-weight: 700;
        }

        .group-desc {
          color: #888;
          font-size: 0.85rem;
          margin-bottom: 12px;
        }

        .group-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--color-primary);
          font-size: 0.85rem;
        }

        .loading, .empty-state {
          padding: 40px;
          text-align: center;
          color: var(--color-text-muted);
          grid-column: 1 / -1;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-content {
          background: var(--color-surface);
          border: 1px solid var(--color-secondary);
          border-radius: 16px;
          padding: 24px;
          max-width: 500px;
          width: 100%;
        }

        .modal-content h3 {
          margin: 0 0 20px 0;
          color: var(--color-primary);
          font-weight: 900;
        }

        .modal-input, .modal-textarea {
          width: 100%;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: white;
          margin-bottom: 16px;
          outline: none;
        }

        .modal-textarea {
          min-height: 80px;
          resize: vertical;
        }

        .modal-textarea:focus, .modal-input:focus {
          border-color: var(--color-primary);
        }

        .anime-selector label {
          color: #888;
          font-size: 0.9rem;
          display: block;
          margin-bottom: 8px;
        }

        .selected-anime {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(0, 229, 255, 0.1);
          border-radius: 8px;
          margin-top: 8px;
          color: var(--color-primary);
        }

        .selected-anime button {
          margin-left: auto;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
        }

        .anime-search-results {
          max-height: 200px;
          overflow-y: auto;
          margin-top: 8px;
        }

        .anime-result-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          border-radius: 6px;
        }

        .anime-result-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .anime-result-item img {
          width: 30px;
          height: 45px;
          object-fit: cover;
          border-radius: 4px;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .btn-cancel, .btn-create {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          font-weight: 800;
          cursor: pointer;
        }

        .btn-cancel {
          background: transparent;
          color: #888;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-create {
          background: var(--color-primary);
          color: black;
        }

        .btn-create:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}