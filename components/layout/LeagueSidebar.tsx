'use client'

import { useLeague, LeagueMeta } from '@/lib/league-context'
import { cn } from '@/lib/utils'

// Ligas definidas no cliente — sincronizado com LEAGUES_META do backend
const ALL_LEAGUES: LeagueMeta[] = [
  { code: 'BSA', name: 'Brasileirão Série A', flag: '🇧🇷', active: true,  has_model: true  },
  { code: 'BSB', name: 'Brasileirão Série B', flag: '🇧🇷', active: false, has_model: false },
  { code: 'PL',  name: 'Premier League',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', active: true,  has_model: false },
  { code: 'PD',  name: 'La Liga',             flag: '🇪🇸', active: false, has_model: false },
  { code: 'SA',  name: 'Serie A',             flag: '🇮🇹', active: false, has_model: false },
  { code: 'FL1', name: 'Ligue 1',             flag: '🇫🇷', active: false, has_model: false },
  { code: 'BL1', name: 'Bundesliga',          flag: '🇩🇪', active: false, has_model: false },
  { code: 'CL',  name: 'Champions League',    flag: '🏆',  active: false, has_model: false },
  { code: 'DED', name: 'Eredivisie',          flag: '🇳🇱', active: false, has_model: false },
  { code: 'PPL', name: 'Primeira Liga',       flag: '🇵🇹', active: false, has_model: false },
  { code: 'ELC', name: 'Championship',        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', active: false, has_model: false },
]

export function LeagueSidebar() {
  const { league, setLeague } = useLeague()

  const active   = ALL_LEAGUES.filter((l) => l.active)
  const inactive = ALL_LEAGUES.filter((l) => !l.active)

  return (
    <aside className="w-56 flex-shrink-0 hidden lg:flex flex-col gap-1 pt-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1">
        Ligas
      </p>

      {active.map((l) => (
        <LeagueItem key={l.code} league={l} selected={league === l.code} onSelect={setLeague} />
      ))}

      {inactive.length > 0 && (
        <>
          <div className="border-t border-border my-2" />
          <p className="text-[10px] text-muted-foreground px-2 mb-1">Em breve</p>
          {inactive.map((l) => (
            <LeagueItem key={l.code} league={l} selected={false} onSelect={() => {}} disabled />
          ))}
        </>
      )}
    </aside>
  )
}

function LeagueItem({
  league,
  selected,
  onSelect,
  disabled = false,
}: {
  league: LeagueMeta
  selected: boolean
  onSelect: (code: string) => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={() => !disabled && onSelect(league.code)}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors text-left w-full',
        selected
          ? 'bg-primary/10 text-primary font-medium'
          : disabled
          ? 'text-muted-foreground/40 cursor-not-allowed'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <span className="text-base leading-none">{league.flag}</span>
      <span className="truncate">{league.name}</span>
      {selected && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
      )}
    </button>
  )
}
