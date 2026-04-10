'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Fixture } from '@/types/api'
import type { MarketOdds } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  fixtures: Fixture[]
  marketOdds: MarketOdds[]
}

const OUTCOME_LABELS = { H: 'Casa', D: 'Empate', A: 'Visitante' } as const
const OUTCOMES = ['H', 'D', 'A'] as const

const BOOKMAKER_LABELS: Record<string, string> = {
  pinnacle: 'Pinnacle', betfair_ex_eu: 'Betfair', matchbook: 'Matchbook',
  williamhill: 'W.Hill', betsson: 'Betsson', marathonbet: 'Marathonbet',
  nordicbet: 'Nordicbet', unibet_nl: 'Unibet', unibet_fr: 'Unibet', unibet_se: 'Unibet',
  betonlineag: 'BetOnline', sport888: '888sport', betclic_fr: 'Betclic',
  winamax_fr: 'Winamax', winamax_de: 'Winamax', tipico_de: 'Tipico',
  onexbet: '1xBet', everygame: 'Everygame', coolbet: 'Coolbet',
  leovegas_se: 'LeoVegas', pmu_fr: 'PMU', gtbets: 'GTbets', codere_it: 'Codere',
}

function normTeam(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(ec|sc|cr|ca|se|rb|fc|fbpa|af|fbc)\b/g, '')
    .replace(/[^a-z]/g, '')
    .trim()
}

function findMarketOdd(fixture: Fixture, marketOdds: MarketOdds[]): MarketOdds | null {
  const fh = normTeam(fixture.home_team)
  const fa = normTeam(fixture.away_team)
  return (
    marketOdds.find((o) => {
      const oh = normTeam(o.home_team)
      const oa = normTeam(o.away_team)
      return (oh === fh || fh.includes(oh) || oh.includes(fh)) &&
             (oa === fa || fa.includes(oa) || oa.includes(fa))
    }) ?? null
  )
}

function calcEv(prob: number, odd: number) { return prob * odd - 1 }
function calcKelly(prob: number, odd: number, fraction = 0.5): number {
  const b = odd - 1
  const f = (prob * b - (1 - prob)) / b
  return Math.max(0, f * fraction)
}

