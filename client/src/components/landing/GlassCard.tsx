'use client';

import React from 'react';
import styles from './GlassCard.module.css';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'cyan' | 'purple' | 'none';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '',
  hover = true,
  glow = 'none'
}) => {
  const glowClass = glow === 'cyan' ? styles.glowCyan : glow === 'purple' ? styles.glowPurple : '';
  const hoverClass = hover ? styles.hover : '';
  
  return (
    <div className={`${styles.card} ${glowClass} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};
