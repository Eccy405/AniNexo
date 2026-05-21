import { Router } from 'express';
import { AuthController } from './auth.controller';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = Router();
const authController = new AuthController();
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is missing on the server!');
}

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify', authController.verify);

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const user = req.user as any;
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    // Redirigir al frontend con el token (usando una página de callback)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/auth-callback?token=${token}`);
  }
);

export default router;
