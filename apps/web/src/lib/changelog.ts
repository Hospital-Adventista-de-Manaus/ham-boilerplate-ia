export interface Release {
  version: string;
  /** AAAA-MM-DD */
  date: string;
  titulo: string;
  itens: string[];
}

/** Fonte única da versão — a primeira entrada é sempre a atual. Adicione uma entrada no
 * topo a cada funcionalidade nova que valha comunicar; isso já atualiza `APP_VERSION` e
 * dispara o aviso de "nova versão" pra quem ainda não viu. */
export const CHANGELOG: Release[] = [
  {
    version: '0.1.0',
    date: new Date().toISOString().slice(0, 10),
    titulo: 'Primeira versão',
    itens: ['Projeto criado.'],
  },
];

/** Versão atual do app — vem do topo do changelog, nunca de env em runtime. */
export const APP_VERSION = CHANGELOG[0].version;
