'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

interface RoundStat {
  season: number
  matchday: number
  total: number
  correct: number
  wrong: number
  accuracy_pct: number
  avg_confidence: number
  round_date: string
}

function AccuracyBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            pct >= 60 ? 'bg-emerald-500' :
            pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn(
        'text-xs font-bold tabular-nums w-10 text-right',
        pct >= 60 ? 'text-emerald-400' :
        pct >= 40 ? 'text-amber-400' : 'text-red-400'
      )}>
        {pct.toFixed(0)}%
      </span>
    </div>
  )
}

export function RoundAccuracy() {
  const [rounds, setRounds] = useState<RoundStat[]>([])
  const [loading, setLoading] = useState(true)
  const [season, setSeason] = useState<number | 'all'>('all')

  useEffect(() => {
    setLoading(true)
    const url = season === 'all'
      ? `${API_BASE}/api/accuracy/by-round`
      : `${API_BASE}/api/accuracy/by-round?season=${season}`
    fetch(url, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setRounds(d.rounds) })
      .finally(() => setLoading(false))
  }, [season])

  const seasons = Array.from(new Set(rounds.map(r => r.season))).sort((a, b) => b - a)
  const filtered = season === 'all' ? rounds : rounds.filter(r => r.season === season)

  // Totais gerais
  const totalJogos = filtered.reduce((s, r) => s + r.total, 0)
  const totalAcertos = filtered.reduce((s, r) => s + r.correct, 0)
  const avgAcc = totalJogos > 0 ? (totalAcertos / totalJogos) * 100 : 0
  const bestRound = filtered.reduce((best, r) => r.accuracy_pct > (best?.accuracy_pct ?? 0) ? r : best, filtered[0])

  if (loading) return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" />
      ))}
    </div>
  )

  if (rounds.length === 0) return (
    <p className="text-sm text-muted-foreground text-center py-10">
      Nenhuma rodada com resultado disponível.
    </p>
  )

  return (
    <div className="space-y-4">
      {/* Filtro de temporada */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSeason('all')}
          className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors',
            season === 'all' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          Todas
        </button>
        {seasons.map(s => (
          <button
            key={s}
            onClick={() => setSeason(s)}
            className={cn('px-3 py-1 rounded-md text-xs font-medium transition-colors',
              season === s ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <div className="text-2xl font-bold">{totalAcertos}/{totalJogos}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Acertos totais</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <div className={cn('text-2xl font-bold',
            avgAcc >= 60 ? 'text-emerald-400' : avgAcc >= 40 ? 'text-amber-400' : 'text-red-400'
          )}>
            {avgAcc.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Acurácia média</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {bestRound ? `Rd ${bestRound.matchday}` : '—'}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Melhor rodada {bestRound ? `(${bestRound.accuracy_pct.toFixed(0)}%)` : ''}
          </div>
        </div>
      </div>

      {/* Tabela por rodada */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Temporada</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">Rodada</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">Acertos</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">Erros</th>
              <th className="px-4 py-2 text-xs font-medium text-muted-foreground">Acurácia</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">Confiança</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(r => (
              <tr key={`${r.season}-${r.matchday}`} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 text-muted-foreground">{r.season}</td>
                <td className="px-4 py-2.5 text-center font-medium">Rd {r.matchday}</td>
                <td className="px-4 py-2.5 text-center text-emerald-400 font-semibold">{r.correct}</td>
                <td className="px-4 py-2.5 text-center text-red-400">{r.wrong}</td>
                <td className="px-4 py-2.5 min-w-[140px]">
                  <AccuracyBar pct={r.accuracy_pct} />
                </td>
                <td className="px-4 py-2.5 text-center text-muted-foreground text-xs">
                  {(r.avg_confidence * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
