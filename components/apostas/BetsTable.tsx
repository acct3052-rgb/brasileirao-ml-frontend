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

const OUTCOME_LABELS = { H: 'Casa', D: 'Empate', A: 'Visitante' } as const

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
            <TableHead>Jogo</TableHead>
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
            const pl =
              bet.status === 'won'
                ? bet.stake * bet.odd - bet.stake
                : bet.status === 'lost'
                ? -bet.stake
                : null
            const matchesPick = bet.bet_outcome === bet.model_pick

            return (
              <TableRow
                key={bet.id}
                className={cn(
                  bet.status === 'won' && 'bg-emerald-500/5 hover:bg-emerald-500/10',
                  bet.status === 'lost' && 'bg-red-500/5 hover:bg-red-500/10',
                )}
              >
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(bet.matches?.match_date ?? bet.created_at)}
                </TableCell>
                <TableCell className="text-sm">
                  <span className="font-medium">{bet.matches?.home_team?.name}</span>
                  <span className="text-muted-foreground mx-1">x</span>
                  <span>{bet.matches?.away_team?.name}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-xs">
                    {OUTCOME_LABELS[bet.bet_outcome]}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      matchesPick ? 'text-emerald-400' : 'text-orange-400',
                    )}
                  >
                    {bet.model_pick ? OUTCOME_LABELS[bet.model_pick] : '—'}
                    {matchesPick ? ' ✓' : ' ✗'}
                  </span>
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
