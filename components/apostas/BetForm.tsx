'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Fixture } from '@/types/api'
import { createBet } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { PlusCircle, X, ShoppingCart } from 'lucide-react'

interface Props {
  fixtures: Fixture[]
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

type MarketKey = 'result' | 'over_15' | 'over_25' | 'btts'
type OutcomeKey = 'H' | 'D' | 'A' | 'over_15' | 'over_25' | 'btts'

interface ComboLeg {
  id: string          // uuid local
  fixture: Fixture
  market: MarketKey
  outcome: OutcomeKey
  label: string       // texto legível ex: "Flamengo Casa", "Over 1.5"
  prob: number | null
}

const MARKETS: { value: MarketKey; label: string }[] = [
  { value: 'result',   label: 'Resultado (1X2)' },
  { value: 'over_15', label: 'Over 1.5 gols' },
  { value: 'over_25', label: 'Over 2.5 gols' },
  { value: 'btts',    label: 'Ambos marcam' },
]

const OUTCOMES_RESULT: { value: 'H' | 'D' | 'A'; label: string }[] = [
  { value: 'H', label: 'Casa' },
  { value: 'D', label: 'Empate' },
  { value: 'A', label: 'Visitante' },
]

function uid() {
  return Math.random().toString(36).slice(2)
}

function outcomeLabel(market: MarketKey, outcome: OutcomeKey, fixture: Fixture): string {
  if (market === 'result') {
    if (outcome === 'H') return `${fixture.home_team} (Casa)`
    if (outcome === 'D') return 'Empate'
    return `${fixture.away_team} (Visitante)`
  }
  if (market === 'over_15') return 'Over 1.5 gols'
  if (market === 'over_25') return 'Over 2.5 gols'
  return 'Ambos marcam'
}

function legProb(market: MarketKey, outcome: OutcomeKey, fixture: Fixture): number | null {
  if (market === 'result') {
    if (outcome === 'H') return fixture.prob_home
    if (outcome === 'D') return fixture.prob_draw
    return fixture.prob_away
  }
  if (market === 'over_15') return fixture.over_15_prob ?? null
  if (market === 'over_25') return fixture.over_25_prob ?? null
  return null
}

// ── Componente principal ──────────────────────────────────────────────────────

export function BetForm({ fixtures }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Modo: 'single' ou 'combo'
  const [mode, setMode] = useState<'single' | 'combo'>('single')

  // ── Estado aposta simples ──────────────────────────────────────────────────
  const [market, setMarket] = useState<MarketKey>('result')
  const [matchId, setMatchId] = useState('')
  const [outcome, setOutcome] = useState<OutcomeKey | ''>('')
  const [odd, setOdd] = useState('')
  const [stake, setStake] = useState('')
  const [notes, setNotes] = useState('')

  // ── Estado múltipla ────────────────────────────────────────────────────────
  const [legs, setLegs] = useState<ComboLeg[]>([])
  const [legMatchId, setLegMatchId] = useState('')
  const [legMarket, setLegMarket] = useState<MarketKey>('result')
  const [legOutcome, setLegOutcome] = useState<OutcomeKey | ''>('')
  const [comboOdd, setComboOdd] = useState('')
  const [comboStake, setComboStake] = useState('')
  const [comboNotes, setComboNotes] = useState('')

  // ── Derivados aposta simples ───────────────────────────────────────────────
  const selectedFixture = fixtures.find((f) => String(f.match_id) === matchId)

  const modelProb = (() => {
    if (!selectedFixture || !outcome) return null
    return legProb(market, outcome as OutcomeKey, selectedFixture)
  })()

  const oddNum = parseFloat(odd)
  const ev = modelProb && !isNaN(oddNum) && oddNum > 1
    ? (modelProb * oddNum - 1) * 100
    : null
  const fairOdd = modelProb && modelProb > 0 ? (1 / modelProb).toFixed(2) : null

  const betOutcome: OutcomeKey = (() => {
    if (market === 'result') return outcome as OutcomeKey
    return market as OutcomeKey
  })()

  // ── Derivados múltipla ─────────────────────────────────────────────────────
  const legFixture = fixtures.find((f) => String(f.match_id) === legMatchId)

  const combinedProb = legs.reduce<number | null>((acc, l) => {
    if (acc === null || l.prob === null) return null
    return acc * l.prob
  }, 1)
  const fairComboOdd = combinedProb && combinedProb > 0 ? (1 / combinedProb).toFixed(2) : null
  const comboOddNum = parseFloat(comboOdd)
  const comboEv = combinedProb && !isNaN(comboOddNum) && comboOddNum > 1
    ? (combinedProb * comboOddNum - 1) * 100
    : null

  // ── Adicionar perna à múltipla ─────────────────────────────────────────────
  function addLeg() {
    if (!legFixture) return
    if (legMarket === 'result' && !legOutcome) return

    const oc: OutcomeKey = legMarket === 'result' ? (legOutcome as OutcomeKey) : legMarket as OutcomeKey
    const label = outcomeLabel(legMarket, oc, legFixture)
    const prob = legProb(legMarket, oc, legFixture)

    setLegs((prev) => [...prev, {
      id: uid(),
      fixture: legFixture,
      market: legMarket,
      outcome: oc,
      label,
      prob,
    }])
    setLegMatchId('')
    setLegMarket('result')
    setLegOutcome('')
  }

  function removeLeg(id: string) {
    setLegs((prev) => prev.filter((l) => l.id !== id))
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  function resetForm() {
    setMarket('result'); setMatchId(''); setOutcome('')
    setOdd(''); setStake(''); setNotes('')
    setLegs([]); setLegMatchId(''); setLegMarket('result'); setLegOutcome('')
    setComboOdd(''); setComboStake(''); setComboNotes('')
    setOpen(false)
  }

  async function handleSubmitSingle(e: React.FormEvent) {
    e.preventDefault()
    if (!odd || !stake || !matchId) return
    if (market === 'result' && !outcome) return
    setLoading(true)
    await createBet({
      match_id: parseInt(matchId),
      bet_outcome: betOutcome,
      odd: parseFloat(odd),
      stake: parseFloat(stake),
      notes: notes || undefined,
      market,
      is_combo: false,
    })
    setLoading(false)
    resetForm()
    router.refresh()
  }

  async function handleSubmitCombo(e: React.FormEvent) {
    e.preventDefault()
    if (!comboOdd || !comboStake || legs.length < 2) return
    setLoading(true)
    const desc = legs.map((l) => `${l.fixture.home_team} x ${l.fixture.away_team} — ${l.label}`).join(' + ')
    await createBet({
      match_id: undefined,
      bet_outcome: 'combo',
      odd: parseFloat(comboOdd),
      stake: parseFloat(comboStake),
      notes: comboNotes || undefined,
      market: 'combo',
      is_combo: true,
      combo_description: desc,
    })
    setLoading(false)
    resetForm()
    router.refresh()
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <PlusCircle className="w-4 h-4" />
        Registrar Aposta
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Nova Aposta</CardTitle>
          {/* Toggle simples / múltipla */}
          <div className="flex gap-1 text-xs rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={cn('px-3 py-1.5 transition-colors', mode === 'single' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted')}
            >
              Simples
            </button>
            <button
              type="button"
              onClick={() => setMode('combo')}
              className={cn('px-3 py-1.5 transition-colors flex items-center gap-1', mode === 'combo' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted')}
            >
              <ShoppingCart className="w-3 h-3" />
              Múltipla
              {legs.length > 0 && (
                <span className="bg-primary text-primary-foreground rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
                  {legs.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* ── APOSTA SIMPLES ────────────────────────────────────────────── */}
        {mode === 'single' && (
          <form onSubmit={handleSubmitSingle} className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Mercado */}
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Mercado</label>
              <div className="flex flex-wrap gap-2">
                {MARKETS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => { setMarket(m.value); setOutcome('') }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                      market === m.value
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Jogo */}
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Jogo</label>
              <Select value={matchId} onValueChange={(v) => { setMatchId(v); setOutcome('') }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o jogo..." />
                </SelectTrigger>
                <SelectContent>
                  {fixtures.map((f) => (
                    <SelectItem key={f.match_id} value={String(f.match_id)}>
                      Rd{f.matchday} {formatDate(f.match_date)} — {f.home_team} x {f.away_team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resultado */}
            {market === 'result' && (
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Resultado Apostado</label>
                <div className="grid grid-cols-3 gap-2">
                  {OUTCOMES_RESULT.map((o) => {
                    const prob = o.value === 'H' ? selectedFixture?.prob_home
                      : o.value === 'D' ? selectedFixture?.prob_draw
                      : selectedFixture?.prob_away
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setOutcome(o.value)}
                        className={cn(
                          'rounded-lg border p-2 text-center transition-colors',
                          outcome === o.value
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'border-border hover:bg-muted'
                        )}
                      >
                        <div className="text-xs font-semibold">{o.label}</div>
                        {prob != null && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {Math.round(prob * 100)}% modelo
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Info gols */}
            {(market === 'over_15' || market === 'over_25' || market === 'btts') && selectedFixture && (
              <div className="md:col-span-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs flex gap-4 flex-wrap">
                {market === 'over_15' && selectedFixture.over_15_prob != null && (
                  <span>Over 1.5: <strong className="text-emerald-400">{Math.round(selectedFixture.over_15_prob * 100)}%</strong> · odd justa: <strong>{(1/selectedFixture.over_15_prob).toFixed(2)}</strong></span>
                )}
                {market === 'over_25' && selectedFixture.over_25_prob != null && (
                  <span>Over 2.5: <strong className="text-emerald-400">{Math.round(selectedFixture.over_25_prob * 100)}%</strong> · odd justa: <strong>{(1/selectedFixture.over_25_prob).toFixed(2)}</strong></span>
                )}
                {market === 'btts' && (
                  <span className="text-muted-foreground">Ambos marcam — sem prob do modelo disponível</span>
                )}
                <span>xG: <strong>{selectedFixture.expected_goals_home?.toFixed(1)} – {selectedFixture.expected_goals_away?.toFixed(1)}</strong></span>
              </div>
            )}

            {/* Odd */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Odd da Casa
                {fairOdd && <span className="ml-2 text-muted-foreground">· justa: {fairOdd}</span>}
                {ev !== null && (
                  <span className={cn('ml-2 font-semibold', ev > 0 ? 'text-emerald-400' : 'text-red-400')}>
                    · EV {ev > 0 ? '+' : ''}{ev.toFixed(1)}% {ev > 0 ? '✓' : ''}
                  </span>
                )}
              </label>
              <input
                type="number" min="1.01" step="0.01" placeholder="ex: 1.40"
                value={odd} onChange={(e) => setOdd(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Stake */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor Apostado (R$)</label>
              <input
                type="number" min="0.01" step="0.01" placeholder="ex: 20.00"
                value={stake} onChange={(e) => setStake(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {stake && odd && !isNaN(parseFloat(stake)) && !isNaN(parseFloat(odd)) && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Retorno potencial: R$ {(parseFloat(stake) * parseFloat(odd)).toFixed(2)}
                </p>
              )}
            </div>

            {/* Notas */}
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Observação (opcional)</label>
              <input
                type="text" placeholder="ex: value bet confirmado pelo modelo..."
                value={notes} onChange={(e) => setNotes(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="md:col-span-2 flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button
                type="submit"
                disabled={loading || !odd || !stake || !matchId || (market === 'result' && !outcome)}
              >
                {loading ? 'Salvando...' : 'Salvar Aposta'}
              </Button>
            </div>
          </form>
        )}

        {/* ── MÚLTIPLA ─────────────────────────────────────────────────── */}
        {mode === 'combo' && (
          <form onSubmit={handleSubmitCombo} className="space-y-4">

            {/* Seletor de pernas */}
            <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Adicionar seleção à múltipla</p>

              {/* Mercado */}
              <div className="flex flex-wrap gap-2">
                {MARKETS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => { setLegMarket(m.value); setLegOutcome('') }}
                    className={cn(
                      'px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors',
                      legMarket === m.value
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Jogo */}
              <Select value={legMatchId} onValueChange={(v) => { setLegMatchId(v); setLegOutcome('') }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Selecione o jogo..." />
                </SelectTrigger>
                <SelectContent>
                  {fixtures.map((f) => (
                    <SelectItem key={f.match_id} value={String(f.match_id)}>
                      Rd{f.matchday} {formatDate(f.match_date)} — {f.home_team} x {f.away_team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Outcome resultado */}
              {legMarket === 'result' && legFixture && (
                <div className="grid grid-cols-3 gap-2">
                  {OUTCOMES_RESULT.map((o) => {
                    const prob = o.value === 'H' ? legFixture.prob_home
                      : o.value === 'D' ? legFixture.prob_draw
                      : legFixture.prob_away
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setLegOutcome(o.value)}
                        className={cn(
                          'rounded-lg border p-1.5 text-center transition-colors',
                          legOutcome === o.value
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'border-border hover:bg-muted'
                        )}
                      >
                        <div className="text-xs font-semibold">{o.label}</div>
                        <div className="text-[10px] text-muted-foreground">{Math.round(prob * 100)}%</div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Info gols para perna */}
              {(legMarket === 'over_15' || legMarket === 'over_25' || legMarket === 'btts') && legFixture && (
                <div className="rounded-md bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground">
                  {legMarket === 'over_15' && legFixture.over_15_prob != null && (
                    <span>Over 1.5: <strong className="text-emerald-400">{Math.round(legFixture.over_15_prob * 100)}%</strong> · justa: <strong>{(1/legFixture.over_15_prob).toFixed(2)}</strong></span>
                  )}
                  {legMarket === 'over_25' && (
                    <span>Over 2.5: <strong className="text-emerald-400">{Math.round(legFixture.over_25_prob * 100)}%</strong> · justa: <strong>{(1/legFixture.over_25_prob).toFixed(2)}</strong></span>
                  )}
                  {legMarket === 'btts' && <span>Ambos marcam</span>}
                  <span className="ml-3">xG: <strong>{legFixture.expected_goals_home?.toFixed(1)} – {legFixture.expected_goals_away?.toFixed(1)}</strong></span>
                </div>
              )}

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addLeg}
                disabled={!legFixture || (legMarket === 'result' && !legOutcome)}
                className="w-full gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Adicionar à Múltipla
              </Button>
            </div>

            {/* Lista de pernas */}
            {legs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">Seleções ({legs.length})</p>
                  {combinedProb !== null && (
                    <span className="text-xs text-muted-foreground">
                      Prob combinada: <strong className="text-foreground">{(combinedProb * 100).toFixed(1)}%</strong>
                      {fairComboOdd && <> · odd justa: <strong className="text-foreground">{fairComboOdd}</strong></>}
                    </span>
                  )}
                </div>
                {legs.map((leg, i) => (
                  <div key={leg.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                    <span className="text-[10px] text-muted-foreground font-bold w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{leg.fixture.home_team} x {leg.fixture.away_team}</div>
                      <div className="text-[10px] text-muted-foreground flex gap-2">
                        <span className="text-primary">{leg.label}</span>
                        {leg.prob !== null && <span>{Math.round(leg.prob * 100)}% modelo</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLeg(leg.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {legs.length < 2 && (
              <p className="text-xs text-muted-foreground text-center py-1">
                Adicione pelo menos 2 seleções para criar uma múltipla
              </p>
            )}

            {/* Odd + Stake da múltipla — sempre visível */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Odd da Múltipla
                    {fairComboOdd && <span className="ml-1 text-muted-foreground">· justa: {fairComboOdd}</span>}
                    {comboEv !== null && (
                      <span className={cn('ml-1 font-semibold', comboEv > 0 ? 'text-emerald-400' : 'text-red-400')}>
                        · EV {comboEv > 0 ? '+' : ''}{comboEv.toFixed(1)}%
                      </span>
                    )}
                  </label>
                  <input
                    type="number" min="1.01" step="0.01" placeholder="ex: 2.57"
                    value={comboOdd} onChange={(e) => setComboOdd(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Valor Apostado (R$)</label>
                  <input
                    type="number" min="0.01" step="0.01" placeholder="ex: 20.00"
                    value={comboStake} onChange={(e) => setComboStake(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  {comboStake && comboOdd && !isNaN(parseFloat(comboStake)) && !isNaN(parseFloat(comboOdd)) && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Retorno potencial: R$ {(parseFloat(comboStake) * parseFloat(comboOdd)).toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Observação (opcional)</label>
                  <input
                    type="text" placeholder="ex: múltipla de value bets da rodada 10..."
                    value={comboNotes} onChange={(e) => setComboNotes(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button
                type="submit"
                disabled={loading || legs.length < 2 || !comboOdd || !comboStake}
              >
                {loading ? 'Salvando...' : `Salvar Múltipla (${legs.length} seleções)`}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