export function RoundCoupon({ fixtures, marketOdds }: Props) {
  const rounds = Array.from(new Set(fixtures.map((f) => f.matchday))).sort((a, b) => a - b)
  const [selectedRound, setSelectedRound] = useState<number>(rounds[0] ?? 1)
  const [bankroll, setBankroll] = useState<number>(1000)

  const roundFixtures = fixtures.filter((f) => f.matchday === selectedRound)

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {rounds.map((r) => (
            <Button
              key={r}
              size="sm"
              variant="outline"
              onClick={() => setSelectedRound(r)}
              className={cn('text-xs h-7 px-3', selectedRound === r && 'bg-primary/10 text-primary border-primary/30')}
            >
              Rd {r}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Banca (R$):</label>
          <input
            type="number"
            min="1"
            step="100"
            value={bankroll}
            onChange={(e) => setBankroll(parseFloat(e.target.value) || 1000)}
            className="w-24 h-7 rounded border border-input bg-transparent px-2 text-center text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Grid de jogos */}
      <div className="grid gap-3 sm:grid-cols-2">
        {roundFixtures.map((f) => {
          const market = findMarketOdd(f, marketOdds)
          const odds = {
            H: market?.odd_home ?? null,
            D: market?.odd_draw ?? null,
            A: market?.odd_away ?? null,
          }
          const bestBks = {
            H: market?.best_home_bk ?? null,
            D: market?.best_draw_bk ?? null,
            A: market?.best_away_bk ?? null,
          }
          const probs = {
            H: f.prob_home,
            D: f.prob_draw,
            A: f.prob_away,
          }
          const predicted = f.predicted_result as 'H' | 'D' | 'A'

          return (
            <div
              key={f.match_id}
              className="rounded-lg border border-border bg-card p-3 space-y-2"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{formatDate(f.match_date)}</span>
                <span className="text-xs text-muted-foreground">Rd {f.matchday}</span>
              </div>

              {/* Times */}
              <div className="text-sm font-semibold text-center">
                {f.home_team} <span className="text-muted-foreground font-normal">vs</span> {f.away_team}
              </div>

              {/* Gols esperados */}
              {f.expected_goals_home != null && (
                <div className="rounded-md bg-muted/40 px-3 py-2 space-y-1.5">
                  {/* Placar esperado */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold tabular-nums text-foreground">
                        {f.expected_goals_home?.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground text-lg">–</span>
                      <span className="text-2xl font-bold tabular-nums text-foreground">
                        {f.expected_goals_away?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  {/* Barras Over 1.5 e Over 2.5 */}
                  {(() => {
                    const over15 = f.over_15_prob ?? null
                    const over25 = f.over_25_prob ?? null
                    const bars = [
                      { label: 'Over 1.5', prob: over15, hi: 0.72, mid: 0.55 },
                      { label: 'Over 2.5', prob: over25, hi: 0.55, mid: 0.40 },
                    ]
                    return bars.map(({ label, prob, hi, mid }) =>
                      prob != null ? (
                        <div key={label} className="space-y-0.5">
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{label}</span>
                            <span className={cn(
                              'font-semibold',
                              prob >= hi ? 'text-emerald-400' :
                              prob >= mid ? 'text-amber-400' : 'text-muted-foreground'
                            )}>
                              {Math.round(prob * 100)}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                prob >= hi ? 'bg-emerald-500' :
                                prob >= mid ? 'bg-amber-500' : 'bg-muted-foreground/40'
                              )}
                              style={{ width: `${Math.round(prob * 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : null
                    )
                  })()}
                </div>
              )}

              {/* Odds grid */}
              <div className="grid grid-cols-3 gap-1">
                {OUTCOMES.map((outcome) => {
                  const prob = probs[outcome]
                  const odd = odds[outcome]
                  const bk = bestBks[outcome]
                  const ev = odd !== null ? calcEv(prob, odd) : null
                  const isValue = ev !== null && ev > 0
                  const kelly = isValue && odd !== null ? calcKelly(prob, odd) : null
                  const isBestPick = outcome === predicted

                  return (
                    <div
                      key={outcome}
                      className={cn(
                        'rounded p-2 text-center space-y-0.5 border',
                        isValue ? 'bg-emerald-500/10 border-emerald-500/20' : 'border-border',
                        isBestPick && !isValue && 'border-blue-500/30 bg-blue-500/5',
                      )}
                    >
                      <div className="text-[10px] text-muted-foreground font-medium">
                        {OUTCOME_LABELS[outcome]}
                      </div>
                      <div className="text-xs font-semibold tabular-nums">
                        {(prob * 100).toFixed(0)}%
                      </div>
                      {odd !== null ? (
                        <>
                          <div className={cn('text-sm font-bold tabular-nums', isValue ? 'text-emerald-400' : 'text-foreground')}>
                            {odd.toFixed(2)}
                          </div>
                          {bk && (
                            <div className="text-[10px] text-muted-foreground leading-tight">
                              {BOOKMAKER_LABELS[bk] ?? bk}
                            </div>
                          )}
                          {isValue && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              EV {ev !== null ? (ev > 0 ? '+' : '') + (ev * 100).toFixed(0) + '%' : ''}
                            </Badge>
                          )}
                          {kelly !== null && kelly > 0 && (
                            <div className="text-[10px] text-amber-400">
                              R$ {(bankroll * kelly).toFixed(0)}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-muted-foreground">—</div>
                      )}
                      {isBestPick && (
                        <div className="text-[9px] text-blue-400">▲ modelo</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {roundFixtures.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-10">
          Nenhum jogo disponível para a rodada {selectedRound}.
        </p>
      )}
    </div>
  )
}
