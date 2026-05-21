'use client';

import { useEffect, useState } from 'react';
import { CreatePost } from './CreatePost';
import { PostItem } from './PostItem';
import { VerticalStoryRow } from './VerticalStoryRow';

export function FeedList() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/feed');
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <div className="feed-wrapper">
      {/* Historias al estilo Facebook */}
      <VerticalStoryRow />
      
      {/* Compositor de posts */}
      <div className="composer-wrapper">
        <CreatePost onPostCreated={fetchFeed} />
      </div>

      {/* Lista de Publicaciones */}
      <div className="posts-list">
        {loading ? (
          <div className="loader-container">
            <div className="loader-nexo" />
            <p>Sincronizando el Nexo...</p>
          </div>
        ) : posts.length === 0 ? (
          <p className="empty-state">No hay publicaciones aún en el Nexo. ¡Sé el primero!</p>
        ) : (
          posts.map(post => (
            <PostItem key={post.id} post={post} />
          ))
        )}
      </div>

      <style jsx>{`
        .feed-wrapper { 
          max-width: 680px; 
          margin: 0 auto; 
          padding: 0 10px;
        }
        .composer-wrapper { margin-bottom: 20px; }
        .posts-list { display: flex; flex-direction: column; }
        
        .loader-container { 
          display: flex; flex-direction: column; align-items: center; 
          padding: 50px; color: #b0b3b8; gap: 15px;
        }
        .loader-nexo { 
          width: 40px; height: 40px; border: 4px solid rgba(0, 229, 255, 0.1); 
          border-top-color: #00E5FF; border-radius: 50%; animation: spin 1s linear infinite; 
        }
        .empty-state { text-align: center; color: #b0b3b8; padding: 40px; }
        
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
