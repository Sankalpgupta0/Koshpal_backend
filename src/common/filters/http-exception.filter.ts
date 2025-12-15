import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof message === 'string'
          ? message
          : (message as { message: string }).message || 'An error occurred',
    };

    // Log error in production
    if (process.env.NODE_ENV === 'production') {
      console.error(
        `[${errorResponse.timestamp}] [HTTP-ERROR] ${errorResponse.method} ${errorResponse.path} - ${errorResponse.statusCode}`,
      );
    } else {
      // In development, log the full stack trace
      console.error('Exception:', exception);
    }

    response.status(status).json(errorResponse);
  }
}
