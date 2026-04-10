'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { HotBadge } from '@/components/ui/HotBadge'
import { ProbabilityBar } from './ProbabilityBar'
import { LineupCard } from './LineupCard'
import type { Fixture } from '@/types/api'
import { confidenceLevel, formatDate, resultLabel } from '@/lib/utils'
import { getCalibrationTier } from '@/lib/calibration'
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
              className={cn(
                'grid items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer',
                getCalibrationTier(f.confidence).highlight === 'hot' && 'bg-emerald-500/5'
              )}
              style={{ gridTemplateColumns: '2rem 6rem 1fr 1fr 180px 5rem 5rem 5rem 5rem auto 1.5rem' }}
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

              {/* Hot badge */}
              <HotBadge confidence={f.confidence} over15Prob={f.over_15_prob} />

              {/* Expand icon */}
              <span className="text-muted-foreground">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </span>
            </div>

            {/* Painel expandido */}
            {isExpanded && (
              <div className={cn(
                'px-4 pb-4 pt-2 space-y-3',
                getCalibrationTier(f.confidence).highlight === 'hot'
                  ? 'bg-emerald-500/5'
                  : 'bg-muted/10'
              )}>
                {/* Probabilidades detalhadas */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: f.home_team, prob: f.prob_home, outcome: 'H' },
                    { label: 'Empate', prob: f.prob_draw, outcome: 'D' },
                    { label: f.away_team, prob: f.prob_away, outcome: 'A' },
                  ].map(({ label, prob, outcome }) => (
                    <div key={outcome} className={cn(
                      'rounded-lg border p-3 text-center space-y-1',
                      f.predicted_result === outcome
                        ? 'border-blue-500/30 bg-blue-500/5'
                        : 'border-border bg-card'
                    )}>
                      <div className="text-[11px] text-muted-foreground truncate">{label}</div>
                      <div className="text-xl font-bold tabular-nums">
                        {Math.round(prob * 100)}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        odd justa: {prob > 0 ? (1 / prob).toFixed(2) : '—'}
                      </div>
                      {f.predicted_result === outcome && (
                        <div className="text-[10px] text-blue-400">▲ modelo</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Gols e Over */}
                <div className="flex gap-4 flex-wrap text-sm text-muted-foreground">
                  <span>xG: <strong className="text-foreground">{f.expected_goals_home?.toFixed(1)} – {f.expected_goals_away?.toFixed(1)}</strong></span>
                  {f.over_15_prob != null && (
                    <span>Over 1.5: <strong className={cn(
                      f.over_15_prob >= 0.72 ? 'text-emerald-400' :
                      f.over_15_prob >= 0.55 ? 'text-amber-400' : 'text-foreground'
                    )}>{Math.round(f.over_15_prob * 100)}%</strong></span>
                  )}
                  <span>Over 2.5: <strong className={cn(
                    f.over_25_prob >= 0.55 ? 'text-emerald-400' :
                    f.over_25_prob >= 0.40 ? 'text-amber-400' : 'text-foreground'
                  )}>{Math.round(f.over_25_prob * 100)}%</strong></span>
                </div>

                {/* Calibração */}
                {(() => {
                  const tier = getCalibrationTier(f.confidence)
                  if (tier.highlight === 'weak' || tier.highlight === 'normal') return null
                  return (
                    <div className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                      tier.highlight === 'hot'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                    )}>
                      <span className="font-bold">{tier.highlight === 'hot' ? '🔥' : '✓'} {tier.label}</span>
                      <span className="opacity-75">·</span>
                      <span>{Math.round(tier.actualAccuracy * 100)}% de acerto histórico nessa faixa de confiança ({tier.description})</span>
                    </div>
                  )
                })()}

                {/* Lesões (só se API_FOOTBALL_KEY configurada) */}
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
