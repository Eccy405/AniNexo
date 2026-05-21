import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../lib/prisma';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder_client_secret',
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email found from Google'));

      // 1. Buscar si ya tiene una cuenta vinculada a este Google ID
      let oauthAccount = await prisma.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'GOOGLE',
            providerAccountId: profile.id
          }
        },
        include: { user: true }
      });

      if (oauthAccount) {
        return done(null, oauthAccount.user);
      }

      // 2. Si no, buscar si existe un usuario con ese email
      let user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Crear nuevo usuario si no existe
        user = await prisma.user.create({
          data: {
            email,
            username: `user_${profile.id.slice(-6)}`, 
            passwordHash: '', 
            firstName: profile.name?.givenName || 'Google',
            lastName: profile.name?.familyName || 'User',
            avatarUrl: profile.photos?.[0]?.value || null,
            isVerified: true 
          }
        });
      }

      // 3. Vincular la cuenta de Google al usuario
      await prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: 'GOOGLE',
          providerAccountId: profile.id
        }
      });

      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }
));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
