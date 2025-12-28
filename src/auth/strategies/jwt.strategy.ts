import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ValidatedUser } from '../../common/types/user.types';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  role: string;
  companyId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from httpOnly cookie
        (request: Request) => {
          return request?.cookies?.accessToken;
        },
        // Fallback to Authorization header for backward compatibility
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'change-me'),
    });
  }

  validate(payload: JwtPayload): ValidatedUser {
    return {
      userId: payload.sub,
      role: payload.role,
      companyId: payload.companyId,
    };
  }
}
