import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { TeamSearch } from '@/components/times/TeamSearch'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function getTeams() {
  try {
    const res = await fetch(`${API_BASE}/api/teams`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return data.teams as { id: number; name: string }[]
  } catch {
    return []
  }
}

async function TeamsContent() {
  const teams = await getTeams()
  return <TeamSearch teams={teams} />
}

export default function TimesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Análise por Time</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Forma recente, gols esperados e rendimento casa/fora
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 rounded-lg" />}>
        <TeamsContent />
      </Suspense>
    </div>
  )
}
