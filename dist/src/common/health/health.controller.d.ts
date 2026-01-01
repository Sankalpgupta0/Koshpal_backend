import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    checkHealth(): {
        status: string;
        timestamp: string;
        uptime: number;
        environment: string;
    };
    checkDatabase(): Promise<{
        status: string;
        database: string;
        timestamp: string;
        error?: undefined;
    } | {
        status: string;
        database: string;
        error: string;
        timestamp: string;
    }>;
    checkRedis(): Promise<{
        status: string;
        redis: string;
        timestamp: string;
        error?: undefined;
    } | {
        status: string;
        redis: string;
        error: string;
        timestamp: string;
    }>;
}
