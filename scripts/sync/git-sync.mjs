#!/usr/bin/env node
// @ts-check
/**
 * git-sync.mjs — Mantém o projeto local sincronizado com o git.
 *
 * O que faz (seguro por padrão):
 *   1. `git fetch` na origin;
 *   2. se a branch atual (ex.: staging/main) estiver ATRÁS do remoto, faz `git pull --ff-only`;
 *   3. NUNCA sobrescreve trabalho local: se houver mudanças não commitadas, apenas avisa e não puxa
 *      (a menos que --force seja passado, que faz pull com --autostash);
 *   4. se o histórico divergiu (não é fast-forward), para e avisa.
 *
 * Uso:
 *   node scripts/sync/git-sync.mjs [--force]
 *
 * Saída: imprime status resumido e um bloco JSON entre <RESULT> e </RESULT>.
 * Ideal para o Claude rodar no início de cada sessão e antes de editar.
 */

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const force = process.argv.slice(2).includes('--force');

function git(args) {
  return spawnSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });
}

function emit(payload) {
  console.log(`\n<RESULT>${JSON.stringify(payload, null, 2)}</RESULT>`);
}

function done(payload, humanLine) {
  if (humanLine) console.log(humanLine);
  emit(payload);
  process.exit(payload.ok === false ? 1 : 0);
}

// Precisa ser um repositório git.
if (git(['rev-parse', '--is-inside-work-tree']).status !== 0) {
  done({ ok: false, status: 'not-a-repo', message: 'Não é um repositório git.' }, '✖ Não é um repositório git.');
}

// Branch atual.
const branch = (git(['rev-parse', '--abbrev-ref', 'HEAD']).stdout || '').trim();
if (!branch || branch === 'HEAD') {
  done(
    { ok: false, status: 'detached', message: 'HEAD destacado; faça checkout de uma branch.' },
    '✖ HEAD destacado — faça checkout de staging/main.',
  );
}

console.log(`▶ Branch atual: ${branch}`);

// Existe upstream configurado?
const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
if (upstream.status !== 0) {
  done(
    { ok: true, status: 'no-upstream', branch, message: `Branch "${branch}" não tem upstream. Nada para sincronizar.` },
    `⚠ Branch "${branch}" sem upstream — pulei o sync.`,
  );
}

// Busca atualizações.
console.log('▶ git fetch…');
if (git(['fetch']).status !== 0) {
  done({ ok: false, status: 'fetch-failed', branch, message: 'git fetch falhou (rede/credenciais?).' }, '✖ git fetch falhou.');
}

// Quantos commits atrás/à frente do upstream.
const counts = git(['rev-list', '--left-right', '--count', 'HEAD...@{u}']);
const [aheadStr, behindStr] = (counts.stdout || '0\t0').trim().split(/\s+/);
const ahead = Number(aheadStr) || 0;
const behind = Number(behindStr) || 0;

if (behind === 0) {
  done(
    { ok: true, status: 'up-to-date', branch, ahead, behind },
    `✔ Em sincronia com origin/${branch}${ahead ? ` (${ahead} commit(s) local(is) à frente)` : ''}.`,
  );
}

// Há mudanças locais não commitadas?
const dirty = (git(['status', '--porcelain']).stdout || '').trim().length > 0;
if (dirty && !force) {
  done(
    {
      ok: true,
      status: 'blocked-dirty',
      branch,
      ahead,
      behind,
      message: `Há ${behind} commit(s) novo(s) em origin/${branch}, mas você tem mudanças locais não commitadas. ` +
        `Commite/guarde e rode de novo, ou use --force (faz pull com --autostash).`,
    },
    `⚠ ${behind} commit(s) novo(s) no remoto, mas há mudanças locais — não puxei. Commite ou use --force.`,
  );
}

// Pull seguro (fast-forward). Só usa autostash quando --force + working tree suja.
console.log(`▶ Puxando ${behind} commit(s) de origin/${branch}…`);
const pullArgs = ['pull', '--ff-only'];
if (dirty && force) pullArgs.push('--autostash');
const pull = git(pullArgs);
if (pull.status !== 0) {
  done(
    {
      ok: false,
      status: 'diverged',
      branch,
      ahead,
      behind,
      message: 'Não foi fast-forward (histórico divergiu). Resolva manualmente (rebase/merge).',
      detail: (pull.stderr || pull.stdout || '').trim(),
    },
    '✖ Histórico divergiu — não puxei. Resolva manualmente.',
  );
}

done(
  { ok: true, status: 'updated', branch, ahead, behind, message: `Atualizado: ${behind} commit(s) puxado(s).` },
  `✔ Atualizado com origin/${branch} (+${behind}).`,
);
