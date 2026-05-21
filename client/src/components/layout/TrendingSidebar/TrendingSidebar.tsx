'use client';

import { useEffect, useState } from 'react';
import styles from './TrendingSidebar.module.css';

interface TrendItem {
  id: number;
  name: string;
  image: string;
  count: string;
}

export function TrendingSidebar() {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/analytics/trending`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setTrends(data);
        }
      } catch (error) {
        console.error('Error fetching trends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  if (loading) return (
    <aside className={styles.sidebar}>
      <h2 className={styles.title}>Cargando tendencias...</h2>
    </aside>
  );

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.title}>Tendencias Semanales</h2>
      
      <div className={styles.trendList}>
        {trends.length > 0 ? trends.map((item, index) => (
          <div key={item.id} className={styles.trendItem}>
            <span className={styles.rank}>{index + 1}</span>
            <img src={item.image} alt={item.name} className={styles.image} />
            <div className={styles.info}>
              <h3 className={styles.animeName}>{item.name}</h3>
              <p className={styles.engagement}>{item.count}</p>
            </div>
          </div>
        )) : (
          <p style={{ color: '#555', fontSize: '0.9rem' }}>No hay actividad reciente.</p>
        )}
      </div>

      <div className={styles.footer}>
        <button className={styles.viewAll}>Ver Ranking Completo</button>
      </div>
    </aside>
  );
}
