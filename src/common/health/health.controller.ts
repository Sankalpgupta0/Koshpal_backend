import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('api/v1/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  checkHealth() {
    return this.healthService.checkHealth();
  }

  @Get('db')
  async checkDatabase() {
    return this.healthService.checkDatabase();
  }

  @Get('redis')
  async checkRedis() {
    return this.healthService.checkRedis();
  }
}
