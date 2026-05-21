'use client';
import React from 'react';
import Link from 'next/link';
import styles from './AnimeCarousel.module.css';

interface Anime {
  id: number;
  titleRomaji: string;
  coverImage: string;
  averageScore?: number;
  seasonYear?: number;
}

interface Props {
  title: string;
  animes: Anime[];
}

export const AnimeCarousel: React.FC<Props> = ({ title, animes }) => {
  return (
    <section className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.carousel}>
        {animes.map((anime) => {
          const slug = anime.titleRomaji.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          return (
            <Link key={anime.id} href={`/dashboard/anime/${anime.id}-${slug}`} className={styles.card}>
            <div className={styles.imageWrapper}>
              <img src={anime.coverImage} alt={anime.titleRomaji} className={styles.image} />
              <div className={styles.overlay}>
                <span className={styles.score}>⭐ {anime.averageScore || '??'}</span>
                <span className={styles.year}>{anime.seasonYear || ''}</span>
              </div>
            </div>
            <p className={styles.animeTitle}>{anime.titleRomaji}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};
