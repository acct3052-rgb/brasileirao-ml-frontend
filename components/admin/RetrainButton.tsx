'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { startRetrain, getRetrainStatus } from '@/lib/api'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? ''

export function RetrainButton() {
  const [token, setToken] = useState(ADMIN_TOKEN)
  const [showInput, setShowInput] = useState(false)
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => () => stopPolling(), [])

  const poll = (t: string) => {
    intervalRef.current = setInterval(async () => {
      const s = await getRetrainStatus(t)
      if (!s) return
      if (s.status === 'done') {
        setStatus('done')
        stopPolling()
        setTimeout(() => setStatus('idle'), 5000)
      } else if (s.status === 'error') {
        setStatus('error')
        setErrorMsg(s.error)
        stopPolling()
      }
    }, 3000)
  }

  const handleRetrain = async () => {
    if (!token) { setShowInput(true); return }
    setShowInput(false)
    setStatus('running')
    setErrorMsg(null)
    const res = await startRetrain(token)
    if (!res) {
      setStatus('error')
      setErrorMsg('Token inválido ou API offline')
      return
    }
    poll(token)
  }

  return (
    <div className="flex items-center gap-2">
      {showInput && status !== 'running' && (
        <input
          type="password"
          placeholder="Token admin"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRetrain()}
          className="h-8 w-36 rounded-md border border-input bg-transparent px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={handleRetrain}
        disabled={status === 'running'}
        className={cn(
          'text-xs gap-1.5',
          status === 'done' && 'border-emerald-500/40 text-emerald-400',
          status === 'error' && 'border-red-500/40 text-red-400',
        )}
      >
        {status === 'running' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
        {status === 'done' && <CheckCircle className="w-3.5 h-3.5" />}
        {status === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
        {status === 'idle' && <RefreshCw className="w-3.5 h-3.5" />}
        {status === 'idle' && 'Retreinar'}
        {status === 'running' && 'Treinando...'}
        {status === 'done' && 'Concluído!'}
        {status === 'error' && (errorMsg ?? 'Erro')}
      </Button>
    </div>
  )
}
