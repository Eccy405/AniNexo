import type { Request, Response, NextFunction } from 'express';

// Mock/placeholder CSRF middleware since the backend currently doesn't enforce it
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const attachCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  next();
};
