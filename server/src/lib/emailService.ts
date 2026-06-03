import prisma from './prisma';
import { logger } from './logger';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

export class EmailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
  /**
   * Encola un email para envío asíncrono
   */
  async queueEmail(to: string, template: string, subject: string, data: any) {
    try {
      return await prisma.emailLog.create({
        data: {
          to,
          subject,
          template: JSON.stringify({ name: template, data }),
          status: 'PENDING'
        }
      });
    } catch (error) {
      logger.error('Error queuing email', error);
    }
  }

  /**
   * Procesa la cola de correos (Ejecutado por un worker o cron)
   */
  async processQueue() {
    const pending = await prisma.emailLog.findMany({
      where: { status: 'PENDING', attempts: { lt: 3 } },
      take: 10
    });

    for (const email of pending) {
      await this.sendFromLog(email);
    }
  }

  private async sendFromLog(log: any) {
    try {
      const { name, data } = JSON.parse(log.template);
      const html = await this.renderTemplate(name, data);

      // Envío real utilizando el transporte nodemailer
      logger.info(`[EmailService] ENVIANDO REAL: ${log.subject} a ${log.to}`);
      await this.transporter.sendMail({
        from: `"AniNexo" <${process.env.MAIL_USER}>`,
        to: log.to,
        subject: log.subject,
        html: html
      });
      
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          attempts: log.attempts + 1
        }
      });
    } catch (error: any) {
      logger.error(`Error sending email ${log.id}`, error);
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: 'FAILED',
          attempts: log.attempts + 1,
          lastError: error.message
        }
      });
    }
  }

  private async renderTemplate(name: string, data: any): Promise<string> {
    const templatePath = path.join(__dirname, 'emailTemplates', `${name.toLowerCase()}.html`);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template ${name} not found`);
    }

    let html = fs.readFileSync(templatePath, 'utf8');

    // Reemplazo simple de variables {{variable}}
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key]);
    });

    return html;
  }

  /**
   * Método de conveniencia que encola inmediatamente (Legacy support)
   */
  async sendTemplateEmail(to: string, template: string, data: any) {
    const subjects: any = {
      WELCOME: '¡Bienvenido a la Dimensión AniNexo!',
      RECOVERY: 'Recuperación de Acceso - AniNexo',
      NOTIFICATION: 'Tienes una nueva actualización en AniNexo'
    };

    return this.queueEmail(to, template, subjects[template] || 'Notificación AniNexo', data);
  }
}

export const emailService = new EmailService();
