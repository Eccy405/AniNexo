import { Skeleton } from '../../components/ui/Skeleton/Skeleton';

export default function Loading() {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Skeleton height="200px" borderRadius="var(--border-radius-lg)" />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
        <Skeleton height="350px" borderRadius="var(--border-radius-lg)" />
        <Skeleton height="350px" borderRadius="var(--border-radius-lg)" />
        <Skeleton height="350px" borderRadius="var(--border-radius-lg)" />
        <Skeleton height="350px" borderRadius="var(--border-radius-lg)" />
      </div>
    </div>
  );
}
