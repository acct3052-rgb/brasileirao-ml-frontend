import { Suspense } from 'react'
import { getFixtures, getAccuracy } from '@/lib/api'
import { getLeague } from '@/lib/get-league'
import { MetricCards } from '@/components/dashboard/MetricCards'
import { FixturesWithLineups } from '@/components/dashboard/FixturesWithLineups'
import { MetricCardsSkeleton } from '@/components/dashboard/MetricCardsSkeleton'
import { FixturesTableSkeleton } from '@/components/dashboard/FixturesTableSkeleton'
import { ApiOfflineBanner } from '@/components/layout/ApiOfflineBanner'

interface PageProps {
  searchParams: Promise<{ league?: string }>
}

async function DashboardContent({ league }: { league: string }) {
  const [fixturesRes, accuracy] = await Promise.all([
    getFixtures(50, league),
    getAccuracy(league),
  ])

  const fixtures = fixturesRes?.fixtures ?? []
  const apiOffline = fixturesRes === null && accuracy === null

  return (
    <>
      {apiOffline && <ApiOfflineBanner />}
      <MetricCards accuracy={accuracy} fixtures={fixtures} />
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Próximos Jogos</h2>
          <p className="text-xs text-muted-foreground">
            Clique num jogo para ver lesões e escalação ajustada
          </p>
        </div>
        <FixturesWithLineups fixtures={fixtures} />
      </section>
    </>
  )
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const league = params.league ?? await getLeague()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Predições com Machine Learning
        </p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-8">
            <MetricCardsSkeleton />
            <FixturesTableSkeleton />
          </div>
        }
      >
        <DashboardContent league={league} />
      </Suspense>
    </div>
  )
}
