'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

interface Injury {
  player_name: string
  player_position: string
  injury_type: string
  teams: { name: string }
}

interface AdjustedPrediction {
  match_id: number
  lineup_confirmed: boolean
  injuries: {
    home: Injury[]
    away: Injury[]
    home_key_out: number
    away_key_out: number
  }
  base_prediction: {
    prob_home: number
    prob_draw: number
    prob_away: number
    expected_goals_home: number
    expected_goals_away: number
  }
  adjusted_prediction: {
    prob_home: number
    prob_draw: number
    prob_away: number
    expected_goals_home: number
    expected_goals_away: number
    over_25_prob: number
  }
  delta: {
    prob_home: number
    prob_draw: number
    prob_away: number
  }
}

interface Props {
  matchId: number
  homeTeam: string
  awayTeam: string
}

function DeltaBadge({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.005) return null
  const positive = delta > 0
  return (
    <span className={cn('text-[10px] font-medium ml-1', positive ? 'text-emerald-400' : 'text-red-400')}>
      {positive ? '+' : ''}{(delta * 100).toFixed(1)}%
    </span>
  )
}

export function LineupCard({ matchId, homeTeam, awayTeam }: Props) {
  const [data, setData] = useState<AdjustedPrediction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/api/predict/with-lineup/${matchId}`, {
      method: 'POST',
      cache: 'no-store',
    })
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [matchId])

  if (loading) return <div className="h-20 rounded-lg bg-muted/30 animate-pulse" />
  if (!data) return null

  const hasInjuries = data.injuries.home.length > 0 || data.injuries.away.length > 0
  const hasSignificantDelta = Math.abs(data.delta.prob_home) > 0.01 ||
                               Math.abs(data.delta.prob_draw) > 0.01 ||
                               Math.abs(data.delta.prob_away) > 0.01

  if (!hasInjuries && !data.lineup_confirmed) return null

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-amber-400">
          {data.lineup_confirmed ? '✓ Escalação confirmada' : '⚠ Ausências registradas'}
        </span>
        {hasSignificantDelta && (
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-amber-500/30 text-amber-400">
            Probabilidades ajustadas
          </Badge>
        )}
      </div>

      {/* Lesões */}
      {hasInjuries && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: homeTeam, injuries: data.injuries.home, keyOut: data.injuries.home_key_out },
            { label: awayTeam, injuries: data.injuries.away, keyOut: data.injuries.away_key_out },
          ].map(({ label, injuries, keyOut }) => (
            <div key={label} className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {label} {keyOut > 0 && <span className="text-amber-400">({keyOut} ausente{keyOut !== 1 ? 's' : ''})</span>}
              </p>
              {injuries.length === 0 ? (
                <p className="text-[10px] text-muted-foreground">Sem ausências</p>
              ) : (
                injuries.map((inj, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground w-3">
                      {inj.player_position === 'Goalkeeper' ? 'GK' :
                       inj.player_position === 'Defender' ? 'ZG' :
                       inj.player_position === 'Midfielder' ? 'MC' :
                       inj.player_position?.startsWith('F') ? 'AT' : '??'}
                    </span>
                    <span className="text-xs">{inj.player_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {inj.injury_type === 'Suspension' ? '🟨' : '🔴'}
                    </span>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {/* Probabilidades ajustadas */}
      {hasSignificantDelta && (
        <div className="border-t border-amber-500/10 pt-2">
          <p className="text-[10px] text-muted-foreground mb-1">Predição ajustada:</p>
          <div className="flex gap-4 text-xs tabular-nums">
            <span>
              Casa: <strong>{(data.adjusted_prediction.prob_home * 100).toFixed(1)}%</strong>
              <DeltaBadge delta={data.delta.prob_home} />
            </span>
            <span>
              Empate: <strong>{(data.adjusted_prediction.prob_draw * 100).toFixed(1)}%</strong>
              <DeltaBadge delta={data.delta.prob_draw} />
            </span>
            <span>
              Fora: <strong>{(data.adjusted_prediction.prob_away * 100).toFixed(1)}%</strong>
              <DeltaBadge delta={data.delta.prob_away} />
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            xG: {data.adjusted_prediction.expected_goals_home.toFixed(1)}–{data.adjusted_prediction.expected_goals_away.toFixed(1)}
            {' '}· Over 2.5: {Math.round(data.adjusted_prediction.over_25_prob * 100)}%
          </p>
        </div>
      )}
    </div>
  )
}
