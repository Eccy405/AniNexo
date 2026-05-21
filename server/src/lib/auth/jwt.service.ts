import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const JWT_EXPIRES_IN = '1h';
const REFRESH_EXPIRES_IN = '7d';

export interface JwtPayload {
  id: string;
  role: string;
  isPremium: boolean;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

// Refresh token handling
export const createRefreshToken = async (userId: string): Promise<string> => {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  await prisma.refreshToken.create({
    data: { userId, token, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });
  return token;
};

export const verifyRefreshToken = async (token: string): Promise<string | null> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const stored = await prisma.refreshToken.findUnique({ where: { token: token } });
    if (!stored) return null;
    return decoded.userId;
  } catch {
    return null;
  }
};
