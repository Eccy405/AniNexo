import prisma from '../../lib/prisma';
import { NotificationService } from '../notification/notification.service';
import { NexoAutomation } from '../nexo/nexo.automation';

const notificationService = new NotificationService();
const nexoAutomation = new NexoAutomation();

export interface BadgeDefinition {
  name: string;
  description: string;
  iconUrl: string;
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  {
    name: 'Miembro Fundador',
    description: 'Cuenta verificada durante el lanzamiento de AniNexo (2026).',
    iconUrl: '🌟'
  },
  {
    name: 'Identidad Nexo',
    description: 'Configuraste tu biografía, anime favorito y personaje favorito.',
    iconUrl: '🎭'
  },
  {
    name: 'Primer Paso',
    description: 'Añadiste tu primer anime a tu lista o colección.',
    iconUrl: '🎬'
  },
  {
    name: 'Maratón Otaku',
    description: 'Registraste 5 o más animes en tu colección o 24 episodios vistos.',
    iconUrl: '🔥'
  },
  {
    name: 'Coleccionista',
    description: 'Completaste 10 o más animes en tu lista de seguimiento.',
    iconUrl: '💎'
  },
  {
    name: 'Primer Post',
    description: 'Compartiste tu primera publicación en la comunidad.',
    iconUrl: '📝'
  },
  {
    name: 'Voz del Nexo',
    description: 'Escribiste al menos 3 comentarios en publicaciones de la comunidad.',
    iconUrl: '💬'
  },
  {
    name: 'Socialite',
    description: 'Seguiste a 5 o más usuarios dentro de AniNexo.',
    iconUrl: '🤝'
  },
  {
    name: 'Racha Dimensional',
    description: 'Visitaste o registraste actividad en AniNexo en 3 o más días distintos.',
    iconUrl: '⚡'
  }
];

export class BadgeService {
  private static catalogPromise: Promise<Map<string, string>> | null = null;

  /**
   * Garantiza que todas las medallas del catálogo existan en PostgreSQL.
   */
  async ensureCatalogSeeded(): Promise<Map<string, string>> {
    if (!BadgeService.catalogPromise) {
      BadgeService.catalogPromise = (async () => {
        const badges = await Promise.all(
          BADGE_CATALOG.map((def) =>
            prisma.badge.upsert({
              where: { name: def.name },
              update: {
                description: def.description,
                iconUrl: def.iconUrl
              },
              create: {
                name: def.name,
                description: def.description,
                iconUrl: def.iconUrl
              }
            })
          )
        );
        return new Map<string, string>(badges.map((b) => [b.name, b.id]));
      })().catch((err) => {
        BadgeService.catalogPromise = null;
        throw err;
      });
    }
    return BadgeService.catalogPromise;
  }

