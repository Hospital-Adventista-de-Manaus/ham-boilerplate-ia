# Guia de Implementação — Deploy de Sistemas HAM via Coolify

> **Público-alvo:** Time de Transformação Digital (TD) do HAM e gestores de setor responsáveis por sistemas desenvolvidos sobre o boilerplate `ham-boilerplate-ia`.
>
> **Objetivo:** Documentar, de ponta a ponta, o fluxo desde a criação do repositório no GitHub até a publicação do sistema em produção no Coolify, incluindo permissões, SSL wildcard e validações.

> ## ⚠ Regra inviolável — Desenvolvimento em ambiente de SIMULAÇÃO
>
> **Todo desenvolvimento, teste e validação prévia DEVE ocorrer em ambiente de simulação** — com **banco de dados de simulação** ou **API de simulação (mock)**.
>
> - **Nunca** aponte o sistema em desenvolvimento para o banco de dados de produção.
> - **Nunca** consuma APIs internas do HAM em ambiente produtivo durante o desenvolvimento.
> - **Nunca** use credenciais de produção em máquinas locais de desenvolvedores.
>
> O acesso ao banco/API de produção é configurado **exclusivamente pela TD** na Etapa 6 deste guia, **somente** após o sistema ter sido validado em simulação. Violar essa regra significa risco direto a dados de pacientes, registros financeiros e operação clínica. Detalhes na [Seção 3.3](#33-ambiente-de-simulação-para-desenvolvimento).

---

## Sumário

1. [Visão geral do fluxo](#1-visão-geral-do-fluxo)
2. [Atores e responsabilidades](#2-atores-e-responsabilidades)
3. [Pré-requisitos](#3-pré-requisitos)
  - [3.3. Ambiente de simulação para desenvolvimento](#33-ambiente-de-simulação-para-desenvolvimento)
4. [Etapa 1 — Gestor: Preparar o repositório GitHub](#4-etapa-1--gestor-preparar-o-repositório-github)
5. [Etapa 2 — Gestor: Adicionar membros da equipe](#5-etapa-2--gestor-adicionar-membros-da-equipe)
6. [Etapa 3 — Gestor: Conectar repositório local ao GitHub](#6-etapa-3--gestor-conectar-repositório-local-ao-github)
7. [Etapa 4 — Gestor: Subir o código para o GitHub](#7-etapa-4--gestor-subir-o-código-para-o-github)
8. [Etapa 5 — Gestor: Solicitar criação do projeto à TD](#8-etapa-5--gestor-solicitar-criação-do-projeto-à-td)
9. [Etapa 6 — TD: Criar projeto no Coolify](#9-etapa-6--td-criar-projeto-no-coolify)
10. [Etapa 7 — TD: Configurar SSL wildcard](#10-etapa-7--td-configurar-ssl-wildcard)
11. [Etapa 8 — TD: Conceder acesso ao gestor no Coolify](#11-etapa-8--td-conceder-acesso-ao-gestor-no-coolify)
12. [Etapa 9 — Validação pós-deploy](#12-etapa-9--validação-pós-deploy)
13. [Troubleshooting comum](#13-troubleshooting-comum)
14. [Templates](#14-templates)
15. [Glossário](#15-glossário)

---

## 1. Visão geral do fluxo

```
  [Gestor do setor]                          [Time TD]
       │                                          │
       │ 1. Cria repositório no GitHub            │
       │    a partir do ham-boilerplate-ia        │
       │                                          │
       │ 2. Adiciona membros da equipe            │
       │    no repositório                        │
       │                                          │
       │ 3. Conecta projeto local ao GitHub       │
       │    e faz o primeiro push                 │
       │                                          │
       │ 4. Abre solicitação para a TD ────────▶  │
       │    informando nome do repositório        │
       │                                          │ 5. Recebe solicitação
       │                                          │ 6. Cria projeto no Coolify
       │                                          │ 7. Conecta GitHub
       │                                          │ 8. Configura build, env,
       │                                          │    domínio e SSL wildcard
       │                                          │ 9. Dispara primeiro deploy
       │ ◀──── 10. Concede acesso ao gestor       │
       │                                          │
       │ 11. Valida acesso e funcionamento        │
       │     do sistema em produção               │
       ▼                                          ▼
   Sistema publicado em https://<app>.s.apps-ia.ham.org.br
```

**Tempo estimado:**

- Etapas do gestor (1–4): ~30 minutos
- Etapas da TD (5–10): ~20 minutos
- Validação (11): ~10 minutos

---

## 2. Atores e responsabilidades


| Ator                                             | Responsabilidades                                                                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Gestor do setor** (ou desenvolvedor designado) | Criar e popular o repositório no GitHub, gerenciar membros, abrir ticket para a TD, validar o sistema após publicação.                           |
| **Time de Transformação Digital (TD)**           | Receber a solicitação, criar e configurar o projeto no Coolify, configurar acesso ao ambiente de produção, garantir SSL, monitoramento e backup. |


> **Importante:** o gestor **não tem acesso direto** ao Coolify. Toda configuração de infraestrutura passa pela TD. Isso garante padronização, segurança e auditabilidade.

---

## 3. Pré-requisitos

### Para o gestor

- Conta no GitHub vinculada ao e-mail institucional `@ham.org.br`
- Membro da organização `Hospital-Adventista-de-Manaus` no GitHub (se não for, solicitar à TD)
- Node.js 20+ e `pnpm@9` instalados localmente
- Git instalado e autenticado (SSH key ou HTTPS via PAT)
- Cópia local do projeto baseada no boilerplate `ham-boilerplate-ia`
- Sistema rodando localmente sem erros (`pnpm dev` funciona)

### Para o time TD

- Acesso administrativo ao Coolify (`https://apps-ia.ham.org.br`)
- Acesso administrativo à organização GitHub `Hospital-Adventista-de-Manaus`
- Acesso ao painel DNS da Cloudflare para a zona `s.apps-ia.ham.org.br`
- Cloudflare API Token configurado no proxy Coolify (DNS-01 challenge)
- Conhecimento básico de Docker e variáveis de ambiente

### 3.3. Ambiente de simulação para desenvolvimento

> **Regra inviolável.** Esta seção formaliza a regra destacada no topo do guia.

Todo desenvolvimento do sistema **deve** ser conduzido contra um **ambiente isolado de simulação**, jamais contra o ambiente produtivo. Isso vale para o gestor, desenvolvedores internos, fornecedores terceirizados e estagiários.

#### O que conta como ambiente de simulação

Pelo menos **uma** das opções abaixo, dependendo da natureza do sistema:


| Recurso                                                                                | Opção de simulação aceita                                                                                                                                                                    |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Banco de dados**                                                                     | Instância separada (Postgres/MySQL/etc.) com **dados anonimizados** ou **dados sintéticos** gerados via seed. Pode rodar localmente em Docker ou em servidor de simulação fornecido pela TD. |
| **APIs internas do HAM** (HIS, ERP, integrações)                                       | Mock local (ex.: Mirage, MSW, json-server, WireMock) reproduzindo os contratos de resposta.                                                                                                  |
| **APIs de terceiros pagas/sensíveis** (gateway de pagamento, e-mail transacional, SMS) | Ambiente sandbox oficial do provedor ou stub local.                                                                                                                                          |
| **Armazenamento de arquivos**                                                          | Bucket S3/MinIO de simulação ou diretório local.                                                                                                                                             |
| **Filas e mensageria**                                                                 | Instância separada (RabbitMQ/Redis) ou broker local.                                                                                                                                         |


#### O que **não** é aceitável durante o desenvolvimento

- Apontar `DATABASE_URL` local para o banco de produção, ainda que "só para conferir um detalhe".
- Usar tokens reais de APIs internas do HAM em `.env` local.
- Copiar dumps de produção para a máquina do desenvolvedor sem anonimização.
- Reutilizar credenciais de usuário real (CPF, prontuário, login) em testes.

#### Como o boilerplate suporta esta regra

- Cada aplicação possui `.env.example` documentando as variáveis necessárias com valores **fictícios**.
- O `.env` real **nunca** é commitado (já está em `.gitignore`).
- O `docker-compose.yml` na raiz sobe um banco local de simulação para uso em desenvolvimento (quando aplicável ao projeto).
- Se o sistema integra com APIs internas do HAM, o time deve criar uma camada de mock (ex.: `apps/api/src/integrations/__mocks__/`) usada por padrão fora de produção.

#### Responsabilidade de cada ator


| Ator                         | Responsabilidade                                                                                                                                                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gestor / desenvolvedores** | Garantir que todo o desenvolvimento e validação prévia ocorre em simulação. Documentar no `README.md` do projeto como o ambiente de simulação é provisionado (comandos para subir banco local, seed inicial, etc.).                                         |
| **Time TD**                  | Verificar, antes de aceitar o ticket de deploy (Etapa 5.1), se o repositório contém evidência de uso de simulação: presença de `.env.example`, scripts de seed, configuração de mock. Recusar o deploy caso encontre credenciais produtivas no repositório. |
| **Tech lead do setor**       | Revisar pull requests garantindo que nenhuma chamada direta a sistema produtivo foi introduzida.                                                                                                                                                            |


#### Transição de simulação para produção

A configuração das credenciais produtivas (banco real, APIs reais, tokens de integração) é feita **apenas no Coolify** pela TD, na [Etapa 6.5](#95-configurar-variáveis-de-ambiente). O código da aplicação **não muda** entre simulação e produção — somente as variáveis de ambiente. Esse é o motivo de o boilerplate exigir que todo acesso a recursos externos seja parametrizado via env vars.

---

## 4. Etapa 1 — Gestor: Preparar o repositório GitHub

### 4.1. Criar o repositório a partir do boilerplate

1. Acesse `https://github.com/Hospital-Adventista-de-Manaus/ham-boilerplate-ia`
2. Clique em **Use this template** → **Create a new repository**
3. Configure:
  - **Owner:** `Hospital-Adventista-de-Manaus`
  - **Repository name:** padrão `ham-<setor>-<sistema>`, exemplos:
    - `ham-rh-onboarding`
    - `ham-cirurgia-protocolos`
    - `ham-financeiro-cobranca`
  - **Description:** breve, em português, ex.: *"Sistema de onboarding de novos colaboradores do RH"*
  - **Privacy:** **Private** (sempre)
4. Clique em **Create repository from template**

> **Padrão de nomenclatura:** sempre `ham-<setor>-<sistema>`, tudo em minúsculas, separado por hífens. Evite acrônimos pouco conhecidos. Esse nome será visível na URL pública e em todo o ciclo de vida do sistema.

### 4.2. Configurar o repositório

Após a criação, ainda no GitHub:

1. Em **Settings → General**:
  - Marque **Require contributors to sign off on web-based commits**
  - Em **Pull Requests**, desmarque **Allow merge commits** (mantém histórico linear)
  - Marque **Automatically delete head branches** (limpa branches após merge)
2. Em **Settings → Branches**:
  - Adicione regra para `master` (ou `main`):
    - Require pull request reviews before merging (mínimo 1 aprovador)
    - Require status checks to pass before merging
    - Include administrators
3. Em **Settings → Secrets and variables → Actions**: não adicione nada agora. Variáveis de produção ficam no Coolify, não no GitHub.

---

## 5. Etapa 2 — Gestor: Adicionar membros da equipe

1. No repositório, acesse **Settings → Collaborators and teams**
2. Clique em **Add people**
3. Adicione cada membro do setor pelo usuário GitHub
4. Defina o papel:


| Papel        | Quando usar                                                  |
| ------------ | ------------------------------------------------------------ |
| **Read**     | Stakeholder que só quer acompanhar (gestor de área, auditor) |
| **Triage**   | QA, analistas de teste                                       |
| **Write**    | Desenvolvedores que vão commitar código                      |
| **Maintain** | Tech leads do setor                                          |
| **Admin**    | Apenas o gestor responsável pelo sistema                     |


1. **Sempre adicione** o time `@Hospital-Adventista-de-Manaus/td-core` como **Admin** — a TD precisa ter acesso para emergências de produção.

---

## 6. Etapa 3 — Gestor: Conectar repositório local ao GitHub

No terminal, dentro da pasta do projeto local:

### 6.1. Inicializar o git (se ainda não foi)

```bash
git init
git branch -M master
```

### 6.2. Conectar ao GitHub

```bash
git remote add origin git@github.com:Hospital-Adventista-de-Manaus/<nome-do-repo>.git
```

> Se estiver usando HTTPS em vez de SSH, troque `git@github.com:` por `https://github.com/`.

Verifique a conexão:

```bash
git remote -v
```

Deve exibir as duas linhas `origin ... (fetch)` e `origin ... (push)` apontando para o GitHub.

### 6.3. Confirmar arquivos críticos

Antes de subir, garanta que estes arquivos **existem e estão corretos**:


| Arquivo                    | Por que importa                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `pnpm-lock.yaml`           | O Docker build no Coolify falha sem ele. Rode `pnpm install` se não existir.         |
| `apps/web/public/.gitkeep` | Diretório `public/` precisa existir mesmo vazio (Docker faz `COPY apps/web/public`). |
| `apps/api/Dockerfile`      | Sem ele o Coolify não sabe construir a API.                                          |
| `apps/web/Dockerfile`      | Sem ele o Coolify não sabe construir o frontend.                                     |
| `.gitignore`               | Deve conter `.env`, `node_modules/`, `.next/`. **Nunca commite segredos.**           |
| `.env.example`             | Documenta as variáveis necessárias. Deve estar versionado.                           |


Comando para conferir tudo de uma vez:

```bash
ls -la pnpm-lock.yaml apps/web/public/.gitkeep apps/api/Dockerfile apps/web/Dockerfile .gitignore .env.example
```

Todos devem existir. Se faltar `pnpm-lock.yaml`, rode `pnpm install`. Se faltar `.gitkeep`, crie com `touch apps/web/public/.gitkeep`.

---

## 7. Etapa 4 — Gestor: Subir o código para o GitHub

### 7.1. Verificar o que será commitado

```bash
git status
git diff --cached
```

Confira que **nenhum arquivo `.env`** está sendo commitado. Se aparecer, pare imediatamente e adicione ao `.gitignore`.

### 7.2. Primeiro commit

```bash
git add .
git commit -m "chore: initial commit from boilerplate"
```

### 7.3. Push para o GitHub

```bash
git push -u origin master
```

### 7.4. Confirmar no GitHub

Acesse o repositório no navegador e verifique que:

- O código apareceu
- O `README.md` mostra a estrutura esperada
- A branch `master` está ativa

---

## 8. Etapa 5 — Gestor: Solicitar criação do projeto à TD

Abra um ticket no canal/sistema oficial da TD (definir internamente: e-mail, Service Desk, Slack, etc.) com o template abaixo:

> Use o template completo da [Seção 14.1](#141-template-de-solicitação-de-deploy).

Informações obrigatórias:

- Nome completo do repositório no GitHub (ex.: `Hospital-Adventista-de-Manaus/ham-rh-onboarding`)
- Subdomínio desejado (ex.: `onboarding.s.apps-ia.ham.org.br`)
- Variáveis de ambiente necessárias (lista por nome, **sem valores sensíveis no ticket**)
- Banco de dados necessário (Postgres? Redis? Nenhum?)
- Restrições de acesso (rede interna apenas? VPN? Público?)
- Responsável técnico (quem a TD aciona em emergência)

---

## 9. Etapa 6 — TD: Criar projeto no Coolify

> Esta seção e as seguintes são **operadas exclusivamente pelo time TD**.

### 9.1. Pré-validação no GitHub

Antes de tocar no Coolify, abra o repositório no GitHub e confirme:

- Existe `pnpm-lock.yaml` na raiz
- Existe `apps/web/Dockerfile` e `apps/api/Dockerfile`
- Existe `apps/web/public/` (mesmo vazio com `.gitkeep`)
- Existe `.env.example` (sem valores sensíveis)
- **Não existe** `.env` commitado (busque por arquivos `.env*` na raiz)
- O time `@td-core` tem acesso Admin ao repositório
- **Evidência de uso de ambiente de simulação:** o `README.md` do projeto descreve como subir banco/API de simulação (ex.: `docker-compose up db`, scripts de seed em `apps/api/prisma/seed.ts`, mocks em `__mocks__/`)
- **Nenhuma credencial produtiva** está hardcoded no código ou em arquivos versionados (procure por strings suspeitas: `prod`, `producao`, IPs internos do HAM, nomes de servidores reais, tokens completos)

Se algum item falhar, **devolva o ticket ao gestor** com a lista de pendências. Não prossiga.

> ⚠ **Encontrou credencial produtiva no repositório?** Pare imediatamente. Notifique o gestor e o time de segurança, inicie processo de rotação da credencial vazada, e exija que o histórico do Git seja limpo antes de retomar o deploy.

### 9.2. Criar o projeto e environment

1. Acesse o Coolify em `https://apps-ia.ham.org.br`
2. Em **Projects** → **+ Add**
3. Configure:
  - **Name:** mesmo nome do repositório (ex.: `ham-rh-onboarding`)
  - **Description:** mesma descrição do GitHub
4. Dentro do projeto criado, clique em **+ Add a new environment**
5. Configure:
  - **Name:** `production`
  - **Description:** *"Ambiente produtivo do sistema"*

### 9.3. Criar a aplicação web

1. No environment `production`, clique em **+ New Resource** → **Public/Private Repository**
2. Selecione **GitHub App** (já configurado para a org `Hospital-Adventista-de-Manaus`)
3. Em **Repository**, selecione o repositório do projeto
4. Em **Branch**, escolha `master`
5. Em **Build Pack**, selecione **Dockerfile**
6. Em **Base Directory**, deixe `/` (raiz)
7. Clique em **Continue**

Na tela de configuração detalhada:

1. **Dockerfile Location:** `/apps/web/Dockerfile`
2. **Port:** `3000` (porta interna do container Next.js)
3. **Domains:** preencha o subdomínio completo, ex.: `https://onboarding.s.apps-ia.ham.org.br`

> ⚠️ **Atenção:** o **Base Directory** sempre é `/` (a raiz do repo). O Dockerfile precisa enxergar o monorepo inteiro como contexto de build — incluindo `pnpm-workspace.yaml` e `packages/`. Apontar Base Directory para `/apps/web` quebra o build.

### 9.4. Criar a aplicação API

Repita 9.3 criando uma **segunda aplicação** no mesmo environment:

- **Dockerfile Location:** `/apps/api/Dockerfile`
- **Port:** `3001`
- **Domains:** ex.: `https://onboarding-api.s.apps-ia.ham.org.br`

> Convenção: a API segue o nome do app com o sufixo `-api`. Documente em `README.md` do projeto.

### 9.5. Configurar variáveis de ambiente

Para cada aplicação (web e api), em **Configuration → Environment Variables**, adicione as variáveis solicitadas pelo gestor. Use **Mark as build variable** para variáveis que o Next.js precisa em tempo de build (geralmente as com prefixo `NEXT_PUBLIC_`).

Variáveis padrão por aplicação:

**Web:**


| Variável              | Valor                                    | Build?  |
| --------------------- | ---------------------------------------- | ------- |
| `NODE_ENV`            | `production`                             | Não     |
| `NEXT_PUBLIC_API_URL` | `https://<app>-api.s.apps-ia.ham.org.br` | **Sim** |


**API:**


| Variável       | Valor                                | Build? |
| -------------- | ------------------------------------ | ------ |
| `NODE_ENV`     | `production`                         | Não    |
| `PORT`         | `3001`                               | Não    |
| `CORS_ORIGINS` | `https://<app>.s.apps-ia.ham.org.br` | Não    |


> ⚠️ Variáveis sensíveis (senhas, tokens, API keys) **só** são adicionadas pelo time TD, **nunca** ficam no repositório. O gestor lista os nomes no ticket; o valor é coletado pela TD em canal seguro.

### 9.6. Configurar health check

Em **Configuration → Health Check** (cada aplicação):

- **Enabled:** sim
- **Path:** `/api/health` (web) ou `/health` (api)
- **Port:** mesma porta do app
- **Method:** GET
- **Expected Status Code:** 200
- **Interval:** 30s
- **Retries:** 3

### 9.7. Disparar o primeiro deploy

1. Clique em **Deploy** (canto superior direito)
2. Acompanhe o log em tempo real
3. Aguarde a mensagem final: `Deployment finished. Your application is available at <URL>.`

Se falhar, consulte a [Seção 13 — Troubleshooting](#13-troubleshooting-comum) **antes** de chamar o gestor.

---

## 10. Etapa 7 — TD: Configurar SSL wildcard

O ambiente Coolify do HAM usa **certificado wildcard `*.s.apps-ia.ham.org.br`** emitido via Let's Encrypt com DNS-01 challenge (Cloudflare). Isso significa que **uma única vez** o resolver foi configurado no proxy Traefik; cada nova aplicação apenas referencia esse resolver.

### 10.1. Pré-requisito: registro DNS

Antes do deploy, confirme na Cloudflare (zona `s.apps-ia.ham.org.br`) que existe:

```
*.s.apps-ia.ham.org.br   A   <IP_DO_SERVIDOR_COOLIFY>
```

Verifique com:

```bash
dig @1.1.1.1 onboarding.s.apps-ia.ham.org.br +short
```

Deve retornar o IP do servidor. Se retornar vazio, o cert é emitido mas o sistema não fica acessível.

### 10.2. Aplicar labels Traefik na aplicação

Em **cada aplicação** criada (web e api):

1. Vá para **Configuration → Labels (Container Labels)**
2. Desmarque **Readonly labels** (rodapé)
3. Edite a linha que contém `tls.certresolver=letsencrypt`:
  - Troque para `tls.certresolver=letsencrypt-dns`
4. Adicione duas linhas (substitua `<nome-do-router>` pelo router gerado automaticamente — você verá o prefixo nas linhas existentes, algo como `https-0-xyz123`):
  ```
   traefik.http.routers.<nome-do-router>.tls.domains[0].main=s.apps-ia.ham.org.br
   traefik.http.routers.<nome-do-router>.tls.domains[0].sans=*.s.apps-ia.ham.org.br
  ```
5. Clique em **Save** e em seguida em **Redeploy**.

### 10.3. Validar a emissão do certificado

Em **Server → Proxy → Logs**, busque por `letsencrypt-dns`. Esperado:

```
Starting ACME client ... resolverName=letsencrypt-dns
Obtained ACME certificate ... domain=s.apps-ia.ham.org.br
```

Da sua máquina, valide o cert:

```bash
echo | openssl s_client -servername onboarding.s.apps-ia.ham.org.br \
  -connect onboarding.s.apps-ia.ham.org.br:443 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

Deve retornar:

- `subject=CN=*.s.apps-ia.ham.org.br` (ou similar)
- `issuer=...Let's Encrypt...`
- Datas de validade dentro de 90 dias

> O Let's Encrypt renova automaticamente a cada ~60 dias. Não há ação manual recorrente.

---

## 11. Etapa 8 — TD: Conceder acesso ao gestor no Coolify

1. No Coolify, acesse **Teams** → escolha o time correspondente ao setor
2. Clique em **Invite Member**
3. Adicione o e-mail do gestor (deve ser `@ham.org.br`)
4. Defina o papel:


| Papel Coolify | Permissões                                      | Indicado para     |
| ------------- | ----------------------------------------------- | ----------------- |
| **Owner**     | Tudo, inclusive deletar projeto                 | Apenas TD         |
| **Admin**     | Gerenciar projeto, deploy, ver logs, editar env | Apenas TD         |
| **Member**    | Ver projeto, ver logs, redeploy                 | Gestor do sistema |
| **Viewer**    | Apenas leitura                                  | Stakeholders      |


> **Regra:** o gestor recebe **Member** — pode redeployar e ver logs, mas não pode alterar variáveis de ambiente ou infraestrutura sem passar pela TD.

1. Comunique o gestor (e-mail ou chat) com:
  - URLs públicas (web e api)
  - URL do Coolify para acompanhar deploys
  - Documentação rápida de como redeployar (Etapa 12.3 abaixo)

---

## 12. Etapa 9 — Validação pós-deploy

### 12.1. Checklist da TD (antes de fechar o ticket)

- Aplicação web responde em `https://<app>.s.apps-ia.ham.org.br` com **200 OK**
- Aplicação api responde em `https://<app>-api.s.apps-ia.ham.org.br/health` com **200 OK**
- Certificado SSL válido (não auto-assinado, não expirado, emissor Let's Encrypt)
- Health checks no Coolify estão verdes
- Logs não mostram erros recorrentes (verificar últimos 5 minutos)
- Gestor recebeu acesso ao Coolify
- Ticket atualizado com URLs e credenciais (em canal seguro)

### 12.2. Checklist do gestor (validação funcional)

- Consegue acessar a aplicação web pelo navegador (sem aviso de cert inválido)
- Consegue fazer login (se aplicável)
- Funcionalidade principal do sistema funciona
- Recebeu convite do Coolify e consegue acessar logs
- Documentou o link interno (wiki/intranet do setor)

### 12.3. Como o gestor redeploya após mudanças no código

1. Faz push do código novo para o GitHub
2. Coolify detecta automaticamente o push (via webhook do GitHub App) e dispara o deploy
3. Acompanha em `https://apps-ia.ham.org.br` → projeto → aplicação → **Deployments**

Se o webhook não disparar:

1. Acessa a aplicação no Coolify
2. Clica no botão **Deploy** (canto superior direito)
3. Acompanha o log

---

## 13. Troubleshooting comum

### 13.1. Build falha com `"/pnpm-lock.yaml": not found`

**Causa:** `pnpm-lock.yaml` não foi commitado no repositório.

**Solução:**

```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: add pnpm-lock.yaml"
git push origin master
```

### 13.2. Build falha com `"/repo/apps/web/public": not found`

**Causa:** o diretório `apps/web/public/` está vazio e o Git não rastreia diretórios vazios.

**Solução:**

```bash
touch apps/web/public/.gitkeep
git add apps/web/public/.gitkeep
git commit -m "chore: track empty public dir"
git push origin master
```

### 13.3. Erro `failed to read dockerfile: open Dockerfile: no such file or directory`

**Causa:** o campo **Dockerfile Location** está vazio ou apontando para a raiz, mas os Dockerfiles do projeto ficam em `apps/web/` e `apps/api/`.

**Solução:** em **Configuration → Build** da aplicação no Coolify, defina:

- **Base Directory:** `/`
- **Dockerfile Location:** `/apps/web/Dockerfile` ou `/apps/api/Dockerfile`

### 13.4. SSL falha com `NXDOMAIN looking up A for <domínio>`

**Causa:** o registro DNS para o subdomínio não existe na Cloudflare.

**Solução:** crie o registro wildcard na Cloudflare:

```
*.s.apps-ia.ham.org.br   A   <IP_DO_SERVIDOR>
```

### 13.5. SSL falha com `403 :: invalid authorization` (HTTP-01)

**Causa:** a label da aplicação ainda aponta para o resolver `letsencrypt` (HTTP-01) em vez de `letsencrypt-dns`.

**Solução:** seguir a [Etapa 10.2](#102-aplicar-labels-traefik-na-aplicação) para corrigir a label.

### 13.6. Erro `Router defined multiple times with different configurations`

**Causa:** container antigo ainda rodando após um deploy mal terminado.

**Solução:** no servidor Coolify:

```bash
docker ps | grep <id-aplicação>
docker rm -f <id-container-antigo>
```

Ou pela UI: **Stop** → **Start** na aplicação.

### 13.7. `CF_DNS_API_TOKEN: required` no log do Traefik

**Causa:** a variável de ambiente não foi propagada ao container do proxy.

**Solução:** confira:

```bash
docker exec coolify-proxy env | grep CF_DNS
```

Se não aparecer, edite o `docker-compose.yml` do proxy em **Server → Proxy → Configuration**, garanta o bloco `environment:` no serviço `traefik`, salve e clique em **Restart Proxy**.

### 13.8. Rate limit `429 :: too many failed authorizations`

**Causa:** muitas tentativas falhas de emissão de cert para o mesmo domínio em 1 hora.

**Solução:**

1. **Pare** todas as tentativas (corrige a causa raiz primeiro)
2. Aguarde 1 hora (mensagem do erro informa o timestamp exato)
3. Após corrigir, redeploye apenas uma vez

> Não fique disparando redeploys — só acumula mais rate limit.

---

## 14. Templates

### 14.1. Template de solicitação de deploy

> Gestor copia, preenche e envia ao time TD.

```
Assunto: [DEPLOY] <nome-do-sistema> — Setor <setor>

Olá time TD,

Solicito a publicação do sistema abaixo em ambiente produtivo.

### Identificação
- Nome do sistema: <Sistema de Onboarding RH>
- Setor responsável: <Recursos Humanos>
- Gestor responsável: <Nome — e-mail@ham.org.br — ramal>
- Tech lead (se houver): <Nome — e-mail@ham.org.br>

### Repositório
- URL: https://github.com/Hospital-Adventista-de-Manaus/ham-rh-onboarding
- Branch de produção: master
- Time @td-core tem acesso Admin? [Sim/Não]

### Domínios
- Web: onboarding.s.apps-ia.ham.org.br
- API: onboarding-api.s.apps-ia.ham.org.br

### Variáveis de ambiente necessárias
(Listar apenas os nomes. Valores sensíveis serão enviados em canal seguro.)

Web:
- NEXT_PUBLIC_API_URL

API:
- DATABASE_URL
- JWT_SECRET
- SMTP_HOST
- SMTP_USER
- SMTP_PASSWORD

### Infraestrutura adicional
- Banco de dados: [Postgres / MySQL / Nenhum]
- Cache: [Redis / Nenhum]
- Armazenamento de arquivos: [S3 / Local / Nenhum]

### Restrições de acesso
- Rede: [Interna HAM / VPN / Pública]
- Restrição por IP: [Sim, listar / Não]

### Validação em ambiente de simulação
Declaro que todo o desenvolvimento e validação prévia deste sistema
ocorreu em ambiente de simulação (banco/API de simulação), conforme
Seção 3.3 do Guia de Implementação. Nenhum desenvolvedor utilizou
credenciais produtivas em máquina local.

- Como o banco/API de simulação foi provisionado: <ex.: docker-compose up db + seed via pnpm db:seed>
- Tipo de dados utilizados em simulação: [ ] sintéticos / [ ] produção anonimizados / [ ] sandbox do provedor
- Responsável pela validação funcional em simulação: <Nome — data da última validação>

### Observações
<Qualquer particularidade do sistema: integrações, horários críticos, dependências externas, prazo de publicação, etc.>
```

### 14.2. Template de resposta da TD ao gestor

> TD usa após concluir as etapas 6–8.

```
Assunto: RE: [DEPLOY] <nome-do-sistema> — Publicado

Olá <gestor>,

O sistema <nome> foi publicado com sucesso no ambiente produtivo.

### URLs públicas
- Web: https://onboarding.s.apps-ia.ham.org.br
- API: https://onboarding-api.s.apps-ia.ham.org.br

### Acesso ao Coolify
- URL: https://apps-ia.ham.org.br
- Você foi convidado como Member do projeto.
- Permissões: ver logs, redeployar. Para alterações em variáveis de ambiente
  ou infraestrutura, abra um ticket conosco.

### Como redeployar
1. Faça push do código para a branch master no GitHub.
2. O Coolify detecta automaticamente e dispara o deploy.
3. Acompanhe em <link direto para a aplicação no Coolify>.

### Monitoramento
- Health check ativo a cada 30s.
- Em caso de falha por mais de 3 ciclos, somos notificados automaticamente.

### Próximos passos
- Valide as funcionalidades principais.
- Documente o link em <wiki/intranet>.
- Em caso de dúvida ou incidente, abra ticket em <canal oficial>.

Atenciosamente,
Time de Transformação Digital
```

### 14.3. Template de incidente em produção

> Gestor usa quando o sistema apresenta falha grave.

```
Assunto: [INCIDENTE — P<1|2|3>] <nome-do-sistema>

### Prioridade
- P1: sistema completamente indisponível, impacto crítico no atendimento
- P2: funcionalidade importante quebrada, impacto parcial
- P3: bug menor, sem impacto crítico

### Sintoma
<O que está acontecendo? Mensagem de erro? Tela branca? Lentidão?>

### Quando começou
<Data/hora aproximada do início do problema>

### Quem foi afetado
<Apenas você? Todo o setor? Todos os usuários?>

### Última mudança conhecida
<Houve deploy recente? Mudança de configuração? Outra atualização?>

### Print/log (se houver)
<Anexar screenshot ou colar trecho do log do navegador (Console F12)>

### Contato emergencial
<Nome — celular — disponibilidade>
```

---

## 15. Glossário


| Termo                          | Significado                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| **Boilerplate**                | Estrutura base de projeto, pronta para ser personalizada. No HAM, é `ham-boilerplate-ia`.  |
| **Build Pack**                 | Conjunto de instruções para construir a imagem Docker. No HAM, usamos sempre `Dockerfile`. |
| **Coolify**                    | Plataforma open-source self-hosted para deploy de aplicações (similar ao Heroku/Vercel).   |
| **Container**                  | Unidade isolada onde a aplicação roda em produção.                                         |
| **DNS-01 Challenge**           | Método de validação do Let's Encrypt via registro TXT no DNS (não exige expor o servidor). |
| **Dockerfile**                 | Arquivo que descreve como construir a imagem Docker da aplicação.                          |
| **Environment**                | Conjunto de aplicações de um mesmo projeto (ex.: production, staging).                     |
| **GitHub App**                 | Integração que permite ao Coolify ler repositórios privados e receber webhooks de push.    |
| **Health Check**               | Verificação periódica de que a aplicação está respondendo.                                 |
| **Let's Encrypt**              | Autoridade certificadora gratuita usada para emitir SSL.                                   |
| **Monorepo**                   | Repositório único contendo múltiplas aplicações (web + api + tipos compartilhados).        |
| **pnpm**                       | Gerenciador de pacotes Node.js usado no boilerplate (mais rápido que npm/yarn).            |
| **Standalone (Next.js)**       | Modo de build do Next.js que gera um servidor Node mínimo, ideal para Docker.              |
| **TD / Transformação Digital** | Time responsável pela infraestrutura, deploys e operações no HAM.                          |
| **Traefik**                    | Reverse proxy usado pelo Coolify para rotear requisições e gerenciar SSL.                  |
| **Turbo / Turborepo**          | Ferramenta de build orchestration usada no monorepo.                                       |
| **Webhook**                    | Notificação automática enviada pelo GitHub ao Coolify quando há push.                      |
| **Wildcard SSL**               | Certificado que cobre qualquer subdomínio (`*.dominio.com`) com um único cert.             |


---

## Anexos

- `[CLAUDE.md](./CLAUDE.md)` — Instruções de contexto principal para agentes de IA
- `[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)` — Arquitetura geral do boilerplate
- `[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)` — Detalhes técnicos do processo de deploy
- `[docs/SECURITY.md](./docs/SECURITY.md)` — Diretrizes de segurança
- `[docs/CONVENTIONS.md](./docs/CONVENTIONS.md)` — Padrões de código e nomenclatura

---

**Versão deste guia:** 1.0
**Última atualização:** 2026-05-15
**Mantido por:** Time de Transformação Digital — HAM  
**Dúvidas:** abrir ticket no canal oficial da TD.