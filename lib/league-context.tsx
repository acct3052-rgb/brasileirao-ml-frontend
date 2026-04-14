'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface LeagueMeta {
  code: string
  name: string
  flag: string
  active: boolean
  has_model: boolean
}

interface LeagueContextType {
  league: string
  setLeague: (code: string) => void
  leagues: LeagueMeta[]
  setLeagues: (leagues: LeagueMeta[]) => void
}

const LeagueContext = createContext<LeagueContextType>({
  league: 'BSA',
  setLeague: () => {},
  leagues: [],
  setLeagues: () => {},
})

export function LeagueProvider({ children }: { children: ReactNode }) {
  const [league, setLeagueState] = useState('BSA')
  const [leagues, setLeagues] = useState<LeagueMeta[]>([])

  // Persiste a liga selecionada no localStorage
  useEffect(() => {
    const saved = localStorage.getItem('selected_league')
    if (saved) setLeagueState(saved)
  }, [])

  function setLeague(code: string) {
    setLeagueState(code)
    localStorage.setItem('selected_league', code)
    // Salva em cookie para Server Components lerem
    document.cookie = `league=${code}; path=/; max-age=31536000`
    // Recarrega para buscar dados da nova liga
    window.location.reload()
  }

  return (
    <LeagueContext.Provider value={{ league, setLeague, leagues, setLeagues }}>
      {children}
    </LeagueContext.Provider>
  )
}

export function useLeague() {
  return useContext(LeagueContext)
}
