import Stripe from 'stripe';
import prisma from '../../lib/prisma';
import { notificationService } from '../notification/notification.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-01-27.acacia' as any,
});

export class PremiumService {
  async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isPremium: true,
        premiumUntil: true,
        premiumStatus: true,
        premiumRequestNote: true,
        premiumRequestedAt: true,
        role: true
      }
    });
    if (!user) throw new Error('Usuario no encontrado');
    return user;
  }

  async requestPremiumActivation(userId: string, note?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        isPremium: true,
        premiumStatus: true
      }
    });
    if (!user) throw new Error('Usuario no encontrado');

    if (user.isPremium) {
      throw new Error('Tu cuenta ya cuenta con membresía Premium activa.');
    }

    if (user.premiumStatus === 'PENDING') {
      return {
        alreadyPending: true,
        premiumStatus: 'PENDING',
        message: 'Ya tienes una solicitud en revisión por un Administrador.'
      };
    }

    const sanitizedNote = typeof note === 'string' && note.trim() ? note.trim().slice(0, 500) : null;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: false,
        premiumStatus: 'PENDING',
        premiumRequestNote: sanitizedNote,
        premiumRequestedAt: new Date()
      },
      select: {
        id: true,
        username: true,
        isPremium: true,
        premiumUntil: true,
        premiumStatus: true,
        premiumRequestNote: true,
        premiumRequestedAt: true
      }
    });

    // Notificar en tiempo real a todos los administradores
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: { id: true }
    });

    const notePreview = sanitizedNote ? ` Nota: "${sanitizedNote.slice(0, 120)}"` : '';
    await Promise.allSettled(
      admins.map((admin) =>
        notificationService.createNotification(admin.id, 'SYSTEM', {
          title: 'Nueva solicitud Premium',
          message: `@${user.username} solicitó la activación de AniNexo Premium.${notePreview}`,
          referenceId: `PREMIUM_REQ:${user.id}`
        })
      )
    );

    return {
      alreadyPending: false,
      premiumStatus: updated.premiumStatus,
      premiumRequestedAt: updated.premiumRequestedAt,
      premiumRequestNote: updated.premiumRequestNote,
      message: 'Solicitud enviada correctamente. Un administrador revisará tu activación pronto.'
    };
  }

  async createCheckoutSession(userId: string) {
    // Bloquear auto-activación directa en modo demo/mock
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        'La auto-activación directa está deshabilitada. Envía una solicitud para verificación manual por un Administrador.'
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuario no encontrado');

    if (user.isPremium) {
      throw new Error('El usuario ya es Premium');
    }

    // Flujo real de Stripe
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'AniNexo Premium Subscription',
                description: 'Acceso a Nexo AI Avanzado y funciones exclusivas',
              },
              unit_amount: 499, // $4.99
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/home/premium?success=true`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/home/premium?canceled=true`,
        client_reference_id: userId,
      });

      return { url: session.url };
    } catch (error) {
      console.error('Stripe error:', error);
      throw new Error('No se pudo crear la sesión de pago');
    }
  }

  async handleWebhook(event: any) {
    if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe webhook verification is not configured');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.client_reference_id;

      if (userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              isPremium: true,
              premiumStatus: 'APPROVED',
              role: user.role === 'USER' ? 'PREMIUM' : user.role,
              premiumUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            }
          });
        }
      }
    }
  }
}
