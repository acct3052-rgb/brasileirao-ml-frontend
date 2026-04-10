import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BetMetrics } from '@/types/api'
import { TrendingUp, TrendingDown, Target, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  metrics: BetMetrics
}

export function BetsMetrics({ metrics }: Props) {
  const plPositive = metrics.profit_loss >= 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Apostas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{metrics.total_bets}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {metrics.won}W · {metrics.lost}L · {metrics.pending} pendentes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            {plPositive ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            )}
            Lucro / Prejuízo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn('text-2xl font-bold', plPositive ? 'text-emerald-400' : 'text-red-400')}>
            {plPositive ? '+' : ''}R$ {metrics.profit_loss.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Investido: R$ {metrics.total_stake.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            ROI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={cn(
            'text-2xl font-bold',
            metrics.roi_pct === null ? 'text-foreground' :
            metrics.roi_pct >= 0 ? 'text-emerald-400' : 'text-red-400'
          )}>
            {metrics.roi_pct !== null ? `${metrics.roi_pct > 0 ? '+' : ''}${metrics.roi_pct.toFixed(1)}%` : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">sobre apostas resolvidas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" />
            Acordo com Modelo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {metrics.model_agreement_pct !== null ? `${metrics.model_agreement_pct.toFixed(0)}%` : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">das apostas batem com a predição</p>
        </CardContent>
      </Card>
    </div>
  )
}
