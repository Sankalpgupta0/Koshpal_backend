import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class HealthService {
    private readonly prisma;
    private readonly configService;
    private redisClient;
    constructor(prisma: PrismaService, configService: ConfigService);
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
    onModuleDestroy(): void;
}
