import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ProbabilityBar } from './ProbabilityBar'
import type { Fixture } from '@/types/api'
import { confidenceLevel, formatDate, resultLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  fixtures: Fixture[]
}

const confidenceBadgeStyle: Record<string, string> = {
  Alta: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Média: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Baixa: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export function FixturesTable({ fixtures }: Props) {
  if (fixtures.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12 text-sm">
        Nenhum jogo previsto disponível no momento.
      </p>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8 text-center">Rd</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Mandante</TableHead>
            <TableHead>Visitante</TableHead>
            <TableHead>Probabilidades</TableHead>
            <TableHead>Previsto</TableHead>
            <TableHead className="text-center">Gols Esp.</TableHead>
            <TableHead className="text-center">Over 2.5</TableHead>
            <TableHead className="text-center">Confiança</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fixtures.map((f) => {
            const level = confidenceLevel(f.confidence)
            const result = resultLabel(f.predicted_result)
            return (
              <TableRow key={f.match_id}>
                <TableCell className="text-center text-muted-foreground text-xs">
                  {f.matchday}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(f.match_date)}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'font-medium text-sm',
                      f.predicted_result === 'H' && 'text-blue-400',
                    )}
                  >
                    {f.home_team}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'font-medium text-sm',
                      f.predicted_result === 'A' && 'text-orange-400',
                    )}
                  >
                    {f.away_team}
                  </span>
                </TableCell>
                <TableCell>
                  <ProbabilityBar
                    probHome={f.prob_home}
                    probDraw={f.prob_draw}
                    probAway={f.prob_away}
                    predicted={f.predicted_result}
                  />
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      f.predicted_result === 'H' && 'text-blue-400',
                      f.predicted_result === 'D' && 'text-zinc-300',
                      f.predicted_result === 'A' && 'text-orange-400',
                    )}
                  >
                    {result}
                  </span>
                </TableCell>
                <TableCell className="text-center text-sm tabular-nums">
                  {f.expected_goals_home?.toFixed(1) ?? '—'}{' '}
                  <span className="text-muted-foreground">x</span>{' '}
                  {f.expected_goals_away?.toFixed(1) ?? '—'}
                </TableCell>
                <TableCell className="text-center text-sm tabular-nums">
                  {f.over_25_prob != null ? Math.round(f.over_25_prob * 100) + '%' : '—'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={cn('text-xs', confidenceBadgeStyle[level])}
                  >
                    {level}
                  </Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
