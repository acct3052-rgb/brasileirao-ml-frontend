import { Suspense } from 'react'
import { getFixtures, getMarketOdds } from '@/lib/api'
import { getLeague } from '@/lib/get-league'
import { ValueBetsTable } from '@/components/value-bets/ValueBetsTable'
import { GoalsOddsTable } from '@/components/value-bets/GoalsOddsTable'
import { RoundCoupon } from '@/components/value-bets/RoundCoupon'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

interface PageProps {
  searchParams: Promise<{ league?: string }>
}

async function ValueBetsContent({ league }: { league: string }) {
  const [fixturesRes, oddsRes] = await Promise.all([
    getFixtures(100, league),
    getMarketOdds(),
  ])

  const fixtures = fixturesRes?.fixtures ?? []
  const marketOdds = oddsRes?.odds ?? []

  return (
    <Tabs defaultValue="coupon">
      <TabsList className="mb-4">
        <TabsTrigger value="coupon">Cupom de Rodada</TabsTrigger>
        <TabsTrigger value="1x2">Resultado (1X2)</TabsTrigger>
        <TabsTrigger value="gols">Mercados de Gols</TabsTrigger>
      </TabsList>

      <TabsContent value="coupon">
        <RoundCoupon fixtures={fixtures} marketOdds={marketOdds} />
      </TabsContent>

      <TabsContent value="1x2">
        <ValueBetsTable fixtures={fixtures} marketOdds={marketOdds} />
      </TabsContent>

      <TabsContent value="gols">
        <div className="space-y-2 mb-4">
          <p className="text-sm text-muted-foreground">
            Over 1.5 e Ambos Marcam calculados pelo modelo Poisson · Over 2.5 com odd real de mercado
          </p>
        </div>
        <GoalsOddsTable marketOdds={marketOdds} />
      </TabsContent>
    </Tabs>
  )
}

export default async function ValueBetsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const league = params.league ?? await getLeague()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Value Bets</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compare as probabilidades do modelo com as odds de mercado
        </p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        }
      >
        <ValueBetsContent league={league} />
      </Suspense>
    </div>
  )
}
