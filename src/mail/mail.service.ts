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
 * Send a generic email
 * @param options - Email options (to, subject, html)
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const emailTransporter = getTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Koshpal" <no-reply@koshpal.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = (await emailTransporter.sendMail(mailOptions)) as {
      messageId?: string;
    };
    const messageId = info.messageId || 'unknown';
    console.log(`[MAIL] Email sent to ${options.to}: ${messageId}`);
  } catch (error) {
    console.error(`[MAIL] Failed to send email to ${options.to}:`, error);
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

/**
 * Send consultation booking confirmation emails to both employee and coach
 * @param data - Consultation booking data
 */
export async function sendConsultationBookingEmails(data: {
  employeeEmail: string;
  coachEmail: string;
  date: string;
  startTime: string | Date;
  endTime: string | Date;
  meetingLink: string;
}): Promise<void> {
  const {
    employeeEmail,
    coachEmail,
    date,
    startTime,
    endTime,
    meetingLink,
  } = data;

  const startDateTime = new Date(startTime);
  const endDateTime = new Date(endTime);
  
  // Parse date string in IST timezone
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
  const formattedStartTime = startDateTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
  const formattedEndTime = endDateTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });

  // Send email to employee
  await sendEmail({
    to: employeeEmail,
    subject: '✅ Consultation Confirmed - Koshpal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Your Financial Consultation is Confirmed!</h2>
        <p>Hi there,</p>
        <p>Your consultation session has been successfully scheduled.</p>
        
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">📅 Consultation Details</h3>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime} (IST)</p>
          <p><strong>Duration:</strong> 1 hour</p>
        </div>

        <div style="background-color: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">🎥 Join Meeting</h3>
          <p><a href="${meetingLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Join Google Meet</a></p>
          <p style="margin-top: 10px; font-size: 12px; color: #6B7280;">Or copy this link: ${meetingLink}</p>
        </div>

        <p style="color: #6B7280; font-size: 14px;">
          💡 <strong>Tips:</strong> Make sure you have a stable internet connection and join a few minutes early.
        </p>

        <p>Looking forward to your session!</p>
        <p>Best regards,<br/>Koshpal Team</p>
      </div>
    `,
  });

  // Send email to coach
  await sendEmail({
    to: coachEmail,
    subject: '📅 New Consultation Booking - Koshpal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">New Consultation Booking</h2>
        <p>Hello Coach,</p>
        <p>You have a new consultation booking from an employee.</p>
        
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">📅 Consultation Details</h3>
          <p><strong>Employee:</strong> ${employeeEmail}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime} (IST)</p>
          <p><strong>Duration:</strong> 1 hour</p>
        </div>

        <div style="background-color: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">🎥 Meeting Link</h3>
          <p><a href="${meetingLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Join Google Meet</a></p>
          <p style="margin-top: 10px; font-size: 12px; color: #6B7280;">Or copy this link: ${meetingLink}</p>
        </div>

        <p>Please be available at the scheduled time.</p>
        <p>Best regards,<br/>Koshpal Team</p>
      </div>
    `,
  });

  console.log(
    `[MAIL] Consultation booking emails sent to ${employeeEmail} and ${coachEmail}`,
  );
}
