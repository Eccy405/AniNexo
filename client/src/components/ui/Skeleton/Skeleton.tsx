'use client';
import styles from './Skeleton.module.css';

export function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--border-radius-sm)',
  className = ''
}: {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}) {
  return (
    <>
      <div 
        className={`${styles.skeleton} ${className}`}
        style={{ width, height, borderRadius }}
      />
    </>
  );
}
