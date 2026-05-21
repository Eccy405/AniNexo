'use client';

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
        className={`skeleton ${className}`}
        style={{ width, height, borderRadius }}
      />
      <style>{`
        .skeleton {
          background: linear-gradient(
            90deg,
            var(--color-surface) 0%,
            var(--color-surface-hover) 50%,
            var(--color-surface) 100%
          );
          background-size: 200% 100%;
          animation: pulse 1.5s infinite ease-in-out;
        }

        @keyframes pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
}
