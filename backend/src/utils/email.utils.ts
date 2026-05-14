import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendWelcomeEmail = async (email: string, name?: string) => {
  try {
    await transporter.sendMail({
      from: '"Arbeitszeit Pro" <no-reply@arbeitszeit.app>',
      to: email,
      subject: 'Welcome to Arbeitszeit Pro!',
      html: `
        <h1>Welcome ${name || ''}!</h1>
        <p>Thank you for registering. You can now start tracking your time efficiently.</p>
        <p>Log in here: <a href="${process.env.FRONTEND_URL}/login">Dashboard</a></p>
      `,
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send email to ${email}`, error);
  }
};
