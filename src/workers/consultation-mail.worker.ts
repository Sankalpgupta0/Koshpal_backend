import 'dotenv/config';
import { Worker } from 'bullmq';
import { sendConsultationBookingEmails } from '../mail/mail.service';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

console.log('='.repeat(60));
console.log('[WORKER] Consultation Mail Worker Starting...');
console.log(`[WORKER] Redis: ${REDIS_HOST}:${REDIS_PORT}`);
console.log(`[WORKER] Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`[WORKER] SMTP Host: ${process.env.SMTP_HOST || 'NOT SET'}`);
console.log(`[WORKER] SMTP User: ${process.env.SMTP_USER || 'NOT SET'}`);
console.log('='.repeat(60));

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

    console.log(`[JOB-${job.id}] 📧 Sending consultation booking emails...`);

    try {
      await sendConsultationBookingEmails(data);
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
