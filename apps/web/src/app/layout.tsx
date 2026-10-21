import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { EnvironmentBanner } from '@/components/EnvironmentBanner';
import { BuildBadge } from '@/components/BuildBadge';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_HAM_REPO || 'HAM Boilerplate IA',
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
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`}>
      <head>
        {/* Ícones padrão do design system — ver apps/web/CLAUDE.md. Não trocar por SVGs avulsos. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className="min-h-dvh bg-bg font-sans text-ink antialiased">
        <EnvironmentBanner />
        {children}
        <BuildBadge />
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
