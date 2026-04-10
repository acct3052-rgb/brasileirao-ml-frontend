'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

interface Match {
  match_date: string
  matchday: number
  venue: 'home' | 'away'
  opponent: string
  team_goals: number
  opp_goals: number
  pts: number
  result: string
}

interface Stats {
  jogos: number
  pts: number
  pts_pj: number
  gf: number
  ga: number
  gf_pj: number
  ga_pj: number
  wins: number
  draws: number
  losses: number
}

interface Upcoming {
  match_id: number
  match_date: string
  home_team: string
  away_team: string
  prob_home: number
  prob_draw: number
  prob_away: number
  predicted_result: string
  expected_goals_home: number | null
  expected_goals_away: number | null
  over_25_prob: number | null
}

interface Profile {
  team: { id: number; name: string }
  season: number
  recent_matches: Match[]
  upcoming: Upcoming[]
  stats_overall: Stats
  stats_home: Stats
  stats_away: Stats
  features: Record<string, number | null> | null
}

const OUTCOME_LABELS = { H: 'Casa', D: 'Empate', A: 'Visitante' } as const

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center space-y-0.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

function FormDots({ matches }: { matches: Match[] }) {
  const last5 = [...matches].slice(0, 5).reverse()
  return (
    <div className="flex gap-1">
      {last5.map((m, i) => (
        <span
          key={i}
          title={`${m.team_goals}–${m.opp_goals} vs ${m.opponent}`}
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold',
            m.pts === 3 ? 'bg-emerald-500/20 text-emerald-400' :
            m.pts === 1 ? 'bg-amber-500/20 text-amber-400' :
            'bg-red-500/20 text-red-400'
          )}
        >
          {m.pts === 3 ? 'V' : m.pts === 1 ? 'E' : 'D'}
        </span>
      ))}
    </div>
  )
}

function StatsRow({ label, stats }: { label: string; stats: Stats }) {
  if (stats.jogos === 0) return null
  const winPct = Math.round((stats.wins / stats.jogos) * 100)
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="grid grid-cols-4 gap-2 text-center text-sm">
        <div>
          <p className="font-bold">{stats.jogos}</p>
          <p className="text-[10px] text-muted-foreground">Jogos</p>
        </div>
        <div>
          <p className="font-bold">{stats.wins}V/{stats.draws}E/{stats.losses}D</p>
          <p className="text-[10px] text-muted-foreground">Resultado ({winPct}% V)</p>
        </div>
        <div>
          <p className="font-bold">{stats.gf_pj?.toFixed(1)}</p>
          <p className="text-[10px] text-muted-foreground">Gols/jogo</p>
        </div>
        <div>
          <p className={cn('font-bold', stats.pts_pj >= 2 ? 'text-emerald-400' : stats.pts_pj >= 1.2 ? 'text-amber-400' : 'text-red-400')}>
            {stats.pts_pj?.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground">Pts/jogo</p>
        </div>
      </div>
    </div>
  )
}

export function TeamProfile({ teamName }: { teamName: string }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch(`${API_BASE}/api/teams/${encodeURIComponent(teamName)}/profile`, { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then(setProfile)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [teamName])

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-muted/40" />
        ))}
      </div>
    )
  }
  if (error || !profile) {
    return <p className="text-sm text-red-400">Erro ao carregar perfil. Verifique se a API está online.</p>
  }

  const { recent_matches, upcoming, stats_overall, stats_home, stats_away, features } = profile

  return (
    <div className="space-y-6">
      {/* Forma recente */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Forma Recente</h3>
        {recent_matches.length > 0 ? (
          <>
            <FormDots matches={recent_matches} />
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Data</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Adversário</th>
                    <th className="text-center px-3 py-2 text-muted-foreground font-medium">Mando</th>
                    <th className="text-center px-3 py-2 text-muted-foreground font-medium">Placar</th>
                    <th className="text-center px-3 py-2 text-muted-foreground font-medium">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_matches.map((m, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-2 text-muted-foreground">{formatDate(m.match_date)}</td>
                      <td className="px-3 py-2">{m.opponent}</td>
                      <td className="px-3 py-2 text-center text-muted-foreground">
                        {m.venue === 'home' ? 'Casa' : 'Fora'}
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-semibold">
                        {m.team_goals}–{m.opp_goals}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={cn(
                          'font-bold',
                          m.pts === 3 ? 'text-emerald-400' : m.pts === 1 ? 'text-amber-400' : 'text-red-400'
                        )}>
                          {m.pts}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma partida disputada nesta temporada.</p>
        )}
      </section>

      {/* Estatísticas */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Estatísticas da Temporada</h3>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Jogos" value={stats_overall.jogos} />
          <StatCard label="Pts/Jogo" value={stats_overall.pts_pj?.toFixed(2) ?? '—'} />
          <StatCard label="Saldo de Gols" value={`${stats_overall.gf}–${stats_overall.ga}`} sub={`${stats_overall.gf_pj?.toFixed(1)} GF · ${stats_overall.ga_pj?.toFixed(1)} GA`} />
        </div>
        <div className="rounded-lg border border-border p-4 space-y-4 divide-y divide-border">
          <StatsRow label="Geral" stats={stats_overall} />
          <div className="pt-4"><StatsRow label="Como Mandante" stats={stats_home} /></div>
          <div className="pt-4"><StatsRow label="Como Visitante" stats={stats_away} /></div>
        </div>
      </section>

      {/* xG do modelo */}
      {features && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Métricas do Modelo (features atuais)</h3>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="xG Médio (casa)"
              value={features.home_avg_xg ? Number(features.home_avg_xg).toFixed(2) : '—'}
              sub="gols esperados"
            />
            <StatCard
              label="xGA Médio (casa)"
              value={features.home_avg_xga ? Number(features.home_avg_xga).toFixed(2) : '—'}
              sub="gols sofridos"
            />
            <StatCard
              label="Posição Tabela"
              value={features.home_table_pos ?? '—'}
              sub={features.home_table_pts ? `${features.home_table_pts} pts` : undefined}
            />
          </div>
        </section>
      )}

      {/* Próximos jogos */}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Próximos Jogos</h3>
          <div className="space-y-2">
            {upcoming.map((u) => {
              const isHome = u.home_team === profile.team.name
              const teamProb = isHome ? u.prob_home : u.prob_away
              const opponent = isHome ? u.away_team : u.home_team
              const pred = u.predicted_result
              const modelFavorsTeam = (isHome && pred === 'H') || (!isHome && pred === 'A')
              return (
                <div key={u.match_id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{formatDate(u.match_date)}</span>
                    <span className="text-xs text-muted-foreground">{isHome ? 'Casa' : 'Fora'}</span>
                  </div>
                  <p className="text-sm font-medium mt-1">vs {opponent}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs">
                      Prob: <span className={cn('font-bold', modelFavorsTeam ? 'text-emerald-400' : 'text-muted-foreground')}>
                        {(teamProb * 100).toFixed(0)}%
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Modelo: <span className="font-medium">{OUTCOME_LABELS[pred as 'H' | 'D' | 'A'] ?? pred}</span>
                      {modelFavorsTeam ? ' ✓' : ''}
                    </span>
                    {u.expected_goals_home != null && (
                      <span className="text-xs text-muted-foreground">
                        xG: {isHome ? u.expected_goals_home?.toFixed(1) : u.expected_goals_away?.toFixed(1)}–
                        {isHome ? u.expected_goals_away?.toFixed(1) : u.expected_goals_home?.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
