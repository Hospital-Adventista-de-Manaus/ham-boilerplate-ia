import type { VersaoWeb } from '@app/shared-types';
import { BUILD_SHA } from '@/lib/build-info';
import { APP_VERSION } from '@/lib/changelog';

// Sempre responde o build que ESTE servidor está rodando — é o que o aviso
// de nova versão compara com o bundle já carregado no navegador.
export const dynamic = 'force-dynamic';

export function GET(): Response {
  const body: VersaoWeb = { versao: APP_VERSION, build: BUILD_SHA };
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' } });
}
