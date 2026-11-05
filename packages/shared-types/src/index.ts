export interface HealthCheck {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  timestamp: string;
  version?: string;
  /** Id do build da API (commit do deploy ou carimbo AAMMDD.HHMM). */
  build?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export * from './hello';
export * from './versao';
