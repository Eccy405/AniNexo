import helmet from 'helmet';
import type { Request, Response, NextFunction } from 'express';

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  const customClients = (process.env.CLIENT_URL || process.env.CORS_ORIGIN || '')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);

  const connectSources = [
    "'self'",
    'https://aninexo.pages.dev',
    'https://*.aninexo.pages.dev',
    'https://aninexo.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...customClients
  ];

  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: connectSources,
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    referrerPolicy: { policy: 'no-referrer' },
    hidePoweredBy: true,
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    dnsPrefetchControl: { allow: false },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' }
  })(req, res, next);
};
