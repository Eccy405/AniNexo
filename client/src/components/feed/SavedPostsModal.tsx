'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card/Card';
import { X, Bookmark } from 'lucide-react';
import { PostItem } from './PostItem';

interface SavedPostsModalProps {
  userId: string;
  onClose: () => void;
}

export const SavedPostsModal: React.FC<SavedPostsModalProps> = ({ userId, onClose }) => {
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedPosts();
  }, [userId]);

  const fetchSavedPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/feed/saved/${userId}`);
      const data = await res.json();
      if (data.success) {
        setSavedPosts(data.data.map((s: any) => s.post));
      }
    } catch (err) {
      console.error('Error fetching saved posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (postId: string) => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/feed/post/${postId}/save`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id })
      });
      
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Error unsaving post:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Card className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Bookmark size={20} style={{ color: 'var(--color-primary)' }} />
            Publicaciones Guardadas
          </h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="posts-container">
          {loading ? (
            <div className="loading">Cargando guardados...</div>
          ) : savedPosts.length === 0 ? (
            <div className="empty-state">
              <p>No tienes publicaciones guardadas</p>
              <span>Las publicaciones que guardes aparecerán aquí para consultarlas fácilmente
              </span>
            </div>
          ) : (
            savedPosts.map((post) => (
              <div key={post.id} className="saved-post-wrapper">
                <PostItem post={post} />
              </div>
            ))
          )}
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(15px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .modal-content {
            width: 100%;
            max-width: 600px;
            max-height: 85vh;
            background: var(--color-surface);
            border: 1px solid var(--color-secondary);
            border-radius: 20px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .modal-header {
            padding: 20px;
            border-bottom: 1px solid var(--color-secondary);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .modal-header h2 {
            margin: 0;
            color: var(--color-text-main);
            font-weight: 900;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .btn-close {
            background: none;
            border: none;
            color: var(--color-text-main);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: background 0.2s;
          }

          .btn-close:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          .posts-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
          }

          .saved-post-wrapper {
            margin-bottom: 16px;
          }

          .loading {
            padding: 40px;
            text-align: center;
            color: var(--color-text-muted);
          }

          .empty-state {
            padding: 60px 20px;
            text-align: center;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 16px;
          }

          .empty-state p {
            color: var(--color-text-main);
            font-weight: 700;
            margin-bottom: 8px;
          }

          .empty-state span {
            color: var(--color-text-muted);
            font-size: 0.9rem;
          }

          .posts-container::-webkit-scrollbar {
            width: 6px;
          }

          .posts-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }
        `}</style>
      </Card>
    </div>
  );
};