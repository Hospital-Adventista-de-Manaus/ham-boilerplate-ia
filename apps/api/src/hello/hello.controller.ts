import { Controller, Get, Query } from '@nestjs/common';
import type { HelloResponse } from '@app/shared-types';

@Controller('hello')
export class HelloController {
  @Get()
  hello(@Query('name') name?: string): HelloResponse {
    const safeName = name?.trim().slice(0, 50);
    return {
      message: safeName ? `Hello, ${safeName}!` : 'Hello, World!',
      from: 'api',
      timestamp: new Date().toISOString(),
      name: safeName || undefined,
    };
  }
}
