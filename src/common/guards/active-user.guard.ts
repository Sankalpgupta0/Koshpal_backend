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
 * CRITICAL: Security guard to block inactive users from accessing protected endpoints
 *
 * This guard verifies that the authenticated user's account is active (isActive = true).
 * Inactive users are prevented from accessing any protected resources.
 *
 * Usage:
 * - Apply globally in main.ts OR
 * - Apply to specific controllers/routes with @UseGuards(ActiveUserGuard)
 * - Should be placed after JwtAuthGuard in the guard chain
 *
 * Why needed:
 * - Prevents deactivated employees from accessing system
 * - Immediate revocation of access without waiting for token expiry
 * - Compliance requirement for user lifecycle management
 *
 * Note: This guard checks real-time status from database, not JWT claims
 */
@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user in request (public route), allow through
    // JwtAuthGuard should handle authentication first
    if (!user || !user.userId) {
      return true;
    }

    // Check if user is active in database
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
