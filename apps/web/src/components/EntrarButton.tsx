'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/Icon';

export function EntrarButton({ href }: { href: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleClick() {
    setLoading(true);
    setTimeout(() => router.push(href), 500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex h-12 w-full items-center justify-center rounded-xl bg-ham-900 font-bold text-white transition hover:bg-ham-700 disabled:cursor-not-allowed disabled:opacity-80"
    >
      {loading ? <Icon name="progress_activity" className="animate-spin text-[22px]" /> : 'Entrar'}
    </button>
  );
}
