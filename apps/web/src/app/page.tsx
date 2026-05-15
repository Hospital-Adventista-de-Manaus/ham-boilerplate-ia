import Link from 'next/link';
import { HealthBadge } from '@/components/HealthBadge';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-3">
        <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-wider text-zinc-600">
          HAM · Boilerplate IA
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Monorepo Next.js + NestJS
        </h1>
        <p className="text-lg text-zinc-600">
          Pronto para deploy no Coolify via push no GitHub. Documentação para Claude Code em{' '}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-sm">docs/</code> e{' '}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-sm">CLAUDE.md</code>.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-500">Status da API</h2>
            <p className="mt-1 text-xs text-zinc-400">
              GET {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/health
            </p>
          </div>
          <HealthBadge />
        </div>
      </section>

      <Link
        href="/hello"
        className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-900 hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Teste end-to-end → <span className="font-mono text-base text-zinc-500">/hello</span>
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Valida server-side fetch (rede interna) e client-side fetch (CORS) em uma tela só.
            </p>
          </div>
          <span className="text-2xl text-zinc-400 transition group-hover:translate-x-1 group-hover:text-zinc-900">
            →
          </span>
        </div>
      </Link>
    </main>
  );
}
