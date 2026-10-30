#!/usr/bin/env node
// @ts-check
/**
 * solicitar-acesso.mjs — Pede ao Gestão-TD autorização para mapear uma integração nova com o SoulMV.
 *
 * Fluxo: cria a solicitação → aguarda um admin decidir (tempo real) → se aprovada, envia o .har
 * direto para a API do Gestão-TD (o conteúdo do arquivo NÃO é lido nem impresso aqui) e salva o
 * .md de uso em docs/integracoes-mv/.
 *
 * Uso:
 *   node scripts/mv/solicitar-acesso.mjs --motivo "<finalidade, mín. 20 caracteres>" [--har <caminho>]
 *        [--projeto <nome>] [--email <email>]
 *
 * Saída: linhas de status em português e, ao final, uma linha `STATUS=<estado>`.
 * Códigos de saída: 0 concluído · 2 rejeitada · 3 expirada/tempo esgotado · 4 API indisponível · 1 erro de uso.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASE = (process.env.NEXT_PUBLIC_HAM_GUARD_URL ?? process.env.HAM_GUARD_URL ?? 'https://gestao-td-api.apps-ia.ham.org.br').replace(/\/+$/, '');
const API = `${BASE}/soulmv/solicitacoes-captura`;
const TIMEOUT_TOTAL_MS = 9 * 60 * 1000;
const STATE_FILE = resolve(ROOT, '.mv-solicitacao.json');

function arg(nome) {
  const i = process.argv.indexOf(`--${nome}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function fim(codigo, status, linha) {
  if (linha) console.log(linha);
  console.log(`STATUS=${status}`);
  // Deixa as conexões do fetch fecharem antes de sair (evita falha do libuv no Windows).
  try {
    await globalThis[Symbol.for('undici.globalDispatcher.1')]?.close();
  } catch {
    /* ignora */
  }
  await new Promise((ok) => setTimeout(ok, 150));
  process.exit(codigo);
}

async function indisponivel() {
  await fim(4, 'INDISPONIVEL', 'Não foi possível enviar a solicitação ao Gestão-TD agora. Tente novamente em alguns minutos.');
}

function gitEmail() {
  const r = spawnSync('git', ['config', 'user.email'], { cwd: ROOT, encoding: 'utf8' });
  return (r.stdout || '').trim();
}

function nomeProjeto() {
  try {
    return JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')).name ?? basename(ROOT);
  } catch {
    return basename(ROOT);
  }
}

async function chamar(url, opcoes) {
  try {
    return await fetch(url, opcoes);
  } catch {
    return await indisponivel();
  }
}

const motivo = (arg('motivo') ?? '').trim();
const projeto = (arg('projeto') ?? nomeProjeto()).toLowerCase().replace(/^@[^/]+\//, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const email = (arg('email') ?? gitEmail()).trim();
const harPath = arg('har') ? resolve(arg('har')) : undefined;

if (motivo.length < 20) await fim(1, 'ERRO_USO', 'Informe a finalidade do uso (--motivo, no mínimo 20 caracteres).');
if (email && !/@ham\.org\.br$/i.test(email)) await fim(1, 'ERRO_USO', 'Use seu e-mail @ham.org.br (configure `git config user.email` ou passe --email).');
if (!email) await fim(1, 'ERRO_USO', 'Não encontrei seu e-mail. Configure `git config user.email` ou passe --email.');

let arquivo;
if (harPath) {
  try {
    arquivo = { nome: basename(harPath), tamanhoBytes: statSync(harPath).size };
    if (arquivo.tamanhoBytes > 40 * 1024 * 1024) await fim(1, 'ERRO_USO', 'O arquivo de captura passa de 40 MB. Grave um fluxo menor.');
  } catch {
    await fim(1, 'ERRO_USO', 'Arquivo de captura não encontrado no caminho informado.');
  }
}

// 1) cria a solicitação
const criada = await chamar(API, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ projeto, email, motivo, arquivo, origem: 'boilerplate' }),
});
if (criada.status === 409) await fim(3, 'JA_PENDENTE', 'Já existe uma solicitação pendente deste projeto e e-mail no Gestão-TD. Aguarde a decisão do administrador.');
if (criada.status === 400) await fim(1, 'ERRO_USO', 'O Gestão-TD recusou os dados da solicitação. Confira o e-mail (@ham.org.br) e a finalidade (20 a 1000 caracteres).');
if (criada.status === 429) await fim(3, 'LIMITE', 'Limite de solicitações atingido ou a fila do Gestão-TD está cheia. Tente novamente mais tarde.');
if (!criada.ok) {
  if (criada.status >= 500 || criada.status === 404) await indisponivel();
  await fim(1, 'ERRO', 'O Gestão-TD não aceitou a solicitação. Tente novamente em alguns minutos.');
}
const { id, segredo } = await criada.json();
writeFileSync(STATE_FILE, JSON.stringify({ id, projeto, email, criadaEm: new Date().toISOString() }));
console.log(`Solicitação enviada ao Gestão-TD (projeto: ${projeto} · e-mail: ${email}).`);
console.log('Um administrador vai avaliar o uso da integração com o SoulMV. Assim que autorizar, o envio segue automaticamente.');
console.log('STATUS=PENDENTE');

