import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * CSRF Protection Middleware
 *
 * Implements Double Submit Cookie pattern for CSRF protection
 * - Generates a random CSRF token and stores it in a cookie
 * - Validates the token from request headers against the cookie
 * - Uses httpOnly=false for CSRF cookie so client can read it
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly CSRF_COOKIE_NAME = 'XSRF-TOKEN';
  private readonly CSRF_HEADER_NAME = 'x-csrf-token';

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF check for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      this.ensureCsrfToken(req, res);
      return next();
    }

    // Skip CSRF for login endpoint (no token available yet)
    if (
      req.path.includes('/auth/login') ||
      req.path.includes('/auth/refresh')
    ) {
      this.ensureCsrfToken(req, res);
      return next();
    }

    // Validate CSRF token for state-changing requests
    const cookieToken = req.cookies?.[this.CSRF_COOKIE_NAME];
    const headerToken = req.headers[this.CSRF_HEADER_NAME] as string;

    if (!cookieToken || !headerToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    if (cookieToken !== headerToken) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    next();
  }

  private ensureCsrfToken(req: Request, res: Response) {
    // Generate new token if not present
    if (!req.cookies?.[this.CSRF_COOKIE_NAME]) {
      const token = crypto.randomBytes(32).toString('hex');
      const isProduction = process.env.NODE_ENV === 'production';

      res.cookie(this.CSRF_COOKIE_NAME, token, {
        httpOnly: false, // Client needs to read this
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
      });
    }
  }
}
