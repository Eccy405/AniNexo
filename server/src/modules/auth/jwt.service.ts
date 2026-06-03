import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import prisma from '../../lib/prisma';
import { redis } from '../../lib/redis';

const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

export class JwtService {
  static generateAccessToken(user: any) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );
  }

  static async generateRefreshToken(userId: string) {
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt
      }
    });

    return token;
  }

  static async rotateRefreshToken(oldToken: string) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: oldToken },
      include: { user: true }
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      // Si el token no existe o expiró, revocamos todo por seguridad si es un intento de reutilización
      if (tokenRecord) {
        await this.revokeAllUserTokens(tokenRecord.userId);
      }
      throw new Error('Invalid or expired refresh token');
    }

    // Revocar el token viejo
    await prisma.refreshToken.delete({ where: { token: oldToken } });

    // Generar nuevos tokens
    const accessToken = this.generateAccessToken(tokenRecord.user);
    const newRefreshToken = await this.generateRefreshToken(tokenRecord.userId);

    return { accessToken, refreshToken: newRefreshToken };
  }

  static async revokeAllUserTokens(userId: string) {
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });
    
    // Opcional: Agregar a blacklist de Redis si queremos invalidar Access Tokens inmediatamente
    await redis.set(`blacklist:user:${userId}`, 'true', 'EX', 900); // 15 mins
  }
}
