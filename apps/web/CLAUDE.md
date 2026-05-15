# CLAUDE.md — apps/web (Next.js)

> Contexto específico do frontend. Use junto com o `CLAUDE.md` raiz.

## Stack

- Next.js 15 (App Router, `output: 'standalone'`)
- React 19
- TypeScript estrito
- Tailwind CSS
- Tipos compartilhados via `@app/shared-types` (workspace)

## Layout dentro de `src/`

```
src/
├── app/              # Rotas (App Router). Cada pasta vira uma rota.
│   ├── layout.tsx    # Layout raiz
│   ├── page.tsx      # Home
│   └── globals.css   # Tailwind base
├── components/       # Componentes reutilizáveis (.tsx, PascalCase)
└── lib/              # Helpers, clientes de API, utilitários
```

## Convenções obrigatórias

- **Server Components por padrão.** Adicione `'use client'` só quando precisar de hooks/eventos do navegador.
- **Fetch a partir do server** usa `INTERNAL_API_URL` (nome de serviço no Docker / hostname interno no Coolify).
- **Fetch a partir do cliente** usa `NEXT_PUBLIC_API_URL` (URL pública do browser).
- **Importe tipos** do shared package: `import type { HealthCheck } from '@app/shared-types';`
- **Aliases:** `@/*` aponta para `src/*` (definido em `tsconfig.json`).
- **Estilização:** Tailwind primeiro. CSS global só em `globals.css`.
- **Sem `getServerSideProps` / `getStaticProps`.** Só App Router.

## Variáveis de ambiente (web)

| Variável | Onde | Para quê |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | build + runtime | URL pública da API (browser) |
| `INTERNAL_API_URL` | runtime server | URL interna da API (server components) |

`NEXT_PUBLIC_*` é **embedida no bundle** — nunca coloque segredo nessas variáveis.

## Quando criar uma rota nova

1. Crie a pasta `src/app/<rota>/page.tsx`.
2. Use Server Component a menos que precise de interatividade.
3. Se precisar de dados, faça `fetch` no Server Component (com `cache: 'no-store'` se for dinâmico).
4. Se for client, isole o componente interativo num arquivo separado com `'use client'`.

## Comandos

```bash
pnpm --filter @app/web dev        # dev server
pnpm --filter @app/web build      # build produção
pnpm --filter @app/web typecheck  # verifica tipos
pnpm --filter @app/web lint       # eslint
```

## Build Docker (referência rápida)

O Dockerfile usa `output: 'standalone'` do Next. **Não remova essa config** — o runner espera `.next/standalone/apps/web/server.js`.
