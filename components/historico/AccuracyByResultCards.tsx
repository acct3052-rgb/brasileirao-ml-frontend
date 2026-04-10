import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RecentPrediction } from '@/types/api'

interface Props {
  predictions: RecentPrediction[]
}

function calcAccuracy(preds: RecentPrediction[], type: 'H' | 'D' | 'A') {
  const filtered = preds.filter(
    (p) => p.actual_result === type && p.correct !== null,
  )
  if (filtered.length === 0) return null
  const correct = filtered.filter((p) => p.correct).length
  return Math.round((correct / filtered.length) * 100)
}

export function AccuracyByResultCards({ predictions }: Props) {
  const items = [
    { label: 'Vitória Mandante', type: 'H' as const, color: 'text-blue-400' },
    { label: 'Empate', type: 'D' as const, color: 'text-zinc-300' },
    { label: 'Vitória Visitante', type: 'A' as const, color: 'text-orange-400' },
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map(({ label, type, color }) => {
        const acc = calcAccuracy(predictions, type)
        const count = predictions.filter((p) => p.actual_result === type).length
        return (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-xs font-medium ${color}`}>
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {acc != null ? `${acc}%` : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {count} jogos
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
