import prisma from '../../lib/prisma';

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
    console.log(`[UserIntelligenceService] Datos de entrada:`, JSON.stringify({ genres, emotions, favAnime, favCharacter }, null, 2));

    const avatar = avatarUrl;
    const archetype = this.calculateArchetype(data);
    
    // 2. Actualizar Usuario Principal con Identidad y Estética
    await prisma.user.update({
      where: { id: userId },
      data: { 
        archetype,
        themeColor: themeColor || "#00E5FF",
        avatarUrl: avatar || null,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        country: country || undefined,
        bio: bio || `Explorador de Nexo. Fan de ${favAnime?.title || favAnime || 'lo desconocido'}.`
      }
    });

    // 3. Crear Inteligencia de Usuario (Emotion Profile + Favorites)
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

    // 4. Guardar Afinidades (Géneros) con Limpieza Previa
    console.log(`[UserIntelligenceService] Sincronizando ${genres.length} géneros para ${userId}`);
    await prisma.userAffinity.deleteMany({
      where: { userId, category: 'GENRE' }
    });

    const affinityPromises = genres.map((g: string) => this.saveAffinity(userId, 'GENRE', g, 1.0));
    await Promise.all(affinityPromises);

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

    return 'AniNexo Explorer'; // Default
  }
}
