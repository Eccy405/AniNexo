import prisma from '../../lib/prisma';

export class ProfileService {
  async getProfileByUsername(username: string) {
    console.log(`[ProfileService] Buscando perfil para: "${username}"`);
    
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username
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
        intelligence: true,
        affinities: true,
        isVerified: true,
        _count: {
          select: { followers: true, following: true, posts: true }
        },
        badges: {
          include: { badge: true }
        },
        posts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { likes: true, comments: true } }
          }
        }
      }
    });

    if (!user) {
      console.log(`[ProfileService] Perfil NO encontrado: "${username}"`);
      throw new Error('Usuario no encontrado');
    }

    console.log(`[ProfileService] Perfil encontrado para: "${username}" (ID: ${user.id})`);
    return user;
  }

  async updateProfile(userId: string, data: any) {
    console.log(`[ProfileService] Actualizando perfil para el usuario ID: ${userId}`);
    
    const updateData: any = {};
    
    // Campos básicos
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.country !== undefined) updateData.country = data.country;
    
    // Personalización visual y arquetipo
    if (data.themeColor !== undefined) updateData.themeColor = data.themeColor;
    if (data.archetype !== undefined) updateData.archetype = data.archetype;

    return await prisma.user.update({
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
        archetype: true
      }
    });
  }
}
