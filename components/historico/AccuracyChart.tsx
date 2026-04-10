'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { RecentPrediction } from '@/types/api'

interface Props {
  predictions: RecentPrediction[]
}

interface ChartPoint {
  rodada: number
  acuracia: number
  jogos: number
}

export function AccuracyChart({ predictions }: Props) {
  const data = useMemo<ChartPoint[]>(() => {
    const byMatchday = new Map<number, { correct: number; total: number }>()

    for (const p of predictions) {
      if (p.actual_result === null || p.correct === null) continue
      const date = new Date(p.matches.match_date)
      // Usa o mês/ano como proxy de rodada se matchday não disponível
      const key = date.getTime()
      const existing = byMatchday.get(key) ?? { correct: 0, total: 0 }
      existing.total++
      if (p.correct) existing.correct++
      byMatchday.set(key, existing)
    }

    return Array.from(byMatchday.entries())
      .sort(([a], [b]) => a - b)
      .map(([ts, { correct, total }], idx) => ({
        rodada: idx + 1,
        acuracia: Math.round((correct / total) * 100),
        jogos: total,
      }))
  }, [predictions])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Sem dados suficientes para exibir o gráfico.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="rodada"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          label={{
            value: 'Rodada',
            position: 'insideBottom',
            offset: -2,
            fontSize: 11,
            fill: 'hsl(var(--muted-foreground))',
          }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: 12,
          }}
          formatter={(value) => [`${value}%`, 'Acurácia']}
          labelFormatter={(label) => `Rodada ${label}`}
        />
        <Line
          type="monotone"
          dataKey="acuracia"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
