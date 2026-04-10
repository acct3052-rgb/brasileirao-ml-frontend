'use client'

import { useState } from 'react'
import type { Bet } from '@/types/api'
import { cn } from '@/lib/utils'

interface Props {
  bets: Bet[]
}

function calcKelly(prob: number, odd: number, fraction = 0.5): number {
  if (!prob || !odd || odd <= 1) return 0
  const b = odd - 1
  const f = (prob * b - (1 - prob)) / b
  return Math.max(0, f * fraction)
}

type Mode = 'flat' | 'kelly' | 'real'

const MODE_LABELS: Record<Mode, string> = {
  flat: 'Flat stake',
  kelly: 'Half-Kelly',
  real: 'Real (suas apostas)',
}

const MODE_COLORS: Record<Mode, string> = {
  flat: '#60a5fa',   // blue-400
  kelly: '#f59e0b',  // amber-400
  real: '#34d399',   // emerald-400
}

export function BankrollSimulator({ bets }: Props) {
  const [initialBankroll, setInitialBankroll] = useState(1000)
  const [flatStake, setFlatStake] = useState(50)
  const [activeModes, setActiveModes] = useState<Set<Mode>>(new Set<Mode>(['flat', 'kelly', 'real']))

  const toggleMode = (mode: Mode) => {
    setActiveModes((prev) => {
      const next = new Set(prev)
      if (next.has(mode)) { if (next.size > 1) next.delete(mode) }
      else next.add(mode)
      return next
    })
  }

  // Apenas apostas resolvidas, em ordem cronológica
  const resolved = bets
    .filter((b) => b.status === 'won' || b.status === 'lost')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  if (resolved.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
        Registre apostas e resolva-as para ver a simulação de banca.
      </div>
    )
  }

  // Simula as três estratégias
  function simulate(mode: Mode): number[] {
    let bankroll = initialBankroll
    const points = [bankroll]
    for (const bet of resolved) {
      const won = bet.status === 'won'
      const odd = Number(bet.odd)
      const prob = Number(bet.model_prob ?? 0.33)

      let stake: number
      if (mode === 'flat') {
        stake = Math.min(flatStake, bankroll)
      } else if (mode === 'kelly') {
        const k = calcKelly(prob, odd)
        stake = Math.min(bankroll * k, bankroll)
      } else {
        stake = Math.min(Number(bet.stake), bankroll)
      }

      bankroll += won ? stake * (odd - 1) : -stake
      bankroll = Math.max(0, bankroll)
      points.push(bankroll)
    }
    return points
  }

  const series: Record<Mode, number[]> = {
    flat: simulate('flat'),
    kelly: simulate('kelly'),
    real: simulate('real'),
  }

  // Escala do gráfico
  const allValues = Object.values(series).flat()
  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)
  const range = maxVal - minVal || 1

  const W = 600
  const H = 200
  const PAD_L = 60
  const PAD_R = 16
  const PAD_T = 16
  const PAD_B = 32
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B
  const n = resolved.length + 1

  function toSvgX(i: number) { return PAD_L + (i / (n - 1)) * chartW }
  function toSvgY(v: number) { return PAD_T + chartH - ((v - minVal) / range) * chartH }

  function makePath(points: number[]) {
    return points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(i).toFixed(1)} ${toSvgY(v).toFixed(1)}`).join(' ')
  }

  // Eixo Y: 5 marcas
  const yTicks = Array.from({ length: 5 }, (_, i) => minVal + (range / 4) * i)

  const finalReal = series.real[series.real.length - 1]
  const finalFlat = series.flat[series.flat.length - 1]
  const finalKelly = series.kelly[series.kelly.length - 1]

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Banca inicial (R$):</label>
          <input
            type="number" min="100" step="100" value={initialBankroll}
            onChange={(e) => setInitialBankroll(parseFloat(e.target.value) || 1000)}
            className="w-24 h-7 rounded border border-input bg-transparent px-2 text-center text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Flat stake (R$):</label>
          <input
            type="number" min="1" step="10" value={flatStake}
            onChange={(e) => setFlatStake(parseFloat(e.target.value) || 50)}
            className="w-20 h-7 rounded border border-input bg-transparent px-2 text-center text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1 ml-auto">
          {(Object.keys(MODE_LABELS) as Mode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => toggleMode(mode)}
              className={cn(
                'text-xs h-7 px-3 rounded border transition-colors',
                activeModes.has(mode)
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
              style={activeModes.has(mode) ? { borderColor: MODE_COLORS[mode], color: MODE_COLORS[mode], background: MODE_COLORS[mode] + '18' } : {}}
            >
              {MODE_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico SVG */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minHeight: 160 }}>
          {/* Grid */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line
                x1={PAD_L} x2={W - PAD_R}
                y1={toSvgY(v)} y2={toSvgY(v)}
                stroke="currentColor" strokeOpacity={0.08} strokeWidth={1}
              />
              <text
                x={PAD_L - 6} y={toSvgY(v)}
                textAnchor="end" dominantBaseline="middle"
                fontSize={9} fill="currentColor" fillOpacity={0.5}
              >
                {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
              </text>
            </g>
          ))}

          {/* Eixo X: rodadas */}
          <text x={PAD_L} y={H - 6} fontSize={9} fill="currentColor" fillOpacity={0.4} textAnchor="middle">0</text>
          <text x={W - PAD_R} y={H - 6} fontSize={9} fill="currentColor" fillOpacity={0.4} textAnchor="middle">
            {resolved.length}
          </text>
          <text x={(PAD_L + W - PAD_R) / 2} y={H - 6} fontSize={9} fill="currentColor" fillOpacity={0.4} textAnchor="middle">
            apostas
          </text>

          {/* Linha de banca inicial */}
          <line
            x1={PAD_L} x2={W - PAD_R}
            y1={toSvgY(initialBankroll)} y2={toSvgY(initialBankroll)}
            stroke="currentColor" strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 3"
          />

          {/* Séries */}
          {(Object.keys(series) as Mode[]).filter((m) => activeModes.has(m)).map((mode) => (
            <path
              key={mode}
              d={makePath(series[mode])}
              fill="none"
              stroke={MODE_COLORS[mode]}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </svg>
      </div>

      {/* Resumo final */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(MODE_LABELS) as Mode[]).map((mode) => {
          const final = mode === 'real' ? finalReal : mode === 'flat' ? finalFlat : finalKelly
          const pl = final - initialBankroll
          const roi = (pl / initialBankroll) * 100
          return (
            <div key={mode} className="rounded-lg border border-border p-3 text-center space-y-1">
              <p className="text-[10px] text-muted-foreground">{MODE_LABELS[mode]}</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: MODE_COLORS[mode] }}>
                R$ {final.toFixed(0)}
              </p>
              <p className={cn('text-xs tabular-nums', pl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {pl >= 0 ? '+' : ''}R$ {pl.toFixed(0)} ({roi > 0 ? '+' : ''}{roi.toFixed(1)}%)
              </p>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Half-Kelly usa probabilidade do modelo para calcular a fração ótima de banca (f/2 para ser conservador).
        Apenas apostas resolvidas ({resolved.length}) são incluídas.
      </p>
    </div>
  )
}
