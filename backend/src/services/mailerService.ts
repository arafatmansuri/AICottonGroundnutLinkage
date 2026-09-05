import nodemailer from 'nodemailer';
import config from '../config';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.mailer.user,
    pass: config.mailer.pass,
  },
});

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

  const m = await transporter.sendMail({
    from: `"KisanMitra AI" <${config.mailer.user}>`,
    to,
    subject: 'Reset your KisanMitra AI password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2328;">
        <div style="background: #16a34a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">🌿 KisanMitra AI</h1>
        </div>
        <div style="background: #f7f8fa; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="margin-top: 0; font-size: 18px;">Reset Your Password</h2>
          <p style="color: #57606a;">We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong>15 minutes</strong>.</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}"
               style="background: #16a34a; color: #ffffff; padding: 12px 28px; border-radius: 8px;
                      text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #57606a; font-size: 13px;">If the button doesn't work, copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #3b82d4; font-size: 12px;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #57606a; font-size: 12px; margin: 0;">
            If you didn't request a password reset, you can safely ignore this email. Your password will not change.
          </p>
        </div>
      </div>
    `,
  });
  console.log("Mail sent: ",m);
}
