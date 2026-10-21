import Image from 'next/image';
import { EntrarButton } from '@/components/EntrarButton';

export default function Home() {
  const projectName = process.env.NEXT_PUBLIC_HAM_REPO || 'ham-boilerplate-ia';

  return (
    <main className="grid min-h-dvh md:grid-cols-2">
      <div className="flex flex-col justify-center bg-surface px-6 py-6 sm:px-8">
        <div className="mx-auto w-full max-w-sm space-y-4 sm:space-y-6">
          <Image
            src="/brand/icone.png"
            alt="Hospital Adventista de Manaus"
            width={88}
            height={98}
            priority
            quality={100}
            className="h-14 w-auto sm:h-20"
          />

          <div className="space-y-2">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-ham-500">
              Hospital Adventista de Manaus
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-ham-900 sm:text-5xl">{projectName}</h1>
            <p className="text-sm text-body">
              Começando um projeto novo utilizando inteligência artificial.
            </p>
          </div>

          <div className="rounded-xl bg-bg px-4 py-3 text-sm text-body">
            Acesso restrito a colaboradores com email <span className="font-bold">@ham.org.br</span>.
          </div>

          <EntrarButton href="/boas-vindas" />

          <p className="text-center text-xs font-semibold text-status-waiting">
            Projeto ainda em desenvolvimento — enquanto isso, o acesso usa um login fictício.
          </p>
        </div>
      </div>

      <div className="relative hidden flex-col justify-end overflow-hidden bg-ham-900 p-6 sm:p-10 md:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-ham-700/40 via-transparent to-transparent" />
        <div className="absolute right-0 top-0 h-[55%] w-[65%] rounded-bl-[64px] bg-white/5" />
        <h2 className="relative max-w-sm text-3xl font-extrabold leading-tight text-white text-balance">
          Automatizando processos para fortalecer o <span className="text-ham-300">cuidado em saúde</span>.
        </h2>
        <p className="mt-3 text-sm text-[#A9CBE3]">Hospital Adventista de Manaus</p>
      </div>
    </main>
  );
}
