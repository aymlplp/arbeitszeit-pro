import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendWelcomeEmail = async (email: string, name?: string | null) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Arbeitszeit Pro" <no-reply@arbeitszeit.app>',
      to: email,
      subject: 'Willkommen bei Arbeitszeit Pro!',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Herzlich Willkommen ${name || ''}!</h2>
          <p>Vielen Dank für Ihre Registrierung. Sie können nun Ihre Arbeitszeiten effizient erfassen.</p>
          <p><a href="${process.env.FRONTEND_URL}/login" style="background: #6366f1; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">Zum Dashboard</a></p>
        </div>
      `,
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send welcome email to ${email}`, error);
  }
};

export const sendVerificationEmail = async (email: string, name: string | null, code: string) => {
  try {
    console.log(`[VERIFICATION CODE] Generated code for ${email} is: ${code}`);
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Arbeitszeit Pro" <no-reply@arbeitszeit.app>',
      to: email,
      subject: 'Aktivierungscode — Arbeitszeit Pro',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; text-align: center;">
          <h2>E-Mail-Adresse bestätigen</h2>
          <p>Guten Tag ${name || ''},</p>
          <p>Bitte verwenden Sie den folgenden 6-stelligen Code, um Ihr Konto zu aktivieren:</p>
          <div style="font-size: 32px; font-weight: bold; color: #4f46e5; background: #f3f4f6; padding: 15px; display: inline-block; letter-spacing: 5px; border-radius: 10px; border: 1px solid #e5e7eb; margin: 15px 0;">
            ${code}
          </div>
          <p style="color: #666; font-size: 12px;">Der Code ist 15 Minuten lang gültig.</p>
        </div>
      `,
    });
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send verification email to ${email}`, error);
  }
};

export const sendPasswordResetEmail = async (email: string, name: string | null, token: string) => {
  try {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Arbeitszeit Pro" <no-reply@arbeitszeit.app>',
      to: email,
      subject: 'Passwort zurücksetzen — Arbeitszeit Pro',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Passwort zurücksetzen</h2>
          <p>Hallo ${name || ''},</p>
          <p>Sie haben das Zurücksetzen Ihres Passworts angefordert. Klicken Sie auf den folgenden Button:</p>
          <p><a href="${resetLink}" style="background: #ef4444; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold;">Passwort jetzt zurücksetzen</a></p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">Der Link ist 1 Stunde lang gültig. Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.</p>
        </div>
      `,
    });
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send password reset email to ${email}`, error);
  }
};
