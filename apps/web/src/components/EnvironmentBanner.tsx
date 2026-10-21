/** Banner global de ambiente não-produtivo. Controlado por NEXT_PUBLIC_ENV_BANNER — ativo por
 * padrão (.env.example), já que todo clone roda como homologação. Apague a variável no Coolify
 * de main (produção) para o banner sumir. */
export function EnvironmentBanner() {
  const message = process.env.NEXT_PUBLIC_ENV_BANNER;
  if (!message) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-status-blocked px-4 py-2 text-center text-sm font-bold uppercase tracking-wide text-white">
      {message}
    </div>
  );
}
