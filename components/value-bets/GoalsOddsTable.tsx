'use client'

import { useState, useCallback } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { MarketOdds } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  marketOdds: MarketOdds[]
}

const BOOKMAKER_LABELS: Record<string, string> = {
  pinnacle: 'Pinnacle', betfair_ex_eu: 'Betfair', matchbook: 'Matchbook',
  williamhill: 'W.Hill', betsson: 'Betsson', marathonbet: 'Marathonbet',
  nordicbet: 'Nordicbet', unibet_nl: 'Unibet', unibet_fr: 'Unibet', unibet_se: 'Unibet',
  betonlineag: 'BetOnline', sport888: '888sport', betclic_fr: 'Betclic',
  winamax_fr: 'Winamax', winamax_de: 'Winamax', tipico_de: 'Tipico',
  onexbet: '1xBet', everygame: 'Everygame', coolbet: 'Coolbet',
  leovegas_se: 'LeoVegas', pmu_fr: 'PMU', gtbets: 'GTbets', codere_it: 'Codere',
}

type Market = 'over15' | 'over25' | 'btts' | 'under25' | 'no_btts'

const MARKET_LABELS: Record<Market, string> = {
  over15:   'Over 1.5',
  over25:   'Over 2.5',
  under25:  'Under 2.5',
  btts:     'Ambos Marcam',
  no_btts:  'Não Ambos',
}

function calcEv(prob: number, odd: number) { return prob * odd - 1 }

interface OddInputProps {
  defaultValue: string
  oddKey: string
  onCommit: (key: string, val: string) => void
}

function OddInput({ defaultValue, oddKey, onCommit }: OddInputProps) {
  const [local, setLocal] = useState(defaultValue)
  return (
    <input
      type="number" min="1.01" step="0.01" value={local}
      onChange={(e) => { setLocal(e.target.value); onCommit(oddKey, e.target.value) }}
      className={cn(
        'w-20 h-7 rounded border border-input bg-transparent px-2 text-center text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring',
        defaultValue && 'border-blue-500/40',
      )}
    />
  )
}

