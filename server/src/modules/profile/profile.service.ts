import axios from 'axios';
import prisma from '../../lib/prisma';
import { upsertAnimeMetadata } from '../../lib/animeCache';
import { BadgeService } from '../social/badge.service';

const badgeService = new BadgeService();
const ANILIST_URL = 'https://graphql.anilist.co';

function truncateText(text: string | null | undefined, max = 70): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export class ProfileService {
  private async resolveMissingAnimes(animeIds: number[]) {
    const uniqueIds = Array.from(
      new Set(animeIds.map(Number).filter((id) => Number.isFinite(id) && id > 0))
    );
    if (uniqueIds.length === 0) return new Map<number, any>();

    const existing = await prisma.anime.findMany({
      where: { id: { in: uniqueIds } },
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

    const animeMap = new Map<number, any>(existing.map((a) => [a.id, a]));
    const missingIds = uniqueIds.filter((id) => {
      const found = animeMap.get(id);
      return !found || !found.coverImage;
    });

    if (missingIds.length > 0) {
      try {
        const query = `
          query ($ids: [Int]) {
            Page(perPage: 50) {
              media(id_in: $ids, type: ANIME) {
                id
                title { romaji english native }
                coverImage { extraLarge large }
                bannerImage
                format
                averageScore
                episodes
              }
            }
          }
        `;
        const res = await axios.post(
          ANILIST_URL,
          { query, variables: { ids: missingIds.slice(0, 50) } },
          { timeout: 3000 }
        );
        const mediaList = res.data?.data?.Page?.media || [];
        const cachedRows = await Promise.all(
          mediaList.map(async (m: any) => {
            const titleStr = m.title?.english || m.title?.romaji || `Anime-${m.id}`;
            const slug = `${m.id}-${titleStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
            const coverImage = m.coverImage?.extraLarge || m.coverImage?.large || null;

            return prisma.anime.upsert({
              where: { id: m.id },
              update: {
                ...(m.title?.romaji ? { titleRomaji: m.title.romaji } : {}),
                ...(m.title?.english ? { titleEnglish: m.title.english } : {}),
                ...(coverImage ? { coverImage } : {}),
                ...(m.bannerImage ? { bannerImage: m.bannerImage } : {}),
                ...(m.format ? { type: m.format } : {}),
                ...(m.averageScore !== undefined && m.averageScore !== null ? { averageScore: m.averageScore } : {}),
                ...(m.episodes !== undefined && m.episodes !== null ? { episodes: m.episodes } : {})
              },
              create: {
                id: m.id,
                slug,
                titleRomaji: m.title?.romaji || titleStr,
                titleEnglish: m.title?.english || null,
                titleNative: m.title?.native || null,
                coverImage,
                bannerImage: m.bannerImage || null,
                type: m.format || null,
                averageScore: m.averageScore || null,
                episodes: m.episodes || null,
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
          })
        );
        for (const cached of cachedRows) {
          animeMap.set(cached.id, cached);
        }
      } catch {
        console.warn('[ProfileService] No se pudieron resolver animes faltantes desde AniList (timeout/error)');
      }
    }

    return animeMap;
  }

  async getProfileByUsername(username: string, viewerId?: string) {
    console.log(`[ProfileService] Buscando perfil para: "${username}"`);

    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        country: true,
        role: true,
        isPremium: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        archetype: true,
        themeColor: true,
        favAnimeId: true,
        favAnimeTitle: true,
        favAnimeImage: true,
        favCharacterId: true,
        favCharacterName: true,
        favCharacterImage: true,
        privateProfile: true,
        showWatchList: true,
        intelligence: true,
        affinities: true,
        isVerified: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
            comments: true,
            animeLists: true,
            collections: true
          }
        }
      }
    });

    if (!user) {
      console.log(`[ProfileService] Perfil NO encontrado: "${username}"`);
      return null;
    }

    // Solo sincronizar logros en escritura cuando el dueño autenticado consulta su propio perfil
    if (viewerId && viewerId === user.id) {
      await badgeService.syncUserBadges(user.id);
    }

    const [badges, animeLists, rawCollections, recentPosts, recentComments] = await Promise.all([
      prisma.userBadge.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { badge: true }
      }),
      prisma.animeList.findMany({
        where: { userId: user.id },
        take: 24,
        orderBy: { updatedAt: 'desc' },
        include: {
          anime: {
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
          }
        }
      }),
      prisma.userCollection.findMany({
        where: { userId: user.id },
        take: 24,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.post.findMany({
        where: { userId: user.id, isPrivate: false },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          anime: { select: { id: true, titleRomaji: true, titleEnglish: true } },
          _count: { select: { likes: true, comments: true } }
        }
      }),
      prisma.comment.findMany({
        where: { userId: user.id, post: { isPrivate: false } },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            select: {
              id: true,
              content: true,
              animeId: true,
              anime: { select: { id: true, titleRomaji: true, titleEnglish: true } }
            }
          }
        }
      })
    ]);

    // Resolver Anime Favorito y Personaje Favorito unificados (incluyendo favAnimeId en el batch único)
    const socialProfile = (user.intelligence?.socialProfile as any) || {};
    const legacyFavAnime = socialProfile?.favAnime;
    const legacyFavChar = socialProfile?.favCharacter;

    const rawFavAnimeId = user.favAnimeId ?? (legacyFavAnime?.id ? Number(legacyFavAnime.id) : null);
    const resolvedFavAnimeId = rawFavAnimeId && Number.isFinite(rawFavAnimeId) && rawFavAnimeId > 0 ? rawFavAnimeId : null;

    const idsToResolve = rawCollections.map((c) => c.animeId);
    if (resolvedFavAnimeId) idsToResolve.push(resolvedFavAnimeId);

    const animeMap = await this.resolveMissingAnimes(idsToResolve);

    const enrichedCollections = rawCollections.map((c) => ({
      ...c,
      anime: animeMap.get(c.animeId) || null
    }));

    const cachedFavAnime = resolvedFavAnimeId ? animeMap.get(resolvedFavAnimeId) || null : null;
    const favAnimeBanner: string | null =
      legacyFavAnime?.bannerImage || cachedFavAnime?.bannerImage || cachedFavAnime?.coverImage || null;
    const resolvedFavCover =
      user.favAnimeImage || legacyFavAnime?.coverImage || legacyFavAnime?.image || cachedFavAnime?.coverImage || null;
    const resolvedFavTitle =
      user.favAnimeTitle || legacyFavAnime?.title || cachedFavAnime?.titleEnglish || cachedFavAnime?.titleRomaji || null;

    const favAnime = (resolvedFavTitle || resolvedFavCover || resolvedFavAnimeId)
      ? {
          id: resolvedFavAnimeId,
          title: resolvedFavTitle,
          image: resolvedFavCover,
          coverImage: resolvedFavCover,
          bannerImage: favAnimeBanner || resolvedFavCover
        }
      : null;

    const favCharacter = (user.favCharacterName || user.favCharacterImage || legacyFavChar?.name || legacyFavChar?.image)
      ? {
          id: user.favCharacterId ?? (legacyFavChar?.id ? Number(legacyFavChar.id) : null),
          name: user.favCharacterName || legacyFavChar?.name || null,
          image: user.favCharacterImage || legacyFavChar?.image || null
        }
      : null;

    // Logros reales desbloqueados
    const achievements = badges.map((ub) => ({
      id: ub.badge.id,
      name: ub.badge.name,
      description: ub.badge.description,
      iconUrl: ub.badge.iconUrl,
      unlockedAt: ub.createdAt.toISOString()
    }));

    // Combinar Actividad Reciente real ordenada por fecha descendente
    type ActivityEvent = {
      id: string;
      type: 'ANIME_LIST' | 'COLLECTION' | 'POST' | 'COMMENT' | 'ACHIEVEMENT';
      title: string;
      status?: string;
      excerpt?: string;
      icon?: string;
      image?: string | null;
      targetId?: string | number | null;
      animeId?: number | null;
      timestamp: string;
    };

    const events: ActivityEvent[] = [];

    for (const item of animeLists.slice(0, 10)) {
      const title = item.anime?.titleEnglish || item.anime?.titleRomaji || `Anime #${item.animeId}`;
      events.push({
        id: `list-${item.id}`,
        type: 'ANIME_LIST',
        title,
        status: item.status,
        image: item.anime?.coverImage || null,
        targetId: item.animeId,
        animeId: item.animeId,
        timestamp: (item.updatedAt || item.createdAt).toISOString()
      });
    }

    const listAnimeIds = new Set(animeLists.map((a) => a.animeId));
    for (const col of enrichedCollections.slice(0, 10)) {
      if (listAnimeIds.has(col.animeId)) continue;
      const title = col.anime?.titleEnglish || col.anime?.titleRomaji || `Anime #${col.animeId}`;
      events.push({
        id: `col-${col.id}`,
        type: 'COLLECTION',
        title,
        status: col.status,
        image: col.anime?.coverImage || null,
        targetId: col.animeId,
        animeId: col.animeId,
        timestamp: (col.updatedAt || col.createdAt).toISOString()
      });
    }

    for (const post of recentPosts) {
      const animeTitle = post.anime?.titleEnglish || post.anime?.titleRomaji;
      events.push({
        id: `post-${post.id}`,
        type: 'POST',
        title: animeTitle || 'Comunidad AniNexo',
        excerpt: truncateText(post.content, 72),
        targetId: post.id,
        animeId: post.animeId,
        timestamp: post.createdAt.toISOString()
      });
    }

    for (const comment of recentComments) {
      const animeTitle = comment.post?.anime?.titleEnglish || comment.post?.anime?.titleRomaji;
      const postRef = animeTitle || truncateText(comment.post?.content, 40) || 'una publicación';
      events.push({
        id: `comment-${comment.id}`,
        type: 'COMMENT',
        title: postRef,
        excerpt: truncateText(comment.content, 72),
        targetId: comment.postId,
        animeId: comment.post?.animeId || null,
        timestamp: comment.createdAt.toISOString()
      });
    }

    for (const ub of badges.slice(0, 8)) {
      events.push({
        id: `badge-${ub.id}`,
        type: 'ACHIEVEMENT',
        title: ub.badge.name,
        excerpt: ub.badge.description,
        icon: ub.badge.iconUrl,
        timestamp: ub.createdAt.toISOString()
      });
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = events.slice(0, 12);

    return {
      ...user,
      favAnime,
      favCharacter,
      badges,
      achievements,
      posts: recentPosts,
      collections: enrichedCollections,
      animeLists,
      recentActivity
    };
  }

  async updateProfile(userId: string, data: any) {
    console.log(`[ProfileService] Actualizando perfil para el usuario ID: ${userId}`);

    const updateData: any = {};

    // Campos básicos
    if (data.bio !== undefined) updateData.bio = typeof data.bio === 'string' ? data.bio.trim() || null : null;
    if (data.firstName !== undefined) updateData.firstName = typeof data.firstName === 'string' ? data.firstName.trim() || null : null;
    if (data.lastName !== undefined) updateData.lastName = typeof data.lastName === 'string' ? data.lastName.trim() || null : null;
    if (data.country !== undefined) updateData.country = typeof data.country === 'string' ? data.country.trim() || null : null;

    // Privacidad / Visual
    if (data.themeColor !== undefined) updateData.themeColor = data.themeColor;
    if (data.archetype !== undefined) updateData.archetype = data.archetype;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl || null;
    if (data.privateProfile !== undefined) updateData.privateProfile = Boolean(data.privateProfile);
    if (data.showWatchList !== undefined) updateData.showWatchList = Boolean(data.showWatchList);

    // Favoritos: Anime Favorito (acepta objeto { id, title, image, coverImage } o campos planos)
    const hasFavAnimePayload =
      data.favAnime !== undefined ||
      data.favAnimeId !== undefined ||
      data.favAnimeTitle !== undefined ||
      data.favAnimeImage !== undefined;

    if (hasFavAnimePayload) {
      if (data.favAnime === null) {
        updateData.favAnimeId = null;
        updateData.favAnimeTitle = null;
        updateData.favAnimeImage = null;
      } else {
        const rawAnime = data.favAnime;
        const nextId = rawAnime?.id !== undefined ? Number(rawAnime.id) : (data.favAnimeId !== undefined ? Number(data.favAnimeId) : undefined);
        const nextTitle = rawAnime?.title !== undefined ? rawAnime.title : data.favAnimeTitle;
        const nextImage = rawAnime?.coverImage ?? rawAnime?.image ?? data.favAnimeImage;

        if (nextId !== undefined) updateData.favAnimeId = Number.isFinite(nextId) && nextId > 0 ? nextId : null;
        if (nextTitle !== undefined) updateData.favAnimeTitle = typeof nextTitle === 'string' ? nextTitle.trim() || null : null;
        if (nextImage !== undefined) updateData.favAnimeImage = typeof nextImage === 'string' ? nextImage.trim() || null : null;
      }
    }

    // Favoritos: Personaje Favorito (acepta objeto { id, name, image } o campos planos)
    const hasFavCharPayload =
      data.favCharacter !== undefined ||
      data.favCharacterId !== undefined ||
      data.favCharacterName !== undefined ||
      data.favCharacterImage !== undefined;

    if (hasFavCharPayload) {
      if (data.favCharacter === null) {
        updateData.favCharacterId = null;
        updateData.favCharacterName = null;
        updateData.favCharacterImage = null;
      } else {
        const rawChar = data.favCharacter;
        const nextId = rawChar?.id !== undefined ? Number(rawChar.id) : (data.favCharacterId !== undefined ? Number(data.favCharacterId) : undefined);
        const nextName = rawChar?.name !== undefined ? rawChar.name : data.favCharacterName;
        const nextImage = rawChar?.image !== undefined ? rawChar.image : data.favCharacterImage;

        if (nextId !== undefined) updateData.favCharacterId = Number.isFinite(nextId) && nextId > 0 ? nextId : null;
        if (nextName !== undefined) updateData.favCharacterName = typeof nextName === 'string' ? nextName.trim() || null : null;
        if (nextImage !== undefined) updateData.favCharacterImage = typeof nextImage === 'string' ? nextImage.trim() || null : null;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        country: true,
        bio: true,
        themeColor: true,
        archetype: true,
        avatarUrl: true,
        privateProfile: true,
        showWatchList: true,
        favAnimeId: true,
        favAnimeTitle: true,
        favAnimeImage: true,
        favCharacterId: true,
        favCharacterName: true,
        favCharacterImage: true,
        intelligence: { select: { socialProfile: true } }
      }
    });

    // Mantener UserIntelligence.socialProfile sincronizado para compatibilidad con vistas existentes
    if (hasFavAnimePayload || hasFavCharPayload) {
      const prevSocial = (updatedUser.intelligence?.socialProfile as any) || {};
      const nextFavAnime = (updatedUser.favAnimeTitle || updatedUser.favAnimeImage)
        ? {
            id: updatedUser.favAnimeId,
            title: updatedUser.favAnimeTitle,
            image: updatedUser.favAnimeImage,
            coverImage: updatedUser.favAnimeImage,
            bannerImage: data.favAnime?.bannerImage || prevSocial?.favAnime?.bannerImage || updatedUser.favAnimeImage
          }
        : null;
      const nextFavCharacter = (updatedUser.favCharacterName || updatedUser.favCharacterImage)
        ? {
            id: updatedUser.favCharacterId,
            name: updatedUser.favCharacterName,
            image: updatedUser.favCharacterImage
          }
        : null;

      await prisma.userIntelligence.upsert({
        where: { userId },
        update: {
          socialProfile: {
            ...prevSocial,
            favAnime: nextFavAnime,
            favCharacter: nextFavCharacter
          }
        },
        create: {
          userId,
          socialProfile: {
            favAnime: nextFavAnime,
            favCharacter: nextFavCharacter
          }
        }
      });
    }

    if (updatedUser.favAnimeId && (updatedUser.favAnimeTitle || updatedUser.favAnimeImage)) {
      upsertAnimeMetadata(updatedUser.favAnimeId, {
        title: updatedUser.favAnimeTitle,
        coverImage: updatedUser.favAnimeImage,
        bannerImage: data.favAnime?.bannerImage || null
      }).catch(() => {});
    }

    await badgeService.syncUserBadges(userId);

    const favAnime = (updatedUser.favAnimeTitle || updatedUser.favAnimeImage)
      ? {
          id: updatedUser.favAnimeId,
          title: updatedUser.favAnimeTitle,
          image: updatedUser.favAnimeImage,
          coverImage: updatedUser.favAnimeImage,
          bannerImage: data.favAnime?.bannerImage || (updatedUser.intelligence?.socialProfile as any)?.favAnime?.bannerImage || updatedUser.favAnimeImage
        }
      : null;

    const favCharacter = (updatedUser.favCharacterName || updatedUser.favCharacterImage)
      ? {
          id: updatedUser.favCharacterId,
          name: updatedUser.favCharacterName,
          image: updatedUser.favCharacterImage
        }
      : null;

    return {
      ...updatedUser,
      favAnime,
      favCharacter
    };
  }
}
