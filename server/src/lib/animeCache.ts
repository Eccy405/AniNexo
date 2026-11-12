import prisma from './prisma';

export interface AnimeMetadataInput {
  title?: string | null;
  titleRomaji?: string | null;
  titleEnglish?: string | null;
  titleNative?: string | null;
  coverImage?: string | null;
  bannerImage?: string | null;
  type?: string | null;
  episodes?: number | null;
  averageScore?: number | null;
}

function buildAnimeSlug(id: number, title: string): string {
  const clean = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return clean ? `${id}-${clean}` : `${id}`;
}

export async function upsertAnimeMetadata(animeId: number, data?: AnimeMetadataInput | null) {
  const numericId = Number(animeId);
  if (!Number.isFinite(numericId) || numericId <= 0 || !data) return null;

  const titleRomaji = (data.titleRomaji || data.title || data.titleEnglish || '').trim();
  const titleEnglish = data.titleEnglish?.trim() || null;
  const titleNative = data.titleNative?.trim() || null;
  const coverImage = data.coverImage?.trim() || null;
  const bannerImage = data.bannerImage?.trim() || null;
  const type = data.type?.trim() || null;
  const episodes = data.episodes !== undefined && data.episodes !== null && Number.isFinite(Number(data.episodes))
    ? Number(data.episodes)
    : null;
  const averageScore = data.averageScore !== undefined && data.averageScore !== null && Number.isFinite(Number(data.averageScore))
    ? Math.round(Number(data.averageScore))
    : null;

  if (!titleRomaji && !coverImage && !bannerImage) return null;

  const fallbackTitle = titleRomaji || `Anime ${numericId}`;
  const slug = buildAnimeSlug(numericId, titleEnglish || fallbackTitle);

  const updateFields: Record<string, any> = {};
  if (titleRomaji) updateFields.titleRomaji = titleRomaji;
  if (titleEnglish) updateFields.titleEnglish = titleEnglish;
  if (titleNative) updateFields.titleNative = titleNative;
  if (coverImage) updateFields.coverImage = coverImage;
  if (bannerImage) updateFields.bannerImage = bannerImage;
  if (type) updateFields.type = type;
  if (episodes !== null) updateFields.episodes = episodes;
  if (averageScore !== null) updateFields.averageScore = averageScore;

  try {
    return await prisma.anime.upsert({
      where: { id: numericId },
      update: updateFields,
      create: {
        id: numericId,
        slug,
        titleRomaji: fallbackTitle,
        titleEnglish,
        titleNative,
        coverImage,
        bannerImage,
        type,
        episodes,
        averageScore,
        isComplete: false
      },
      select: {
        id: true,
        titleRomaji: true,
        titleEnglish: true,
        coverImage: true,
        bannerImage: true,
        type: true,
        averageScore: true,
        episodes: true
      }
    });
  } catch {
    return await prisma.anime.upsert({
      where: { id: numericId },
      update: updateFields,
      create: {
        id: numericId,
        slug: `${numericId}-${Date.now()}`,
        titleRomaji: fallbackTitle,
        titleEnglish,
        titleNative,
        coverImage,
        bannerImage,
        type,
        episodes,
        averageScore,
        isComplete: false
      },
      select: {
        id: true,
        titleRomaji: true,
        titleEnglish: true,
        coverImage: true,
        bannerImage: true,
        type: true,
        averageScore: true,
        episodes: true
      }
    });
  }
}
