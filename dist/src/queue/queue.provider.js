"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeUploadQueueProvider = exports.EMPLOYEE_UPLOAD_QUEUE = void 0;
const bullmq_1 = require("bullmq");
const config_1 = require("@nestjs/config");
exports.EMPLOYEE_UPLOAD_QUEUE = 'EMPLOYEE_UPLOAD_QUEUE';
exports.employeeUploadQueueProvider = {
    provide: exports.EMPLOYEE_UPLOAD_QUEUE,
    useFactory: (configService) => {
        return new bullmq_1.Queue('employee-upload', {
            connection: {
                host: configService.get('REDIS_HOST', 'localhost'),
                port: configService.get('REDIS_PORT', 6379),
            },
        });
    },
    inject: [config_1.ConfigService],
};
//# sourceMappingURL=queue.provider.js.map