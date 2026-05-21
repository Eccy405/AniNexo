'use client';

import { FreeOnly } from '../../auth/FreemiumWrappers';

export function AdBanner({ position = 'sidebar' }: { position?: 'sidebar' | 'feed' }) {
  const height = position === 'sidebar' ? '250px' : '100px';
  const width = position === 'sidebar' ? '100%' : '100%';

  return (
    <FreeOnly>
      <div style={{
        width,
        height,
        backgroundColor: 'var(--color-surface-hover)',
        border: '1px dashed var(--color-secondary)',
        borderRadius: 'var(--border-radius-md)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-muted)',
        textAlign: 'center',
        padding: '1rem',
        margin: position === 'feed' ? '1rem 0' : '0 0 1rem 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          right: 0, 
          background: 'rgba(0,0,0,0.5)', 
          fontSize: '0.6rem', 
          padding: '2px 4px' 
        }}>
          AD
        </div>
        <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📢</span>
        <strong>Espacio Publicitario</strong>
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
          Hazte Premium para navegar sin interrupciones.
        </p>
      </div>
    </FreeOnly>
  );
}
