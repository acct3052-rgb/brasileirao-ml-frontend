import { Suspense } from 'react'
import { getAccuracy, getRecentPredictions } from '@/lib/api'
import { getLeague } from '@/lib/get-league'
import { AccuracyChart } from '@/components/historico/AccuracyChart'
import { AccuracyByResultCards } from '@/components/historico/AccuracyByResultCards'
import { PredictionsTable } from '@/components/historico/PredictionsTable'
import { HistoricoFilters } from '@/components/historico/HistoricoFilters'
import { RoundAccuracy } from '@/components/historico/RoundAccuracy'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiOfflineBanner } from '@/components/layout/ApiOfflineBanner'

interface PageProps {
  searchParams: Promise<{ season?: string }>
}

async function HistoricoContent({ season, league }: { season?: string; league: string }) {
  const [accuracy, predsRes] = await Promise.all([
    getAccuracy(league),
    getRecentPredictions(200, league),
  ])

  const allPredictions = predsRes?.predictions ?? []
  const apiOffline = accuracy === null && predsRes === null

  const predictions = season
    ? allPredictions.filter((p) => p.matches?.match_date?.startsWith(season))
    : allPredictions

  const withResult = predictions.filter((p) => p.actual_result !== null)

  return (
    <>
      {apiOffline && <ApiOfflineBanner />}

      <AccuracyByResultCards predictions={withResult} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Acertos por Rodada</CardTitle>
        </CardHeader>
        <CardContent>
          <RoundAccuracy league={league} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Acurácia por Rodada</CardTitle>
        </CardHeader>
        <CardContent>
          <AccuracyChart predictions={withResult} />
        </CardContent>
      </Card>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">
            Predições Passadas
            <span className="text-muted-foreground text-sm font-normal ml-2">
              ({withResult.length} jogos)
            </span>
          </h2>
          <HistoricoFilters />
        </div>
        <PredictionsTable predictions={withResult} />
      </section>
    </>
  )
}

export default async function HistoricoPage({ searchParams }: PageProps) {
  const params = await searchParams
  const league = await getLeague()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Histórico</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acurácia do modelo e predições passadas
        </p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-72 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        }
      >
        <HistoricoContent season={params.season} league={league} />
      </Suspense>
    </div>
  )
}
