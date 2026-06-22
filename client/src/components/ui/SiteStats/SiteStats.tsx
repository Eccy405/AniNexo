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
    <section className={styles.siteStats} aria-label="Estadísticas de la comunidad">
      <div className={styles.grid}>
        {/* Users card */}
        <div className={styles.card}>
          <div className={styles.iconContainer}>
            <Users size={24} />
          </div>
          <div className={styles.content}>
            <h3 className={styles.title}>Usuarios activos</h3>
            <p className={styles.number}>{users.toLocaleString()}</p>
          </div>
        </div>
        {/* Animes card */}
        <div className={styles.card}>
          <div className={styles.iconContainer}>
            <Map size={24} />
          </div>
          <div className={styles.content}>
            <h3 className={styles.title}>Animes disponibles</h3>
            <p className={styles.number}>{animes.toLocaleString()}</p>
          </div>
        </div>
        {/* Upcoming card */}
        <div className={styles.card}>
          <div className={styles.iconContainer}>
            <Rocket size={24} />
          </div>
          <div className={styles.content}>
            <h3 className={styles.title}>Próximamente</h3>
            <ul className={styles.list}>
              {upcoming.map((item, idx) => (
                <li key={idx} className={styles.listItem}>
                  <span className={styles.feature}>{item.feature}</span>
                  <span className={styles.eta}>{item.eta}</span>
                </li>
              ))}
              {/* fallback if empty */}
              {!upcoming.length && (
                <li className={styles.listItem}>
                  <span className={styles.feature}>Mejoras de IA Nexo</span>
                  <span className={styles.eta}>Q3 2026</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};