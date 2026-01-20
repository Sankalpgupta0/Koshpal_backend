import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import { sendPasswordResetEmail } from '../mail/mail.service';

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
   * 
   * SSO FEATURE: Validates user role for unified login across subdomains
   */
  async login(email: string, password: string, context?: LoginContext, requestedRole?: string) {
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

    // Role validation for unified login
    if (requestedRole && user.role !== requestedRole) {
      throw new UnauthorizedException(`You do not have ${requestedRole} role access. Your role is ${user.role}.`);
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
    let phone = '';
    let profileId = '';

    if (user.employeeProfile) {
      fullName = user.employeeProfile.fullName;
      phone = user.employeeProfile.phone || '';
      profileId = user.employeeProfile.userId;
    } else if (user.hrProfile) {
      fullName = user.hrProfile.fullName;
      phone = user.hrProfile.phone || '';
      profileId = user.hrProfile.userId;
    } else if (user.adminProfile) {
      fullName = user.adminProfile.fullName;
      phone = '';
      profileId = user.adminProfile.userId;
    } else if (user.coachProfile) {
      fullName = user.coachProfile.fullName;
      phone = user.coachProfile.phone || '';
      profileId = user.coachProfile.userId;
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        _id: profileId, // Add _id for frontend compatibility (references profile ID)
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        name: fullName,
        phone: phone,
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
      let matchedToken: (typeof storedTokens)[0] | null = null;
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

    // Revoke all sessions after password change
    await this.revokeAllSessions(userId);

    return {
      message:
        'Password changed successfully. All sessions have been revoked. Please log in again.',
    };
  }

  /**
   * Forgot Password - Generate Reset Token
   *
   * SECURITY FEATURES:
   * - Rate limited via controller (5 attempts per 15 minutes per email)
   * - Single-use tokens
   * - 15 minute expiry
   * - Tokens are cryptographically secure
   * - Token hashed before storage
   * - Email sent with reset link
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        employeeProfile: true,
        hrProfile: true,
        coachProfile: true,
      },
    });

    // Always return success message to prevent email enumeration
    const successMessage =
      'If an account exists with this email, you will receive a password reset link shortly.';

    if (!user) {
      return { message: successMessage };
    }

    if (!user.isActive) {
      // Don't send reset link to inactive accounts
      return { message: successMessage };
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(resetToken, 10);

    // Token expires in 15 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Invalidate any existing unused tokens
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    // Store new token
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Get user's full name
    let fullName = email;
    if (user.employeeProfile) {
      fullName = user.employeeProfile.fullName;
    } else if (user.hrProfile) {
      fullName = user.hrProfile.fullName;
    } else if (user.coachProfile) {
      fullName = user.coachProfile.fullName;
    }

    // Send reset email (async - don't wait for completion)
    sendPasswordResetEmail(email, fullName, resetToken).catch((error) => {
      console.error('Failed to send password reset email:', error);
    });

    return { message: successMessage };
  }

  /**
   * Reset Password - Verify Token and Update Password
   *
   * SECURITY FEATURES:
   * - Token validation (exists, not used, not expired)
   * - Password validation (min 8 chars, uppercase, lowercase, number)
   * - Token invalidation after use
   * - All sessions revoked after password reset
   * - Password hashed with bcrypt
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Find all unused, non-expired tokens
    const storedTokens = await this.prisma.passwordResetToken.findMany({
      where: {
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
      include: {
        user: true,
      },
    });

    // Find matching token by comparing hash
    let matchedToken: (typeof storedTokens)[0] | null = null;
    for (const storedToken of storedTokens) {
      const isMatch = await bcrypt.compare(token, storedToken.tokenHash);
      if (isMatch) {
        matchedToken = storedToken;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const user = matchedToken.user;

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used in a transaction
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: matchedToken.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      }),
      // Revoke all refresh tokens
      this.prisma.refreshToken.updateMany({
        where: {
          userId: user.id,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      }),
    ]);

    return {
      message:
        'Password reset successfully. All sessions have been revoked. Please log in with your new password.',
    };
  }




  
}
