import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { RecentPrediction } from '@/types/api'
import { formatDate, resultLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  predictions: RecentPrediction[]
}

export function PredictionsTable({ predictions }: Props) {
  if (predictions.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12 text-sm">
        Nenhuma predição com resultado disponível.
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
            <TableHead className="text-center">Previsto</TableHead>
            <TableHead className="text-center">Real</TableHead>
            <TableHead className="text-center">Placar</TableHead>
            <TableHead className="text-center">Acerto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {predictions.map((p) => {
            const home = p.matches?.home_team?.name ?? '—'
            const away = p.matches?.away_team?.name ?? '—'
            const date = p.matches?.match_date
              ? formatDate(p.matches.match_date)
              : '—'
            const hg = p.matches?.home_goals
            const ag = p.matches?.away_goals

            return (
              <TableRow
                key={p.match_id}
                className={cn(
                  p.correct === true && 'bg-emerald-500/5',
                  p.correct === false && 'bg-red-500/5',
                )}
              >
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {date}
                </TableCell>
                <TableCell className="text-sm">
                  <span className="font-medium">{home}</span>
                  <span className="text-muted-foreground mx-1">x</span>
                  <span className="font-medium">{away}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-xs">
                    {resultLabel(p.predicted_result)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {p.actual_result ? (
                    <Badge variant="outline" className="text-xs">
                      {resultLabel(p.actual_result)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center text-sm tabular-nums">
                  {hg != null && ag != null ? `${hg} x ${ag}` : '—'}
                </TableCell>
                <TableCell className="text-center">
                  {p.correct === true && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                  )}
                  {p.correct === false && (
                    <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                  )}
                  {p.correct === null && (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
