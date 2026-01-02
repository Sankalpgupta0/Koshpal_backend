import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ActiveUserGuard } from './common/guards/active-user.guard';
import { PrismaService } from '../prisma/prisma.service';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  /**
   * =====================================================
   * 1️⃣ SECURITY & COMMON MIDDLEWARE
   * =====================================================
   */
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  /**
   * =====================================================
   * 2️⃣ CORS CONFIGURATION (HANDLED BY NESTJS)
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
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
  });

  /**
   * =====================================================
   * 4️⃣ GLOBAL VALIDATION
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
   * 5️⃣ GLOBAL EXCEPTION FILTER
   * =====================================================
   */
  app.useGlobalFilters(new HttpExceptionFilter());

  /**
   * =====================================================
   * 6️⃣ GLOBAL GUARD (OPTIONS SAFE)
   * =====================================================
   */
  const prismaService = app.get(PrismaService);
  const reflector = app.get(Reflector);

  app.useGlobalGuards(
    new ActiveUserGuard(prismaService),
  );

  /**
   * =====================================================
   * 7️⃣ PRISMA SHUTDOWN
   * =====================================================
   */
  await prismaService.enableShutdownHooks(app);
  app.enableShutdownHooks();

  /**
   * =====================================================
   * 8️⃣ START SERVER
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