  /**
   * Evalúa el progreso real del usuario en la base de datos y desbloquea logros elegibles.
   */
  async syncUserBadges(userId: string) {
    try {
      const badgeMap = await this.ensureCatalogSeeded();

      const [
        user,
        animeLists,
        collections,
        postsCount,
        commentsCount,
        followingCount,
        viewHistory,
        sessions,
        existingUserBadges
      ] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            isVerified: true,
            createdAt: true,
            bio: true,
            favAnimeTitle: true,
            favCharacterName: true,
            intelligence: { select: { socialProfile: true } }
          }
        }),
        prisma.animeList.findMany({
          where: { userId },
          select: { animeId: true, status: true, progress: true, updatedAt: true }
        }),
        prisma.userCollection.findMany({
          where: { userId },
          select: { animeId: true, updatedAt: true }
        }),
        prisma.post.count({ where: { userId } }),
        prisma.comment.count({ where: { userId } }),
        prisma.follow.count({ where: { followerId: userId } }),
        prisma.viewHistory.findMany({
          where: { userId },
          take: 60,
          orderBy: { updatedAt: 'desc' },
          select: { updatedAt: true }
        }),
        prisma.userSession.findMany({
          where: { userId },
          take: 60,
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        }),
        prisma.userBadge.findMany({
          where: { userId },
          select: { badgeId: true }
        })
      ]);

      if (!user) return;

      const socialProfile = (user.intelligence?.socialProfile as any) || {};
      const distinctAnimes = new Set<number>([
        ...animeLists.map((a) => a.animeId),
        ...collections.map((c) => c.animeId)
      ]);
      const completedAnimes = animeLists.filter((a) => a.status === 'COMPLETED').length;
      const totalEpisodes = animeLists.reduce((sum, a) => sum + (a.progress || 0), 0);

      const activityDays = new Set<string>();
      for (const v of viewHistory) activityDays.add(v.updatedAt.toISOString().slice(0, 10));
      for (const s of sessions) activityDays.add(s.createdAt.toISOString().slice(0, 10));
      for (const a of animeLists) activityDays.add(a.updatedAt.toISOString().slice(0, 10));
      for (const c of collections) activityDays.add(c.updatedAt.toISOString().slice(0, 10));

      const unlockedIds = new Set(existingUserBadges.map((ub) => ub.badgeId));

      const hasBio = Boolean(user.bio && user.bio.trim().length > 0);
      const hasFavAnime = Boolean(user.favAnimeTitle || socialProfile?.favAnime?.title);
      const hasFavCharacter = Boolean(user.favCharacterName || socialProfile?.favCharacter?.name);

      const eligibility: Record<string, boolean> = {
        'Miembro Fundador': Boolean(user.isVerified && user.createdAt <= new Date('2026-12-31T23:59:59Z')),
        'Identidad Nexo': hasBio && hasFavAnime && hasFavCharacter,
        'Primer Paso': distinctAnimes.size >= 1,
        'Maratón Otaku': distinctAnimes.size >= 5 || totalEpisodes >= 24,
        'Coleccionista': completedAnimes >= 10,
        'Primer Post': postsCount >= 1,
        'Voz del Nexo': commentsCount >= 3,
        'Socialite': followingCount >= 5,
        'Racha Dimensional': activityDays.size >= 3
      };

      const toCreate: { userId: string; badgeId: string }[] = [];
      for (const [name, qualified] of Object.entries(eligibility)) {
        if (!qualified) continue;
        const badgeId = badgeMap.get(name);
        if (badgeId && !unlockedIds.has(badgeId)) {
          toCreate.push({ userId, badgeId });
        }
      }

      if (toCreate.length > 0) {
        await prisma.userBadge.createMany({
          data: toCreate,
          skipDuplicates: true
        });
      }
    } catch (error) {
      console.error('[BadgeService]: Error sincronizando logros del usuario', error);
    }
  }

  /**
   * Otorga una medalla a un usuario si cumple los requisitos y no la tiene ya.
   */
  async awardBadgeIfEligible(userId: string, badgeName: string) {
    try {
      await this.ensureCatalogSeeded();

      // 1. Verificar si el usuario ya tiene la medalla
      const existingBadge = await prisma.userBadge.findFirst({
        where: {
          userId,
          badge: { name: badgeName }
        }
      });

      if (existingBadge) return;

      // 2. Buscar la medalla en la DB
      const badge = await prisma.badge.findUnique({
        where: { name: badgeName }
      });

      if (!badge) {
        console.warn(`[BadgeService]: La medalla "${badgeName}" no existe en la base de datos.`);
        return;
      }

      // 3. Otorgar medalla
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id
        }
      });

      // 4. Notificar al usuario (Persistente + Socket + Push/Email si configurado)
      await notificationService.createNotification(userId, 'SYSTEM', {
        title: '¡Nueva Medalla Ganada!',
        message: `Has ganado la medalla: ${badgeName} ${badge.iconUrl}`,
        referenceId: badge.id
      });

      // Trigger Nexo Automation (Proactive message)
      await nexoAutomation.congratulateForBadge(userId, badgeName);

      console.log(`[BadgeService]: Medalla "${badgeName}" otorgada al usuario ${userId}`);
    } catch (error) {
      console.error('[BadgeService]: Error al otorgar medalla', error);
    }
  }

  /**
   * Lógica específica para medallas de conteo (ej. Coleccionista de Anime)
   */
  async checkAnimeCollector(userId: string) {
    await this.syncUserBadges(userId);
  }

  /**
   * Lógica para medallas sociales
   */
  async checkSocialite(userId: string) {
    await this.syncUserBadges(userId);
  }
}