// 2) aguarda a decisão (long-poll)
const limite = Date.now() + TIMEOUT_TOTAL_MS;
let decisao;
while (Date.now() < limite) {
  const r = await chamar(`${API}/${id}/aguardar?timeout=25`, { headers: { 'x-solicitacao-segredo': segredo } });
  if (!r.ok) {
    if (r.status === 404) await fim(3, 'EXPIRADA', 'A solicitação não está mais disponível no Gestão-TD.');
    await new Promise((ok) => setTimeout(ok, 3000));
    continue;
  }
  const corpo = await r.json();
  if (corpo.status === 'pendente') continue;
  decisao = corpo;
  break;
}
if (!decisao) await fim(3, 'TEMPO_ESGOTADO', 'Ainda aguardando o administrador. Rode o mesmo comando de novo quando ele tiver avaliado.');
if (decisao.status === 'rejeitada') await fim(2, 'REJEITADA', `O Gestão-TD não aprovou esta integração.${decisao.motivoRejeicao ? ` Motivo: ${decisao.motivoRejeicao}` : ''}`);
if (decisao.status === 'falhou') await fim(1, 'FALHOU', 'O Gestão-TD não conseguiu processar esta solicitação. Tente enviar a solicitação novamente.');
if (decisao.status === 'concluida') await fim(0, 'CONCLUIDO', `Esta solicitação já foi concluída (mapeamento ${decisao.mapeamentoId ?? '?'}).`);
if (decisao.status === 'expirada') await fim(3, 'EXPIRADA', 'A solicitação expirou. Faça uma nova.');
if (decisao.status !== 'aprovada' || !decisao.uploadToken) await fim(3, 'EXPIRADA', 'Não foi possível obter a autorização. Faça uma nova solicitação.');

console.log('Autorizado pelo Gestão-TD.');
console.log('STATUS=APROVADA');

// 3) envia o .har direto para a API (sem ler/imprimir o conteúdo)
if (!harPath) await fim(0, 'APROVADA_SEM_ARQUIVO', 'Informe o caminho do arquivo de captura para eu enviar ao Gestão-TD (rode de novo com --har).');
const form = new FormData();
form.append('har', new Blob([readFileSync(harPath)]), basename(harPath));
const envio = await chamar(`${API}/${id}/har`, { method: 'POST', headers: { authorization: `Bearer ${decisao.uploadToken}` }, body: form });
if (envio.status === 400) await fim(1, 'FALHA_ENVIO', 'O arquivo informado não é uma captura válida (HAR). A autorização continua válida por alguns minutos; envie o arquivo correto.');
if (envio.status === 401) await fim(3, 'EXPIRADA', 'A autorização de envio expirou ou já foi usada. Faça uma nova solicitação.');
if (!envio.ok) await fim(1, 'FALHA_ENVIO', 'O Gestão-TD recebeu a autorização, mas não conseguiu processar a captura. Tente enviar a solicitação novamente.');

// A resposta é NDJSON: etapa/ping (progresso) e, no fim, `concluido` ou `erro`.
let resultado;
let falhaMsg;
const tratarLinha = (linha) => {
  let ev;
  try {
    ev = JSON.parse(linha);
  } catch {
    return;
  }
  if (ev.tipo === 'etapa') console.log(`Gestão-TD processando a captura: ${ev.etapa}...`);
  else if (ev.tipo === 'concluido') resultado = ev;
  else if (ev.tipo === 'erro') falhaMsg = ev.mensagem ?? 'erro no processamento';
  else if (!ev.tipo && (ev.mapeamentoId || ev.id)) resultado = ev; // JSON simples
};
try {
  const leitor = envio.body.getReader();
  const decodificador = new TextDecoder();
  let resto = '';
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    resto += decodificador.decode(value, { stream: true });
    const partes = resto.split(/\r?\n/);
    resto = partes.pop() ?? '';
    partes.filter(Boolean).forEach(tratarLinha);
  }
  if (resto.trim()) tratarLinha(resto.trim());
} catch {
  /* conexão caiu antes do fim: confere o estado na API abaixo */
}
if (falhaMsg) await fim(1, 'FALHA_ENVIO', `O Gestão-TD não conseguiu processar a captura: ${falhaMsg}`);
if (!resultado) {
  const r = await chamar(`${API}/${id}/aguardar?timeout=1`, { headers: { 'x-solicitacao-segredo': segredo } });
  const corpo = r.ok ? await r.json().catch(() => undefined) : undefined;
  if (corpo?.status === 'concluida' && corpo.mapeamentoId) {
    console.log(`Mapeamento ${corpo.mapeamentoId} criado no Gestão-TD. O .md de uso está disponível na Central de Integrações SoulMV.`);
    console.log('STATUS=CONCLUIDO');
    process.exitCode = 0;
    await new Promise((ok) => setTimeout(ok, 0));
    process.exit(0);
  }
  await fim(1, 'FALHA_ENVIO', 'A conexão com o Gestão-TD caiu antes do fim do processamento. Tente enviar a solicitação novamente.');
}

const mapeamentoId = resultado.mapeamentoId ?? resultado.id;
if (resultado.mdUso) {
  const pasta = resolve(ROOT, 'docs', 'integracoes-mv');
  mkdirSync(pasta, { recursive: true });
  writeFileSync(resolve(pasta, `${mapeamentoId}.md`), String(resultado.mdUso));
  console.log(`Mapeamento ${mapeamentoId} criado. .md de uso salvo em docs/integracoes-mv/${mapeamentoId}.md.`);
} else {
  console.log(`Mapeamento ${mapeamentoId} criado no Gestão-TD.`);
}
console.log('O token de consumo da rota é gerado na Central de Integrações SoulMV do Gestão-TD.');
console.log('STATUS=CONCLUIDO');
process.exitCode = 0; // saída natural: process.exit() aqui aciona falha do libuv no Windows
