import { Controller, Get } from '@nestjs/common';
import type { HealthCheck } from '@app/shared-types';

@Controller('health')
export class HealthController {
  private readonly bootedAt = Date.now();

  @Get()
  check(): HealthCheck {
    return {
      status: 'ok',
      uptime: Math.floor((Date.now() - this.bootedAt) / 1000),
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
    };
  }
}
