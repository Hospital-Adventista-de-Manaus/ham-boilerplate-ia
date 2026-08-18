---
description: Cria um projeto novo a partir deste boilerplate (pasta + repo privado na org + banco provisionado + push na branch staging)
---

# Criar projeto novo a partir do boilerplate

Você vai conduzir um vibe-coder (pessoa não técnica) na criação de um projeto novo a partir
deste boilerplate. Siga EXATAMENTE este roteiro. Fale em português, de forma simples.

O repositório e o banco de dados são criados por uma **API de provisionamento** (não é mais
necessário o `gh`). A API cria o repositório privado vazio na organização, provisiona um
usuário/schema isolado no Postgres e devolve as credenciais — que o script grava sozinho em
`apps/api/.env` (sem exibir na tela).

## Passo 1 — Confirmar pré-requisitos (rápido)
Rode e confirme que passam:
- `node -v` e `git --version` (existem no PATH).
- A API está no ar: `GET https://api-provisionamento.apps.ham.org.br/health` deve responder `{"status":"ok"}`.

O `gh` não é obrigatório, mas **se existir e estiver logado**, detecte o username com
`gh api user --jq .login` — ele será enviado à API para dar acesso de push à conta da pessoa.
Sem ele, o acesso ao repo fica só com o team padrão da org. Detalhes em `docs/PRE_REQUISITOS.md`.

## Passo 2 — Perguntar nome e e-mail
Pergunte: **"Qual o nome do projeto?"** e **"Qual o seu e-mail?"** (o e-mail é exigido pela API).
Mostre para a pessoa o *slug* que será usado no repositório (minúsculo, com hífens) e **confirme**
antes de prosseguir.
Ex.: nome "Painel de Sepse" → slug `painel-de-sepse` → repo `Hospital-Adventista-de-Manaus/painel-de-sepse`.

## Passo 3 — Rodar o scaffold
Este comando é a ação principal. Ele copia os arquivos, chama a API (que cria o repositório
privado na org e provisiona o banco), conecta o `origin`, grava as credenciais em
`apps/api/.env` e envia a branch `staging`. Peça confirmação da pessoa antes de executar
(cria repositório + banco e faz push — ações externas):

```
node scripts/bootstrap/novo-projeto.mjs --nome "<NOME QUE A PESSOA DEU>" --email "<E-MAIL DA PESSOA>" --github-user "<LOGIN DETECTADO>"
```

Omita `--github-user` se não conseguiu detectar o login (o script também tenta detectar sozinho
via `gh api user --jq .login`; sem o username, o fluxo segue normalmente só com o team da org).

Leia o bloco `<RESULT>…</RESULT>` impresso pelo script:
- `ok: true` → deu tudo certo.
- `ok: false` com `stage: "provision"` → falha ao falar com a API ou o projeto já existe.
  Explique o `nextStep` do JSON para a pessoa (a pasta local já ficou pronta com o commit na `staging`).
- `ok: false` com `stage: "push"` → o repo/banco foram criados, mas o push falhou; siga o `nextStep`.

## Passo 4 — Verificar e reportar
Se `ok: true`, confirme:
- o **link do repositório** (`repoUrl` do JSON) abre e tem o código na branch `staging`.
- a pasta local em `dest` (do JSON) contém o projeto.

Depois reporte à pessoa, em linguagem simples:
- o **link do repositório** (`repoUrl` do JSON)
- **onde** o projeto ficou na máquina (`dest`)
- que o código já está na branch **`staging`**
- que as **credenciais do banco** já foram gravadas em `apps/api/.env` (não mostre a senha)
- próximo passo sugerido: abrir a pasta e rodar `pnpm install && pnpm dev`

## Regras
- NÃO rode este fluxo se o repositório atual já for um projeto gerado (só vale no boilerplate original).
- NUNCA exponha tokens/segredos nem o conteúdo de `apps/api/.env` (contém a senha do banco).
- A URL da API pode ser trocada com a variável de ambiente `PROVISION_API_URL`.
- Se qualquer passo falhar, pare e explique o erro em português — não improvise comandos.
