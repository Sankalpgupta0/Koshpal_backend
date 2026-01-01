import { PrismaClient } from '@prisma/client';
export declare function getSharedPrisma(): PrismaClient;
export declare function disconnectSharedPrisma(): Promise<void>;
