'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Upload, Image as ImageIcon, Send } from 'lucide-react';

interface StoryItem {
  id: string;
  mediaUrl: string;
  caption?: string;
  createdAt?: string;
  isMock?: boolean;
}

interface StoryGroup {
  userId: string;
  username: string;
  avatarUrl: string;
  stories: StoryItem[];
  isMock?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const MOCK_GROUPS: StoryGroup[] = [
  {
    userId: 'mock-2',
    username: 'Alejandra Colmenares',
    avatarUrl: 'https://ui-avatars.com/api/?name=Alejandra&background=c2185b&color=fff',
    isMock: true,
    stories: [
      {
        id: 'mock-s-2',
        mediaUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80',
        caption: 'Explorando nuevos animes de temporada ✨',
        isMock: true
      }
    ]
  },
  {
    userId: 'mock-3',
    username: 'Jerson Camilo',
    avatarUrl: 'https://ui-avatars.com/api/?name=Jerson+Camilo&background=00838f&color=fff',
    isMock: true,
    stories: [
      {
        id: 'mock-s-3',
        mediaUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80',
        caption: 'Maratón nocturna en AniNexo 🔥',
        isMock: true
      }
    ]
  },
  {
    userId: 'mock-4',
    username: 'Zoro Roronoa',
    avatarUrl: 'https://ui-avatars.com/api/?name=Zoro+Roronoa&background=2e7d32&color=fff',
    isMock: true,
    stories: [
      {
        id: 'mock-s-4',
        mediaUrl: 'https://images.unsplash.com/photo-1541562232579-512a21360020?w=800&q=80',
        caption: 'Entrenamiento del día ⚔️',
        isMock: true
      }
    ]
  },
  {
    userId: 'mock-5',
    username: 'Camila Uzuga',
    avatarUrl: 'https://ui-avatars.com/api/?name=Camila&background=e65100&color=fff',
    isMock: true,
    stories: [
      {
        id: 'mock-s-5',
        mediaUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
        caption: 'Vibras de Tokio 🏮',
        isMock: true
      }
    ]
  }
];

export function VerticalStoryRow() {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [user, setUser] = useState<any>(null);

  // Viewer modal state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);

  // Create story modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {
        // ignore invalid json
      }
    }
  }, []);

  const fetchStories = useCallback(async (userId?: string) => {
    const uid = userId || user?.id;
    if (!uid) return;
    try {
      const res = await fetch(`${API_BASE}/social/stories?userId=${uid}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const mapped: StoryGroup[] = data.data.map((g: any) => ({
          userId: g.user.id,
          username: g.user.username,
          avatarUrl: g.user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(g.user.username)}&background=00E5FF&color=000`,
          stories: (g.stories || []).map((s: any) => ({
            id: s.id,
            mediaUrl: s.mediaUrl,
            caption: s.caption,
            createdAt: s.createdAt,
            isMock: false
          })),
          isMock: false
        }));
        setStoryGroups(mapped);
      } else {
        setStoryGroups([]);
      }
    } catch (e) {
      console.error('Error fetching stories:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchStories(user.id);
    }
  }, [user?.id, fetchStories]);

  const displayGroups: StoryGroup[] = storyGroups.length > 0 ? storyGroups : MOCK_GROUPS;

  const markViewed = useCallback(async (story: StoryItem) => {
    if (story.isMock || !user?.id) return;
    try {
      await fetch(`${API_BASE}/social/stories/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, storyId: story.id })
      });
    } catch {
      // non-critical
    }
  }, [user?.id]);

  const openStoryGroup = (groupIdx: number) => {
    setActiveGroupIdx(groupIdx);
    setActiveStoryIdx(0);
    setViewerOpen(true);
    const first = displayGroups[groupIdx]?.stories[0];
    if (first) markViewed(first);
  };

  const goNextStory = useCallback(() => {
    const currentGroup = displayGroups[activeGroupIdx];
    if (!currentGroup) {
      setViewerOpen(false);
      return;
    }
    if (activeStoryIdx < currentGroup.stories.length - 1) {
      const nextIdx = activeStoryIdx + 1;
      setActiveStoryIdx(nextIdx);
      markViewed(currentGroup.stories[nextIdx]);
    } else if (activeGroupIdx < displayGroups.length - 1) {
      const nextGroupIdx = activeGroupIdx + 1;
      setActiveGroupIdx(nextGroupIdx);
      setActiveStoryIdx(0);
      const first = displayGroups[nextGroupIdx]?.stories[0];
      if (first) markViewed(first);
    } else {
      setViewerOpen(false);
    }
  }, [activeGroupIdx, activeStoryIdx, displayGroups, markViewed]);

  const goPrevStory = useCallback(() => {
    if (activeStoryIdx > 0) {
      setActiveStoryIdx(activeStoryIdx - 1);
    } else if (activeGroupIdx > 0) {
      const prevGroupIdx = activeGroupIdx - 1;
      const prevStories = displayGroups[prevGroupIdx]?.stories || [];
      setActiveGroupIdx(prevGroupIdx);
      setActiveStoryIdx(Math.max(0, prevStories.length - 1));
    }
  }, [activeGroupIdx, activeStoryIdx, displayGroups]);

  // Auto-advance and keyboard navigation inside viewer
  useEffect(() => {
    if (!viewerOpen) return;
    const timer = setTimeout(goNextStory, 6000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewerOpen(false);
      if (e.key === 'ArrowRight') goNextStory();
      if (e.key === 'ArrowLeft') goPrevStory();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [viewerOpen, activeGroupIdx, activeStoryIdx, goNextStory, goPrevStory]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 1080;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        setNewMediaUrl(canvas.toDataURL('image/jpeg', 0.85));
        setCreateError('');
      };
      img.src = String(ev.target?.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setCreateError('Debes iniciar sesión para publicar una historia.');
      return;
    }
    if (!newMediaUrl.trim()) {
      setCreateError('Sube una imagen o ingresa una URL válida.');
      return;
    }

    setSubmitting(true);
    setCreateError('');
    try {
      const res = await fetch(`${API_BASE}/social/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          mediaUrl: newMediaUrl.trim(),
          caption: newCaption.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setCreateOpen(false);
        setNewMediaUrl('');
        setNewCaption('');
        await fetchStories(user.id);
      } else {
        setCreateError(data.message || 'No se pudo publicar la historia.');
      }
    } catch {
      setCreateError('Error de conexión con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeGroup = displayGroups[activeGroupIdx];
  const activeStory = activeGroup?.stories[activeStoryIdx];

  return (
    <div className="fb-stories-container">
      <div className="stories-scroll">
        {/* Create Story Card */}
        <div
          className="story-card create"
          onClick={() => setCreateOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setCreateOpen(true)}
          aria-label="Crear historia"
        >
          <div className="story-media">
            <img src={user?.avatarUrl || 'https://ui-avatars.com/api/?name=User&background=00E5FF&color=000'} alt="" />
          </div>
          <div className="create-footer">
            <div className="plus-btn">+</div>
            <span>Crear historia</span>
          </div>
        </div>

        {/* Existing / Mock Stories */}
        {displayGroups.map((group, idx) => (
          <div
            key={group.userId}
            className="story-card"
            onClick={() => openStoryGroup(idx)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openStoryGroup(idx)}
            aria-label={`Ver historia de ${group.username}`}
          >
            <img src={group.stories[0]?.mediaUrl || ''} className="story-bg" alt={group.username} />
            <div className="user-avatar-overlay">
              <img src={group.avatarUrl || 'https://ui-avatars.com/api/?name=User'} alt={group.username} />
            </div>
            <div className="story-username">
              {group.username}
            </div>
          </div>
        ))}
      </div>

      {/* STORY VIEWER MODAL */}
      {viewerOpen && activeGroup && activeStory && (
        <div className="story-modal-backdrop" onClick={() => setViewerOpen(false)}>
          <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
            {/* Progress bars */}
            <div className="story-progress-row">
              {activeGroup.stories.map((s, idx) => (
                <div key={s.id} className="story-progress-track">
                  <div
                    className={`story-progress-fill ${idx < activeStoryIdx ? 'done' : idx === activeStoryIdx ? 'active' : ''}`}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="story-viewer-header">
              <div className="story-viewer-user">
                <img src={activeGroup.avatarUrl} alt={activeGroup.username} />
                <div>
                  <strong>{activeGroup.username}</strong>
                  <span>
                    {activeStory.createdAt
                      ? new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Destacada'}
                  </span>
                </div>
              </div>
              <button className="story-close-btn" onClick={() => setViewerOpen(false)} aria-label="Cerrar historia">
                <X size={20} />
              </button>
            </div>

            {/* Media */}
            <div className="story-viewer-media">
              <img src={activeStory.mediaUrl} alt={activeStory.caption || activeGroup.username} />
              <div className="story-tap-left" onClick={goPrevStory} />
              <div className="story-tap-right" onClick={goNextStory} />

              <button className="story-nav-btn prev" onClick={goPrevStory} aria-label="Anterior">
                <ChevronLeft size={22} />
              </button>
              <button className="story-nav-btn next" onClick={goNextStory} aria-label="Siguiente">
                <ChevronRight size={22} />
              </button>
            </div>

            {activeStory.caption && (
              <div className="story-caption-bar">
                <p>{activeStory.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE STORY MODAL */}
      {createOpen && (
        <div className="story-modal-backdrop" onClick={() => setCreateOpen(false)}>
          <div className="story-create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-modal-header">
              <h3>Nueva Historia (24h)</h3>
              <button className="story-close-btn" onClick={() => setCreateOpen(false)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="create-modal-form">
              <label className="upload-dropzone">
                <input type="file" accept="image/*" onChange={handleFileUpload} hidden />
                {newMediaUrl ? (
                  <img src={newMediaUrl} alt="Vista previa" className="create-preview-img" />
                ) : (
                  <div className="upload-placeholder">
                    <Upload size={28} />
                    <span>Haz clic para subir una imagen</span>
                    <small>Se mostrará durante 24 horas en el feed</small>
                  </div>
                )}
              </label>

              <div className="create-field">
                <label><ImageIcon size={14} /> O pega una URL de imagen</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newMediaUrl.startsWith('data:') ? '' : newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                />
              </div>

              <div className="create-field">
                <label>Descripción / Texto (opcional)</label>
                <input
                  type="text"
                  maxLength={160}
                  placeholder="¿Qué anime estás viendo hoy?"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                />
              </div>

              {createError && <p className="create-error">{createError}</p>}

              <div className="create-actions">
                <button type="button" className="btn-cancel-story" onClick={() => setCreateOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-publish-story" disabled={submitting}>
                  <Send size={15} />
                  {submitting ? 'Publicando...' : 'Publicar Historia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .fb-stories-container {
          margin-bottom: 24px;
          overflow: hidden;
          width: 100%;
        }

        .stories-scroll {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 5px 0 12px;
          scrollbar-width: none;
        }

        .stories-scroll::-webkit-scrollbar {
          display: none;
        }

        .story-card {
          min-width: 115px;
          width: 115px;
          height: 195px;
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          flex-shrink: 0;
        }

        .story-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0, 229, 255, 0.4);
          box-shadow: 0 8px 25px rgba(0, 229, 255, 0.15), 0 0 10px rgba(124, 77, 255, 0.1);
        }

        .story-card:hover .story-bg {
          transform: scale(1.08);
          filter: brightness(0.9);
        }

        .story-bg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: all 0.4s ease;
          filter: brightness(0.7);
        }

        .user-avatar-overlay {
          position: absolute;
          top: 10px;
          left: 10px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid var(--color-primary);
          padding: 1.5px;
          background: #050505;
          z-index: 2;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
          transition: transform 0.3s ease;
        }

        .story-card:hover .user-avatar-overlay {
          transform: scale(1.1);
        }

        .user-avatar-overlay img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .story-username {
          position: absolute;
          bottom: 10px;
          left: 10px;
          right: 10px;
          color: white;
          font-size: 0.75rem;
          font-weight: 800;
          z-index: 2;
          text-shadow: 0 2px 6px rgba(0,0,0,0.9);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.25;
        }

        .story-card.create {
          display: flex;
          flex-direction: column;
        }

        .story-card.create .story-media {
          height: 70%;
          overflow: hidden;
        }

        .story-card.create .story-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.55;
          transition: transform 0.4s;
        }

        .story-card.create:hover .story-media img {
          transform: scale(1.08);
        }

        .create-footer {
          height: 30%;
          background: rgba(15, 15, 15, 0.95);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .plus-btn {
          position: absolute;
          top: -16px;
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          border: 3px solid #0a0a0a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: black;
          font-size: 1.2rem;
          font-weight: 900;
          box-shadow: 0 0 12px rgba(0, 229, 255, 0.5);
          transition: transform 0.2s;
        }

        .story-card.create:hover .plus-btn {
          transform: scale(1.1) rotate(90deg);
        }

        .create-footer span {
          font-size: 0.72rem;
          font-weight: 800;
          color: #e4e6eb;
          margin-top: 12px;
        }

        /* ===== STORY MODALS ===== */
        .story-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(12px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .story-viewer {
          position: relative;
          width: 100%;
          max-width: 420px;
          height: min(720px, 90dvh);
          background: #0a0a0a;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
        }

        .story-progress-row {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          gap: 6px;
          z-index: 5;
        }

        .story-progress-track {
          flex: 1;
          height: 3px;
          background: rgba(255, 255, 255, 0.25);
          border-radius: 999px;
          overflow: hidden;
        }

        .story-progress-fill {
          height: 100%;
          width: 0%;
          background: #00E5FF;
        }

        .story-progress-fill.done {
          width: 100%;
        }

        .story-progress-fill.active {
          animation: storyFill 6s linear forwards;
        }

        @keyframes storyFill {
          from { width: 0%; }
          to { width: 100%; }
        }

        .story-viewer-header {
          position: absolute;
          top: 24px;
          left: 14px;
          right: 14px;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .story-viewer-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .story-viewer-user img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #00E5FF;
        }

        .story-viewer-user div {
          display: flex;
          flex-direction: column;
        }

        .story-viewer-user strong {
          color: #fff;
          font-size: 0.9rem;
          text-shadow: 0 2px 6px rgba(0,0,0,0.8);
        }

        .story-viewer-user span {
          color: #ccc;
          font-size: 0.72rem;
          text-shadow: 0 2px 6px rgba(0,0,0,0.8);
        }

        .story-close-btn {
          background: rgba(0, 0, 0, 0.55);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.18);
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .story-close-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .story-viewer-media {
          position: relative;
          flex: 1;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
        }

        .story-viewer-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .story-tap-left, .story-tap-right {
          position: absolute;
          top: 60px;
          bottom: 60px;
          width: 40%;
          z-index: 3;
          cursor: pointer;
        }
        .story-tap-left { left: 0; }
        .story-tap-right { right: 0; }

        .story-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 6;
          background: rgba(0, 0, 0, 0.5);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .story-nav-btn.prev { left: 10px; }
        .story-nav-btn.next { right: 10px; }
        .story-nav-btn:hover { background: rgba(0, 229, 255, 0.3); border-color: #00E5FF; }

        .story-caption-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 28px 18px 18px;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
          z-index: 4;
        }

        .story-caption-bar p {
          margin: 0;
          color: #fff;
          font-size: 0.92rem;
          text-align: center;
          line-height: 1.4;
        }

        /* ===== CREATE STORY MODAL ===== */
        .story-create-modal {
          width: 100%;
          max-width: 440px;
          background: #0f0f12;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          padding: 22px;
          color: #fff;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
        }

        .create-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .create-modal-header h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 800;
          color: #00E5FF;
        }

        .create-modal-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .upload-dropzone {
          border: 2px dashed rgba(0, 229, 255, 0.35);
          border-radius: 14px;
          min-height: 190px;
          max-height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.02);
          transition: border-color 0.2s;
        }

        .upload-dropzone:hover {
          border-color: #00E5FF;
        }

        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #aaa;
          padding: 20px;
          text-align: center;
        }

        .upload-placeholder small {
          color: #666;
          font-size: 0.78rem;
        }

        .create-preview-img {
          width: 100%;
          max-height: 260px;
          object-fit: cover;
        }

        .create-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .create-field label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #999;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .create-field input {
          background: #17171c;
          border: 1px solid #2b2b33;
          border-radius: 10px;
          padding: 10px 12px;
          color: #fff;
          font-size: 0.9rem;
          outline: none;
        }

        .create-field input:focus {
          border-color: #00E5FF;
        }

        .create-error {
          margin: 0;
          color: #ff5c5c;
          font-size: 0.82rem;
          font-weight: 600;
        }

        .create-actions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        .btn-cancel-story {
          background: transparent;
          border: 1px solid #333;
          color: #bbb;
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-publish-story {
          flex: 1;
          background: #00E5FF;
          color: #000;
          border: none;
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 900;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-publish-story:disabled {
          opacity: 0.6;
          cursor: wait;
        }
      `}</style>
    </div>
  );
}
