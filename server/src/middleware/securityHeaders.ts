import helmet from 'helmet';
import type { Request, Response, NextFunction } from 'express';

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.CLIENT_URL ?? '' ],
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
