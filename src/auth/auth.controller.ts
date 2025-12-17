import { Controller, Get, Post, Body, UseGuards, Patch } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto, ChangePasswordDto } from './dto/auth.dto';
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
   * Login
   * 
   * Authenticates user credentials and returns JWT access and refresh tokens.
   * Supports all user roles: EMPLOYEE, HR, ADMIN, COACH
   * 
   * Rate limited to 50 login attempts per minute to prevent brute force attacks.
   * 
   * @param dto - Login credentials (email and password)
   * @returns Access token, refresh token, and user information
   * @throws UnauthorizedException if credentials are invalid
   * @route POST /api/v1/auth/login
   * @access Public
   * @rateLimit 50 requests per minute
   */
  @Post('login')
  @Throttle({ strict: { limit: 50, ttl: 60000 } }) // 50 login attempts per minute
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
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
   * Generates a new access token using a valid refresh token.
   * Refresh tokens have longer expiry (7 days) compared to access tokens (15 minutes).
   * This allows users to stay logged in without re-entering credentials frequently.
   * 
   * @param dto - Refresh token from previous login
   * @returns New access token
   * @throws UnauthorizedException if refresh token is invalid or expired
   * @route POST /api/v1/auth/refresh
   * @access Public (requires valid refresh token)
   */
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  /**
   * Logout
   * 
   * Logs out the current user by invalidating their session.
   * Client should delete tokens from storage upon receiving this response.
   * 
   * Note: Token invalidation on server-side requires Redis/DB blacklist implementation.
   * Currently relies on client-side token deletion.
   * 
   * @returns Success message
   * @route POST /api/v1/auth/logout
   * @access Protected - Requires valid JWT token
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout() {
    // Token invalidation would require Redis/DB blacklist
    // For now, client-side token deletion is sufficient
    return { message: 'Logged out successfully' };
  }

  /**
   * Change Password
   * 
   * Allows authenticated users to change their password.
   * Requires current password verification before setting new password.
   * New password must meet security requirements (min 8 characters).
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
}
