import 'dotenv/config';
import { Worker } from 'bullmq';
import {
  sendConsultationBookingEmails,
  sendConsultationCancellationEmails,
} from '../mail/mail.service';

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

    interface CancellationEmailData {
      coachEmail: string;
      coachName: string;
      employeeEmail: string;
      employeeName: string;
      date: string;
      startTime: string | Date;
      endTime: string | Date;
      reason?: string;
      cancelledBy: 'EMPLOYEE' | 'COACH';
    }

    const jobType = job.name;
    console.log(`[JOB-${job.id}] 📧 Processing ${jobType} email...`);

    try {
      if (jobType === 'send-consultation-email') {
        const data = job.data as ConsultationEmailData;
        console.log('sankalp', data);
        console.log(
          `[JOB-${job.id}] 📧 Sending consultation booking emails...`,
        );
        await sendConsultationBookingEmails(data);
        console.log(`[JOB-${job.id}] ✅ Booking emails sent successfully`);
      } else if (jobType === 'send-cancellation-email') {
        const data = job.data as CancellationEmailData;
        console.log(
          `[JOB-${job.id}] 📧 Sending consultation cancellation emails...`,
        );
        await sendConsultationCancellationEmails(data);
        console.log(`[JOB-${job.id}] ✅ Cancellation emails sent successfully`);
      } else {
        console.warn(`[JOB-${job.id}] ⚠️  Unknown job type: ${jobType}`);
      }
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
