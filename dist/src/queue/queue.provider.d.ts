import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
export declare const EMPLOYEE_UPLOAD_QUEUE = "EMPLOYEE_UPLOAD_QUEUE";
export declare const employeeUploadQueueProvider: {
    provide: string;
    useFactory: (configService: ConfigService) => Queue<any, any, string, any, any, string>;
    inject: (typeof ConfigService)[];
};
