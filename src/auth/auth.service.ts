import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Login with Refresh Token Storage
   * 
   * SECURITY FIX: Now stores refresh tokens in database for:
   * - Token revocation on logout
   * - Session management
   * - Security audit trail
   * - Device tracking
   */
  async login(email: string, password: string, context?: LoginContext) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        employeeProfile: true,
        hrProfile: true,
        adminProfile: true,
        coachProfile: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = {
      sub: user.id,
      role: user.role,
      companyId: user.companyId,
    };

    const accessToken = this.jwtService.sign(payload);
    
    // Generate a unique refresh token
    const refreshToken = this.generateRefreshToken();
    
    // Store refresh token in database (hashed)
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenHash,
        expiresAt,
        deviceId: context?.deviceId,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      },
    });

    // Get profile based on role
    let fullName = email;
    if (user.employeeProfile) {
      fullName = user.employeeProfile.fullName;
    } else if (user.hrProfile) {
      fullName = user.hrProfile.fullName;
    } else if (user.adminProfile) {
      fullName = user.adminProfile.fullName;
    } else if (user.coachProfile) {
      fullName = user.coachProfile.fullName;
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        name: fullName,
        isActive: user.isActive,
      },
    };
  }

  /**
   * Generate a cryptographically secure refresh token
   */
  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Refresh Access Token
   * 
   * SECURITY FIX: Now validates refresh token against database
   * and checks if it's been revoked or expired
   */
  async refresh(refreshToken: string) {
    try {
      // Find all non-revoked, non-expired tokens
      const storedTokens = await this.prisma.refreshToken.findMany({
        where: {
          isRevoked: false,
          expiresAt: { gte: new Date() },
        },
        include: {
          user: true,
        },
      });

      // Find matching token by comparing hash
      let matchedToken: typeof storedTokens[0] | null = null;
      for (const storedToken of storedTokens) {
        const isMatch = await bcrypt.compare(refreshToken, storedToken.token);
        if (isMatch) {
          matchedToken = storedToken;
          break;
        }
      }

      if (!matchedToken) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const user = matchedToken.user;

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const payload = {
        sub: user.id,
        role: user.role,
        companyId: user.companyId,
      };

      // Generate new access token
      const accessToken = this.jwtService.sign(payload);

      // Optional: Implement token rotation (generate new refresh token)
      // For now, we keep the existing refresh token valid

      return {
        accessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout - Revoke Refresh Token
   * 
   * SECURITY FIX: Now properly revokes refresh token
   */
  async logout(userId: string, refreshToken: string) {
    try {
      // Find all non-revoked tokens for the user
      const storedTokens = await this.prisma.refreshToken.findMany({
        where: {
          userId,
          isRevoked: false,
        },
      });

      // Find and revoke the matching token
      for (const storedToken of storedTokens) {
        const isMatch = await bcrypt.compare(refreshToken, storedToken.token);
        if (isMatch) {
          await this.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: {
              isRevoked: true,
              revokedAt: new Date(),
            },
          });
          break;
        }
      }

      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new UnauthorizedException('Logout failed');
    }
  }

  /**
   * Revoke All Sessions for a User
   * 
   * Useful for security incidents or password changes
   */
  async revokeAllSessions(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    return { message: 'All sessions revoked successfully' };
  }

  /**
   * Get Active Sessions for a User
   * 
   * Shows all devices/locations with active sessions
   */
  async getActiveSessions(userId: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gte: new Date() },
      },
      select: {
        id: true,
        deviceId: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }
}
