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
      <span className="inline-flex items-center gap-2 rounded-full bg-[#FDF2F1] px-3 py-1 text-sm font-semibold text-status-blocked">
        <span className="size-2 rounded-full bg-status-blocked" /> offline
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#E6F7F1] px-3 py-1 text-sm font-semibold text-status-done">
      <span className="size-2 rounded-full bg-status-done" /> {health.status}
    </span>
  );
}
