'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

interface GoalLine {
  label: string
  prob: number
  prob_pct: number
  fair_odd: number | null
  highlight: 'hot' | 'good' | 'normal'
}

interface GoalsData {
  expected_goals_home: number
  expected_goals_away: number
  lines: GoalLine[]
}

interface Props {
  matchId: number
}

export function GoalsLines({ matchId }: Props) {
  const [data, setData] = useState<GoalsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/api/goals-lines/${matchId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [matchId])

  if (loading) return (
    <div className="space-y-1.5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-8 rounded bg-muted/30 animate-pulse" />
      ))}
    </div>
  )

  if (!data) return null

  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Linhas de Gols
      </div>

      {data.lines.map((line) => {
        const isHot  = line.highlight === 'hot'
        const isGood = line.highlight === 'good'

        return (
          <div
            key={line.label}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-3 py-2 transition-all',
              isHot  && 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
              isGood && !isHot && 'border-emerald-500/25 bg-emerald-500/5',
              !isHot && !isGood && 'border-border bg-card'
            )}
          >
            {/* Label */}
            <span className={cn(
              'text-xs font-semibold w-16 flex-shrink-0',
              isHot  ? 'text-emerald-300' :
              isGood ? 'text-emerald-400' :
              'text-muted-foreground'
            )}>
              {isHot && <span className="animate-pulse mr-1">🔥</span>}
              {isGood && !isHot && <span className="mr-1">✓</span>}
              {line.label}
            </span>

            {/* Barra de probabilidade */}
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isHot  ? 'bg-emerald-400' :
                  isGood ? 'bg-emerald-500/70' :
                  'bg-muted-foreground/40'
                )}
                style={{ width: `${line.prob_pct}%` }}
              />
            </div>

            {/* Probabilidade */}
            <span className={cn(
              'text-sm font-bold tabular-nums w-10 text-right flex-shrink-0',
              isHot  ? 'text-emerald-300' :
              isGood ? 'text-emerald-400' :
              'text-foreground'
            )}>
              {line.prob_pct}%
            </span>

            {/* Odd justa */}
            <div className="text-right flex-shrink-0 w-20">
              <div className="text-[10px] text-muted-foreground leading-none">odd justa</div>
              <div className={cn(
                'text-sm font-bold tabular-nums',
                isHot  ? 'text-emerald-300' :
                isGood ? 'text-emerald-400' :
                'text-foreground'
              )}>
                {line.fair_odd?.toFixed(2) ?? '—'}
              </div>
            </div>
          </div>
        )
      })}

      <p className="text-[10px] text-muted-foreground pt-1">
        Procure odds acima da "odd justa" para ter EV positivo.
      </p>
    </div>
  )
}
