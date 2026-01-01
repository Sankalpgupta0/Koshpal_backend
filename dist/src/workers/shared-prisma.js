"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSharedPrisma = getSharedPrisma;
exports.disconnectSharedPrisma = disconnectSharedPrisma;
const client_1 = require("@prisma/client");
let prismaInstance = null;
function getSharedPrisma() {
    if (!prismaInstance) {
        console.log('🔧 Creating shared PrismaClient for workers...');
        prismaInstance = new client_1.PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        });
        prismaInstance
            .$connect()
            .then(() => {
            console.log('✅ Shared PrismaClient connected successfully');
        })
            .catch((error) => {
            console.error('❌ Failed to connect shared PrismaClient:', error);
        });
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
async function disconnectSharedPrisma() {
    if (prismaInstance) {
        console.log('🔄 Disconnecting shared PrismaClient...');
        await prismaInstance.$disconnect();
        prismaInstance = null;
        console.log('✅ Shared PrismaClient disconnected');
    }
}
//# sourceMappingURL=shared-prisma.js.map