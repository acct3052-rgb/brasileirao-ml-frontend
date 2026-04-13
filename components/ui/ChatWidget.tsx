'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'

interface Pick {
  match: string
  matchday: number
  match_date: string
  market: string
  prob: number
  tier: string
  fair_odd: number | null
  market_odd: number | null
  ev: number | null
}

interface Message {
  role: 'user' | 'assistant'
  text: string
  picks?: Pick[]
}

const DEFAULT_QUESTION = 'Quais são as apostas Elite com EV positivo para a próxima rodada?'

const SUGGESTIONS = [
  DEFAULT_QUESTION,
  'Tem jogo ⭐ Ouro essa rodada?',
  'Como foi a precisão recente?',
  'Qual Over 1.5 mais confiante?',
]

const TIER_STYLE: Record<string, string> = {
  Elite: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
  Alta:  'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
  Média: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
  Baixa: 'text-muted-foreground border-border',
}

function PickCard({ pick }: { pick: Pick }) {
  const isGolden = pick.ev !== null && pick.ev > 0 && (pick.tier === 'Elite' || pick.tier === 'Alta')
  const noMarketOdd = pick.market_odd === null

  return (
    <div className={cn(
      'rounded-lg border p-2.5 space-y-1.5',
      isGolden
        ? 'border-yellow-400/50 bg-yellow-400/5 shadow-[0_0_8px_rgba(250,204,21,0.12)]'
        : 'border-border bg-card'
    )}>
      {/* Jogo + rodada */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] font-semibold truncate">{pick.match}</span>
        <span className="text-[10px] text-muted-foreground flex-shrink-0">Rd{pick.matchday}</span>
      </div>

      {/* Mercado */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{pick.market}</span>
        {isGolden && <span className="text-[9px] text-yellow-300 animate-pulse font-bold">⭐ Ouro</span>}
      </div>

      {/* Prob + tier + odds */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold tabular-nums">{pick.prob}%</span>
          <span className={cn('text-[9px] px-1 py-0.5 rounded border font-semibold', TIER_STYLE[pick.tier] ?? TIER_STYLE.Baixa)}>
            {pick.tier === 'Elite' ? '🔥' : ''}{pick.tier}
          </span>
        </div>
        <div className="text-right">
          {pick.market_odd ? (
            <div>
              <div className="text-xs font-bold tabular-nums">{pick.market_odd.toFixed(2)}</div>
              <div className={cn('text-[10px] font-semibold', (pick.ev ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400')}>
                EV {(pick.ev ?? 0) > 0 ? '+' : ''}{pick.ev?.toFixed(1)}%
              </div>
            </div>
          ) : (
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground">odd justa</div>
              <div className="text-xs font-bold tabular-nums">{pick.fair_odd?.toFixed(2) ?? '—'}</div>
              {noMarketOdd && (
                <div className="text-[9px] text-amber-400">preencha manualmente</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PicksGrid({ picks }: { picks: Pick[] }) {
  if (!picks.length) return null
  const col1 = picks.slice(0, 3)
  const col2 = picks.slice(3, 6)

  return (
    <div className="mt-2 space-y-2">
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        Top 6 Apostas Selecionadas
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="space-y-1.5">{col1.map((p, i) => <PickCard key={i} pick={p} />)}</div>
        <div className="space-y-1.5">{col2.map((p, i) => <PickCard key={i} pick={p} />)}</div>
      </div>
      <p className="text-[9px] text-muted-foreground">
        "Preencha manualmente" = sem odd de mercado disponível para esse mercado. Use a odd justa como referência mínima.
      </p>
    </div>
  )
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Olá! Pergunte sobre apostas, predições ou acurácia do modelo. 🤖' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
      if (messages.length === 1 && !input) setInput(DEFAULT_QUESTION)
    }
  }, [open, messages])

  async function send(text: string) {
    if (!text.trim() || loading) return
    const userMsg = text.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: res.ok ? data.reply : (data.detail ?? 'Erro ao consultar o assistente.'),
        picks: res.ok ? (data.picks ?? []) : [],
      }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Erro de conexão. Tente novamente.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed bottom-5 right-5 z-50 flex items-center justify-center rounded-full shadow-lg transition-all',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          open && 'rotate-90'
        )}
        style={{ width: 52, height: 52 }}
        aria-label="Abrir assistente"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>

      {/* Painel do chat */}
      {open && (
        <div
          className="fixed bottom-20 right-5 z-50 w-80 sm:w-[420px] flex flex-col rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
          style={{ maxHeight: '80vh' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <span className="text-sm font-semibold">Assistente ML</span>
            <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Haiku</span>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ minHeight: 200 }}>
            {messages.map((m, i) => (
              <div key={i} className={cn('flex flex-col', m.role === 'user' ? 'items-end' : 'items-start')}>
                <div className={cn(
                  'max-w-[90%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                )}>
                  {m.text}
                </div>
                {m.picks && m.picks.length > 0 && (
                  <div className="w-full mt-1">
                    <PicksGrid picks={m.picks} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Sugestões */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] px-2 py-1 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-border">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder="Pergunte sobre apostas..."
              className="flex-1 h-8 rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={loading}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
