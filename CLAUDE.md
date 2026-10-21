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

### Regra de resiliência: toda falha tem pelo menos uma segunda tentativa

Nenhuma etapa deste fluxo (preflight, scaffold, commit, provisionamento, push, subir o dev) pode
terminar em "deu erro, aqui está a mensagem" na primeira tentativa. Sempre que algo falhar:

1. Leia a causa real (stderr, status code, `detail` do `<RESULT>`) — nunca repita a mesma ação
   exatamente igual esperando resultado diferente.
2. Pense em pelo menos uma causa alternativa plausível e teste-a você mesmo (ex.: push falhou →
   tente `gh auth setup-git` + retry; porta ocupada → suba em outra porta; comando não encontrado →
   procure um caminho alternativo ou instale).
3. Só reporte a falha pra pessoa depois de esgotar as alternativas razoáveis — e mesmo aí, nunca em
   linguagem técnica crua: traduza pro que ela precisa fazer ou saber, em uma frase.

Isso vale para qualquer problema, não só os já mapeados abaixo.

### Regra de ouro: resolva sozinho, não pergunte

O único dado que só a pessoa sabe é **o nome do projeto**. Tudo o resto (Node, pnpm, git, e-mail,
autenticação do GitHub) você verifica e corrige sozinho, sem interromper, **antes** de rodar o
script. Só volte a perguntar algo se o Passo 0 abaixo esgotar as alternativas automáticas.

### Passo 0 — Preparação automática do ambiente (faça isso ANTES de perguntar o nome)

Rode estas checagens em sequência, corrigindo o que der automaticamente:

