"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCredentialsEmail = sendCredentialsEmail;
exports.sendEmail = sendEmail;
exports.verifyEmailConnection = verifyEmailConnection;
exports.sendConsultationBookingEmails = sendConsultationBookingEmails;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendConsultationCancellationEmails = sendConsultationCancellationEmails;
const nodemailer_1 = __importDefault(require("nodemailer"));
let transporter = null;
function getTransporter() {
    if (!transporter) {
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = Number(process.env.SMTP_PORT) || 587;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        if (!smtpHost || !smtpUser || !smtpPass) {
            throw new Error('SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.');
        }
        transporter = nodemailer_1.default.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
        });
    }
    return transporter;
}
async function sendCredentialsEmail(email, fullName, password) {
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
        const info = await emailTransporter.sendMail(mailOptions);
        console.log(`[MAIL] Email sent to ${email}: ${String(info.messageId)}`);
    }
    catch (error) {
        console.error(`[MAIL] Failed to send email to ${email}:`, error);
        throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
async function sendEmail(options) {
    const emailTransporter = getTransporter();
    const mailOptions = {
        from: process.env.SMTP_FROM || '"Koshpal" <no-reply@koshpal.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
    };
    try {
        const info = (await emailTransporter.sendMail(mailOptions));
        const messageId = info.messageId || 'unknown';
        console.log(`[MAIL] Email sent to ${options.to}: ${messageId}`);
    }
    catch (error) {
        console.error(`[MAIL] Failed to send email to ${options.to}:`, error);
        throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
async function verifyEmailConnection() {
    try {
        const emailTransporter = getTransporter();
        await emailTransporter.verify();
        console.log('[MAIL] SMTP connection verified successfully');
        return true;
    }
    catch (error) {
        console.error('[MAIL] SMTP connection verification failed:', error);
        return false;
    }
}
async function sendConsultationBookingEmails(data) {
    const { employeeEmail, coachEmail, date, startTime, endTime, meetingLink } = data;
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);
    const [year, month, day] = date.split('-').map(Number);
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const tempDate = new Date(dateString + 'T12:00:00');
    const formattedDate = tempDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
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
    console.log(`[MAIL] Consultation booking emails sent to ${employeeEmail} and ${coachEmail}`);
}
async function sendPasswordResetEmail(email, fullName, resetToken) {
    if (!email || !fullName || !resetToken) {
        throw new Error('Email, fullName, and resetToken are required');
    }
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    await sendEmail({
        to: email,
        subject: 'Password Reset Request - Koshpal',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .button { 
            display: inline-block;
            background-color: #4F46E5; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 6px;
            margin: 20px 0;
          }
          .warning { 
            background-color: #FEF3C7; 
            border-left: 4px solid #F59E0B; 
            padding: 15px; 
            margin: 20px 0;
          }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <p>Hello <strong>${fullName}</strong>,</p>
            <p>We received a request to reset your password for your Koshpal account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p style="font-size: 14px; color: #666;">Or copy this link into your browser:</p>
            <p style="word-break: break-all; font-size: 12px; color: #666;">${resetLink}</p>
            <div class="warning">
              <p style="margin: 0;"><strong>⚠️ Important Security Information:</strong></p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>This link will expire in <strong>15 minutes</strong></li>
                <li>This link can only be used <strong>once</strong></li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Your password will remain unchanged</li>
              </ul>
            </div>
            <p>For security reasons, please do not share this link with anyone.</p>
            <p>If you have any concerns, please contact your HR department immediately.</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Koshpal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    });
    console.log(`[MAIL] Password reset email sent to ${email}`);
}
async function sendConsultationCancellationEmails(data) {
    const { employeeEmail, coachEmail, date, startTime, cancelledBy, reason } = data;
    const startDateTime = new Date(startTime);
    const [year, month, day] = date.split('-').map(Number);
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const tempDate = new Date(dateString + 'T12:00:00');
    const formattedDate = tempDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const formattedStartTime = startDateTime.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
    });
    const reasonText = reason ? `<p><strong>Reason:</strong> ${reason}</p>` : '';
    await sendEmail({
        to: employeeEmail,
        subject: '❌ Consultation Cancelled - Koshpal',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #EF4444;">Consultation Cancelled</h2>
        <p>Hi there,</p>
        <p>Your consultation session has been cancelled by the ${cancelledBy === 'EMPLOYEE' ? 'you' : 'coach'}.</p>
        
        <div style="background-color: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
          <h3 style="margin-top: 0;">📅 Cancelled Session</h3>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedStartTime} (IST)</p>
          ${reasonText}
        </div>

        <p>You can book another session at your convenience from the consultation portal.</p>
        <p>Best regards,<br/>Koshpal Team</p>
      </div>
    `,
    });
    await sendEmail({
        to: coachEmail,
        subject: '❌ Consultation Cancelled - Koshpal',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #EF4444;">Consultation Cancelled</h2>
        <p>Hello Coach,</p>
        <p>A consultation session has been cancelled by the ${cancelledBy === 'COACH' ? 'you' : 'employee'}.</p>
        
        <div style="background-color: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
          <h3 style="margin-top: 0;">📅 Cancelled Session</h3>
          <p><strong>Employee:</strong> ${employeeEmail}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedStartTime} (IST)</p>
          ${reasonText}
        </div>

        <p>The time slot is now available for new bookings.</p>
        <p>Best regards,<br/>Koshpal Team</p>
      </div>
    `,
    });
    console.log(`[MAIL] Consultation cancellation emails sent to ${employeeEmail} and ${coachEmail}`);
}
//# sourceMappingURL=mail.service.js.map