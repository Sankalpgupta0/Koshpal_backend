import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ScopedPrismaService } from '../services/scoped-prisma.service';
import { ValidatedUser } from '../types/user.types';
import { Role } from '../enums/role.enum';

@Injectable()
export class ScopedPrismaInterceptor implements NestInterceptor {
  constructor(private readonly scopedPrisma: ScopedPrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const user: ValidatedUser = request.user;

    if (user) {
      this.scopedPrisma.setContext({
        userId: user.userId,
        companyId: user.companyId,
        role: user.role as Role,
      });
    }

    return next.handle();
  }
}
