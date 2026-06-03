import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MailService } from '../mail/mail.service';

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is missing on the server!');
}


export class AuthService {
  private mailService: MailService;

  constructor() {
    this.mailService = new MailService();
  }

  async register(data: any) {
    const { email, username, password: passwordRaw, firstName, lastName, birthDate, gender, country } = data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      throw new Error('El correo electrónico o nombre de usuario ya está en uso');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordRaw, salt);

    // Generar Código de Verificación de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        firstName,
        lastName,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        country,
        verificationCode,
        isVerified: false
      }
    });

    // Enviar Email (Async)
    console.log('-------------------------------------------');
    console.log(`[AUTH] Código de Verificación para ${email}: ${verificationCode}`);
    console.log('-------------------------------------------');
    this.mailService.sendVerificationCode(email, verificationCode);

    const token = this.generateToken(newUser.id, newUser.role);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        isVerified: newUser.isVerified
      },
      token,
      verificationCode: verificationCode // TODO: REMOVE IN PRODUCTION (DEV BYPASS)
    };
  }

  async verifyCode(userId: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.verificationCode !== code) {
      throw new Error('Código de verificación inválido');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { 
        isVerified: true,
        verificationCode: null // Limpiar tras verificar
      }
    });

    return { success: true, message: 'Cuenta verificada correctamente' };
  }

  async login(identifier: string, passwordHashRaw: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(passwordHashRaw, user.passwordHash);

    if (!isMatch) {
      throw new Error('Credenciales inválidas');
    }

    const token = this.generateToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isPremium: user.isPremium
      },
      token
    };
  }

  private generateToken(userId: string, role: string) {
    return jwt.sign({ id: userId, role }, JWT_SECRET, {
      expiresIn: '7d'
    });
  }
}
