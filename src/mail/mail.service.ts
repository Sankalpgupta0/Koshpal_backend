import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

/**
 * Initialize email transporter with environment configuration
 * Only creates transporter if SMTP credentials are provided
 */
function getTransporter(): Transporter {
  if (!transporter) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error(
        'SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.',
      );
    }

    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for port 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      pool: true, // Use pooled connections
      maxConnections: 5,
      maxMessages: 100,
    });
  }

  return transporter;
}

/**
 * Send login credentials to a new employee
 * @param email - Employee email address
 * @param fullName - Employee full name
 * @param password - Generated password
 * @throws Error if email sending fails
 */
export async function sendCredentialsEmail(
  email: string,
  fullName: string,
  password: string,
): Promise<void> {
  if (!email || !fullName || !password) {
    throw new Error('Email, fullName, and password are required');
  }

  const emailTransporter = getTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Koshpal HR" <no-reply@koshpal.com>',
    to: email,
    subject: 'Your Koshpal Login Credentials',
    text: `Hello ${fullName},\n\nYour Koshpal employee account has been created.\n\nLogin Email: ${email}\nPassword: ${password}\n\nPlease change your password after your first login.\n\nBest regards,\nKoshpal HR Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .credentials { background-color: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Welcome to Koshpal</h2>
          </div>
          <div class="content">
            <p>Hello <strong>${fullName}</strong>,</p>
            <p>Your Koshpal employee account has been successfully created.</p>
            <div class="credentials">
              <p><strong>Login Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> <code>${password}</code></p>
            </div>
            <p><strong>⚠️ Important:</strong> Please change your password immediately after your first login for security reasons.</p>
            <p>If you have any questions, please contact your HR department.</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Koshpal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const info = await emailTransporter.sendMail(mailOptions);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log(`[MAIL] Email sent to ${email}: ${String(info.messageId)}`);
  } catch (error) {
    console.error(`[MAIL] Failed to send email to ${email}:`, error);
    throw new Error(
      `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Verify SMTP connection
 * @returns Promise<boolean> true if connection successful
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const emailTransporter = getTransporter();
    await emailTransporter.verify();
    console.log('[MAIL] SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('[MAIL] SMTP connection verification failed:', error);
    return false;
  }
}
