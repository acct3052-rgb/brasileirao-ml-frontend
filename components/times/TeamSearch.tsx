'use client'

import { useState } from 'react'
import { TeamProfile } from './TeamProfile'
import { cn } from '@/lib/utils'

interface Props {
  teams: { id: number; name: string }[]
  league?: string
}

export function TeamSearch({ teams, league = 'BSA' }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Buscar time..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Team chips */}
      {!selected && (
        <div className="flex flex-wrap gap-2">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t.name)}
              className={cn(
                'text-sm px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors',
                selected === t.name && 'bg-primary/10 border-primary/30 text-primary',
              )}
            >
              {t.name}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum time encontrado.</p>
          )}
        </div>
      )}

      {/* Profile */}
      {selected && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelected(null); setQuery('') }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar
            </button>
            <h2 className="text-lg font-semibold">{selected}</h2>
          </div>
          <TeamProfile teamName={selected} league={league} />
        </div>
      )}
    </div>
  )
}