export function GoalsOddsTable({ marketOdds }: Props) {
  const [customOdds, setCustomOdds] = useState<Record<string, number | null>>({})
  const [onlyValue, setOnlyValue] = useState(false)
  const [activeMarket, setActiveMarket] = useState<Market>('over25')

  const handleCommit = useCallback((key: string, val: string) => {
    const num = parseFloat(val)
    setCustomOdds((prev) => ({ ...prev, [key]: !isNaN(num) && num > 1 ? num : null }))
  }, [])

  const markets: Market[] = ['over15', 'over25', 'under25', 'btts', 'no_btts']

  const rows = marketOdds.map((o) => {
    const modelProb =
      activeMarket === 'over15'  ? o.model_over15 :
      activeMarket === 'over25'  ? o.model_over25 :
      activeMarket === 'under25' ? (o.model_over25 !== null ? 1 - o.model_over25 : null) :
      activeMarket === 'btts'    ? o.model_btts :
      activeMarket === 'no_btts' ? (o.model_btts !== null ? 1 - o.model_btts : null) : null

    const fairOdd =
      activeMarket === 'over15'  ? o.fair_over15 :
      activeMarket === 'over25'  ? o.fair_over25 :
      activeMarket === 'under25' ? o.fair_under25 :
      activeMarket === 'btts'    ? o.fair_btts :
      activeMarket === 'no_btts' ? o.fair_no_btts : null

    // Odd de mercado disponível (só over25/under25 vêm da API)
    const defaultMarketOdd =
      activeMarket === 'over25'  ? o.odd_over25_market :
      activeMarket === 'under25' ? o.odd_under25_market : null

    const marketBk =
      activeMarket === 'over25'  ? o.best_over25_bk :
      activeMarket === 'under25' ? o.best_under25_bk : null

    const key = `${o.home_team}_${o.away_team}_${activeMarket}`
    const effectiveOdd = customOdds[key] ?? defaultMarketOdd ?? null
    const evVal = modelProb && effectiveOdd ? calcEv(modelProb, effectiveOdd) : null
    const isValue = evVal !== null && evVal > 0

    return { o, modelProb, fairOdd, defaultMarketOdd, marketBk, key, effectiveOdd, evVal, isValue }
  })

  const filtered = onlyValue ? rows.filter((r) => r.isValue) : rows
  const valueCount = rows.filter((r) => r.isValue).length

  return (
    <div className="space-y-4">
      {/* Seletor de mercado */}
      <div className="flex items-center gap-2 flex-wrap">
        {markets.map((m) => (
          <Button
            key={m}
            size="sm"
            variant="outline"
            onClick={() => setActiveMarket(m)}
            className={cn(
              'text-xs',
              activeMarket === m && 'bg-primary/10 text-primary border-primary/30',
            )}
          >
            {MARKET_LABELS[m]}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {valueCount > 0 && (
            <span className="text-xs text-emerald-400 font-medium">{valueCount} value bets</span>
          )}
          <Button
            size="sm" variant="outline"
            onClick={() => setOnlyValue((v) => !v)}
            className={cn('text-xs', onlyValue && 'border-emerald-500/40 text-emerald-400')}
          >
            {onlyValue ? 'Mostrar todos' : 'Só value bets'}
          </Button>
        </div>
      </div>

      {(activeMarket === 'over15' || activeMarket === 'btts' || activeMarket === 'no_btts') && (
        <p className="text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2">
          Odds de mercado não disponíveis para este mercado via API. Insira manualmente para calcular value.
        </p>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Data</TableHead>
              <TableHead>Mandante</TableHead>
              <TableHead>Visitante</TableHead>
              <TableHead className="text-center">Prob. Modelo</TableHead>
              <TableHead className="text-center">Odd Justa</TableHead>
              <TableHead className="text-center">
                Odd Mercado
                {(activeMarket === 'over25' || activeMarket === 'under25') && (
                  <span className="text-[10px] text-muted-foreground ml-1">(editável)</span>
                )}
              </TableHead>
              <TableHead className="text-center">Valor Esp.</TableHead>
              <TableHead className="text-center">Sinal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10 text-sm">
                  {onlyValue ? 'Nenhuma value bet. Insira odds manualmente.' : 'Nenhum jogo disponível.'}
                </TableCell>
              </TableRow>
            )}
            {filtered.map(({ o, modelProb, fairOdd, defaultMarketOdd, marketBk, key, evVal, isValue }) => (
              <TableRow
                key={key}
                className={cn(isValue && 'bg-emerald-500/5 hover:bg-emerald-500/10')}
              >
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(o.commence_time)}
                </TableCell>
                <TableCell className="text-sm font-medium">{o.home_team}</TableCell>
                <TableCell className="text-sm">{o.away_team}</TableCell>
                <TableCell className="text-center text-sm tabular-nums">
                  {modelProb !== null ? `${(modelProb * 100).toFixed(1)}%` : '—'}
                </TableCell>
                <TableCell className="text-center text-sm tabular-nums font-medium text-blue-400">
                  {fairOdd ?? '—'}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <OddInput
                      oddKey={key}
                      defaultValue={defaultMarketOdd ? String(defaultMarketOdd.toFixed(2)) : ''}
                      onCommit={handleCommit}
                    />
                    {defaultMarketOdd && marketBk && (
                      <span className="text-[10px] text-muted-foreground">
                        {BOOKMAKER_LABELS[marketBk] ?? marketBk}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center text-sm tabular-nums font-medium">
                  {evVal !== null ? (
                    <span className={evVal > 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {evVal > 0 ? '+' : ''}{(evVal * 100).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {fairOdd ? `> ${fairOdd} p/ value` : '—'}
                    </span>
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
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
