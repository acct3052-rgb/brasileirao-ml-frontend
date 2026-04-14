'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { startRetrain, getRetrainStatus } from '@/lib/api'
import { RefreshCw, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? ''
const API_BASE    = process.env.NEXT_PUBLIC_API_URL ?? ''

function getLeagueCookie(): string {
  if (typeof document === 'undefined') return 'BSA'
  const match = document.cookie.match(/(?:^|;\s*)league=([^;]*)/)
  return match ? match[1] : 'BSA'
}

// ── Retreinar (liga com dados já coletados) ───────────────────────────────────

export function RetrainButton() {
  const [token, setToken]       = useState(ADMIN_TOKEN)
  const [showInput, setShowInput] = useState(false)
  const [status, setStatus]     = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }
  useEffect(() => () => stopPolling(), [])

  const poll = (t: string) => {
    intervalRef.current = setInterval(async () => {
      const s = await getRetrainStatus(t)
      if (!s) return
      if (s.status === 'done') { setStatus('done'); stopPolling(); setTimeout(() => setStatus('idle'), 5000) }
      else if (s.status === 'error') { setStatus('error'); setErrorMsg(s.error); stopPolling() }
    }, 3000)
  }

  const handleRetrain = async () => {
    if (!token) { setShowInput(true); return }
    setShowInput(false)
    setStatus('running')
    setErrorMsg(null)
    const league = getLeagueCookie()
    const res = await startRetrain(token, league)
    if (!res) { setStatus('error'); setErrorMsg('Token inválido ou API offline'); return }
    poll(token)
  }

  return (
    <div className="flex items-center gap-2">
      {showInput && status !== 'running' && (
        <input
          type="password" placeholder="Token admin" value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRetrain()}
          className="h-8 w-36 rounded-md border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
      )}
      <Button
        size="sm" variant="outline" onClick={handleRetrain}
        disabled={status === 'running'}
        className={cn(
          'text-xs gap-1.5',
          status === 'done'  && 'border-emerald-500/40 text-emerald-400',
          status === 'error' && 'border-red-500/40 text-red-400',
        )}
      >
        <RefreshCw className={cn('w-3.5 h-3.5', status === 'running' && 'animate-spin')} />
        {status === 'idle'    && 'Retreinar'}
        {status === 'running' && 'Treinando...'}
        {status === 'done'    && 'Concluído!'}
        {status === 'error'   && (errorMsg ?? 'Erro')}
      </Button>
    </div>
  )
}

// ── Setup de liga nova (coleta + features + treino) ───────────────────────────

export function SetupLeagueButton({ league }: { league: string }) {
  const [token, setToken]       = useState(ADMIN_TOKEN)
  const [showInput, setShowInput] = useState(false)
  const [status, setStatus]     = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [step, setStep]         = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }
  useEffect(() => () => stopPolling(), [])

  const poll = () => {
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/setup-league/status`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        const s = await res.json()
        setStep(s.step ?? '')
        if (s.status === 'done') { setStatus('done'); stopPolling(); setTimeout(() => setStatus('idle'), 8000) }
        else if (s.status === 'error') { setStatus('error'); setErrorMsg(s.error); stopPolling() }
      } catch { /* ignora */ }
    }, 4000)
  }

  const handleSetup = async () => {
    if (!token) { setShowInput(true); return }
    setShowInput(false)
    setStatus('running')
    setStep('iniciando...')
    setErrorMsg(null)
    try {
      const res = await fetch(`${API_BASE}/api/setup-league?league=${league}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { setStatus('error'); setErrorMsg('Token inválido ou API offline'); return }
      poll()
    } catch { setStatus('error'); setErrorMsg('Erro de conexão') }
  }

  return (
    <div className="flex items-center gap-2">
      {showInput && status !== 'running' && (
        <input
          type="password" placeholder="Token admin" value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSetup()}
          className="h-8 w-36 rounded-md border border-input bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
      )}
      <Button
        size="sm" variant="outline" onClick={handleSetup}
        disabled={status === 'running'}
        className={cn(
          'text-xs gap-1.5',
          status === 'done'  && 'border-emerald-500/40 text-emerald-400',
          status === 'error' && 'border-red-500/40 text-red-400',
        )}
      >
        {status === 'running'
          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          : status === 'done'
          ? <CheckCircle className="w-3.5 h-3.5" />
          : status === 'error'
          ? <AlertCircle className="w-3.5 h-3.5" />
          : <Download className="w-3.5 h-3.5" />
        }
        {status === 'idle'    && `Configurar ${league}`}
        {status === 'running' && (step || 'Processando...')}
        {status === 'done'    && `${league} pronto!`}
        {status === 'error'   && (errorMsg ?? 'Erro')}
      </Button>
    </div>
  )
}
