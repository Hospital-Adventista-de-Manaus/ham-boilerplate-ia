# Guia de implementação — do zero ao deploy

> Passo-a-passo para usar este boilerplate em um novo projeto: setup local → GitHub → Coolify → primeira feature.
>
> **Tempo estimado:** 30–45 minutos na primeira vez.

---

## Sumário

- [Parte 1 — Pré-requisitos](#parte-1--pré-requisitos)
- [Parte 2 — Adotar o boilerplate em um novo projeto](#parte-2--adotar-o-boilerplate-em-um-novo-projeto)
- [Parte 3 — Setup local](#parte-3--setup-local)
- [Parte 4 — Subir para o GitHub](#parte-4--subir-para-o-github)
- [Parte 5 — Configurar o Coolify](#parte-5--configurar-o-coolify)
- [Parte 6 — Primeiro deploy](#parte-6--primeiro-deploy)
- [Parte 7 — Domínios e HTTPS](#parte-7--domínios-e-https)
- [Parte 8 — Adicionar uma feature (fluxo padrão)](#parte-8--adicionar-uma-feature-fluxo-padrão)
- [Parte 9 — Adicionar banco de dados](#parte-9--adicionar-banco-de-dados-postgres)
- [Parte 10 — Troubleshooting](#parte-10--troubleshooting)

---

## Parte 1 — Pré-requisitos

Antes de começar, garanta que você tem:

- [ ] **Node.js 20** instalado (`node -v` → `v20.x.x`)
  ```bash
  # se não tiver, use nvm:
  nvm install 20 && nvm use 20
  ```
- [ ] **pnpm 9.12+** ativo
  ```bash
  corepack enable
  corepack prepare pnpm@9.12.0 --activate
  pnpm -v   # deve mostrar 9.12.x
  ```
- [ ] **Docker** + **Docker Compose** funcionando (`docker ps` não dá erro)
- [ ] **Git** configurado (`git config --global user.email` retorna seu email)
- [ ] **Conta GitHub** com permissão para criar repositórios na organização desejada
- [ ] **Servidor Coolify** acessível (URL e credenciais)
- [ ] **GitHub App do Coolify** instalada na sua org/conta (ou Deploy Key configurada) — veja [Parte 5](#parte-5--configurar-o-coolify)

---

## Parte 2 — Adotar o boilerplate em um novo projeto

> Você quer usar este boilerplate como base para um projeto novo (ex.: `meu-app-ham`).

### 2.1. Copiar a estrutura

```bash
# Saia da pasta do boilerplate e crie a do novo projeto
cd ~/GitHub
cp -R ham-boilerplate-ia meu-app-ham
cd meu-app-ham

# Apague o git antigo, comece do zero
rm -rf .git
git init
```

### 2.2. Renomear o projeto

Edite o `package.json` da raiz e troque o `name`:

```diff
- "name": "ham-boilerplate-ia",
+ "name": "meu-app-ham",
```

Edite o `README.md` se quiser personalizar o título.

> Os pacotes dos apps (`@app/web`, `@app/api`, `@app/shared-types`) podem manter o prefixo `@app/` — é interno ao monorepo, não vai pro npm.

### 2.3. Ajustar o CLAUDE.md raiz

Abra `CLAUDE.md` e troque a seção **"1. O que este repositório é"** pelo propósito do projeto novo. Mantenha o resto (regras, layout, comandos).

---

## Parte 3 — Setup local

### 3.1. Criar `.env`

```bash
cp .env.example .env
```

Os defaults já funcionam para dev local. Edite só se mudar portas.

### 3.2. Instalar dependências

```bash
pnpm install
```

Isso gera o `pnpm-lock.yaml` — **commite esse arquivo**.

### 3.3. Rodar em modo dev

```bash
pnpm dev
```

Deve subir:
- **web** em http://localhost:3000
- **api** em http://localhost:3001

### 3.4. Validar que funcionou

Abra http://localhost:3000 no browser. Você deve ver:

- Título "Monorepo Next.js + NestJS"
- Badge verde "ok" mostrando que o web conseguiu falar com a api

Se aparecer badge vermelho "offline", veja [Troubleshooting](#parte-10--troubleshooting).

### 3.5. Validar build de produção

Antes de subir para o git, garanta que o build passa:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Os quatro devem terminar sem erro.

### 3.6. (opcional) Validar o Docker

```bash
pnpm docker:up
```

Sobe web e api em containers. Confirme que http://localhost:3000 funciona igual.

Para parar:
```bash
pnpm docker:down
```

---

## Parte 4 — Subir para o GitHub

### 4.1. Criar o repositório no GitHub

Pelo browser ou via `gh`:

```bash
# via GitHub CLI:
gh repo create meu-app-ham --private --source=. --remote=origin
```

Ou manualmente:
1. Acesse https://github.com/new
2. Nome: `meu-app-ham`
3. Visibilidade: **Private** (recomendado para projeto interno)
4. **Não** inicialize com README/gitignore (já temos)
5. Crie

### 4.2. Primeiro commit

```bash
git add .
git commit -m "chore: scaffold from ham-boilerplate-ia"
git branch -M main
git remote add origin https://github.com/<sua-org>/meu-app-ham.git
git push -u origin main
```

### 4.3. Confirmar CI

O workflow `.github/workflows/ci.yml` roda automaticamente. Vá em **Actions** no GitHub e veja se o job "CI" termina verde.

Se falhar, conserte localmente antes de seguir.

---

## Parte 5 — Configurar o Coolify

### 5.1. Conectar GitHub ao Coolify (uma vez por organização)

No painel do Coolify:

1. **Sources → New** → **GitHub App**
2. Siga o fluxo OAuth — Coolify abre um app GitHub que você instala na sua organização
3. Selecione **apenas os repositórios necessários** (princípio do menor privilégio)
4. Confirme

> Já fez isso para outro projeto? Pule esta etapa.

### 5.2. Criar o Projeto

1. **Projects → New Project**
2. Nome: `meu-app-ham`
3. Crie

### 5.3. Criar Application 1 — Web (Next.js)

Dentro do projeto:

1. **+ New Resource → Application → Public/Private Repo** (escolha conforme a fonte)
2. **GitHub Source:** selecione o repositório `meu-app-ham`
3. **Branch:** `main`
4. **Build Pack:** **Dockerfile**
5. **Base Directory:** `/`
6. **Dockerfile Location:** `apps/web/Dockerfile`
7. **Ports Exposes:** `3000`
8. **Healthcheck Path:** `/`
9. Salvar (ainda **não** clique em Deploy)

**Configurar variáveis de ambiente** (aba *Environment Variables*):

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.meu-dominio.com    # ajuste para o domínio real
INTERNAL_API_URL=http://<service-name-da-api>:3001 # ver passo 5.4 abaixo
```

> Você ainda não sabe o nome do serviço da API. Deixe `INTERNAL_API_URL` placeholder, volte e ajuste após criar a aplicação API.

### 5.4. Criar Application 2 — API (NestJS)

Repita o fluxo:

1. **+ New Resource → Application** → mesmo repositório
2. **Branch:** `main`
3. **Build Pack:** **Dockerfile**
4. **Base Directory:** `/`
5. **Dockerfile Location:** `apps/api/Dockerfile`
6. **Ports Exposes:** `3001`
7. **Healthcheck Path:** `/health`
8. Salvar

**Variáveis de ambiente:**

```
NODE_ENV=production
PORT=3001
CORS_ORIGINS=https://app.meu-dominio.com           # domínio do web
```

### 5.5. Descobrir o nome interno de serviço da API

Após salvar a Application API, Coolify mostra o **nome do container/serviço** (algo como `api-abc123` ou o slug que você definiu).

Volte na Application **Web** → *Environment Variables* → ajuste:

```
INTERNAL_API_URL=http://api-abc123:3001
```

> Esse hostname só funciona dentro da rede interna do Coolify. É o que o Server Component do Next vai usar para falar com a API sem passar pela internet.

---

## Parte 6 — Primeiro deploy

### 6.1. Deployar a API primeiro

Na Application **API** → botão **Deploy**.

Acompanhe os logs no painel. O build leva ~3–6 min na primeira vez (depois o cache acelera).

Quando terminar:
- Status fica **Running**
- Healthcheck `/health` deve ficar verde dentro de ~30s

### 6.2. Deployar o Web

Na Application **Web** → **Deploy**.

Mesmo processo. Ao terminar:
- Status **Running**
- A URL temporária do Coolify (ex.: `https://web-xxx.coolify.app`) deve abrir a página

### 6.3. Validar end-to-end com a tela `/hello`

Abra a URL do web. Você verá:

1. **Badge "ok" verde** na home → server falando com a API via rede interna
2. Clique em **"Teste end-to-end → /hello"**

A página `/hello` faz **dois testes simultâneos**:

| Cartão | Caminho | O que valida |
|---|---|---|
| **1. Server Component** | Next server → API via `INTERNAL_API_URL` | Rede interna do Coolify, build do Next, fetch SSR |
| **2. Client Component** | Browser → API via `NEXT_PUBLIC_API_URL` | DNS público, CORS, certificado HTTPS, build do bundle |

**Resultado esperado:**
- Cartão 1 mostra JSON com `"message": "Hello, Server!"` → ✅ rede interna OK
- Cartão 2 mostra JSON com `"message": "Hello, Browser!"` → ✅ CORS e rede pública OK
- Você consegue digitar um nome, clicar "Chamar API" e ver a resposta atualizar → ✅ fluxo interativo OK

Se um dos dois falhar, o erro mostrado já indica a causa provável (CORS, hostname interno, API offline).

---

## Parte 7 — Domínios e HTTPS

### 7.1. Configurar DNS

No seu provedor de DNS (Cloudflare, Route53, Registro.br):

| Tipo | Nome | Valor |
|---|---|---|
| `A` | `app.meu-dominio.com` | IP do servidor Coolify |
| `A` | `api.meu-dominio.com` | IP do servidor Coolify |

Aguarde a propagação (geralmente <5 min).

### 7.2. Configurar domínios no Coolify

**Application Web:**
- Aba *Domains*
- Adicione `https://app.meu-dominio.com`
- Coolify gera certificado Let's Encrypt automaticamente

**Application API:**
- Mesmo processo, adicione `https://api.meu-dominio.com`

### 7.3. Atualizar variáveis de ambiente

Na **Web**:
```
NEXT_PUBLIC_API_URL=https://api.meu-dominio.com   # agora é o domínio real
```

Na **API**:
```
CORS_ORIGINS=https://app.meu-dominio.com
```

### 7.4. Redeploy

Salve as variáveis → **Redeploy** as duas apps. `NEXT_PUBLIC_*` é embedida no bundle do Next, então mudou env → precisa rebuildar.

---

## Parte 8 — Adicionar uma feature (fluxo padrão)

> Exemplo: criar endpoint `GET /users` no backend e listar usuários no frontend.

### 8.1. Branch nova

```bash
git checkout -b feat/list-users
```

### 8.2. Definir tipo compartilhado

`packages/shared-types/src/user.ts`:
```ts
export interface User {
  id: string;
  name: string;
  email: string;
}
```

Adicione no `index.ts`:
```ts
export * from './user';
```

### 8.3. Criar módulo no backend

```bash
mkdir -p apps/api/src/users
```

`apps/api/src/users/users.controller.ts`:
```ts
import { Controller, Get } from '@nestjs/common';
import type { User } from '@app/shared-types';

@Controller('users')
export class UsersController {
  @Get()
  list(): User[] {
    return [{ id: '1', name: 'Ana', email: 'ana@ham.org.br' }];
  }
}
```

`apps/api/src/users/users.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';

@Module({ controllers: [UsersController] })
export class UsersModule {}
```

Importe em `apps/api/src/app.module.ts`:
```ts
import { UsersModule } from './users/users.module';

@Module({
  imports: [ConfigModule.forRoot({...}), HealthModule, UsersModule],
})
export class AppModule {}
```

### 8.4. Consumir no frontend

`apps/web/src/app/users/page.tsx`:
```tsx
import type { User } from '@app/shared-types';

async function fetchUsers(): Promise<User[]> {
  const url = process.env.INTERNAL_API_URL ?? 'http://localhost:3001';
  const res = await fetch(`${url}/users`, { cache: 'no-store' });
  return res.json();
}

export default async function UsersPage() {
  const users = await fetchUsers();
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Usuários</h1>
      <ul className="mt-6 space-y-2">
        {users.map((u) => (
          <li key={u.id} className="rounded-lg border p-4">
            {u.name} — <span className="text-zinc-500">{u.email}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

### 8.5. Verificar

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm dev
```

Abra http://localhost:3000/users — deve listar a Ana.

### 8.6. Commit e push

```bash
git add .
git commit -m "feat: add users list endpoint and page"
git push -u origin feat/list-users
```

### 8.7. Pull Request

Abra um PR no GitHub. CI roda automaticamente. Após aprovação, merge na `main`.

O Coolify detecta o push na `main` e redeploya as duas apps automaticamente.

---

## Parte 9 — Adicionar banco de dados (Postgres)

### 9.1. Criar Resource no Coolify

No projeto:
1. **+ New Resource → Database → PostgreSQL**
2. Nome: `meu-app-ham-db`
3. Versão: 16
4. Crie

Coolify mostra a **string interna** de conexão, algo como:
```
postgres://postgres:<senha>@meu-app-ham-db:5432/postgres
```

### 9.2. Configurar a API

Variáveis da Application **API**:
```
DATABASE_URL=postgres://postgres:<senha>@meu-app-ham-db:5432/postgres
```

### 9.3. Instalar Prisma (sugestão)

```bash
pnpm --filter @app/api add prisma @prisma/client
pnpm --filter @app/api exec prisma init
```

Edite `apps/api/prisma/schema.prisma` conforme a necessidade.

Adicione ao Dockerfile da API (antes do `pnpm build`):
```dockerfile
RUN pnpm --filter @app/api exec prisma generate
```

### 9.4. Migrations

Para rodar migrations no deploy, adicione ao `CMD` ou crie um *Pre-deploy Command* no Coolify:
```
pnpm --filter @app/api exec prisma migrate deploy
```

### 9.5. Atualize a documentação

Adicione as instruções específicas em `docs/DEVELOPMENT.md` para que próximos devs (humanos ou IA) saibam do banco.

---

## Parte 10 — Troubleshooting

### Build falha em "pnpm install"
- Verifique se commitou o `pnpm-lock.yaml`.
- Confirme `packageManager: "pnpm@9.12.0"` no `package.json`.

### Web mostra badge vermelho "offline"
- **Local:** API está rodando em :3001? (`curl http://localhost:3001/health`)
- **Coolify:** `INTERNAL_API_URL` usa o **nome interno do serviço**, não o domínio público?
- Veja logs da API no painel — ela ficou up? Healthcheck verde?

### CORS error no browser
- A env `CORS_ORIGINS` da API inclui o domínio do web (com `https://`)?
- Múltiplos domínios? Separe por vírgula sem espaço: `https://a.com,https://b.com`.

### Build do Next.js gigante
- `output: 'standalone'` está no `next.config.ts`?
- `.dockerignore` está sendo respeitado? (Confira se o arquivo está na **raiz**, não dentro de `apps/web/`.)

### "Cannot find module '@app/shared-types'"
- Rodou `pnpm install` na raiz após adicionar o package?
- O package está listado em `pnpm-workspace.yaml`?
- No Next: `transpilePackages: ['@app/shared-types']` em `next.config.ts`.

### Healthcheck do Coolify nunca fica verde
- Path correto? (`/` para web, `/health` para api)
- A porta exposta no Coolify bate com a porta de `EXPOSE` do Dockerfile?
- O servidor está bindando em `0.0.0.0`? (Em `main.ts` da API: `await app.listen(port, '0.0.0.0')` ✓)

### Coolify não redeploya em push
- A GitHub App tem acesso ao repositório?
- O webhook foi criado? (GitHub → Settings → Webhooks)
- A branch monitorada no Coolify é a mesma que você está pushando?

### Variável `NEXT_PUBLIC_*` mudou e não refletiu
- `NEXT_PUBLIC_*` é **embedida no bundle no build time**. Precisa **rebuildar** o web (Redeploy no Coolify).

### Container reinicia em loop
- Veja `docker logs <container>` no servidor ou logs no Coolify.
- Erro comum: variável de ambiente faltando. Compare com `.env.example`.

### Build Docker local OK, mas falha no Coolify
- Coolify usa cache mais agressivo. Tente **Force rebuild** (sem cache).
- Confira se algum arquivo necessário não está no `.dockerignore`.

---

## Checklist final — "está pronto pra produção"

Antes de declarar um deploy pronto:

- [ ] CI verde na branch `main`
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` passa localmente
- [ ] Web e API rodando, healthchecks verdes no Coolify
- [ ] Domínios próprios com HTTPS válido
- [ ] `CORS_ORIGINS` da API restrito aos domínios reais (sem `*`)
- [ ] Segredos **só** no Coolify, nada em `.env` versionado
- [ ] `.env.example` reflete todas as variáveis usadas
- [ ] Documentação relevante (`docs/`) atualizada se mudou algo arquitetural
- [ ] README do projeto descreve o que ele faz (não copie do boilerplate)
- [ ] Backup do banco configurado (se aplicável)

---

## Onde aprender mais

- Arquitetura: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- Stack e versões: [`docs/STACK.md`](./docs/STACK.md)
- Convenções de código: [`docs/CONVENTIONS.md`](./docs/CONVENTIONS.md)
- Setup local detalhado: [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md)
- Coolify avançado: [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)
- Fluxo com Claude Code: [`docs/AI_WORKFLOW.md`](./docs/AI_WORKFLOW.md)
- Testes: [`docs/TESTING.md`](./docs/TESTING.md)
- Segurança: [`docs/SECURITY.md`](./docs/SECURITY.md)
