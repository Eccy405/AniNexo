import Stripe from 'stripe';
import prisma from '../../lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-01-27.acacia' as any,
});

export class PremiumService {
  async createCheckoutSession(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuario no encontrado');

    if (user.isPremium) {
      throw new Error('El usuario ya es Premium');
    }

    // Mock flow si no hay API key
    if (!process.env.STRIPE_SECRET_KEY) {
      // Directamente actualizamos al usuario para propósitos de demostración
      await prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: true,
          role: user.role === 'USER' ? 'PREMIUM' : user.role, // Solo subir a Premium si es USER normal
          premiumUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // 1 año
        }
      });
      return { url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/premium?success=true&mock=true` };
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
        mode: 'payment', // O 'subscription' dependiendo de la necesidad
        success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/premium?success=true`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/premium?canceled=true`,
        client_reference_id: userId,
      });

      return { url: session.url };
    } catch (error) {
      console.error('Stripe error:', error);
      throw new Error('No se pudo crear la sesión de pago');
    }
  }

  async handleWebhook(event: any) {
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
              role: user.role === 'USER' ? 'PREMIUM' : user.role,
              premiumUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            }
          });
        }
      }
    }
  }
}
