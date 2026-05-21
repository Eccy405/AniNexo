import nodemailer from 'nodemailer';

export class MailService {
  private transporter;

  constructor() {
    // Configuración para Desarrollo (Ethereal o Mailtrap recomendado para pruebas)
    // Para producción, aquí irían los datos de Gmail/Outlook/SendGrid
    // Configuración para Gmail con tusoportenexo@gmail.com
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER || 'tusoportenexo@gmail.com',
        pass: process.env.MAIL_PASS // Aquí debe ir la "Contraseña de aplicación" de 16 caracteres
      }
    });
  }

  async sendVerificationCode(email: string, code: string) {
    const mailOptions = {
      from: '"AniNexo Security" <security@aninexo.com>',
      to: email,
      subject: 'Verifica tu cuenta de AniNexo',
      html: `
        <div style="font-family: sans-serif; background: #050505; color: white; padding: 40px; border-radius: 20px; text-align: center;">
          <h1 style="color: #00E5FF;">¡Bienvenido a AniNexo!</h1>
          <p>Para activar tu cuenta y empezar tu aventura, ingresa el siguiente código de verificación:</p>
          <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; display: inline-block; margin: 20px 0;">
            <span style="font-size: 2.5rem; font-weight: 900; letter-spacing: 10px; color: #00E5FF;">${code}</span>
          </div>
          <p style="color: #666; font-size: 0.8rem;">Este código expirará en 30 minutos.</p>
          <hr style="border: 0; border-top: 1px solid #222; margin: 30px 0;">
          <p style="font-size: 0.7rem; color: #444;">Si no creaste una cuenta en AniNexo, ignora este correo.</p>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent:', nodemailer.getTestMessageUrl(info));
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}
