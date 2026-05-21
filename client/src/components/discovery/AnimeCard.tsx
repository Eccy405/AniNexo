'use client';

import React from 'react';
import Link from 'next/link';

interface AnimeCardProps {
  id: number;
  title: string;
  coverImage: string;
  score?: number;
  episodes?: number;
  status?: string;
  genres?: string[];
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ 
  id, 
  title, 
  coverImage, 
  score, 
  episodes, 
  status,
  genres 
}) => {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    <Link href={`/dashboard/anime/${id}-${slug}`} style={{ textDecoration: 'none' }}>
      <div className="anime-card-container">
        <div className="anime-card">
          {/* Poster Principal */}
          <div className="poster-wrapper">
            <img src={coverImage} alt={title} className="poster-image" loading="lazy" />
            
            {/* Badges Flotantes */}
            {score && (
              <div className="score-badge">
                ⭐ {score / 10}
              </div>
            )}
            
            {status === 'RELEASING' && (
              <div className="airing-badge">
                Emisión
              </div>
            )}
          </div>

          {/* Información en Hover */}
          <div className="card-overlay">
            <div className="overlay-content">
              <h3 className="overlay-title">{title}</h3>
              <div className="overlay-meta">
                <span>{episodes ? `${episodes} Eps` : '???'}</span>
                <span className="dot">•</span>
                <span className="status-text">{status}</span>
              </div>
              <div className="overlay-genres">
                {genres?.slice(0, 2).map(g => (
                  <span key={g} className="genre-tag">{g}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <h4 className="card-external-title">{title}</h4>

        <style jsx>{`
          .anime-card-container {
            width: 200px;
            transition: transform 0.3s ease;
          }

          .anime-card {
            position: relative;
            width: 100%;
            aspect-ratio: 2/3;
            border-radius: 12px;
            overflow: hidden;
            background-color: #111;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            cursor: pointer;
          }

          .poster-wrapper {
            width: 100%;
            height: 100%;
          }

          .poster-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
          }

          .score-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 229, 255, 0.9);
            color: #000;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: bold;
            box-shadow: 0 0 10px rgba(0, 229, 255, 0.4);
          }

          .airing-badge {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 255, 0, 0.8);
            color: #000;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.7rem;
            font-weight: bold;
            text-transform: uppercase;
          }

          .card-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.95) 80%);
            padding: 20px 15px 15px;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
          }

          .overlay-content {
            color: white;
          }

          .overlay-title {
            margin: 0 0 8px 0;
            font-size: 1rem;
            line-height: 1.2;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .overlay-meta {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.75rem;
            color: #ccc;
            margin-bottom: 8px;
          }

          .dot { color: var(--color-primary); }

          .overlay-genres {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
          }

          .genre-tag {
            background: rgba(255,255,255,0.1);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.65rem;
            color: #aaa;
          }

          .card-external-title {
            margin: 10px 0 0 0;
            font-size: 0.9rem;
            color: #eee;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-weight: 500;
          }

          /* Hover Effects */
          .anime-card-container:hover {
            transform: scale(1.05);
            z-index: 10;
          }

          .anime-card-container:hover .poster-image {
            transform: scale(1.1);
          }

          .anime-card-container:hover .card-overlay {
            opacity: 1;
            transform: translateY(0);
          }

          .anime-card-container:hover .anime-card {
            box-shadow: 0 0 25px rgba(0, 229, 255, 0.2);
            border: 1px solid rgba(0, 229, 255, 0.3);
          }
        `}</style>
      </div>
    </Link>
  );
};
