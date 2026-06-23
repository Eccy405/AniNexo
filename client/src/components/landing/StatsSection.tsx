'use client';

import { motion } from 'framer-motion';
import { Users, Tv, MessageSquare, Zap } from 'lucide-react';
import styles from './StatsSection.module.css';

interface StatsSectionProps {
  users: number;
  animes: number;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ users, animes }) => {
  const stats = [
    { 
      icon: <Users size={28} />, 
      value: users, 
      label: 'Usuarios Activos',
      suffix: '+' 
    },
    { 
      icon: <Tv size={28} />, 
      value: animes, 
      label: 'Animes Disponibles',
      suffix: '+' 
    },
    { 
      icon: <MessageSquare size={28} />, 
      value: 12500, 
      label: 'Comentarios',
      suffix: '+' 
    },
    { 
      icon: <Zap size={28} />, 
      value: 99, 
      label: 'Uptime %',
      suffix: '%' 
    }
  ];

  return (
    <section className={styles.stats}>
      <div className={styles.container}>
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            className={styles.card}
          >
            <div className={styles.iconWrapper}>
              {stat.icon}
            </div>
            <div className={styles.value}>
              {stat.value.toLocaleString()}
              <span className={styles.suffix}>{stat.suffix}</span>
            </div>
            <div className={styles.label}>{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
