import { Controller, Get, Post, Body, UseGuards, Patch } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto, ChangePasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { ValidatedUser } from '../common/types/user.types';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Throttle({ strict: { limit: 50, ttl: 60000 } }) // 50 login attempts per minute
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: ValidatedUser): ValidatedUser {
    return user;
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout() {
    // Token invalidation would require Redis/DB blacklist
    // For now, client-side token deletion is sufficient
    return { message: 'Logged out successfully' };
  }

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
