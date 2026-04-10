import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AccuracyResponse, Fixture } from '@/types/api'
import { formatDate } from '@/lib/utils'
import { Target, TrendingUp, Zap, CalendarClock } from 'lucide-react'

interface Props {
  accuracy: AccuracyResponse | null
  fixtures: Fixture[]
}

export function MetricCards({ accuracy, fixtures }: Props) {
  const avgConfidence =
    fixtures.length > 0
      ? fixtures.reduce((sum, f) => sum + f.confidence, 0) / fixtures.length
      : null

  const nextMatch = fixtures[0]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Total de Predições
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {accuracy?.total_predictions ?? '—'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Acurácia Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {accuracy?.accuracy_pct != null
              ? `${accuracy.accuracy_pct.toFixed(1)}%`
              : '—'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Confiança Média
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {avgConfidence != null
              ? `${Math.round(avgConfidence * 100)}%`
              : '—'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            Próximo Jogo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-semibold leading-tight">
            {nextMatch
              ? `${nextMatch.home_team} x ${nextMatch.away_team}`
              : '—'}
          </p>
          {nextMatch && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(nextMatch.match_date)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
