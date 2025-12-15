import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';

export const EMPLOYEE_UPLOAD_QUEUE = 'EMPLOYEE_UPLOAD_QUEUE';

export const employeeUploadQueueProvider = {
  provide: EMPLOYEE_UPLOAD_QUEUE,
  useFactory: (configService: ConfigService) => {
    return new Queue('employee-upload', {
      connection: {
        host: configService.get<string>('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
      },
    });
  },
  inject: [ConfigService],
};
