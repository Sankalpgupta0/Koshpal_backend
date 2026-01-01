import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ActiveUserGuard } from './common/guards/active-user.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  /**
   * =====================================================
   * 1️⃣ HANDLE CORS PREFLIGHT FIRST (CRITICAL)
   * =====================================================
   */
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  /**
   * =====================================================
   * 2️⃣ SECURITY & COMMON MIDDLEWARE
   * =====================================================
   */
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  /**
   * =====================================================
   * 3️⃣ CORS CONFIGURATION (SUBDOMAIN SAFE)
   * =====================================================
   */
  app.enableCors({
    origin: [
      'https://koshpal.com',
      'https://employee.koshpal.com',
      'https://hr.koshpal.com',
      'https://coach.koshpal.com',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-CSRF-Token'],
    exposedHeaders: ['Authorization'],
  });

  /**
   * =====================================================
   * 4️⃣ CSRF (DISABLED FOR API ROUTES)
   * =====================================================
   */
  const csrfMiddleware = new CsrfMiddleware();
  app.use((req, res, next) => {
    // Skip CSRF for APIs & preflight
    if (
      req.method === 'OPTIONS' ||
      req.method === 'GET' ||
      req.originalUrl.startsWith('/api')
    ) {
      return next();
    }

    csrfMiddleware.use(req, res, next);
  });

  /**
   * =====================================================
   * 5️⃣ GLOBAL VALIDATION
   * =====================================================
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  /**
   * =====================================================
   * 6️⃣ GLOBAL EXCEPTION FILTER
   * =====================================================
   */
  app.useGlobalFilters(new HttpExceptionFilter());

  /**
   * =====================================================
   * 7️⃣ GLOBAL GUARD (OPTIONS SAFE)
   * =====================================================
   */
  const prismaService = app.get(PrismaService);
  const reflector = app.get(Reflector);

  app.useGlobalGuards(
    new ActiveUserGuard(prismaService),
  );

  /**
   * =====================================================
   * 8️⃣ PRISMA SHUTDOWN
   * =====================================================
   */
  await prismaService.enableShutdownHooks(app);
  app.enableShutdownHooks();

  /**
   * =====================================================
   * 9️⃣ START SERVER
   * =====================================================
   */
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
