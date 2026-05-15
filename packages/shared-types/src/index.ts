export interface HealthCheck {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  timestamp: string;
  version?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export * from './hello';
