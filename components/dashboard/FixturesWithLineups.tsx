'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ProbabilityBar } from './ProbabilityBar'
import { LineupCard } from './LineupCard'
import type { Fixture } from '@/types/api'
import { confidenceLevel, formatDate, resultLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Props {
  fixtures: Fixture[]
}

const confidenceBadgeStyle: Record<string, string> = {
  Alta: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Média: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Baixa: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export function FixturesWithLineups({ fixtures }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (fixtures.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12 text-sm">
        Nenhum jogo previsto disponível no momento.
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
      {fixtures.map((f) => {
        const level = confidenceLevel(f.confidence)
        const result = resultLabel(f.predicted_result)
        const isExpanded = expanded.has(f.match_id)

        return (
          <div key={f.match_id}>
            {/* Linha principal */}
            <div
              className="grid items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
              style={{ gridTemplateColumns: '2rem 6rem 1fr 1fr 180px 5rem 5rem 5rem 5rem 1.5rem' }}
              onClick={() => toggle(f.match_id)}
            >
              {/* Rodada */}
              <span className="text-center text-muted-foreground text-xs">{f.matchday}</span>

              {/* Data */}
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(f.match_date)}
              </span>

              {/* Mandante */}
              <span className={cn('font-medium text-sm truncate', f.predicted_result === 'H' && 'text-blue-400')}>
                {f.home_team}
              </span>

              {/* Visitante */}
              <span className={cn('font-medium text-sm truncate', f.predicted_result === 'A' && 'text-orange-400')}>
                {f.away_team}
              </span>

              {/* Barras */}
              <ProbabilityBar
                probHome={f.prob_home}
                probDraw={f.prob_draw}
                probAway={f.prob_away}
                predicted={f.predicted_result}
              />

              {/* Previsto */}
              <span className={cn(
                'text-sm font-semibold',
                f.predicted_result === 'H' && 'text-blue-400',
                f.predicted_result === 'D' && 'text-zinc-300',
                f.predicted_result === 'A' && 'text-orange-400',
              )}>
                {result}
              </span>

              {/* Gols esperados */}
              <span className="text-center text-sm tabular-nums text-muted-foreground">
                {f.expected_goals_home?.toFixed(1) ?? '—'} x {f.expected_goals_away?.toFixed(1) ?? '—'}
              </span>

              {/* Over 2.5 */}
              <span className="text-center text-sm tabular-nums">
                {f.over_25_prob != null ? Math.round(f.over_25_prob * 100) + '%' : '—'}
              </span>

              {/* Confiança */}
              <Badge variant="outline" className={cn('text-xs justify-self-center', confidenceBadgeStyle[level])}>
                {level}
              </Badge>

              {/* Expand icon */}
              <span className="text-muted-foreground">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </span>
            </div>

            {/* Painel expandido: lesões + escalação */}
            {isExpanded && (
              <div className="px-4 pb-3 bg-muted/10">
                <LineupCard
                  matchId={f.match_id}
                  homeTeam={f.home_team}
                  awayTeam={f.away_team}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
