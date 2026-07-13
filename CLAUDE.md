# CLAUDE.md — Contexto principal para o Claude Code

> **Leitura obrigatória.** Este arquivo é a primeira coisa que o Claude Code lê. Carrega o restante por demanda lendo os arquivos referenciados em `docs/`.

---

<!-- BOOTSTRAP:START -->
## 🚀 ATENÇÃO: Este é o BOILERPLATE ORIGINAL — modo bootstrap ATIVO

**SE VOCÊ ESTÁ VENDO ISTO, A PESSOA QUER CRIAR UM PROJETO NOVO.**

Verifique rapidamente:
- `package.json` tem `"name": "ham-boilerplate-ia"`? ✅ É o boilerplate original.
- `origin` aponta para `Hospital-Adventista-de-Manaus/ham-boilerplate-ia`? ✅ É o boilerplate original.

**SE AMBAS FOREM SIM:** Você está no **modo bootstrap**. Ignore toda a documentação abaixo e siga APENAS isto:

### Fluxo de Criação de Projeto Novo

1. **Pergunte o nome do projeto:**
   > "Qual é o nome do projeto que você quer criar?"
   
   Confirme o slug derivado (ex: "Painel de Sepse" → `painel-de-sepse`).

2. **Pergunte o e-mail (se não tiver git config):**
   > "Qual é seu e-mail corporativo? (ex: voce@ham.org.br)"

3. **Execute o script de bootstrap:**
   ```bash
   node scripts/bootstrap/novo-projeto.mjs --nome "Nome Dado" --email "email@ham.org.br"
   ```

4. **Aguarde a execução** — ele:
   - Copia os arquivos do boilerplate
   - Chama a API de provisionamento
   - Cria o repositório privado na organização
   - Provisiona um banco de dados isolado
   - Faz push para `staging`

5. **Reporte o resultado** — se `ok: true`:
   - Envie o **link do repositório** (`repoUrl`)
   - Localize de onde o projeto foi criado (`dest`)
   - Mencione que as **credenciais do banco estão em `apps/api/.env`** (não exiba a senha)
   - Próximo passo sugerido: `pnpm install && pnpm dev`

**Pré-requisitos:** ver `docs/PRE_REQUISITOS.md` se a máquina não tiver Node/Git/pnpm.

**Nota:** Esta seção é removida automaticamente nos projetos gerados (não aparece em projetos novos).

<!-- BOOTSTRAP:END -->

---

## 🔄 Sincronização com o git (faça sempre em projetos existentes)

**NOTA:** Esta seção só se aplica se você **NÃO** está no modo bootstrap. Se é um projeto gerado (não o boilerplate), siga isto:

**No início de cada sessão e antes de editar qualquer arquivo**, rode:

```
node scripts/sync/git-sync.mjs
```

Isso garante que você trabalha sobre o que está na branch atual (`staging`/`main`) do GitHub.
O script é seguro: só faz fast-forward e **não** sobrescreve mudanças locais não commitadas
(nesse caso ele apenas avisa). Leia o bloco `<RESULT>` para saber o status. Se ele avisar que
está bloqueado por mudanças locais, resolva antes de continuar.

---

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
