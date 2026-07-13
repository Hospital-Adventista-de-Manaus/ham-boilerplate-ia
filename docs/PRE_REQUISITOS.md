# Pré-requisitos — criar um projeto novo com o Claude

Este guia é para quem vai usar o boilerplate do jeito mais simples: **entregar o link ao Claude
e deixar ele criar o projeto**. Instale as ferramentas abaixo **uma vez** na sua máquina.

O repositório e o banco de dados são criados por uma **API de provisionamento** da organização —
você **não** precisa do GitHub CLI (`gh`) nem de permissão para criar repositórios na org.

## 1. O que instalar

| Ferramenta | Versão | Como conferir | Onde baixar |
|---|---|---|---|
| Node.js | **24.16.0** | `node -v` | https://nodejs.org (ou `nvm install 24.16.0`) |
| pnpm | **9.12.0** | `pnpm -v` | `corepack enable && corepack prepare pnpm@9.12.0 --activate` |
| Git | qualquer recente | `git --version` | https://git-scm.com |
| Claude Code | atual | — | conforme instalação interna |

## 2. Configurar sua identidade do git (uma vez)

O commit inicial do projeto usa seu nome/e-mail do git. Configure:

```bash
git config --global user.name  "Seu Nome"
git config --global user.email "voce@ham.org.br"
```

O **e-mail** também é enviado à API de provisionamento (ela exige um e-mail válido). Você pode
informá-lo na hora (o Claude vai perguntar) ou deixar que ele use o `user.email` do git acima.

## 3. Confirmar que a API está no ar

O Claude cria o repositório e o banco chamando a API de provisionamento. Confirme que ela responde:

```bash
curl https://api-provisionamento.apps.ham.org.br/health   # deve responder {"status":"ok"}
```

Se precisar apontar para outra URL, defina a variável de ambiente `PROVISION_API_URL` antes de rodar.

## 4. Como iniciar (a "frase mágica")

1. Abra o Claude Code.
2. Cole o link do boilerplate e peça, por exemplo:

   > "Clona esse repositório e cria um projeto novo pra mim: https://github.com/Hospital-Adventista-de-Manaus/ham-boilerplate-ia"

3. O Claude vai ler o `CLAUDE.md` do repositório, entrar em **modo bootstrap** e **perguntar o nome
   do projeto e o seu e-mail**. Responda.
4. Ele então cria uma pasta nova com esse nome, chama a API (que cria o repositório privado na
   organização e provisiona o banco) e envia o código para a branch **`staging`** — pedindo sua
   confirmação antes das ações externas. As credenciais do banco são gravadas automaticamente em
   `apps/api/.env`.

Ao final, o Claude te devolve o **link do repositório** e **onde o projeto ficou na sua máquina**.

## 5. Se algo falhar

- **API fora do ar** (`/health` não responde) → avise o time responsável pela API de provisionamento.
- **Projeto já existe** → a API recusa nomes repetidos; escolha outro nome de projeto.
- **Node/pnpm na versão errada** → use a versão exata da tabela acima (a `.nvmrc` do projeto ajuda: `nvm use`).
- Em qualquer falha, o projeto local fica pronto com o commit na branch `staging` e o push pode ser refeito depois.
