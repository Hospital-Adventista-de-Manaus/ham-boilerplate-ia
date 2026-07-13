#!/usr/bin/env node
// @ts-check
/**
 * novo-projeto.mjs — Motor de scaffold do ham-boilerplate-ia.
 *
 * Cria um projeto novo a partir deste boilerplate:
 *   1. copia os arquivos para uma pasta nova (sem o .git do boilerplate);
 *   2. remove a maquinaria de bootstrap do projeto gerado;
 *   3. substitui os textos fixos ("boilerplate") pelo nome do projeto;
 *   4. git init na branch `staging` + commit inicial;
 *   5. chama a API de provisionamento (cria o repo privado na org + provisiona
 *      o banco) e conecta o `origin`, gravando as credenciais em apps/api/.env;
 *   6. faz push para `staging`.
 *
 * Uso:
 *   node scripts/bootstrap/novo-projeto.mjs --nome "Meu Projeto" --email voce@ham.org.br [--dir <destino>] [--skip-remote]
 *
 * Flags:
 *   --nome         Nome do projeto (obrigatório). Vira o título humano; o slug é derivado dele.
 *   --email        E-mail do responsável (obrigatório, salvo com --skip-remote). Enviado à API.
 *   --dir          Destino explícito. Padrão: pasta irmã <repo>/../<slug>.
 *   --skip-remote  Só faz o scaffold local + git init/commit (sem API/push). Útil para dry-run.
 *
 * Env:
 *   PROVISION_API_URL  Base da API de provisionamento (default: https://api-provisionamento.apps.ham.org.br).
 *
 * Saída: imprime um bloco JSON entre <RESULT> e </RESULT> para o Claude ler.
 */

import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORG = 'Hospital-Adventista-de-Manaus';
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Pastas/arquivos que nunca são copiados para o projeto novo.
const EXCLUDE_DIRS = new Set(['.git', 'node_modules', '.next', 'dist', '.turbo', 'coverage']);

/**
 * Encerra com mensagem clara e código de erro.
 * @returns {never}
 */
function fail(message, extra = {}) {
  emit({ ok: false, error: message, ...extra });
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

/** Imprime o bloco de resultado que o Claude consome. */
function emit(payload) {
  console.log(`\n<RESULT>${JSON.stringify(payload, null, 2)}</RESULT>`);
}

/** Executa um comando externo capturando saída. */
function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: 'utf8', ...opts });
}

/** Parser mínimo de argumentos --chave valor / --flag. */
function parseArgs(argv) {
  /** @type {Record<string, string | boolean>} */
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

/** Converte um nome livre em slug seguro para repo/pacote. */
function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // remove acentos (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // não-alfanumérico → hífen
    .replace(/^-+|-+$/g, '') // tira hífens das pontas
    .replace(/-{2,}/g, '-'); // colapsa hífens repetidos
}

// ── 0. Argumentos ────────────────────────────────────────────────────────────
const args = parseArgs(process.argv.slice(2));
const projectName = typeof args.nome === 'string' ? args.nome.trim() : '';
const skipRemote = args['skip-remote'] === true;

// Base da API de provisionamento (sem barra final).
const PROVISION_API_URL = (
  process.env.PROVISION_API_URL || 'https://api-provisionamento.apps.ham.org.br'
).replace(/\/+$/, '');

if (!projectName) {
  fail('Faltou --nome. Ex.: node scripts/bootstrap/novo-projeto.mjs --nome "Meu Projeto" --email voce@ham.org.br');
}

// E-mail do responsável: --email tem prioridade; senão cai no git config user.email.
const email =
  (typeof args.email === 'string' ? args.email.trim() : '') ||
  (run('git', ['config', 'user.email']).stdout || '').trim();

const slug = slugify(projectName);
if (!slug) {
  fail(`Não consegui derivar um slug válido de "${projectName}". Escolha um nome com letras/números.`);
}

const dest =
  typeof args.dir === 'string'
    ? isAbsolute(args.dir)
      ? args.dir
      : resolve(process.cwd(), args.dir)
    : join(dirname(REPO_ROOT), slug);

