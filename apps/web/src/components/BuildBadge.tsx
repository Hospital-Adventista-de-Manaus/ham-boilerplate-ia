'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/ui/Modal';
import { APP_VERSION, CHANGELOG } from '@/lib/changelog';
import { getAppStorage, setAppStorage } from '@/lib/app-storage';

const VERSAO_VISTA_KEY = 'versaoVista';

/** Rotas antes do login — sem badge de versão por aqui. */
const ROTAS_SEM_BADGE = ['/'];

export function BuildBadge() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [temNovidade, setTemNovidade] = useState(false);

  useEffect(() => {
    setTemNovidade(getAppStorage(VERSAO_VISTA_KEY) !== APP_VERSION);
  }, []);

  if (ROTAS_SEM_BADGE.includes(pathname)) return null;

  function abrir() {
    setAberto(true);
    setTemNovidade(false);
    setAppStorage(VERSAO_VISTA_KEY, APP_VERSION);
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-xs font-semibold text-muted shadow-card transition hover:border-ham-500 hover:text-ham-700"
      >
        v{APP_VERSION}
        {temNovidade && (
          <span className="flex items-center gap-1 rounded-full bg-[#E9F1FA] px-2 py-0.5 text-ham-700">
            <Icon name="celebration" className="text-[14px]" />
            Nova versão
          </span>
        )}
      </button>

      <Modal open={aberto} onClose={() => setAberto(false)} title="Novidades">
        {CHANGELOG.map((rel, i) => (
          <section key={rel.version} className="space-y-2">
            <div className="flex items-baseline gap-2">
              <h3 className="font-mono text-sm font-bold text-ham-900">v{rel.version}</h3>
              {i === 0 && (
                <span className="rounded-full bg-[#E9F1FA] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-ham-700">
                  Atual
                </span>
              )}
              <span className="font-mono text-xs text-muted">{rel.date}</span>
            </div>
            <p className="text-sm font-semibold text-ham-900">{rel.titulo}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-body">
              {rel.itens.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </Modal>
    </>
  );
}
