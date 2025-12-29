import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Patch,
  Req,
  Res,
  Delete,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto, ChangePasswordDto } from './dto/auth.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { ValidatedUser } from '../common/types/user.types';

/**
 * Authentication Controller
 *
 * Handles user authentication and authorization including:
 * - User login with JWT token generation
 * - Token refresh for session management
 * - User logout
 * - Password management
 * - Current user information retrieval
 *
 * Base route: /api/v1/auth
 * Rate limiting applied on login endpoint (50 attempts/minute)
 */
@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Helper method to determine cookie domain based on request origin
   * This ensures each portal gets its own isolated cookies
   */
  private getCookieDomain(req: Request): string | undefined {
    const origin = req.headers.origin || req.headers.referer;

    if (!origin) return undefined;

    try {
      const url = new URL(origin);

      // For localhost subdomains, set domain to the specific subdomain
      if (url.hostname.endsWith('.localhost')) {
        return url.hostname;
      }

      // For production, you might want to set domain to your main domain
      // return '.yourdomain.com';

      return undefined; // Default behavior for other cases
    } catch {
      return undefined;
    }
  }

  /**
   * Login
   *
   * SECURITY FIX: Now uses httpOnly cookies instead of localStorage
   *
   * Authenticates user credentials and sets httpOnly cookies for tokens.
   * Supports all user roles: EMPLOYEE, HR, ADMIN, COACH
   *
   * Rate limited to 50 login attempts per minute to prevent brute force attacks.
   *
   * @param dto - Login credentials (email and password)
   * @param req - Express request object for IP and user agent
   * @param res - Express response object to set cookies
   * @returns User information (tokens set in httpOnly cookies)
   * @throws UnauthorizedException if credentials are invalid
   * @route POST /api/v1/auth/login
   * @access Public
   * @rateLimit 50 requests per minute
   */
  @Post('login')
  @Throttle({ strict: { limit: 50, ttl: 60000 } }) // 50 login attempts per minute
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const context = {
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
      userAgent: req.headers['user-agent'],
      deviceId: req.headers['x-device-id'] as string,
    };
    const result = await this.authService.login(
      dto.email,
      dto.password,
      context,
    );

    // Set httpOnly cookies for tokens
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = this.getCookieDomain(req);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
      domain: cookieDomain,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      domain: cookieDomain,
    });

    // Return user data without tokens (tokens are in cookies)
    return {
      user: result.user,
    };
  }

  /**
   * Get Current User
   *
   * Retrieves the currently authenticated user's information from the JWT token.
   * Returns user ID, email, role, and other profile data.
   *
   * @param user - Authenticated user extracted from JWT token
   * @returns Current user information
   * @route GET /api/v1/auth/me
   * @access Protected - Requires valid JWT token
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: ValidatedUser): ValidatedUser {
    return user;
  }

  /**
   * Refresh Access Token
   *
   * Generates a new access token using refresh token from httpOnly cookie.
   * Refresh tokens have longer expiry (7 days) compared to access tokens (15 minutes).
   * This allows users to stay logged in without re-entering credentials frequently.
   *
   * @param req - Request with refresh token in cookie
   * @param res - Response to set new access token cookie
   * @returns Success message
   * @throws UnauthorizedException if refresh token is invalid or expired
   * @route POST /api/v1/auth/refresh
   * @access Public (requires valid refresh token in cookie)
   */
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const result = await this.authService.refresh(refreshToken);

    // Set new access token in cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = this.getCookieDomain(req);
    
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
      domain: cookieDomain,
    });

    return { message: 'Token refreshed successfully' };
  }

  /**
   * Logout
   *
   * SECURITY FIX: Now properly revokes refresh token and clears httpOnly cookies
   *
   * Logs out the current user by invalidating their refresh token and clearing cookies.
   *
   * @param user - Current authenticated user
   * @param req - Request with refresh token in cookie
   * @param res - Response to clear cookies
   * @returns Success message
   * @route POST /api/v1/auth/logout
   * @access Protected - Requires valid JWT token
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: ValidatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await this.authService.logout(user.userId, refreshToken);
    }

    // Clear cookies with correct domain
    const cookieDomain = this.getCookieDomain(req);
    res.clearCookie('accessToken', { path: '/', domain: cookieDomain });
    res.clearCookie('refreshToken', { path: '/', domain: cookieDomain });

    return { message: 'Logged out successfully' };
  }

  /**
   * Get Active Sessions
   *
   * NEW: Returns all active sessions for the current user
   * Shows devices, locations, and last activity
   *
   * @param user - Current authenticated user
   * @returns List of active sessions
   * @route GET /api/v1/auth/sessions
   * @access Protected
   */
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@CurrentUser() user: ValidatedUser) {
    return this.authService.getActiveSessions(user.userId);
  }

  /**
   * Revoke All Sessions
   *
   * NEW: Revokes all active sessions (logout from all devices)
   * Useful after password change or security incident
   *
   * @param user - Current authenticated user
   * @returns Success message
   * @route POST /api/v1/auth/sessions/revoke-all
   * @access Protected
   */
  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke-all')
  async revokeAllSessions(@CurrentUser() user: ValidatedUser) {
    return this.authService.revokeAllSessions(user.userId);
  }

  /**
   * Change Password
   *
   * Allows authenticated users to change their password.
   * Requires current password verification before setting new password.
   * New password must meet security requirements (min 8 characters).
   *
   * After password change, all sessions are revoked for security.
   *
   * @param user - Authenticated user from JWT token
   * @param dto - Current password and new password
   * @returns Success message
   * @throws UnauthorizedException if current password is incorrect
   * @throws BadRequestException if new password doesn't meet requirements
   * @route PATCH /api/v1/auth/me/password
   * @access Protected - Requires valid JWT token
   */
  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  async changePassword(
    @CurrentUser() user: ValidatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  /**
   * Forgot Password
   *
   * SECURITY CRITICAL: Request password reset link
   *
   * Generates a secure, single-use token with 15-minute expiry.
   * Sends reset link via email to the registered email address.
   *
   * Rate limited to 5 attempts per 15 minutes per IP to prevent:
   * - Email enumeration attacks
   * - Spam/abuse
   * - Brute force attempts
   *
   * Always returns success message to prevent email enumeration.
   *
   * @param dto - Email address for password reset
   * @returns Success message (same response whether email exists or not)
   * @route POST /api/v1/auth/forgot-password
   * @access Public
   * @rateLimit 5 requests per 15 minutes
   */
  @Post('forgot-password')
  @Throttle({ strict: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  /**
   * Reset Password
   *
   * SECURITY CRITICAL: Reset password using token from email
   *
   * Validates reset token and updates password if valid.
   * Token requirements:
   * - Must exist in database
   * - Must not be used
   * - Must not be expired (15 min expiry)
   * - Single-use only
   *
   * After successful reset:
   * - Password is updated (bcrypt hashed)
   * - Token is marked as used
   * - ALL sessions are revoked
   * - User must log in again
   *
   * @param dto - Reset token and new password
   * @returns Success message
   * @throws UnauthorizedException if token is invalid/expired
   * @throws BadRequestException if password doesn't meet requirements
   * @route POST /api/v1/auth/reset-password
   * @access Public
   * @rateLimit 10 requests per 15 minutes
   */
  @Post('reset-password')
  @Throttle({ strict: { limit: 10, ttl: 900000 } }) // 10 attempts per 15 minutes
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