// ── 1. Preflight ──────────────────────────────────────────────────────────────
console.log(`▶ Projeto: "${projectName}"  ·  slug: "${slug}"`);
console.log(`▶ Destino: ${dest}`);

if (run('git', ['--version']).status !== 0) {
  fail('git não encontrado no PATH. Instale o git antes de continuar.');
}

if (existsSync(dest)) {
  fail(`O destino já existe: ${dest}. Escolha outro nome ou remova a pasta.`);
}

if (!skipRemote) {
  // A criação do repo e o acesso à org são responsabilidade da API de
  // provisionamento (ela usa o token da org). Aqui só validamos o e-mail,
  // que a API exige. A existência do repo é checada pela própria API (409).
  if (!email) {
    fail(
      'Faltou o e-mail do responsável. Passe --email voce@ham.org.br ' +
        'ou configure `git config user.email`. A API de provisionamento exige um e-mail válido.',
    );
  }
}

// ── 2. Cópia da árvore de trabalho ─────────────────────────────────────────────
console.log('▶ Copiando arquivos do boilerplate…');
cpSync(REPO_ROOT, dest, {
  recursive: true,
  filter: (src) => {
    const rel = src.slice(REPO_ROOT.length).replace(/\\/g, '/').replace(/^\//, '');
    if (!rel) return true;
    const segments = rel.split('/');
    // exclui diretórios pesados/gerados em qualquer nível
    if (segments.some((seg) => EXCLUDE_DIRS.has(seg))) return false;
    // exclui env locais, mas mantém .env.example
    const base = segments[segments.length - 1];
    if (base === '.env' || base === '.env.local' || /\.env\..*\.local$/.test(base)) return false;
    return true;
  },
});

// ── 3. Auto-limpeza (remove a maquinaria de bootstrap do projeto gerado) ────────
console.log('▶ Removendo maquinaria de bootstrap do projeto gerado…');
rmSync(join(dest, 'scripts', 'bootstrap'), { recursive: true, force: true });
rmSync(join(dest, '.claude', 'commands', 'novo-projeto.md'), { force: true });

// remove o bloco <!-- BOOTSTRAP:START --> ... <!-- BOOTSTRAP:END --> do CLAUDE.md
const claudeMdPath = join(dest, 'CLAUDE.md');
if (existsSync(claudeMdPath)) {
  const original = readFileSync(claudeMdPath, 'utf8');
  const stripped = original.replace(
    /\n?<!-- BOOTSTRAP:START -->[\s\S]*?<!-- BOOTSTRAP:END -->\n?/g,
    '\n',
  );
  if (stripped !== original) writeFileSync(claudeMdPath, stripped);
}

// ── 4. Substituição de textos fixos ────────────────────────────────────────────
console.log('▶ Substituindo textos "boilerplate" pelo nome do projeto…');
/** Aplica uma lista de [de, para] num arquivo do destino. */
function replaceInFile(relPath, replacements) {
  const filePath = join(dest, relPath);
  if (!existsSync(filePath)) return;
  let content = readFileSync(filePath, 'utf8');
  for (const [from, to] of replacements) content = content.split(from).join(to);
  writeFileSync(filePath, content);
}

replaceInFile('package.json', [
  ['"name": "ham-boilerplate-ia"', `"name": "${slug}"`],
  [
    '"description": "Boilerplate monorepo (Next.js + NestJS) pronto para Claude Code + deploy Coolify via push GitHub."',
    `"description": "${projectName} — projeto HAM (Next.js + NestJS), deploy Coolify via push GitHub."`,
  ],
]);
replaceInFile('apps/web/src/app/layout.tsx', [["title: 'HAM Boilerplate IA'", `title: '${projectName}'`]]);
replaceInFile('apps/web/src/app/page.tsx', [['HAM · Boilerplate IA', projectName]]);
replaceInFile('docker-compose.yml', [
  ['container_name: ham-web', `container_name: ${slug}-web`],
  ['container_name: ham-api', `container_name: ${slug}-api`],
]);
replaceInFile('README.md', [['# ham-boilerplate-ia', `# ${slug}`]]);

// ── 5. git init + commit inicial na branch staging ──────────────────────────────
console.log('▶ Inicializando git na branch `staging`…');
const gitEnv = { cwd: dest };
let r = run('git', ['init', '-b', 'staging'], gitEnv);
if (r.status !== 0) fail(`git init falhou: ${r.stderr || r.stdout}`, { dest });
run('git', ['add', '-A'], gitEnv);
r = run('git', ['commit', '-m', 'chore: scaffold inicial a partir do ham-boilerplate-ia'], gitEnv);
if (r.status !== 0) {
  fail(`git commit falhou (configure user.name/user.email?): ${r.stderr || r.stdout}`, { dest });
}

if (skipRemote) {
  console.log('▶ --skip-remote: pulando criação de repo e push.');
  emit({
    ok: true,
    skippedRemote: true,
    projectName,
    slug,
    dest,
    branch: 'staging',
    message: 'Scaffold local pronto (sem repo remoto). Push manual quando quiser.',
  });
  process.exit(0);
}

// ── 6. Provisiona repo + banco via API e conecta o `origin` (ANTES do push) ─────
console.log(`▶ Provisionando repositório + banco via API para "${slug}"…`);

/** @type {any} */
let provision;
try {
  const resp = await fetch(`${PROVISION_API_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nomeProjeto: slug, nome: projectName, email }),
  });
  const raw = await resp.text();
  if (!resp.ok) {
    fail(`A API de provisionamento retornou HTTP ${resp.status}.`, {
      stage: 'provision',
      projectName,
      slug,
      dest,
      branch: 'staging',
      detail: raw.slice(0, 600),
      nextStep:
        `Confirme que a API está no ar (${PROVISION_API_URL}/health) e que o projeto "${slug}" ainda não foi provisionado. ` +
        `A pasta local está pronta com o commit na branch staging.`,
    });
  }
  provision = JSON.parse(raw);
} catch (err) {
  fail(`Não consegui falar com a API de provisionamento (${PROVISION_API_URL}).`, {
    stage: 'provision',
    projectName,
    slug,
    dest,
    branch: 'staging',
    detail: String(err && err.message ? err.message : err),
    nextStep: `Verifique a conexão e se a API responde em ${PROVISION_API_URL}/health, depois rode de novo.`,
  });
}

const repoUrl = provision?.repositorio?.url;
if (!repoUrl) {
  fail('A API não retornou a URL do repositório (campo repositorio.url).', {
    stage: 'provision',
    projectName,
    slug,
    dest,
    branch: 'staging',
    detail: JSON.stringify(provision).slice(0, 600),
  });
}

// Conecta o `origin` ao repositório recém-criado pela API.
r = run('git', ['remote', 'add', 'origin', repoUrl], gitEnv);
if (r.status !== 0) {
  // Se já existir um origin (re-execução), atualiza a URL.
  run('git', ['remote', 'set-url', 'origin', repoUrl], gitEnv);
}

// Grava as credenciais do banco no .env da API do projeto (NÃO exibir na tela).
if (provision.envFile) {
  writeFileSync(join(dest, 'apps', 'api', '.env'), `${provision.envFile}\n`);
  console.log('▶ Credenciais do banco gravadas em apps/api/.env (não exibidas).');
}

// ── 7. Push da branch staging ───────────────────────────────────────────────────
console.log('▶ Enviando `staging` para o GitHub…');
r = run('git', ['push', '-u', 'origin', 'staging'], gitEnv);
if (r.status !== 0) {
  emit({
    ok: false,
    stage: 'push',
    projectName,
    slug,
    dest,
    branch: 'staging',
    repoUrl,
    error: 'Repositório criado, mas o push falhou.',
    detail: (r.stderr || r.stdout || '').trim(),
    nextStep: `cd "${dest}" && git push -u origin staging`,
  });
  console.error(`\n✖ Push falhou. Veja o bloco <RESULT> acima.`);
  process.exit(1);
}

// ── Sucesso ─────────────────────────────────────────────────────────────────────
emit({
  ok: true,
  projectName,
  slug,
  dest,
  branch: 'staging',
  repoUrl,
  message: 'Projeto criado, repositório privado na org e branch staging publicada.',
});
console.log(`\n✔ Pronto! Repositório: ${repoUrl}  (branch staging)`);
