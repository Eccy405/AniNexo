import csrf from 'csurf';
import type { Request, Response, NextFunction } from 'express';

// csurf expects a session or cookie parser; we use cookie‑based tokens
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
});

// Helper to expose token to views / APIs
export const attachCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    httpOnly: false, // readable by client JS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  next();
};
