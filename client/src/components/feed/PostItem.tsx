'use client';

import { useState } from 'react';
import { Card } from '../ui/Card/Card';
import { Button } from '../ui/Button/Button';

interface PostData {
  id: string;
  content: string;
  mediaUrl?: string;
  animeId?: number;
  anime?: {
    id: number;
    titleRomaji: string;
    coverImage: string;
  };
  createdAt: string;
  user: {
    username: string;
    avatarUrl: string;
    isPremium: boolean;
  };
  _count: {
    comments: number;
    likes: number;
  };
  likes?: { userId: string }[];
}

export function PostItem({ post }: { post: PostData }) {
  const [likesCount, setLikesCount] = useState(post._count?.likes || 0);
  const [isLiked, setIsLiked] = useState(() => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr && post.likes) {
        const user = JSON.parse(userStr);
        return post.likes.some((like: any) => like.userId === user.id);
      }
    } catch (e) {}
    return false;
  });

  const handleLike = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (!userStr || !token) return;

      const user = JSON.parse(userStr);

      const res = await fetch('http://localhost:3001/api/social/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id, postId: post.id })
      });

      const data = await res.json();
      if (data.success) {
        setIsLiked(data.data.liked);
        setLikesCount(prev => data.data.liked ? prev + 1 : Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card className="fb-post-card">
      {/* Header */}
      <div className="post-header">
        <img 
          src={post.user.avatarUrl || 'https://ui-avatars.com/api/?name=User'} 
          className="post-avatar" 
          alt="" 
        />
        <div className="post-meta">
          <div className="user-name">
            {post.user.username}
            {post.user.isPremium && <span className="premium-star">★</span>}
            {post.anime && (
              <a href={`/dashboard/anime/${post.anime.id}`} className="anime-mention-badge">
                🏷️ {post.anime.titleRomaji}
              </a>
            )}
          </div>
          <div className="post-time">
            {new Date(post.createdAt).toLocaleDateString()} • 🌎
          </div>
        </div>
        <div className="post-options">•••</div>
      </div>

      {/* Content */}
      <div className="post-content">
        <p>{post.content}</p>
      </div>

      {/* Media */}
      {post.mediaUrl && (
        <div className="post-media">
          <img src={post.mediaUrl} alt="" loading="lazy" />
        </div>
      )}

      {/* Stats Bar */}
      <div className="post-stats">
        <div className="reactions-count">
          <span className="react-icons">👍❤️😲</span>
          {likesCount}
        </div>
        <div className="comments-count">
          {post._count?.comments || 0} comentarios
        </div>
      </div>

      <div className="post-divider" />

      {/* Action Buttons */}
      <div className="post-actions">
        <button className={`action-btn ${isLiked ? 'active' : ''}`} onClick={handleLike}>
          <span className="icon">{isLiked ? '👍' : '👍'}</span>
          Me gusta
        </button>
        <button className="action-btn">
          <span className="icon">💬</span>
          Comentar
        </button>
        <button className="action-btn">
          <span className="icon">➡️</span>
          Compartir
        </button>
      </div>

      <style jsx>{`
        .fb-post-card { 
          padding: 0 !important; 
          background: rgba(20, 20, 20, 0.6) !important; 
          backdrop-filter: blur(20px); 
          border-radius: 12px;
          margin-bottom: 20px;
          overflow: hidden;
        }
        .post-header { display: flex; align-items: center; padding: 15px; gap: 12px; }
        .post-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
        .post-meta { flex: 1; }
        .user-name { font-weight: 700; color: white; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 1rem; }
        .premium-star { color: #00E5FF; font-size: 0.9rem; }
        .post-time { font-size: 0.85rem; color: #b0b3b8; }
        .post-options { color: #b0b3b8; cursor: pointer; padding: 5px; }

        .anime-mention-badge { 
          background: rgba(0, 229, 255, 0.1); color: #00E5FF; padding: 2px 8px; 
          border-radius: 4px; font-size: 0.75rem; text-decoration: none; 
          border: 1px solid rgba(0, 229, 255, 0.2); transition: 0.3s;
        }
        .anime-mention-badge:hover { background: rgba(0, 229, 255, 0.2); transform: translateY(-1px); }

        .post-content { padding: 5px 15px 15px 15px; color: #e4e6eb; line-height: 1.5; font-size: 1.05rem; }
        
        .post-media { width: 100%; background: #000; display: flex; justify-content: center; }
        .post-media img { max-width: 100%; max-height: 600px; object-fit: contain; }

        .post-stats { display: flex; justify-content: space-between; padding: 12px 15px; color: #b0b3b8; font-size: 0.9rem; }
        .react-icons { margin-right: 8px; font-size: 1.1rem; }
        
        .post-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 0 15px; }
        
        .post-actions { display: flex; padding: 4px; }
        .action-btn { 
          flex: 1; background: transparent; border: none; color: #b0b3b8; 
          padding: 10px; border-radius: 8px; cursor: pointer; 
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-weight: 600; font-size: 0.95rem; transition: background 0.2s;
        }
        .action-btn:hover { background: rgba(255,255,255,0.05); }
        .action-btn.active { color: #00E5FF; }
        .action-btn .icon { font-size: 1.2rem; }
      `}</style>
    </Card>
  );
}
