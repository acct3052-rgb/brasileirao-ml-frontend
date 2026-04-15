import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { TeamSearch } from '@/components/times/TeamSearch'
import { getLeague } from '@/lib/get-league'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

interface PageProps {
  searchParams: Promise<{ league?: string }>
}

async function getTeams(league: string) {
  try {
    const res = await fetch(`${API_BASE}/api/teams?league=${league}`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return data.teams as { id: number; name: string }[]
  } catch {
    return []
  }
}

async function TeamsContent({ league }: { league: string }) {
  const teams = await getTeams(league)
  return <TeamSearch teams={teams} league={league} />
}

export default async function TimesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const league = params.league ?? await getLeague()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Análise por Time</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Forma recente, gols esperados e rendimento casa/fora
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 rounded-lg" />}>
        <TeamsContent league={league} />
      </Suspense>
    </div>
  )
}
