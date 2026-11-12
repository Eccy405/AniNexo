'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, ArrowLeft } from 'lucide-react';
import { PostItem } from '@/components/feed/PostItem';

export default function SavedPostsPage() {
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      setLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(userStr);
      setUser(parsed);
      fetchSaved(parsed.id);
    } catch {
      setLoading(false);
    }
  }, []);

  const fetchSaved = async (userId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://aninexo.onrender.com/api' : 'http://localhost:3001/api')}/feed/saved/${userId}`);
      const data = await res.json();
      if (data.success) {
        setSavedPosts((data.data || []).map((s: any) => s.post).filter(Boolean));
      }
    } catch (err) {
      console.error('Error fetching saved posts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="saved-page">
      <div className="saved-container">
        <header className="saved-header">
          <Link href="/home/community" className="back-link">
            <ArrowLeft size={18} /> Volver a Comunidad
          </Link>
          <div className="title-row">
            <Bookmark size={26} color="#00E5FF" />
            <h1>Publicaciones Guardadas</h1>
          </div>
          <p className="subtitle">Tus publicaciones y momentos guardados en el Nexo.</p>
        </header>

        {loading ? (
          <div className="status-box">Cargando guardados...</div>
        ) : !user ? (
          <div className="status-box">
            <p>Inicia sesión para ver tus publicaciones guardadas.</p>
            <Link href="/login" className="cta-btn">Iniciar Sesión</Link>
          </div>
        ) : savedPosts.length === 0 ? (
          <div className="status-box">
            <Bookmark size={42} color="#333" />
            <h3>Aún no tienes guardados</h3>
            <p>Guarda publicaciones desde el feed de Comunidad para encontrarlas rápido aquí.</p>
            <Link href="/home/community" className="cta-btn">Explorar Comunidad</Link>
          </div>
        ) : (
          <div className="posts-list">
            {savedPosts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .saved-page {
          min-height: 100vh;
          background: #050505;
          color: #fff;
          padding: 96px 20px 48px;
        }
        .saved-container {
          max-width: 720px;
          margin: 0 auto;
        }
        .saved-header {
          margin-bottom: 28px;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #888;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: 14px;
        }
        .back-link:hover { color: #00E5FF; }
        .title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .title-row h1 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 900;
        }
        .subtitle {
          color: #777;
          margin: 6px 0 0;
          font-size: 0.92rem;
        }
        .status-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 48px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #999;
        }
        .status-box h3 { margin: 0; color: #fff; }
        .status-box p { margin: 0; max-width: 400px; }
        .cta-btn {
          margin-top: 8px;
          background: #00E5FF;
          color: #000;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 800;
          text-decoration: none;
        }
        .posts-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
      `}</style>
    </div>
  );
}
