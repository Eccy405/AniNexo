'use client';

import React from 'react';
import Link from 'next/link';
import { AnimeCard } from './AnimeCard';

interface AnimeRowProps {
  title: string;
  items: any[];
  viewAllHref?: string;
}

export const AnimeRow: React.FC<AnimeRowProps> = ({ title, items, viewAllHref }) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="anime-row-section">
      <div className="row-header">
        <h2 className="row-title">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="view-all">Ver Todo</Link>
        )}
      </div>

      <div className="row-scroll-container">
        {items.map((anime: any) => (
          <AnimeCard 
            key={anime.id}
            id={anime.id}
            title={anime.title.romaji}
            coverImage={anime.coverImage.extraLarge}
            score={anime.averageScore}
            episodes={anime.episodes}
            status={anime.status}
            genres={anime.genres}
          />
        ))}
      </div>

      <style jsx>{`
        .anime-row-section {
          margin-bottom: 3rem;
          padding: 0 1rem;
        }

        .row-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 1.5rem;
          padding: 0 1rem;
        }

        .row-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
          letter-spacing: -0.5px;
          border-left: 4px solid var(--color-primary);
          padding-left: 15px;
        }

        .view-all {
          background: transparent;
          border: none;
          color: var(--color-primary);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .view-all:hover {
          opacity: 0.7;
          text-decoration: underline;
        }

        .row-scroll-container {
          display: flex;
          gap: 1.5rem;
          overflow-x: auto;
          padding: 10px 1rem 30px;
          scroll-behavior: smooth;
          scrollbar-width: none; /* Firefox */
        }

        .row-scroll-container::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }

        /* Responsive */
        @media (max-width: 768px) {
          .row-title { font-size: 1.2rem; }
        }
      `}</style>
    </section>
  );
};
