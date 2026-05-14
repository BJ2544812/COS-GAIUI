import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Default to a configuration that might exist in .env
    // If not, we could use a mock or a console logger
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
      console.log('EmailService: SMTP Transporter initialized');
    } else {
      // Mock Transporter for development/no-config
      this.transporter = nodemailer.createTransport({
        streamConfig: true,
        jsonTransport: true
      } as any);
      console.log('EmailService: Mock Transporter initialized (No SMTP config found)');
    }
  }

  async sendEmail(to: string, subject: string, html: string) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Kingdom OS" <noreply@kingdomos.local>',
      to,
      subject,
      html
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Email sent:', info.messageId);
        // If mock, it might just log the JSON
        if ((info as any).message) {
            console.log('Message Content:', (info as any).message);
        }
      }
      return info;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendPasswordReset(to: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; rounded: 24px;">
        <h2 style="color: #0f172a; font-weight: 900; text-transform: uppercase; letter-spacing: -0.025em;">Password Reset Request</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">You requested a password reset for your Kingdom OS account. Click the button below to set a new password.</p>
        <div style="margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
        <p style="color: #cbd5e1; font-size: 10px; font-weight: 700; text-transform: uppercase;">Deterministic Security Protocol v1.0</p>
      </div>
    `;
    return this.sendEmail(to, 'Reset your password — Kingdom OS', html);
  }
}

export const emailService = new EmailService();