1. **Git:** `git --version`. Se faltar, é o único bloqueio que exige a pessoa — peça pra instalar
   (https://git-scm.com) e pare aqui.
2. **GitHub é pré-requisito — mas `gh` é só UM jeito de confirmar isso, não o único.** Muita
   máquina (principalmente Windows) já tem o git autenticado via Git Credential Manager, SSH ou
   outro `credential.helper`, sem nunca ter instalado o `gh` CLI. Ordem de verificação:
   ```bash
   gh --version
   ```
   - **`gh` não instalado:** não trate isso como bloqueio — rode
     `git ls-remote https://github.com/octocat/Hello-World.git HEAD` (repo público, só testa se o
     git já enxerga o GitHub). Se funcionar, o git já está autenticado por outro meio (Credential
     Manager, SSH) — siga em frente normalmente, sem pedir pra instalar `gh`. Só volte a isso se o
     push de verdade (lá no final) falhar por autenticação.
   - **`gh` instalado:**
     ```bash
     gh auth status
     ```
     - Se **não autenticado**: rode `gh auth login` (fluxo interativo/navegador) e espere a pessoa
       concluir.
     - Se **autenticado**: rode `gh auth setup-git` de qualquer forma, mesmo que pareça redundante
       — é o passo que registra o git como cliente das credenciais do `gh`. **Essa é a causa nº 1
       de "o push falhou" mesmo com `gh` logado**, e corrigi-la aqui evita o erro lá na frente.
   - **Nunca pergunte o e-mail do usuário.** O e-mail vem sozinho — `git config user.email`
     (funciona com ou sem `gh`), senão `gh api user --jq .email` (só se `gh` existir), senão o
     e-mail noreply do GitHub — o script de bootstrap já faz essa cadeia inteira sozinho. Só
     pergunte e-mail se nenhuma dessas fontes existir.
   - **Nunca pergunte nome/e-mail de identidade do git** (o erro cru "Please tell me who you
     are" nunca deve chegar na pessoa). O script de bootstrap já configura `user.name`/
     `user.email` locais no projeto novo sozinho antes do commit, com fallback genérico
     ("Equipe HAM") se não achar nada — isso nunca bloqueia o fluxo.
3. **Node:** `node -v`. Se a versão não bater com `engines.node` do `package.json` raiz, mas ainda
   assim rodar o projeto, **não trave por causa disso** — siga em frente. Só peça pra pessoa
   instalar se o Node estiver **ausente** (nenhum `node` no PATH).
4. **pnpm:** `pnpm -v`. Se faltar ou vier incompatível, resolva sozinho, sem perguntar:
   ```bash
   corepack enable && corepack prepare pnpm@9.12.0 --activate
   ```
   (o script de bootstrap já tenta isso automaticamente também, isto aqui é só pra garantir que
   os comandos seguintes — `pnpm install`, `pnpm dev` — funcionem de primeira no final.)

Se tudo acima passou (ou você já corrigiu), prossiga sem relatar essas checagens em detalhe —
um resumo de uma linha ("ambiente verificado, GitHub conectado") basta.

### Fluxo de Criação de Projeto Novo

1. **Pergunte só o nome do projeto:**
   > "Qual é o nome do projeto que você quer criar?"

   Confirme o slug derivado (ex: "Painel de Sepse" → `painel-de-sepse`).

2. **Detecte o username do GitHub logado** (para a API dar acesso de push à conta da pessoa):
   ```bash
   gh api user --jq .login
   ```
   Isso já deve funcionar de primeira, já que o Passo 0 confirmou a autenticação.

3. **Execute o script de bootstrap** (não passe `--email` — ele resolve isso sozinho):
   ```bash
   node scripts/bootstrap/novo-projeto.mjs --nome "Nome Dado" --github-user "login-detectado"
   ```

4. **Aguarde a execução** — ele:
   - Verifica/ativa pnpm via Corepack e a credencial de git do `gh` sozinho (redundante com o
     Passo 0, mas não custa nada)
   - Copia os arquivos do boilerplate
   - Resolve o e-mail do responsável automaticamente (git config → GitHub → noreply)
   - Chama a API de provisionamento (enviando o `githubUsername`, se detectado)
   - Cria o repositório privado na organização
   - Adiciona a conta do GitHub da pessoa como collaborator (push), quando o username foi enviado
   - Provisiona um banco de dados isolado
   - Faz push para `staging` — e se falhar na primeira tentativa, já tenta de novo sozinho depois
     de reconfigurar a credencial do git

5. **Se mesmo assim o push falhar** (bloco `<RESULT>` com `"stage": "push"`): não jogue o erro cru
   pra pessoa. Leia o `detail`, tente diagnosticar (ex.: `gh auth status`, `git remote -v`,
   `git push -u origin staging` manualmente para ver o erro completo) e corrija você mesmo antes de
   pedir ajuda — o repositório e o commit local já existem, então um push manual depois de corrigir
   a causa resolve sem precisar recomeçar.

6. **Depois do `ok: true`, suba o projeto você mesmo — nunca pergunte se pode.** `pnpm install &&
   pnpm dev` (ou os comandos do preview do seu ambiente) não é destrutivo e faz parte do fluxo até
   o fim: a tarefa só termina quando front e back estiverem rodando e você confirmou que o `/health`
   da API respondeu. Isso vale mesmo que a pessoa não tenha pedido explicitamente — "criar o
   projeto" inclui deixá-lo rodando.

7. **Relatório final — sempre com uma tabela curta, nunca um parágrafo técnico:**

   | O quê | Link/Info |
   |---|---|
   | **Link da sua aplicação** | http://localhost:3000 |
   | Repositório no GitHub | `repoUrl` |
   | Pasta no seu computador | `dest` |

   Depois da tabela, só uma frase: as credenciais do banco já estão configuradas em
   `apps/api/.env` (nunca exiba a senha), e o projeto já está pronto pra usar.

**Pré-requisitos:** ver `docs/PRE_REQUISITOS.md` — mas o Passo 0 acima já cobre a maior parte sozinho.

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
11. **Toda UI usa obrigatoriamente o design system HAM** (tokens em `apps/web/tailwind.config.ts`, detalhado em `apps/web/CLAUDE.md`). Nenhuma tela/componente novo usa cor ou fonte fora desses tokens.
12. **Modelo e esforço padrão em `.claude/settings.json`** (`model: "sonnet"`, `effortLevel: "medium"`) — economiza tokens e mantém o ritmo ágil descrito na skill `fast-executor`. Não aumente pra "high"/"xhigh" por padrão; se uma tarefa específica exigir mais raciocínio, ajuste pontualmente na sessão (`/model`, `/effort`), não neste arquivo.

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
- "Vou adicionar Prisma ao apps/api" → `docs/PRISMA.md` (leia antes — bug de build em produção já mapeado)
