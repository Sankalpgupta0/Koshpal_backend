/**
 * Shared PrismaClient instance for workers
 * 
 * IMPORTANT: Workers should NEVER create their own PrismaClient instances.
 * This causes connection pool exhaustion. Always use this shared instance.
 * 
 * Connection pool settings are configured in DATABASE_URL:
 * - connection_limit=30
 * - pool_timeout=20s
 */

import { PrismaClient } from '@prisma/client';

// Single shared instance for all workers
let prismaInstance: PrismaClient | null = null;

export function getSharedPrisma(): PrismaClient {
  if (!prismaInstance) {
    console.log('🔧 Creating shared PrismaClient for workers...');
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
    
    // Connect immediately
    prismaInstance.$connect().then(() => {
      console.log('✅ Shared PrismaClient connected successfully');
    }).catch((error) => {
      console.error('❌ Failed to connect shared PrismaClient:', error);
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      console.log('🔄 SIGINT received, disconnecting shared Prisma...');
      await prismaInstance?.$disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('🔄 SIGTERM received, disconnecting shared Prisma...');
      await prismaInstance?.$disconnect();
      process.exit(0);
    });
  }

  return prismaInstance;
}

export async function disconnectSharedPrisma() {
  if (prismaInstance) {
    console.log('🔄 Disconnecting shared PrismaClient...');
    await prismaInstance.$disconnect();
    prismaInstance = null;
    console.log('✅ Shared PrismaClient disconnected');
  }
}
