import { Router } from 'express';
import { AuthController } from './auth.controller';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = Router();
const authController = new AuthController();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_dev';

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
    res.redirect(`http://localhost:3000/auth-callback?token=${token}`);
  }
);

export default router;
