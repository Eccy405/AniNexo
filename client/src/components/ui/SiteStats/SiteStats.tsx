'use client';
import React from 'react';
import styles from './SiteStats.module.css';
import { Users, Map, Rocket } from 'lucide-react';

interface SiteStatsProps {
  users: number;
  animes: number;
  upcoming: Array<{ feature: string; eta: string }>;
}

export const SiteStats: React.FC<SiteStatsProps> = ({ users, animes, upcoming }) => {
  return (
    <section className={stats.siteStats} aria-label="Estadísticas de la comunidad">
      <div className={stats.grid}>
        {/* Users card */}
        <div className={stats.card}>
          <div className={stats.iconContainer}>
            <Users size={24} />
          </div>
          <div className={stats.content}>
            <h3 className={stats.title}>Usuarios activos</h3>
            <p className={stats.number}>{users.toLocaleString()}</p>
          </div>
        </div>
        {/* Animes card */}
        <div className={stats.card}>
          <div className={stats.iconContainer}>
            <Map size={24} />
          </div>
          <div className={stats.content}>
            <h3 className={stats.title}>Animes disponibles</h3>
            <p className={stats.number}>{animes.toLocaleString()}</p>
          </div>
        </div>
        {/* Upcoming card */}
        <div className={stats.card}>
          <div className={stats.iconContainer}>
            <Rocket size={24} />
          </div>
          <div className={stats.content}>
            <h3 className={stats.title}>Próximamente</h3>
            <ul className={stats.list}>
              {upcoming.map((item, idx) => (
                <li key={idx} className={stats.listItem}>
                  <span className={stats.feature}>{item.feature}</span>
                  <span className={stats.eta}>{item.eta}</span>
                </li>
              ))}
              {/* fallback if empty */}
              {!upcoming.length && (
                <li className={stats.listItem}>
                  <span className={stats.feature}>Mejoras de IA Nexo</span>
                  <span className={stats.eta}>Q3 2026</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const stats = {
  siteStats: 'siteStats',
  grid: 'grid',
  card: 'card',
  iconContainer: 'iconContainer',
  content: 'content',
  title: 'title',
  number: 'number',
  list: 'list',
  listItem: 'listItem',
  feature: 'feature',
  eta: 'eta',
};