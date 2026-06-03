import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { validateRegister, validateLogin } from './auth.validator';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, username, password, confirmPassword } = req.body;

      if (!email || !username || !password) {
        return res.status(400).json({ success: false, message: 'Correo, usuario y contraseña son obligatorios' });
      }

      // Validar con las reglas del pizarrón
      const validation = validateRegister({
        firstName: req.body.firstName || '',
        lastName: req.body.lastName || '',
        email,
        username,
        password,
        confirmPassword: confirmPassword || password,
        birthDate: req.body.birthDate || '',
        gender: req.body.gender || '',
        country: req.body.country || ''
      });

      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.errors[0], errors: validation.errors });
      }

      const result = await this.authService.register(req.body);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, identifier, password } = req.body;
      const loginIdentifier = identifier || email;

      if (!loginIdentifier || !password) {
        return res.status(400).json({ success: false, message: 'Usuario/Correo y contraseña son obligatorios' });
      }

      const validation = validateLogin({ identifier: loginIdentifier, password });
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.errors[0], errors: validation.errors });
      }

      const result = await this.authService.login(loginIdentifier, password);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  };

  verify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, code } = req.body;

      if (!userId || !code) {
        return res.status(400).json({ success: false, message: 'ID de usuario y código son requeridos' });
      }

      const result = await this.authService.verifyCode(userId, code);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
