'use client'

import { useState, useCallback } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
  pinnacle: 'Pinnacle',
  betfair_ex_eu: 'Betfair',
  matchbook: 'Matchbook',
  williamhill: 'William Hill',
  betsson: 'Betsson',
  marathonbet: 'Marathonbet',
  nordicbet: 'Nordicbet',
  unibet_nl: 'Unibet',
  unibet_fr: 'Unibet',
  unibet_se: 'Unibet',
  betonlineag: 'BetOnline',
  sport888: '888sport',
  betclic_fr: 'Betclic',
  winamax_fr: 'Winamax',
  winamax_de: 'Winamax',
  tipico_de: 'Tipico',
  onexbet: '1xBet',
  everygame: 'Everygame',
  coolbet: 'Coolbet',
  leovegas_se: 'LeoVegas',
  pmu_fr: 'PMU',
  gtbets: 'GTbets',
  codere_it: 'Codere',
}

function calcEv(prob: number, odd: number) {
  return prob * odd - 1
}

/**
 * Kelly Criterion: fração ideal da banca a apostar.
 * f = (prob × (odd - 1) - (1 - prob)) / (odd - 1)
 *   = (prob × odd - 1) / (odd - 1)
 * Usamos fração fracionária (half-Kelly = f/2) para ser mais conservador.
 */
function calcKelly(prob: number, odd: number, fraction = 0.5): number {
  const b = odd - 1
  const f = (prob * b - (1 - prob)) / b
  return Math.max(0, f * fraction)
}

// Normaliza removendo acentos, siglas e palavras genéricas para cruzar nomes
function normTeam(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\b(ec|sc|cr|ca|se|rb|fc|fbpa|af|fbc)\b/g, '') // remove siglas
    .replace(/[^a-z]/g, '') // remove não-letras
    .trim()
}

function findMarketOdd(fixture: Fixture, marketOdds: MarketOdds[]): MarketOdds | null {
  const fh = normTeam(fixture.home_team)
  const fa = normTeam(fixture.away_team)
  return (
    marketOdds.find((o) => {
      const oh = normTeam(o.home_team)
      const oa = normTeam(o.away_team)
      // match exato ou um contém o outro (ex: "gremio" vs "gremiofbpa")
      return (oh === fh || fh.includes(oh) || oh.includes(fh)) &&
             (oa === fa || fa.includes(oa) || oa.includes(fa))
    }) ?? null
  )
}

interface OddInputProps {
  defaultValue: string
  oddKey: string
  onCommit: (key: string, val: string) => void
}

function OddInput({ defaultValue, oddKey, onCommit }: OddInputProps) {
  const [local, setLocal] = useState(defaultValue)
  return (
    <input
      type="number"
      min="1.01"
      step="0.01"
      value={local}
      onChange={(e) => {
        setLocal(e.target.value)
        onCommit(oddKey, e.target.value)
      }}
      className={cn(
        'w-20 h-7 rounded border border-input bg-transparent px-2 text-center text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring',
        defaultValue && 'border-blue-500/40',
      )}
    />
  )
}

