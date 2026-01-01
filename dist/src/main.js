"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const active_user_guard_1 = require("./common/guards/active-user.guard");
const prisma_service_1 = require("../prisma/prisma.service");
const csrf_middleware_1 = require("./common/middleware/csrf.middleware");
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log'],
    });
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    app.use((0, cookie_parser_1.default)());
    const csrfMiddleware = new csrf_middleware_1.CsrfMiddleware();
    app.use((req, res, next) => csrfMiddleware.use(req, res, next));
    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',') || [
            'https://koshpal.com',
            'https://employee.koshpal.com',
            'https://hr.koshpal.com',
            'https://coach.koshpal.com',
            'https://api.koshpal.com',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:3000',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-CSRF-Token'],
        exposedHeaders: ['Authorization'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: process.env.NODE_ENV === 'production',
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    const reflector = app.get(core_1.Reflector);
    const prismaService = app.get(prisma_service_1.PrismaService);
    app.useGlobalGuards(new active_user_guard_1.ActiveUserGuard(prismaService));
    await prismaService.enableShutdownHooks(app);
    app.enableShutdownHooks();
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🚀 Koshpal Backend Server                        ║
║                                                    ║
║   Environment: ${process.env.NODE_ENV || 'development'}                         ║
║   Port: ${port}                                       ║
║   URL: http://localhost:${port}                       ║
║                                                    ║
╚════════════════════════════════════════════════════╝
  `);
}
void bootstrap();
//# sourceMappingURL=main.js.map