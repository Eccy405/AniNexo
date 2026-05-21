'use client';

import React from 'react';
import { FeedList } from '../../../components/feed/FeedList';
import { TrendingSidebar } from '../../../components/layout/TrendingSidebar/TrendingSidebar';

export default function CommunityPage() {
  return (
    <div className="community-layout">
      <div className="social-discovery-grid">
        <main className="feed-container">
          <h2 className="section-title">💬 Actividad de la Comunidad</h2>
          <FeedList />
        </main>
        
        <aside className="sidebar-container">
          <div className="nexo-suggestion-inline">
             <h4>🤖 Nexo AI Sugiere</h4>
             <p>¿Quieres debatir? El último episodio de <strong>Oshi no Ko</strong> está causando furor en la comunidad.</p>
          </div>
          <TrendingSidebar />
        </aside>
      </div>

      <style jsx>{`
        .community-layout {
          background-color: #050505;
          min-height: 100vh;
          padding-top: 80px;
        }

        .social-discovery-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 50px;
          padding: 2rem 5%;
          max-width: 1600px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 2rem;
          font-weight: 900;
          color: #fff;
          margin-bottom: 2rem;
          border-left: 6px solid #00E5FF;
          padding-left: 20px;
          letter-spacing: -1px;
        }

        .sidebar-container {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .nexo-suggestion-inline {
          background: linear-gradient(135deg, #110520 0%, #050505 100%);
          border: 1px solid rgba(0, 229, 255, 0.2);
          padding: 25px;
          border-radius: 15px;
        }

        .nexo-suggestion-inline h4 {
          color: #00E5FF;
          margin-bottom: 10px;
          font-size: 1.1rem;
        }

        .nexo-suggestion-inline p {
          color: #bbb;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        @media (max-width: 1200px) {
          .social-discovery-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
