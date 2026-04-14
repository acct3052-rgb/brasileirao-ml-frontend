'use client'

import { useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Bet } from '@/types/api'
import { formatDate } from '@/lib/utils'
import { deleteBet } from '@/lib/api'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  bets: Bet[]
}

const OUTCOME_LABELS: Record<string, string> = {
  H: 'Casa',
  D: 'Empate',
  A: 'Visitante',
  over_15: 'Over 1.5',
  over_25: 'Over 2.5',
  btts: 'Ambos marcam',
  combo: 'Múltipla',
}

const MARKET_LABELS: Record<string, string> = {
  result: '1X2',
  over_15: 'Over 1.5',
  over_25: 'Over 2.5',
  btts: 'BTTS',
  combo: 'Múltipla',
}

const statusStyle = {
  pending: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  won:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  lost:    'bg-red-500/10 text-red-400 border-red-500/20',
} as const

const statusLabel = { pending: 'Pendente', won: 'Acertou', lost: 'Errou' } as const

export function BetsTable({ bets }: Props) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    await deleteBet(id)
    router.refresh()
  }

  if (bets.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12 text-sm">
        Nenhuma aposta registrada ainda.
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Data</TableHead>
            <TableHead>Jogo / Descrição</TableHead>
            <TableHead className="text-center">Mercado</TableHead>
            <TableHead className="text-center">Apostei</TableHead>
            <TableHead className="text-center">Modelo</TableHead>
            <TableHead className="text-center">Odd</TableHead>
            <TableHead className="text-center">Stake</TableHead>
            <TableHead className="text-center">Resultado</TableHead>
            <TableHead className="text-center">Lucro</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {bets.map((bet) => {
            const isCombo = (bet as any).is_combo
            const market: string = (bet as any).market ?? 'result'
            const comboDesc: string | null = (bet as any).combo_description ?? null

            const pl =
              bet.status === 'won'
                ? bet.stake * bet.odd - bet.stake
                : bet.status === 'lost'
                ? -bet.stake
                : null

            const matchesPick = market === 'result' && bet.bet_outcome === bet.model_pick

            // Linha do jogo
            const matchLine = isCombo
              ? (comboDesc ?? 'Múltipla')
              : bet.matches
              ? `${bet.matches.home_team?.name} x ${bet.matches.away_team?.name}`
              : '—'

            const dateLine = bet.matches?.match_date ?? (bet as any).created_at

            return (
              <TableRow
                key={bet.id}
                className={cn(
                  bet.status === 'won' && 'bg-emerald-500/5 hover:bg-emerald-500/10',
                  bet.status === 'lost' && 'bg-red-500/5 hover:bg-red-500/10',
                )}
              >
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(dateLine)}
                </TableCell>
                <TableCell className="text-sm max-w-[200px]">
                  <span className={cn('truncate block', isCombo && 'text-xs text-muted-foreground')}>
                    {matchLine}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-[10px]">
                    {MARKET_LABELS[market] ?? market}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-xs">
                    {OUTCOME_LABELS[bet.bet_outcome] ?? bet.bet_outcome}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {market === 'result' ? (
                    <span className={cn('text-xs font-medium', matchesPick ? 'text-emerald-400' : 'text-orange-400')}>
                      {bet.model_pick ? (OUTCOME_LABELS[bet.model_pick] ?? bet.model_pick) : '—'}
                      {bet.model_pick ? (matchesPick ? ' ✓' : ' ✗') : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {bet.model_prob != null ? `${Math.round(bet.model_prob * 100)}%` : '—'}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-center text-sm tabular-nums">
                  {Number(bet.odd).toFixed(2)}
                </TableCell>
                <TableCell className="text-center text-sm tabular-nums">
                  R$ {Number(bet.stake).toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={cn('text-xs', statusStyle[bet.status])}>
                    {statusLabel[bet.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-sm tabular-nums font-medium">
                  {pl !== null ? (
                    <span className={pl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {pl >= 0 ? '+' : ''}R$ {pl.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(bet.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
