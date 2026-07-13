# CLAUDE.md — Contexto principal para o Claude Code

> **Leitura obrigatória.** Este arquivo é a primeira coisa que o Claude Code lê. Carrega o restante por demanda lendo os arquivos referenciados em `docs/`.

---

## 🔄 Sincronização com o git (faça sempre)

**No início de cada sessão e antes de editar qualquer arquivo**, rode:

```
node scripts/sync/git-sync.mjs
```

Isso garante que você trabalha sobre o que está na branch atual (`staging`/`main`) do GitHub.
O script é seguro: só faz fast-forward e **não** sobrescreve mudanças locais não commitadas
(nesse caso ele apenas avisa). Leia o bloco `<RESULT>` para saber o status. Se ele avisar que
está bloqueado por mudanças locais, resolva antes de continuar.

---

<!-- BOOTSTRAP:START -->
## 🚀 Modo Bootstrap (só no boilerplate original)

Se este repositório ainda é o **boilerplate original** — ou seja, `package.json` tem
`"name": "ham-boilerplate-ia"` **e** o `origin` aponta para
`Hospital-Adventista-de-Manaus/ham-boilerplate-ia` — então a pessoa provavelmente quer
**criar um projeto novo** a partir dele.

Nesse caso, ofereça conduzir o fluxo de projeto novo:

1. Pergunte **"Qual o nome do projeto?"** e confirme o slug derivado.
2. Rode o roteiro completo em `.claude/commands/novo-projeto.md` (ou execute direto
   `node scripts/bootstrap/novo-projeto.mjs --nome "<nome>"`).
3. O script cria a pasta nova, **cria o repositório privado na org ANTES do push** e envia a
   branch `staging`. Peça confirmação antes de criar o repo / dar push (ações externas).
4. Ao final, reporte o link do repositório, a pasta local e a branch `staging`.

Pré-requisitos da máquina estão em `docs/PRE_REQUISITOS.md`. **Não** rode este fluxo se o
repositório já for um projeto gerado (esta seção é removida automaticamente nos projetos novos).
<!-- BOOTSTRAP:END -->

## 1. O que este repositório é

Boilerplate monorepo para projetos do **HAM (Hospital Adventista de Manaus)** desenvolvidos com Claude Code. Stack escolhida para padronização interna:

- **Frontend:** Next.js 15 (App Router, React 19, Tailwind)
- **Backend:** NestJS 10 (Express adapter)
- **Tipos compartilhados:** package `@app/shared-types`
- **Monorepo:** pnpm workspaces + Turborepo
- **Deploy:** Coolify via push no GitHub (Dockerfile multi-stage por app)

**Não é** um starter genérico. É opinionado, alinhado às convenções do HAM, e otimizado para ser pilotado por agentes de IA.

## 2. Layout

```
.
├── apps/
│   ├── web/                  # Next.js (porta 3000)
│   │   ├── CLAUDE.md         # ⚠️ leia ao tocar frontend
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── app/          # App Router
│   │       ├── components/
│   │       └── lib/
│   └── api/                  # NestJS (porta 3001)
│       ├── CLAUDE.md         # ⚠️ leia ao tocar backend
│       ├── Dockerfile
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           └── health/
├── packages/
│   └── shared-types/         # Tipos compartilhados (HealthCheck, ApiError, …)
├── docs/                     # Documentação aprofundada
│   ├── ARCHITECTURE.md
│   ├── STACK.md
│   ├── CONVENTIONS.md
│   ├── DEVELOPMENT.md
│   ├── DEPLOYMENT.md
│   ├── AI_WORKFLOW.md        # ⚠️ leia antes de planejar uma feature
│   ├── TESTING.md
│   └── SECURITY.md
├── docker-compose.yml        # dev local (web + api)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 3. Comandos essenciais

| Tarefa | Comando |
|---|---|
| Instalar | `pnpm install` |
| Dev (tudo em paralelo) | `pnpm dev` |
| Dev só web | `pnpm --filter @app/web dev` |
| Dev só api | `pnpm --filter @app/api dev` |
| Build | `pnpm build` |
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| Testes | `pnpm test` |
| Subir Docker local | `pnpm docker:up` |

## 4. Regras invioláveis para o Claude

1. **Antes de codar uma feature**, leia `docs/AI_WORKFLOW.md` — define o ritual de planejamento, implementação e verificação.
2. **Antes de tocar `apps/web/`**, leia `apps/web/CLAUDE.md`.
3. **Antes de tocar `apps/api/`**, leia `apps/api/CLAUDE.md`.
4. **Tipos compartilhados entre web e api ficam em `packages/shared-types/`.** Nunca duplique uma interface entre os dois.
5. **Nada de `any` solto.** Tipagem estrita. Se precisar destravar, comente o porquê.
6. **Nunca commite segredos.** Use `.env` local + variáveis do Coolify em produção.
7. **Saída do Next.js é `standalone`** (em `next.config.ts`). Não mude sem entender o impacto no Dockerfile.
8. **CORS no Nest é controlado por `CORS_ORIGINS`** — configure no Coolify ao adicionar um novo domínio.
9. **Sempre rode `pnpm typecheck && pnpm lint`** antes de declarar uma tarefa terminada.
10. **Não invente comandos.** Os scripts oficiais estão em `package.json` (raiz + cada app).

## 5. Fluxo de deploy (resumo)

1. Você dá `git push` na branch monitorada (ex.: `main`).
2. Coolify recebe webhook e:
   - Builda `apps/web/Dockerfile` → container `web`
   - Builda `apps/api/Dockerfile` → container `api`
3. Coolify aplica variáveis de ambiente e expõe via domínio configurado.

Detalhes em `docs/DEPLOYMENT.md`.

## 6. Quando estiver em dúvida

- "Como organizo este código?" → `docs/CONVENTIONS.md`
- "Qual versão do X usar?" → `docs/STACK.md`
- "Como testar isso?" → `docs/TESTING.md`
- "Posso expor isso publicamente?" → `docs/SECURITY.md`
- "Como rodar localmente?" → `docs/DEVELOPMENT.md`
- "Como o sistema se conecta?" → `docs/ARCHITECTURE.md`
- "Como conduzir minha sessão de trabalho?" → `docs/AI_WORKFLOW.md`
