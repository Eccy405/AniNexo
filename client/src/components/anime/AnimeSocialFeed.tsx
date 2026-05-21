'use client';

import { useState, useEffect } from 'react';
import { PostItem } from '../feed/PostItem';
import { CreatePost } from '../feed/CreatePost';

export function AnimeSocialFeed({ animeId, animeTitle }: { animeId: number, animeTitle: string }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnimeFeed = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/feed/anime/${animeId}`);
      const data = await res.json();
      if (data.success) setPosts(data.data);
    } catch (e) {
      console.error('Error fetching anime feed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (animeId) fetchAnimeFeed();
  }, [animeId]);

  return (
    <div className="anime-social-container">
      <div className="social-header">
        <h3>Debate Dimensional: {animeTitle}</h3>
        <p>Últimas impresiones de la comunidad sobre este título.</p>
      </div>

      <div className="composer-section" style={{ marginBottom: '30px' }}>
        <CreatePost 
          onPostCreated={fetchAnimeFeed} 
          defaultAnimeId={animeId} 
        />
      </div>

      <div className="posts-list">
        {loading ? (
          <div className="loader-placeholder">
            <div className="spinner" />
            <p>Sincronizando feed social...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📡</div>
            <p>Aún no hay ecos sobre este anime en el Nexo.</p>
            <span>¡Sé el primero en iniciar el debate!</span>
          </div>
        ) : (
          posts.map(post => (
            <PostItem key={post.id} post={post} />
          ))
        )}
      </div>

      <style jsx>{`
        .anime-social-container { max-width: 800px; margin: 0 auto; }
        .social-header { margin-bottom: 25px; border-left: 4px solid #00E5FF; padding-left: 15px; }
        .social-header h3 { margin: 0; font-size: 1.4rem; font-weight: 900; color: #fff; }
        .social-header p { margin: 5px 0 0 0; color: #666; font-size: 0.9rem; font-weight: 700; }
        
        .loader-placeholder { display: flex; flex-direction: column; align-items: center; padding: 50px; color: #00E5FF; gap: 15px; }
        .spinner { width: 30px; height: 30px; border: 3px solid rgba(0, 229, 255, 0.1); border-top-color: #00E5FF; border-radius: 50%; animation: spin 1s linear infinite; }
        
        .empty-state { text-align: center; padding: 60px 20px; background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px dashed rgba(255,255,255,0.1); }
        .empty-icon { font-size: 3rem; margin-bottom: 15px; opacity: 0.5; }
        .empty-state p { margin: 0; color: #fff; font-size: 1.1rem; font-weight: 800; }
        .empty-state span { color: #666; font-size: 0.9rem; font-weight: 700; }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
