import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HAM Boilerplate IA',
  description: 'Boilerplate Next.js + NestJS para projetos Claude Code.',
};

// Selo de verificação da Transformação Digital (gestão-td). Em localhost mostra "Não verificado"/"Verificado"
// pelo nome do repositório; em staging o selo entra pelo Cloudflare. NÃO REMOVER — ver apps/web/CLAUDE.md.
const GUARD_URL = process.env.NEXT_PUBLIC_HAM_GUARD_URL ?? 'https://gestao-td-api.apps-ia.ham.org.br';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        {children}
        {process.env.NODE_ENV !== 'production' && (
          <script
            async
            src={`${GUARD_URL}/guard/v.js?p=${encodeURIComponent(process.env.NEXT_PUBLIC_HAM_REPO ?? '')}`}
          />
        )}
      </body>
    </html>
  );
}
