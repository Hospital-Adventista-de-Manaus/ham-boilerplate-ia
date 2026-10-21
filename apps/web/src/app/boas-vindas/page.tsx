import Link from 'next/link';
import { Icon } from '@/components/Icon';

export default function BoasVindas() {
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-6 py-6 sm:gap-10 sm:py-16">
      <Link
        href="/"
        aria-label="Voltar para o login"
        className="absolute left-4 top-16 flex size-10 items-center justify-center rounded-full border border-border bg-surface text-ham-500 shadow-card transition hover:border-ham-500 hover:text-ham-700 sm:left-6 sm:top-20"
      >
        <Icon name="arrow_back" />
      </Link>

      <header className="animate-ham-rise space-y-2 sm:space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-ham-900 sm:text-6xl">
          Bem-vindo! Agora é só construir a sua ideia.
        </h1>
        <p className="text-base text-body sm:text-lg">Sua aplicação e o banco de dados já estão conectados.</p>
      </header>

      <section className="animate-ham-rise grid gap-4 sm:grid-cols-2" style={{ animationDelay: '80ms' }}>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E6F7F1] px-3 py-1 text-xs font-bold text-status-done">
            <span className="size-2 rounded-full bg-status-done" /> Conectado
          </div>
          <h2 className="text-base font-bold text-ham-900">Banco de dados Postgres</h2>
          <p className="mt-1 text-sm text-body">Provisionado e pronto para uso.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E9F1FA] px-3 py-1 text-xs font-bold text-ham-700">
            ✦ Sua vez
          </div>
          <h2 className="text-base font-bold text-ham-900">Ideia do projeto</h2>
          <p className="mt-1 text-sm text-body">
            Esta tela é só um exemplo. Troque por aquilo que você quer construir.
          </p>
        </div>
      </section>
    </main>
  );
}
