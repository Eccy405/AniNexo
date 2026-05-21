import { Request, Response, NextFunction } from 'express';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as any);

const sanitize = (data: any): any => {
  if (typeof data === 'string') {
    return DOMPurify.sanitize(data);
  }
  if (Array.isArray(data)) {
    return data.map(v => sanitize(v));
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const key in data) {
      sanitized[key] = sanitize(data[key]);
    }
    return sanitized;
  }
  return data;
};

export const sanitizerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeInPlace = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = DOMPurify.sanitize(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitizeInPlace(obj[key]);
      }
    }
  };

  if (req.body) sanitizeInPlace(req.body);
  if (req.query) sanitizeInPlace(req.query);
  if (req.params) sanitizeInPlace(req.params);
  
  next();
};
