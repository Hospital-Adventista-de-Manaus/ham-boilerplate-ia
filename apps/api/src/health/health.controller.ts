import { Controller, Get } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { HealthCheck } from '@app/shared-types';

/** Id do build da API: o Dockerfile grava /app/BUILD_ID. Em dev local cai na env BUILD_ID. */
function lerBuildArquivo(): string | undefined {
  try {
    return readFileSync(join(process.cwd(), 'BUILD_ID'), 'utf8').trim() || undefined;
  } catch {
    return undefined;
  }
}

@Controller('health')
export class HealthController {
  private readonly bootedAt = Date.now();
  private readonly build = lerBuildArquivo() ?? process.env.BUILD_ID;

  @Get()
  check(): HealthCheck {
    return {
      status: 'ok',
      uptime: Math.floor((Date.now() - this.bootedAt) / 1000),
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
      build: this.build,
    };
  }
}
