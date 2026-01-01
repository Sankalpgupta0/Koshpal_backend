import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class CsrfMiddleware implements NestMiddleware {
    private readonly CSRF_COOKIE_NAME;
    private readonly CSRF_HEADER_NAME;
    use(req: Request, res: Response, next: NextFunction): void;
    private ensureCsrfToken;
}
