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
      await sendEmail({
        to: employeeEmail,
        subject: 'Consultation Booked',
        html: `
          <h2>Your consultation has been confirmed!</h2>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${new Date(startTime).toLocaleTimeString()} - ${new Date(endTime).toLocaleTimeString()}</p>
          <p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>
        `,
      });

      await sendEmail({
        to: coachEmail,
        subject: 'New Consultation Booking',
        html: `
          <h2>You have a new consultation booking!</h2>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${new Date(startTime).toLocaleTimeString()} - ${new Date(endTime).toLocaleTimeString()}</p>
          <p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>
        `,
      });

      console.log(`[JOB-${job.id}] ✅ Emails sent successfully`);
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