export function ValueBetsTable({ fixtures, marketOdds }: Props) {
  const [customOdds, setCustomOdds] = useState<Record<string, number | null>>({})
  const [onlyValue, setOnlyValue] = useState(false)
  const [bankroll, setBankroll] = useState<number>(1000)

  const handleCommit = useCallback((key: string, val: string) => {
    const num = parseFloat(val)
    setCustomOdds((prev) => ({ ...prev, [key]: !isNaN(num) && num > 1 ? num : null }))
  }, [])

  const rows = fixtures.flatMap((f) => {
    const market = findMarketOdd(f, marketOdds)
    return OUTCOMES.map((outcome) => {
      const prob = outcome === 'H' ? f.prob_home : outcome === 'D' ? f.prob_draw : f.prob_away
      const key = `${f.match_id}_${outcome}`
      const marketOdd =
        outcome === 'H' ? market?.odd_home : outcome === 'D' ? market?.odd_draw : market?.odd_away
      const bestBk =
        outcome === 'H' ? market?.best_home_bk : outcome === 'D' ? market?.best_draw_bk : market?.best_away_bk
      const effectiveOdd = customOdds[key] ?? marketOdd ?? null
      const evVal = effectiveOdd !== null ? calcEv(prob, effectiveOdd) : null
      const kellyFrac = effectiveOdd !== null && evVal !== null && evVal > 0
        ? calcKelly(prob, effectiveOdd)
        : null
      const kellySuggest = kellyFrac !== null ? bankroll * kellyFrac : null
      return { f, outcome, prob, key, market, marketOdd: marketOdd ?? null, bestBk: bestBk ?? null, effectiveOdd, evVal, kellyFrac, kellySuggest }
    })
  })

  const filtered = onlyValue ? rows.filter((r) => r.evVal !== null && r.evVal > 0) : rows
  const valueCount = rows.filter((r) => r.evVal !== null && r.evVal > 0).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground flex-1">
          Odds preenchidas automaticamente pelo mercado (campo azul).{' '}
          <span className="text-emerald-400">Verde = value bet.</span>
          {valueCount > 0 && (
            <span className="ml-2 font-medium text-emerald-400">{valueCount} value bets encontradas!</span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Banca (R$):</label>
          <input
            type="number"
            min="1"
            step="100"
            value={bankroll}
            onChange={(e) => setBankroll(parseFloat(e.target.value) || 1000)}
            className="w-24 h-7 rounded border border-input bg-transparent px-2 text-center text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOnlyValue((v) => !v)}
          className={cn('text-xs', onlyValue && 'border-emerald-500/40 text-emerald-400')}
        >
          {onlyValue ? 'Mostrar todos' : 'Só value bets'}
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Data</TableHead>
              <TableHead>Mandante</TableHead>
              <TableHead>Visitante</TableHead>
              <TableHead className="text-center">Resultado</TableHead>
              <TableHead className="text-center">Prob. Modelo</TableHead>
              <TableHead className="text-center">Odd Justa</TableHead>
              <TableHead className="text-center">Odd Mercado</TableHead>
              <TableHead className="text-center">Valor Esp.</TableHead>
              <TableHead className="text-center">Kelly (½)</TableHead>
              <TableHead className="text-center">Sinal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-10 text-sm">
                  {onlyValue
                    ? 'Nenhuma value bet encontrada.'
                    : 'Nenhum jogo disponível.'}
                </TableCell>
              </TableRow>
            )}
            {filtered.map(({ f, outcome, prob, key, market, marketOdd, bestBk, evVal, kellyFrac, kellySuggest }) => {
              const isValue = evVal !== null && evVal > 0
              const fairOdd = 1 / prob
              return (
                <TableRow
                  key={key}
                  className={cn(isValue && 'bg-emerald-500/5 hover:bg-emerald-500/10')}
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(f.match_date)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{f.home_team}</TableCell>
                  <TableCell className="text-sm">{f.away_team}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {OUTCOME_LABELS[outcome]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm tabular-nums">
                    {(prob * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-center text-sm tabular-nums font-medium text-blue-400">
                    {fairOdd.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <OddInput
                        oddKey={key}
                        defaultValue={marketOdd ? String(marketOdd.toFixed(2)) : ''}
                        onCommit={handleCommit}
                      />
                      {bestBk && (
                        <span className="text-[10px] text-muted-foreground">
                          {BOOKMAKER_LABELS[bestBk] ?? bestBk}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm tabular-nums font-medium">
                    {evVal !== null ? (
                      <span className={evVal > 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {evVal > 0 ? '+' : ''}
                        {(evVal * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-xs tabular-nums">
                    {kellySuggest !== null ? (
                      <div className="flex flex-col items-center">
                        <span className="text-amber-400 font-medium">
                          R$ {kellySuggest.toFixed(0)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {(kellyFrac! * 100).toFixed(1)}% banca
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {evVal !== null ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          isValue
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20',
                        )}
                      >
                        {isValue ? 'Value' : 'Sem valor'}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {`> ${fairOdd.toFixed(2)} p/ value`}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
