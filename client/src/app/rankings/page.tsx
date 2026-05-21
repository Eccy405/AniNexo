import { Metadata } from 'next';
import { Card } from '../../components/ui/Card/Card';
import Link from 'next/link';
import Image from 'next/image';
import { getPopularAnimes } from '../../lib/anilist';

export const metadata: Metadata = {
  title: 'Top Anime Global | Los Más Populares del Momento',
  description: 'Descubre los animes en tendencia. Los títulos más vistos y mejor valorados por la comunidad de AniNexo y AniList.',
  openGraph: {
    title: 'Top Anime Global - AniNexo',
    description: 'Ranking actualizado de los mejores animes actuales.',
  }
};

export default async function RankingsPage() {
  const animes = await getPopularAnimes(1, 20);

  // JSON-LD for ItemList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: animes?.map((anime: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: anime.title.english || anime.title.romaji,
      url: `https://aninexo.com/dashboard/anime/${anime.id}`
    }))
  };

  return (
    <div style={{ padding: '3rem 5rem' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Top Anime Global</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Tendencias mundiales actualizadas en tiempo real</p>
        </div>
        <Link href="/dashboard" style={{ 
          color: 'var(--color-primary)', 
          padding: '0.5rem 1rem', 
          border: '1px solid var(--color-primary)', 
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '0.9rem'
        }}>
          Volver al Dashboard
        </Link>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {animes?.map((anime: any, index: number) => (
          <Link 
            href={`/dashboard/anime/${anime.id}`} 
            key={anime.id} 
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Card style={{ 
              padding: '1.2rem 2rem', 
              display: 'grid', 
              gridTemplateColumns: '50px 100px 1fr 150px', 
              alignItems: 'center', 
              gap: '2rem',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
              cursor: 'pointer'
            }}>
              <h2 style={{ 
                color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--color-text-muted)', 
                fontSize: '1.8rem',
                textAlign: 'center'
              }}>
                #{index + 1}
              </h2>
              
              <div style={{ 
                width: '100px', 
                height: '140px', 
                position: 'relative', 
                borderRadius: '8px', 
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}>
                <Image 
                  src={anime.coverImage.large} 
                  alt={anime.title.english || anime.title.romaji}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>

              <div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{anime.title.english || anime.title.romaji}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {anime.genres.slice(0, 3).map((g: string) => (
                    <span key={g} style={{ fontSize: '0.7rem', color: '#555', border: '1px solid #222', padding: '2px 8px', borderRadius: '4px' }}>
                      {g}
                    </span>
                  ))}
                </div>
                <p style={{ marginTop: '0.8rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                  {anime.seasonYear} • {anime.episodes || '?'} Episodios
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  {anime.averageScore}%
                </div>
                <div style={{ fontSize: '0.8rem', color: '#444' }}>AniList Score</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
