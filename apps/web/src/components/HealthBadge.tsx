import type { HealthCheck } from '@app/shared-types';

async function fetchHealth(): Promise<HealthCheck | null> {
  const url = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${url}/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as HealthCheck;
  } catch {
    return null;
  }
}

export async function HealthBadge() {
  const health = await fetchHealth();

  if (!health) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
        <span className="size-2 rounded-full bg-red-500" /> offline
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
      <span className="size-2 rounded-full bg-emerald-500" /> {health.status}
    </span>
  );
}
