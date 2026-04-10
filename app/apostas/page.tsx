import { Suspense } from 'react'
import { getBets, getBetMetrics, getFixtures } from '@/lib/api'
import { BetsMetrics } from '@/components/apostas/BetsMetrics'
import { BetsTable } from '@/components/apostas/BetsTable'
import { BetForm } from '@/components/apostas/BetForm'
import { BankrollSimulator } from '@/components/apostas/BankrollSimulator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

async function ApostasContent() {
  const [betsRes, metrics, fixturesRes] = await Promise.all([
    getBets(),
    getBetMetrics(),
    getFixtures(100),
  ])

  const bets = betsRes?.bets ?? []
  const fixtures = fixturesRes?.fixtures ?? []

  const emptyMetrics = {
    total_bets: 0, won: 0, lost: 0, pending: 0,
    total_stake: 0, profit_loss: 0, roi_pct: null, model_agreement_pct: null,
  }

  return (
    <div className="space-y-6">
      <BetsMetrics metrics={metrics ?? emptyMetrics} />

      <BetForm fixtures={fixtures} />

      <Tabs defaultValue="historico">
        <TabsList className="mb-4">
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="simulador">Simulador de Banca</TabsTrigger>
        </TabsList>

        <TabsContent value="historico">
          <div className="space-y-3">
            <h2 className="text-base font-semibold">
              Histórico de Apostas
              <span className="text-muted-foreground text-sm font-normal ml-2">
                ({bets.length} apostas)
              </span>
            </h2>
            <BetsTable bets={bets} />
          </div>
        </TabsContent>

        <TabsContent value="simulador">
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">Simulador de Banca</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Compara flat stake, Half-Kelly e suas apostas reais ao longo do tempo.
              </p>
            </div>
            <BankrollSimulator bets={bets} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ApostasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minhas Apostas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registre suas apostas e acompanhe seu desempenho
        </p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        }
      >
        <ApostasContent />
      </Suspense>
    </div>
  )
}
