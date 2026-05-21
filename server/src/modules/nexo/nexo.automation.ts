import prisma from '../../lib/prisma';
import { NexoService } from './nexo.service';
import { MessagingService } from '../messaging/messaging.service';
import { socketService } from '../../lib/socketService';

const nexoService = new NexoService();
const messagingService = new MessagingService();

export class NexoAutomation {
  /**
   * Ejecuta una tarea proactiva de Nexo para un usuario Premium.
   */
  async congratulateForBadge(userId: string, badgeName: string) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.isPremium) return;

      // Buscar o crear conversación con Nexo
      const nexoUser = await this.getNexoUser();
      const conversation = await messagingService.createOrGetConversation(userId, nexoUser.id);

      const message = `¡Hey ${user.username}! Acabo de ver que has ganado la medalla "${badgeName}". ¡Excelente trabajo, maestro! Sigue así y pronto dominarás todo el catálogo de AniNexo. 🚀`;

      await messagingService.sendMessage(conversation.id, nexoUser.id, message);
      socketService.emitToRoom(`conv_${conversation.id}`, 'new_message', {
        sender: { username: 'Nexo', avatarUrl: nexoUser.avatarUrl },
        content: message,
        createdAt: new Date()
      });

      console.log(`[NexoAutomation]: Felicitación enviada a ${user.username}`);
    } catch (error) {
      console.error('[NexoAutomation]: Error en congratulateForBadge', error);
    }
  }

  /**
   * Envía una recomendación basada en la última actividad
   */
  async sendProactiveRecommendation(userId: string) {
    try {
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        include: { animeLists: { take: 1, orderBy: { updatedAt: 'desc' } } }
      });

      if (!user || !user.isPremium || user.animeLists.length === 0) return;

      const lastAnime = user.animeLists[0];
      if (!lastAnime) return;
      
      const nexoUser = await this.getNexoUser();
      const conversation = await messagingService.createOrGetConversation(userId, nexoUser.id);

      const aiResponse = await nexoService.chatWithNexo(userId, `El usuario acaba de terminar/actualizar el anime con ID ${lastAnime.animeId}. Recomiéndale algo similar en un mensaje breve y amigable.`);

      await messagingService.sendMessage(conversation.id, nexoUser.id, aiResponse);
      socketService.emitToRoom(`conv_${conversation.id}`, 'new_message', {
        sender: { username: 'Nexo', avatarUrl: nexoUser.avatarUrl },
        content: aiResponse,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('[NexoAutomation]: Error en sendProactiveRecommendation', error);
    }
  }

  private async getNexoUser() {
    let nexoUser = await prisma.user.findUnique({ where: { username: 'Nexo' } });
    if (!nexoUser) {
      nexoUser = await prisma.user.create({
        data: {
          username: 'Nexo',
          email: 'nexo@aninexo.com',
          passwordHash: 'AI_VIRTUAL_USER',
          role: 'ADMIN',
          avatarUrl: 'https://img.icons8.com/fluency/96/artificial-intelligence.png'
        }
      });
    }
    return nexoUser;
  }
}
