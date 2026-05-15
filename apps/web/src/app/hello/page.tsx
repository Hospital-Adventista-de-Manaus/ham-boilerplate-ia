import type { HelloResponse } from '@app/shared-types';
import Link from 'next/link';
import { getApiBaseUrl } from '@/lib/api';
import { HelloClient } from './HelloClient';

async function fetchHelloFromServer(): Promise<HelloResponse | { error: string }> {
  const base = getApiBaseUrl('server');
  try {
    const res = await fetch(`${base}/hello?name=Server`, { cache: 'no-store' });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return (await res.json()) as HelloResponse;
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'unknown error' };
  }
}

export default async function HelloPage() {
  const serverData = await fetchHelloFromServer();
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <Link
          href="/"
          className="inline-block text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← voltar
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight">Hello World</h1>
        <p className="text-zinc-600">
          Teste end-to-end. Esta página chama <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-sm">GET /hello</code> da API
          de dois jeitos diferentes — se os dois funcionarem, o deploy está saudável.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">1. Server Component</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            INTERNAL_API_URL
          </span>
        </div>
        <p className="mb-3 text-sm text-zinc-500">
          Chamada feita no servidor Next.js usando a rede interna (Docker / Coolify).
          Não passa pelo browser, não precisa de CORS.
        </p>
        {'error' in serverData ? (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <strong>Falhou:</strong> {serverData.error}
            <p className="mt-2 text-xs text-red-600">
              Verifique se a env <code>INTERNAL_API_URL</code> aponta para o nome de serviço correto da API.
            </p>
          </div>
        ) : (
          <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-xs text-zinc-100">
            {JSON.stringify(serverData, null, 2)}
          </pre>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">2. Client Component</h2>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            NEXT_PUBLIC_API_URL
          </span>
        </div>
        <p className="mb-3 text-sm text-zinc-500">
          Chamada feita pelo browser usando a URL pública da API. Testa CORS — se falhar,
          ajuste <code>CORS_ORIGINS</code> na API.
        </p>
        <p className="mb-3 text-xs text-zinc-400">
          API pública: <code>{publicApiUrl}</code>
        </p>
        <HelloClient />
      </section>

      <footer className="text-center text-xs text-zinc-400">
        Os dois cartões verdes? Deploy 100% saudável. ✅
      </footer>
    </main>
  );
}
