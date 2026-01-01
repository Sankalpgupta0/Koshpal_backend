import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ScopedPrismaService } from '../services/scoped-prisma.service';
export declare class ScopedPrismaInterceptor implements NestInterceptor {
    private readonly scopedPrisma;
    constructor(scopedPrisma: ScopedPrismaService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
