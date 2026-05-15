'use client';

import { useEffect, useState } from 'react';
import type { HelloResponse } from '@app/shared-types';
import { getApiBaseUrl } from '@/lib/api';

type State =
  | { status: 'loading' }
  | { status: 'ok'; data: HelloResponse }
  | { status: 'error'; error: string };

export function HelloClient() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [name, setName] = useState('Browser');

  async function callApi(targetName: string) {
    setState({ status: 'loading' });
    const base = getApiBaseUrl('client');
    try {
      const res = await fetch(`${base}/hello?name=${encodeURIComponent(targetName)}`);
      if (!res.ok) {
        setState({ status: 'error', error: `HTTP ${res.status}` });
        return;
      }
      const data = (await res.json()) as HelloResponse;
      setState({ status: 'ok', data });
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : 'erro desconhecido',
      });
    }
  }

  useEffect(() => {
    callApi('Browser');
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          placeholder="Seu nome"
        />
        <button
          onClick={() => callApi(name)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Chamar API
        </button>
      </div>

      {state.status === 'loading' && (
        <p className="text-sm text-zinc-500">Carregando…</p>
      )}

      {state.status === 'error' && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <strong>Falhou:</strong> {state.error}
          <p className="mt-2 text-xs text-red-600">
            Provável causa: CORS bloqueando a origem, ou a API está offline.
          </p>
        </div>
      )}

      {state.status === 'ok' && (
        <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-xs text-zinc-100">
          {JSON.stringify(state.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
