import { Worker } from 'bullmq';
import { sendEmail } from '../mail/mail.service';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

const worker = new Worker(
  'consultation-email',
  async (job) => {
    interface ConsultationEmailData {
      coachEmail: string;
      employeeEmail: string;
      date: string;
      startTime: string | Date;
      endTime: string | Date;
      meetingLink: string;
    }

    const data = job.data as ConsultationEmailData;
    const { coachEmail, employeeEmail, date, startTime, endTime, meetingLink } =
      data;

    console.log(`[JOB-${job.id}] 📧 Sending consultation booking emails...`);

    try {
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(endTime);
      const formattedDate = new Date(date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const formattedStartTime = startDateTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'UTC'
      });
      const formattedEndTime = endDateTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'UTC'
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
              <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime} (UTC)</p>
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
              <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime} (UTC)</p>
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

      console.log(`[JOB-${job.id}] ✅ Emails sent successfully to ${employeeEmail} and ${coachEmail}`);
    } catch (error) {
      console.error(`[JOB-${job.id}] ❌ Error sending emails:`, error);
      throw error;
    }
  },
  {
    connection: {
      host: REDIS_HOST,
      port: REDIS_PORT,
    },
  },
);

worker.on('completed', (job) => {
  console.log(`✅ [WORKER] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ [WORKER] Job ${job?.id} failed:`, err.message);
});

console.log('🚀 Consultation email worker started');
