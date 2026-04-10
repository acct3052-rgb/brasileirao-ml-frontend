'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export function SyncResultsButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<string | null>(null)

  async function handleSync() {
    setState('loading')
    setResult(null)
    try {
      const res = await fetch(`${API_BASE}/api/sync-results`, {
        method: 'POST',
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const msg = `✓ ${data.matches_synced} jogos | ${data.predictions_updated} predições | ${data.bets_updated} apostas`
      setResult(msg)
      setState('done')
    } catch (e) {
      setResult('Erro ao sincronizar')
      setState('error')
    }
    setTimeout(() => setState('idle'), 5000)
  }

  return (
    <div className="flex items-center gap-2">
      {result && (
        <span className={`text-xs ${state === 'error' ? 'text-red-400' : 'text-green-400'}`}>
          {result}
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={state === 'loading'}
        title="Buscar resultados reais e atualizar predições"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${state === 'loading' ? 'animate-spin' : ''}`} />
        {state === 'loading' ? 'Sincronizando...' : 'Atualizar Resultados'}
      </button>
    </div>
  )
}
