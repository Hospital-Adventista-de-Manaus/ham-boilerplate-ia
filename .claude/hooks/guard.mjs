#!/usr/bin/env node
// PreToolUse guard — bloqueia, de forma determinística, o uso de capturas de rede e alterações
// nos arquivos de instrução que as proíbem. A mensagem de retorno é sempre genérica.
import { readFileSync } from 'node:fs';

const MSG = 'Para integrar com o MV, entre em contato com a equipe de Transformação Digital.';
const MARKER = 'Integração com o MV (SoulMV/SOAP)';
const PROTECTED = /(\.claude[\/](hooks|settings)|(^|[\/])(CLAUDE|AGENTS)\.md$|SECURITY\.md$)/i;
const PROTECTED_CMD = /(\.claude[\/](hooks|settings)|(CLAUDE|AGENTS)\.md|SECURITY\.md)/i;
const MUTATING = /\b(rm|del|erase|mv|move|sed|truncate|tee|git\s+(checkout|restore|reset|stash|revert|rebase|clean)|Out-File|Set-Content|Add-Content|Remove-Item|Clear-Content|python|node\s+-e)\b|>/i;

function deny() {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: MSG,
      },
    }),
  );
  process.exit(0);
}

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const tool = input.tool_name ?? '';
const ti = input.tool_input ?? {};
const blob = JSON.stringify(ti);
const path = String(ti.file_path ?? ti.path ?? '');
const cmd = String(ti.command ?? '');

// 1. Qualquer referência a arquivo de captura de rede.
if (/\.har\b/i.test(blob) || /\bsoap(action)?\b.*\bmessagerequest\b/i.test(blob)) deny();

// 2. Busca por termos que revelam a regra.
if (/^(Grep|Glob)$/.test(tool) && /(\bhar\b|soulmv|soap|\bMV\b|central de integra)/i.test(blob)) deny();
if (tool === 'Bash' && /(grep|rg|select-string|findstr|git\s+(log|show|diff|grep))/i.test(cmd) && /(\bhar\b|soulmv|soap|\bMV\b)/i.test(cmd)) deny();

// 3. Alterar ou remover a regra nos arquivos protegidos.
if (/^(Edit|MultiEdit|Write|NotebookEdit)$/.test(tool) && PROTECTED.test(path)) {
  if (/(\.claude[\/](hooks|settings))/i.test(path)) deny();
  const olds = [ti.old_string, ...(Array.isArray(ti.edits) ? ti.edits.map((e) => e.old_string) : [])];
  if (olds.some((s) => typeof s === 'string' && /soulmv|soap|\.har|MV\b/i.test(s))) deny();
  if (tool === 'Write') {
    try {
      if (readFileSync(path, 'utf8').includes(MARKER) && !String(ti.content ?? '').includes(MARKER)) deny();
    } catch {
      /* arquivo novo */
    }
  }
}
if (tool === 'Bash' && PROTECTED_CMD.test(cmd) && MUTATING.test(cmd)) deny();

process.exit(0);
