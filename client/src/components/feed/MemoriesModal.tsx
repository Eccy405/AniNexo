'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card/Card';
import { X, History, Heart, MessageSquare, Share2 } from 'lucide-react';
import { PostItem } from './PostItem';

interface MemoriesModalProps {
  userId: string;
  onClose: () => void;
}

export const MemoriesModal: React.FC<MemoriesModalProps> = ({ userId, onClose }) => {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemories();
  }, [userId]);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/feed/memories/${userId}`);
      const data = await res.json();
      if (data.success) {
        setMemories(data.data);
      }
    } catch (err) {
      console.error('Error fetching memories:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SHARE':
        return <Share2 size={14} />;
      case 'INTERACTION':
      default:
        return <Heart size={14} />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Card className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <History size={20} style={{ color: '#ffa500' }} />
            Recuerdos
          </h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="memories-container">
          {loading ? (
            <div className="loading">Cargando recuerdos...</div>
          ) : memories.length === 0 ? (
            <div className="empty-state">
              <p>No tienes recuerdos aún</p>
              <span>Las publicaciones que reacciones, comentes o compartas aparecerán aquí
              </span>
            </div>
          ) : (
            memories.map((memory) => (
              <div key={memory.id} className="memory-item">
                <div className="memory-meta">
                  <span className="memory-type">
                    {getTypeIcon(memory.type)}
                    {memory.type === 'SHARE' ? ' Compartido' : ' Interactuado'}
                  </span>
                  <span className="memory-date">
                    {new Date(memory.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {memory.post && <PostItem post={memory.post} />}
              </div>
            ))
          )}
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: fade-in 0.2s ease;
          }

          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

          .modal-content {
            width: 100%;
            max-width: 600px;
            max-height: 85vh;
            background: rgba(10, 10, 18, 0.98);
            backdrop-filter: blur(40px);
            border: 1px solid rgba(0, 229, 255, 0.15);
            border-radius: 22px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,82,255,0.1);
            animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes modal-in {
            from { opacity: 0; transform: scale(0.88) translateY(24px); }
            to   { opacity: 1; transform: scale(1)    translateY(0); }
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

          .memories-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
          }

          .memory-item {
            margin-bottom: 20px;
          }

          .memory-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: rgba(255, 165, 0, 0.1);
            border-radius: 8px;
            margin-bottom: 10px;
          }

          .memory-type {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #ffa500;
            font-size: 0.8rem;
            font-weight: 600;
          }

          .memory-date {
            color: var(--color-text-muted);
            font-size: 0.75rem;
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

          .memories-container::-webkit-scrollbar {
            width: 6px;
          }

          .memories-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }
        `}</style>
      </Card>
    </div>
  );
};