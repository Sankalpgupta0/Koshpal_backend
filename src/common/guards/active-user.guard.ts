import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Active User Guard
 *
 * Blocks inactive users from accessing protected endpoints.
 *
 * IMPORTANT:
 * - MUST allow OPTIONS requests (CORS preflight)
 * - MUST allow public routes (no user attached)
 * - MUST run AFTER JwtAuthGuard
 */
@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    /**
     * ✅ 1️⃣ ALWAYS allow CORS preflight
     */
    if (request.method === 'OPTIONS') {
      return true;
    }

    const user = request.user;

    /**
     * ✅ 2️⃣ Allow public routes
     * (JwtAuthGuard should handle auth where required)
     */
    if (!user || !user.userId) {
      return true;
    }

    /**
     * ✅ 3️⃣ Validate user activity from DB
     */
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { isActive: true },
    });

    if (!dbUser) {
      throw new ForbiddenException('User not found');
    }

    if (!dbUser.isActive) {
      throw new ForbiddenException(
        'Your account has been deactivated. Please contact your administrator.',
      );
    }

    return true;
  }
}
