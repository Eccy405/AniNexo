import { Metadata } from 'next';
import { ProfileView } from '@/components/profile/ProfileView';

interface PageProps {
  params: { username: string };
}

async function getProfileData(username: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/profile/${username}`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    return null;
  }
}

async function getListData(username: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/list/${username}`, { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileData(username);
  
  if (!profile) return { title: 'Perfil no encontrado' };

  const title = `Perfil de ${profile.username} | AniNexo`;
  const description = profile.bio || `Mira la lista de anime de ${profile.username} y conecta en AniNexo.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [profile.avatarUrl || '/default-avatar.png'],
      type: 'profile',
      username: profile.username
    }
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getProfileData(username);
  const animeList = await getListData(username);

  if (!profile) return <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>Usuario no encontrado</div>;

  return (
    <ProfileView profile={profile} animeList={animeList} />
  );
}
