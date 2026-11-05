'use client';

import { useEffect, useState } from 'react';
import type { VersaoWeb } from '@app/shared-types';
import { Icon } from '@/components/Icon';
import { BUILD_SHA } from '@/lib/build-info';
import { APP_VERSION } from '@/lib/changelog';

/** Intervalo entre consultas enquanto a aba está visível. */
const INTERVALO_MS = 60_000;

/**
 * Avisa quem está com o sistema aberto que um deploy novo do web subiu.
 *
 * Consulta `GET /versao`, que responde o build que o servidor está rodando
 * agora, e compara com o build embutido no bundle carregado no navegador.
 * Se forem diferentes, mostra o aviso. A consulta roda a cada minuto e ao
 * voltar para a aba.
 *
 * Nunca recarrega sozinho: a pessoa pode estar no meio de um formulário.
 * "Depois" esconde o aviso até surgir um build ainda mais novo.
 */
export function AvisoNovaVersao() {
  const [nova, setNova] = useState<VersaoWeb | null>(null);
  const [dispensado, setDispensado] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function verificar() {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch('/versao', { cache: 'no-store' });
        if (!res.ok) return;
        const servidor = (await res.json()) as VersaoWeb;
        const mudou = servidor.build !== BUILD_SHA || servidor.versao !== APP_VERSION;
        if (!cancelado) setNova(mudou ? servidor : null);
      } catch {
        /* rede instável ou deploy em andamento — tenta de novo no próximo ciclo */
      }
    }

    const timer = window.setInterval(verificar, INTERVALO_MS);
    document.addEventListener('visibilitychange', verificar);
    return () => {
      cancelado = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', verificar);
    };
  }, []);

  if (!nova || dispensado === chave(nova)) return null;

  const mudouVersao = nova.versao !== APP_VERSION;

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-ham-rise fixed bottom-20 left-4 z-50 w-[min(340px,calc(100vw-32px))] rounded-2xl border border-border bg-surface p-4 shadow-elevated"
    >
      <div className="flex items-start gap-3">
        <Icon name="cloud_sync" className="mt-0.5 shrink-0 text-ham-500" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-ham-900">
            Nova versão disponível{mudouVersao && <span className="text-ham-700"> · v{nova.versao}</span>}
          </div>
          <p className="mt-1 text-xs leading-snug text-muted">
            O sistema foi atualizado. Salve o que estiver fazendo e recarregue para usar a versão nova.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-ham-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ham-700"
            >
              Recarregar
            </button>
            <button
              type="button"
              onClick={() => setDispensado(chave(nova))}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-ham-900"
            >
              Depois
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function chave(v: VersaoWeb): string {
  return `${v.versao}@${v.build}`;
}
