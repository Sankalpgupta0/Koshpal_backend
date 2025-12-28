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

  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser()); // Enable cookie parsing for httpOnly cookies

  // CSRF Protection
  const csrfMiddleware = new CsrfMiddleware();
  app.use((req, res, next) => csrfMiddleware.use(req, res, next));

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-CSRF-Token'],
    exposedHeaders: ['Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global active user guard (blocks inactive users)
  const reflector = app.get(Reflector);
  const prismaService = app.get(PrismaService);
  app.useGlobalGuards(new ActiveUserGuard(prismaService));

  // Enable Prisma shutdown hooks
  await prismaService.enableShutdownHooks(app);

  // Graceful shutdown
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
