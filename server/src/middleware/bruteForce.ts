import { Request, Response, NextFunction } from 'express';

// Simple in‑memory store (replace with Redis for production)
const attempts: Record<string, { count: number; lastAttempt: number }> = {};

const MAX_ATTEMPTS = 5; // after which lock
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

export const bruteForceProtection = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip;
  const now = Date.now();

  const record = attempts[ip] || { count: 0, lastAttempt: now };

  // Reset after lock period
  if (now - record.lastAttempt > LOCK_TIME_MS) {
    record.count = 0;
  }

  if (record.count >= MAX_ATTEMPTS) {
    const wait = Math.ceil((LOCK_TIME_MS - (now - record.lastAttempt)) / 1000);
    return res.status(429).json({ success: false, message: `Too many login attempts. Try again in ${wait}s.` });
  }

  // expose helper to increment on failed login
  (req as any).incrementLoginFailures = () => {
    record.count += 1;
    record.lastAttempt = Date.now();
    attempts[ip] = record;
  };

  next();
};
