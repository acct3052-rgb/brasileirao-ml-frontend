'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

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

interface GameDetail {
  home_team: string
  away_team: string
  match_date: string
  predicted_result: string
  actual_result: string | null
  home_goals: number | null
  away_goals: number | null
  confidence: number
  correct: boolean
}

const RESULT_LABEL: Record<string, string> = { H: 'Casa', D: 'Empate', A: 'Visitante' }

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

function RoundDetail({ season, matchday, league }: { season: number; matchday: number; league: string }) {
  const [games, setGames] = useState<GameDetail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/api/accuracy/by-round/${season}/${matchday}?league=${league}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setGames(d.games) })
      .finally(() => setLoading(false))
  }, [season, matchday, league])

  if (loading) return (
    <div className="px-4 py-3 space-y-2">
      {[...Array(5)].map((_, i) => <div key={i} className="h-8 rounded bg-muted/30 animate-pulse" />)}
    </div>
  )

  if (games.length === 0) return (
    <div className="px-4 py-3 text-sm text-muted-foreground">Sem detalhes disponíveis.</div>
  )

  return (
    <div className="divide-y divide-border bg-muted/5">
      {games.map((g, i) => {
        const score = g.home_goals != null ? `${g.home_goals}–${g.away_goals}` : null
        const conf = g.confidence ? Math.round(g.confidence * 100) : null
        const tier = conf != null
          ? conf >= 70 ? 'Elite' : conf >= 60 ? 'Alta' : conf >= 50 ? 'Média' : 'Baixa'
          : null

        return (
          <div key={i} className={cn(
            'flex items-center gap-3 px-6 py-2.5 text-sm',
            g.correct ? 'bg-emerald-500/3' : 'bg-red-500/3'
          )}>
            {/* Resultado acerto/erro */}
            <span className={cn(
              'text-base font-bold w-5 text-center flex-shrink-0',
              g.correct ? 'text-emerald-400' : 'text-red-400'
            )}>
              {g.correct ? '✓' : '✗'}
            </span>

            {/* Times */}
            <span className={cn('flex-1 truncate', g.predicted_result === 'H' && g.correct && 'text-emerald-400')}>
              {g.home_team}
            </span>
            <span className="text-muted-foreground text-xs">vs</span>
            <span className={cn('flex-1 truncate', g.predicted_result === 'A' && g.correct && 'text-emerald-400')}>
              {g.away_team}
            </span>

            {/* Placar real */}
            <span className="tabular-nums font-bold text-center w-12 flex-shrink-0">
              {score ?? '—'}
            </span>

            {/* Previsto → Real */}
            <span className="text-xs text-muted-foreground w-28 text-center flex-shrink-0">
              prev: <span className={cn('font-semibold', g.correct ? 'text-emerald-400' : 'text-red-400')}>
                {RESULT_LABEL[g.predicted_result] ?? g.predicted_result}
              </span>
              {g.actual_result && g.actual_result !== g.predicted_result && (
                <> → <span className="text-foreground">{RESULT_LABEL[g.actual_result]}</span></>
              )}
            </span>

            {/* Confiança / tier */}
            {tier && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0',
                tier === 'Elite' ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' :
                tier === 'Alta'  ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' :
                tier === 'Média' ? 'text-amber-400 border-amber-500/20' :
                'text-muted-foreground border-border'
              )}>
                {tier} {conf}%
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function RoundAccuracy({ league = 'BSA' }: { league?: string }) {
  const [rounds, setRounds] = useState<RoundStat[]>([])
  const [loading, setLoading] = useState(true)
  const [season, setSeason] = useState<number | 'all'>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    const base = `${API_BASE}/api/accuracy/by-round?league=${league}`
    const url = season === 'all' ? base : `${base}&season=${season}`
    fetch(url, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setRounds(d.rounds) })
      .finally(() => setLoading(false))
  }, [season, league])

  const toggle = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const seasons = Array.from(new Set(rounds.map(r => r.season))).sort((a, b) => b - a)
  const filtered = season === 'all' ? rounds : rounds.filter(r => r.season === season)

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
      <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground w-8"></th>
              <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Temporada</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">Rodada</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">Acertos</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">Erros</th>
              <th className="px-4 py-2 text-xs font-medium text-muted-foreground">Acurácia</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">Confiança</th>
            </tr>
          </thead>
        </table>

        {filtered.map(r => {
          const key = `${r.season}-${r.matchday}`
          const isOpen = expanded.has(key)
          return (
            <div key={key}>
              <table className="w-full text-sm">
                <tbody>
                  <tr
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => toggle(key)}
                  >
                    <td className="px-4 py-2.5 w-8 text-muted-foreground">
                      {isOpen
                        ? <ChevronDown className="w-3.5 h-3.5" />
                        : <ChevronRight className="w-3.5 h-3.5" />}
                    </td>
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
                </tbody>
              </table>

              {isOpen && <RoundDetail season={r.season} matchday={r.matchday} league={league} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
