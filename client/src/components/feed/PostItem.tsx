'use client';

import { useState } from 'react';
import { ThumbsUp, MessageSquare, Share2, MoreHorizontal, X, Send } from 'lucide-react';
import { Card } from '../ui/Card/Card';

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  user: {
    username: string;
    avatarUrl: string;
  };
}

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
  comments?: CommentData[];
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

  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<CommentData[]>(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showPost, setShowPost] = useState(true);

  const handleLike = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (!userStr || !token) return;

      const user = JSON.parse(userStr);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/social/like`, {
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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (!userStr || !token) return;

      const user = JSON.parse(userStr);
      setIsSubmittingComment(true);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/feed/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          postId: post.id,
          content: newComment.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setCommentsList(prev => [...prev, data.data]);
        setNewComment('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!showPost) return null;

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
            <span className="profile-link">{post.user.username}</span>
            {post.user.isPremium && <span className="premium-star">★ Premium</span>}
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
        <div className="header-actions">
          <button className="icon-btn-header"><MoreHorizontal size={18} /></button>
          <button className="icon-btn-header" onClick={() => setShowPost(false)}><X size={18} /></button>
        </div>
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
          <div className="react-icons-bubbles">
            <span className="react-bubble like">👍</span>
            <span className="react-bubble heart">❤️</span>
            <span className="react-bubble wow">😲</span>
          </div>
          <span className="stats-number">{likesCount}</span>
        </div>
        <div className="comments-count" onClick={() => setShowComments(!showComments)}>
          {commentsList.length} {commentsList.length === 1 ? 'comentario' : 'comentarios'}
        </div>
      </div>

      <div className="post-divider" />

      {/* Action Buttons */}
      <div className="post-actions">
        <button className={`action-btn ${isLiked ? 'active' : ''}`} onClick={handleLike}>
          <ThumbsUp size={18} />
          <span>Me gusta</span>
        </button>
        <button className={`action-btn ${showComments ? 'active-comments' : ''}`} onClick={() => setShowComments(!showComments)}>
          <MessageSquare size={18} />
          <span>Comentar</span>
        </button>
        <button className="action-btn">
          <Share2 size={18} />
          <span>Compartir</span>
        </button>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="comments-section animate-fade-in">
          <div className="post-divider" style={{ margin: '0 0 12px 0' }} />
          
          <div className="comments-list">
            {commentsList.map(comment => (
              <div key={comment.id} className="comment-item">
                <img 
                  src={comment.user.avatarUrl || 'https://ui-avatars.com/api/?name=User'} 
                  alt="" 
                  className="comment-avatar" 
                />
                <div className="comment-content-bubble">
                  <div className="comment-user-header">
                    <span className="comment-username">{comment.user.username}</span>
                  </div>
                  <p className="comment-text">{comment.content}</p>
                  <span className="comment-time">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {commentsList.length === 0 && (
              <p className="no-comments-yet">Aún no hay comentarios. ¡Inicia la conversación!</p>
            )}
          </div>

          {/* Comment input form */}
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <img 
              src={typeof window !== 'undefined' && localStorage.getItem('user') 
                ? JSON.parse(localStorage.getItem('user')!).avatarUrl || 'https://ui-avatars.com/api/?name=Me'
                : 'https://ui-avatars.com/api/?name=User'
              } 
              alt="Me" 
              className="my-comment-avatar" 
            />
            <div className="comment-input-wrapper">
              <input 
                type="text" 
                placeholder="Escribe un comentario..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmittingComment}
              />
              <button type="submit" className="btn-send-comment" disabled={isSubmittingComment || !newComment.trim()}>
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        .fb-post-card { 
          padding: 0 !important; 
          background: rgba(15, 15, 15, 0.75) !important; 
          backdrop-filter: blur(25px); 
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          margin-bottom: 20px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          transition: border-color 0.3s;
        }

        .fb-post-card:hover {
          border-color: rgba(0, 229, 255, 0.2);
        }

        .post-header { 
          display: flex; 
          align-items: center; 
          padding: 14px 16px; 
          gap: 12px; 
        }

        .post-avatar { 
          width: 40px; 
          height: 40px; 
          border-radius: 50%; 
          object-fit: cover; 
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .post-meta { 
          flex: 1; 
        }

        .user-name { 
          font-weight: 700; 
          color: white; 
          display: flex; 
          align-items: center; 
          flex-wrap: wrap; 
          gap: 8px; 
          font-size: 0.95rem; 
        }

        .profile-link {
          cursor: pointer;
        }

        .profile-link:hover {
          text-decoration: underline;
        }

        .premium-star { 
          background: linear-gradient(90deg, #00E5FF, #af50ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-size: 0.75rem; 
          font-weight: 900;
          letter-spacing: 0.5px;
          border: 1px solid rgba(0, 229, 255, 0.2);
          padding: 1px 6px;
          border-radius: 4px;
        }

        .post-time { 
          font-size: 0.8rem; 
          color: #888; 
          margin-top: 2px;
        }

        .header-actions {
          display: flex;
          gap: 6px;
        }

        .icon-btn-header {
          background: transparent;
          border: none;
          color: #888;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s, color 0.2s;
        }

        .icon-btn-header:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .anime-mention-badge { 
          background: rgba(0, 229, 255, 0.08); 
          color: #00E5FF; 
          padding: 1px 8px; 
          border-radius: 4px; 
          font-size: 0.75rem; 
          text-decoration: none; 
          border: 1px solid rgba(0, 229, 255, 0.15); 
          transition: all 0.2s;
        }

        .anime-mention-badge:hover { 
          background: rgba(0, 229, 255, 0.15); 
          transform: translateY(-1px); 
        }

        .post-content { 
          padding: 4px 16px 14px 16px; 
          color: #e4e6eb; 
          line-height: 1.5; 
          font-size: 0.95rem; 
        }
        
        .post-media { 
          width: 100%; 
          background: #000; 
          display: flex; 
          justify-content: center; 
          border-top: 1px solid rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }

        .post-media img { 
          max-width: 100%; 
          max-height: 550px; 
          object-fit: contain; 
        }

        .post-stats { 
          display: flex; 
          justify-content: space-between; 
          padding: 10px 16px; 
          color: #b0b3b8; 
          font-size: 0.85rem; 
        }

        .reactions-count {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .react-icons-bubbles {
          display: flex;
          align-items: center;
        }

        .react-bubble {
          font-size: 0.85rem;
          margin-right: -4px;
          background: #18191a;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stats-number {
          margin-left: 6px;
          font-weight: 500;
        }

        .comments-count {
          cursor: pointer;
        }

        .comments-count:hover {
          text-decoration: underline;
        }
        
        .post-divider { 
          height: 1px; 
          background: rgba(255, 255, 255, 0.08); 
          margin: 0 16px; 
        }
        
        .post-actions { 
          display: flex; 
          padding: 4px 8px; 
        }

        .action-btn { 
          flex: 1; 
          background: transparent; 
          border: none; 
          color: #b0b3b8; 
          padding: 8px; 
          border-radius: 8px; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 8px;
          font-weight: 600; 
          font-size: 0.85rem; 
          transition: background-color 0.2s, color 0.2s;
        }

        .action-btn:hover { 
          background-color: rgba(255, 255, 255, 0.05); 
          color: white;
        }

        .action-btn.active { 
          color: #00E5FF; 
          text-shadow: 0 0 10px rgba(0, 229, 255, 0.2);
        }

        .action-btn.active-comments {
          color: #af50ff;
        }

        /* Comments drawer */
        .comments-section {
          padding: 12px 16px 16px 16px;
          background: rgba(0, 0, 0, 0.2);
        }

        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 14px;
          max-height: 250px;
          overflow-y: auto;
          scrollbar-width: none;
        }

        .comments-list::-webkit-scrollbar {
          display: none;
        }

        .comment-item {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .comment-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(255, 255, 255, 0.08);
          margin-top: 2px;
        }

        .comment-content-bubble {
          flex: 1;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 8px 12px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
        }

        .comment-username {
          font-size: 0.8rem;
          font-weight: 700;
          color: #e4e6eb;
        }

        .comment-text {
          font-size: 0.85rem;
          color: #b0b3b8;
          margin-top: 3px;
          line-height: 1.4;
        }

        .comment-time {
          font-size: 0.7rem;
          color: #555;
          align-self: flex-start;
          margin-top: 4px;
        }

        .no-comments-yet {
          text-align: center;
          font-size: 0.8rem;
          color: #6b6b6b;
          padding: 8px;
        }

        /* Comment form */
        .comment-form {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 10px;
        }

        .my-comment-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .comment-input-wrapper {
          flex: 1;
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 4px 8px 4px 14px;
          align-items: center;
          transition: border-color 0.3s;
        }

        .comment-input-wrapper:focus-within {
          border-color: #00E5FF;
        }

        .comment-input-wrapper input {
          flex: 1;
          border: none;
          background: transparent;
          color: white;
          outline: none;
          font-size: 0.85rem;
          padding: 6px 0;
        }

        .btn-send-comment {
          background: transparent;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .comment-input-wrapper input:focus + .btn-send-comment,
        .btn-send-comment:hover {
          color: #00E5FF;
        }

        .btn-send-comment:disabled {
          color: #333 !important;
          cursor: not-allowed;
        }

        .animate-fade-in {
          animation: fadeIn 0.25s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Card>
  );
}
