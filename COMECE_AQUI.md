# 👋 COMECE AQUI — Criar um Projeto Novo

**Você quer criar um projeto novo a partir deste boilerplate?**

Peça ao Claude exatamente isto:

> **"Leia o CLAUDE.md e crie um projeto novo pra mim chamado [NOME DO SEU PROJETO]"**

Exemplo:
> "Leia o CLAUDE.md e crie um projeto novo pra mim chamado Painel de Sepse"

---

## O que acontece depois:

1. Claude lê o `CLAUDE.md` e entra em **modo bootstrap**
2. Pergunta seu **e-mail** (obrigatório para provisionar o banco)
3. Cria uma pasta nova com o código
4. Chama a **API de provisionamento** (cria repo privado + banco)
5. Faz push automático para a branch `staging`
6. Te devolve o **link do repositório** e a **pasta local**

---

## Pré-requisitos na sua máquina:

- ✅ Node.js 24.16.0+ (`node -v`)
- ✅ Git (`git --version`)
- ✅ pnpm 9.12.0+ (`pnpm -v`)

Se faltar algo, veja `docs/PRE_REQUISITOS.md`.

---

**Pronto?** Cole o comando acima no Claude e acompanhe o fluxo! 🚀
