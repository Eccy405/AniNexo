import prisma from '../../lib/prisma';
import { BadgeService } from '../social/badge.service';

const badgeService = new BadgeService();

export class UserIntelligenceService {
  /**
   * Procesa las respuestas del cuestionario inicial y genera el perfil base del usuario.
   */
  async setupInitialProfile(userId: string, data: any) {
    const { 
      genres = [], 
      emotions = [], 
      themeColor,
      avatarUrl,
      favAnime,
      favCharacter,
      esthetic,
      firstName,
      lastName,
      bio,
      country
    } = data;

    console.log(`[UserIntelligenceService] Iniciando configuración de perfil para: ${userId}`);

    const avatar = avatarUrl;
    const archetype = this.calculateArchetype(data);

    const parsedFavAnimeId = favAnime?.id ? Number(favAnime.id) : null;
    const parsedFavAnimeTitle = typeof favAnime === 'string'
      ? favAnime.trim() || null
      : (favAnime?.title?.trim() || null);
    const parsedFavAnimeImage = favAnime?.coverImage || favAnime?.image || favAnime?.bannerImage || null;

    const parsedFavCharId = favCharacter?.id ? Number(favCharacter.id) : null;
    const parsedFavCharName = typeof favCharacter === 'string'
      ? favCharacter.trim() || null
      : (favCharacter?.name?.trim() || null);
    const parsedFavCharImage = favCharacter?.image || null;

    const cleanBio = typeof bio === 'string' && bio.trim().length > 0 ? bio.trim() : undefined;

    // Actualizar Usuario Principal con Identidad, Favoritos y Estética reales
    await prisma.user.update({
      where: { id: userId },
      data: { 
        archetype,
        themeColor: themeColor || "#00E5FF",
        avatarUrl: avatar || undefined,
        firstName: firstName !== undefined ? (firstName?.trim() || null) : undefined,
        lastName: lastName !== undefined ? (lastName?.trim() || null) : undefined,
        country: country !== undefined ? (country?.trim() || null) : undefined,
        ...(cleanBio !== undefined ? { bio: cleanBio } : {}),
        ...(favAnime !== undefined ? {
          favAnimeId: Number.isFinite(parsedFavAnimeId as number) ? parsedFavAnimeId : null,
          favAnimeTitle: parsedFavAnimeTitle,
          favAnimeImage: parsedFavAnimeImage
        } : {}),
        ...(favCharacter !== undefined ? {
          favCharacterId: Number.isFinite(parsedFavCharId as number) ? parsedFavCharId : null,
          favCharacterName: parsedFavCharName,
          favCharacterImage: parsedFavCharImage
        } : {})
      }
    });

    // Crear/Actualizar Inteligencia de Usuario (Emotion Profile + Favorites)
    const emotionProfile: any = {};
    emotions.forEach((e: string) => emotionProfile[e] = true);

    await prisma.userIntelligence.upsert({
      where: { userId },
      update: {
        emotionProfile,
        socialProfile: { esthetic: esthetic || themeColor, favAnime, favCharacter },
      },
      create: {
        userId,
        emotionProfile,
        socialProfile: { esthetic: esthetic || themeColor, favAnime, favCharacter },
      }
    });

    // Guardar Afinidades (Géneros) con Limpieza Previa
    await prisma.userAffinity.deleteMany({
      where: { userId, category: 'GENRE' }
    });

    const affinityPromises = genres.map((g: string) => this.saveAffinity(userId, 'GENRE', g, 1.0));
    await Promise.all(affinityPromises);

    await badgeService.syncUserBadges(userId);

    return { archetype, themeColor };
  }

  private async saveAffinity(userId: string, category: string, name: string, weight: number) {
    return prisma.userAffinity.upsert({
      where: { 
        userId_category_name: { userId, category, name } 
      },
      update: { weight },
      create: { userId, category, name, weight }
    });
  }

  private calculateArchetype(data: any): string {
    const genres = data.genres || [];
    const emotions = data.emotions || [];
    
    if (genres.includes('Psicologico') || genres.includes('Misterio')) {
      return 'Dark Strategist';
    }

    if (emotions.includes('Llorar') || emotions.includes('Inspirarme') || genres.includes('Romance')) {
      return 'Emotional Explorer';
    }

    if (genres.includes('Acción') || emotions.includes('Adrenalina')) {
      return 'Adrenaline Seeker';
    }

    if (genres.includes('Slice of Life') || emotions.includes('Relajarme')) {
      return 'Chill Traveler';
    }

    return 'AniNexo Explorer';
  }
}
