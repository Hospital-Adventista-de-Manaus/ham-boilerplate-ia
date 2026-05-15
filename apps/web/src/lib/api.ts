/**
 * Resolve a URL base da API conforme o lado da chamada:
 * - Server Component / Server Action → INTERNAL_API_URL (rede interna)
 * - Client Component → NEXT_PUBLIC_API_URL (URL pública, browser)
 */
export function getApiBaseUrl(side: 'server' | 'client'): string {
  if (side === 'server') {
    return (
      process.env.INTERNAL_API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:3001'
    );
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}
