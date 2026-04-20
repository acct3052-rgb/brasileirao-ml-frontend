'use client'

import { useState, useCallback, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Fixture } from '@/types/api'
import type { MarketOdds } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { HotBadge } from '@/components/ui/HotBadge'
import { getCalibrationTier } from '@/lib/calibration'

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

interface GoalPick {
  matchLabel: string
  matchDate: string
  market: string
  prob: number
  fairOdd: number
  marketOdd: number | null
  marketBk: string | null
  ev: number | null
  grade: 'A+' | 'A' | 'B+'
}

export function RoundCoupon({ fixtures, marketOdds }: Props) {
  const rounds = Array.from(new Set(fixtures.map((f) => f.matchday))).sort((a, b) => a - b)
  const [selectedRound, setSelectedRound] = useState<number>(rounds[0] ?? 1)
  const [bankroll, setBankroll] = useState<number>(1000)

  const roundFixtures = fixtures.filter((f) => f.matchday === selectedRound)

  // Monta top picks de gols para a rodada
  const goalPicks = useMemo(() => {
    const picks: GoalPick[] = []

    for (const f of roundFixtures) {
      const market = findMarketOdd(f, marketOdds)
      const matchLabel = `${f.home_team} vs ${f.away_team}`
      const matchDate = f.match_date

      // Over 1.5
      const o15 = f.over_15_prob
      if (o15 && o15 >= 0.70) {
        const fair = parseFloat((1 / o15).toFixed(2))
        const mktOdd = market?.odd_over15_market ?? null
        const bk = market?.best_over15_bk ?? null
        const ev = mktOdd ? calcEv(o15, mktOdd) : null
        const grade = o15 >= 0.85 ? 'A+' as const : o15 >= 0.78 ? 'A' as const : 'B+' as const
        picks.push({ matchLabel, matchDate, market: 'Over 1.5', prob: o15, fairOdd: fair, marketOdd: mktOdd, marketBk: bk, ev, grade })
      }

      // Over 2.5
      const o25 = f.over_25_prob
      if (o25 && o25 >= 0.55) {
        const fair = parseFloat((1 / o25).toFixed(2))
        const mktOdd = market?.odd_over25_market ?? null
        const bk = market?.best_over25_bk ?? null
        const ev = mktOdd ? calcEv(o25, mktOdd) : null
        const grade = o25 >= 0.70 ? 'A+' as const : o25 >= 0.62 ? 'A' as const : 'B+' as const
        picks.push({ matchLabel, matchDate, market: 'Over 2.5', prob: o25, fairOdd: fair, marketOdd: mktOdd, marketBk: bk, ev, grade })
      }

      // BTTS
      const btts = f.btts_prob
      if (btts && btts >= 0.58) {
        const fair = parseFloat((1 / btts).toFixed(2))
        const mktOdd = market?.odd_btts_yes ?? null
        const bk = market?.best_btts_yes_bk ?? null
        const ev = mktOdd ? calcEv(btts, mktOdd) : null
        const grade = btts >= 0.72 ? 'A+' as const : btts >= 0.65 ? 'A' as const : 'B+' as const
        picks.push({ matchLabel, matchDate, market: 'BTTS', prob: btts, fairOdd: fair, marketOdd: mktOdd, marketBk: bk, ev, grade })
      }
    }

    const gradeOrder = { 'A+': 3, 'A': 2, 'B+': 1 }
    picks.sort((a, b) => gradeOrder[b.grade] - gradeOrder[a.grade] || b.prob - a.prob)
    return picks
  }, [roundFixtures, marketOdds])

  const valuePicksCount = goalPicks.filter((p) => p.ev && p.ev > 0).length

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

      {/* ── TOP PICKS DE GOLS ── */}
      {goalPicks.length > 0 && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-400">
              Melhores Apostas de Gols — Rodada {selectedRound}
            </h3>
            <div className="flex items-center gap-2">
              {valuePicksCount > 0 && (
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  {valuePicksCount} value {valuePicksCount === 1 ? 'bet' : 'bets'}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                {goalPicks.length} {goalPicks.length === 1 ? 'pick' : 'picks'}
              </Badge>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {goalPicks.map((pick, i) => {
              const isValue = pick.ev !== null && pick.ev > 0
              const kelly = isValue && pick.marketOdd ? calcKelly(pick.prob, pick.marketOdd) : null
              const gradeColor = pick.grade === 'A+' ? 'text-yellow-300 border-yellow-400/50 bg-yellow-400/10'
                : pick.grade === 'A' ? 'text-emerald-300 border-emerald-400/50 bg-emerald-400/10'
                : 'text-blue-300 border-blue-400/50 bg-blue-400/10'

              return (
                <div
                  key={`${pick.matchLabel}-${pick.market}`}
                  className={cn(
                    'rounded-lg border p-3 space-y-2 transition-all',
                    isValue
                      ? 'border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_12px_rgba(52,211,153,0.15)]'
                      : 'border-border bg-card/50',
                    pick.grade === 'A+' && 'border-yellow-400/50 bg-yellow-400/5 shadow-[0_0_12px_rgba(250,204,21,0.12)]'
                  )}
                >
                  {/* Header: grade + market */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', gradeColor)}>
                        {pick.grade}
                      </span>
                      <span className="text-xs font-bold">{pick.market}</span>
                    </div>
                    {isValue && (
                      <span className="text-[10px] font-bold text-emerald-400 animate-pulse">VALUE</span>
                    )}
                  </div>

                  {/* Match */}
                  <div className="text-[11px] text-muted-foreground truncate">{pick.matchLabel}</div>

                  {/* Prob + Odds */}
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[10px] text-muted-foreground">Probabilidade</div>
                      <div className={cn(
                        'text-xl font-black tabular-nums',
                        pick.prob >= 0.78 ? 'text-emerald-400' :
                        pick.prob >= 0.65 ? 'text-amber-400' : 'text-foreground'
                      )}>
                        {Math.round(pick.prob * 100)}%
                      </div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div>
                        <span className="text-[10px] text-muted-foreground">Justa: </span>
                        <span className="text-sm font-bold tabular-nums text-blue-400">{pick.fairOdd}</span>
                      </div>
                      {pick.marketOdd && (
                        <div>
                          <span className="text-[10px] text-muted-foreground">
                            {pick.marketBk ? (BOOKMAKER_LABELS[pick.marketBk] ?? pick.marketBk) : 'Mercado'}:{' '}
                          </span>
                          <span className={cn('text-sm font-bold tabular-nums', isValue ? 'text-emerald-400' : 'text-foreground')}>
                            {pick.marketOdd.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* EV + Kelly */}
                  {pick.ev !== null && (
                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <span className={cn('text-xs font-bold tabular-nums', isValue ? 'text-emerald-400' : 'text-red-400')}>
                        EV {pick.ev > 0 ? '+' : ''}{(pick.ev * 100).toFixed(1)}%
                      </span>
                      {kelly !== null && kelly > 0 && (
                        <span className="text-xs text-amber-400 font-medium">
                          Apostar R$ {(bankroll * kelly).toFixed(0)}
                        </span>
                      )}
                    </div>
                  )}
                  {!pick.marketOdd && (
                    <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                      Aposte se odd do mercado {'>'} {pick.fairOdd}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── CARDS DOS JOGOS ── */}
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

          const calTier = getCalibrationTier(f.confidence)

          // Aposta de ouro: tier Alta/Elite + EV positivo no resultado previsto
          const predictedOdd = odds[predicted]
          const predictedProb = probs[predicted]
          const predictedEv = predictedOdd !== null ? calcEv(predictedProb, predictedOdd) : null
          const isGoldenBet =
            (calTier.highlight === 'hot' || calTier.highlight === 'good') &&
            predictedEv !== null && predictedEv > 0

          // Over 1.5 data
          const o15prob = f.over_15_prob ?? null
          const o15mkt = market?.odd_over15_market ?? null
          const o15ev = o15prob && o15mkt ? calcEv(o15prob, o15mkt) : null

          // Over 2.5 data
          const o25prob = f.over_25_prob ?? null
          const o25mkt = market?.odd_over25_market ?? null
          const o25ev = o25prob && o25mkt ? calcEv(o25prob, o25mkt) : null

          // BTTS data
          const bttsprob = f.btts_prob ?? null
          const bttsmkt = market?.odd_btts_yes ?? null
          const bttsev = bttsprob && bttsmkt ? calcEv(bttsprob, bttsmkt) : null

          return (
            <div
              key={f.match_id}
              className={cn(
                'rounded-lg border bg-card p-3 space-y-2 transition-all',
                isGoldenBet
                  ? 'border-yellow-400/60 bg-yellow-400/5 shadow-[0_0_16px_rgba(250,204,21,0.20)]'
                  : calTier.highlight === 'hot'
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-border'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{formatDate(f.match_date)}</span>
                <div className="flex items-center gap-2">
                  {isGoldenBet && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border bg-yellow-400/20 border-yellow-400/50 text-yellow-300 animate-pulse">
                      Ouro
                    </span>
                  )}
                  <HotBadge confidence={f.confidence} over15Prob={f.over_15_prob} />
                  <span className="text-xs text-muted-foreground">Rd {f.matchday}</span>
                </div>
              </div>

              {/* Times */}
              <div className="text-sm font-semibold text-center">
                {f.home_team} <span className="text-muted-foreground font-normal">vs</span> {f.away_team}
              </div>

              {/* Gols esperados */}
              {f.expected_goals_home != null && (
                <div className="space-y-2">
                  <div className="rounded-md bg-muted/40 px-3 py-2 flex items-center justify-center gap-2">
                    <span className="text-[10px] text-muted-foreground">xG</span>
                    <span className="text-2xl font-bold tabular-nums">{f.expected_goals_home?.toFixed(1)}</span>
                    <span className="text-muted-foreground">&ndash;</span>
                    <span className="text-2xl font-bold tabular-nums">{f.expected_goals_away?.toFixed(1)}</span>
                  </div>

                  {/* Cards Over 1.5, Over 2.5 e BTTS */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Over 1.5 */}
                    {o15prob && (
                      <GoalMarketCard
                        label="Over 1.5"
                        prob={o15prob}
                        fairOdd={parseFloat((1 / o15prob).toFixed(2))}
                        marketOdd={o15mkt}
                        marketBk={market?.best_over15_bk ?? null}
                        ev={o15ev}
                        hotThreshold={0.72}
                        warmThreshold={0.55}
                        bankroll={bankroll}
                      />
                    )}

                    {/* Over 2.5 */}
                    {o25prob && (
                      <GoalMarketCard
                        label="Over 2.5"
                        prob={o25prob}
                        fairOdd={parseFloat((1 / o25prob).toFixed(2))}
                        marketOdd={o25mkt}
                        marketBk={market?.best_over25_bk ?? null}
                        ev={o25ev}
                        hotThreshold={0.55}
                        warmThreshold={0.40}
                        bankroll={bankroll}
                      />
                    )}

                    {/* BTTS */}
                    {bttsprob && (
                      <GoalMarketCard
                        label="BTTS"
                        prob={bttsprob}
                        fairOdd={parseFloat((1 / bttsprob).toFixed(2))}
                        marketOdd={bttsmkt}
                        marketBk={market?.best_btts_yes_bk ?? null}
                        ev={bttsev}
                        hotThreshold={0.65}
                        warmThreshold={0.50}
                        bankroll={bankroll}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Odds grid 1X2 */}
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
                        <div className="text-xs text-muted-foreground">&mdash;</div>
                      )}
                      {isBestPick && (
                        <div className="text-[9px] text-blue-400">modelo</div>
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
          Nenhum jogo disponivel para a rodada {selectedRound}.
        </p>
      )}
    </div>
  )
}


// ── Componente reutilizavel para card de mercado de gols ──

interface GoalMarketCardProps {
  label: string
  prob: number
  fairOdd: number
  marketOdd: number | null
  marketBk: string | null
  ev: number | null
  hotThreshold: number
  warmThreshold: number
  bankroll: number
}

function GoalMarketCard({ label, prob, fairOdd, marketOdd, marketBk, ev, hotThreshold, warmThreshold, bankroll }: GoalMarketCardProps) {
  const isValue = ev !== null && ev > 0
  const kelly = isValue && marketOdd ? calcKelly(prob, marketOdd) : null
  const isHot = prob >= hotThreshold
  const isWarm = prob >= warmThreshold

  return (
    <div className={cn(
      'rounded-lg border p-2 space-y-1',
      isValue ? 'border-emerald-400/40 bg-emerald-500/10' :
      isHot ? 'border-emerald-500/30 bg-emerald-500/5' :
      'border-border bg-card'
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
        {isValue && <span className="text-[9px] text-emerald-400 font-bold">EV+</span>}
      </div>
      <div className={cn(
        'text-lg font-black tabular-nums text-center',
        isHot ? 'text-emerald-400' :
        isWarm ? 'text-amber-400' : 'text-foreground'
      )}>
        {Math.round(prob * 100)}%
      </div>
      <div className="text-center">
        <span className="text-[10px] text-muted-foreground">justa </span>
        <span className="text-xs font-bold tabular-nums">{fairOdd}</span>
      </div>
      {marketOdd && (
        <div className="text-center">
          <span className="text-[10px] text-muted-foreground">
            {marketBk ? (BOOKMAKER_LABELS[marketBk] ?? marketBk) : 'mkt'}{' '}
          </span>
          <span className={cn('text-xs font-bold tabular-nums', isValue ? 'text-emerald-400' : '')}>
            {marketOdd.toFixed(2)}
          </span>
        </div>
      )}
      {ev !== null && (
        <div className="text-center">
          <span className={cn('text-[10px] font-bold', isValue ? 'text-emerald-400' : 'text-red-400')}>
            EV {ev > 0 ? '+' : ''}{(ev * 100).toFixed(1)}%
          </span>
        </div>
      )}
      {kelly !== null && kelly > 0 && (
        <div className="text-center text-[10px] text-amber-400">
          R$ {(bankroll * kelly).toFixed(0)}
        </div>
      )}
    </div>
  )
}
