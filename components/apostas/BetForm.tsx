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
import { PlusCircle } from 'lucide-react'

interface Props {
  fixtures: Fixture[]
}

const MARKETS = [
  { value: 'result',   label: 'Resultado (1X2)' },
  { value: 'over_15', label: 'Over 1.5 gols' },
  { value: 'over_25', label: 'Over 2.5 gols' },
  { value: 'btts',    label: 'Ambos marcam' },
  { value: 'combo',   label: 'Múltipla' },
]

const OUTCOMES_RESULT = [
  { value: 'H', label: 'Casa' },
  { value: 'D', label: 'Empate' },
  { value: 'A', label: 'Visitante' },
]

export function BetForm({ fixtures }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [market, setMarket] = useState('result')
  const [matchId, setMatchId] = useState('')
  const [outcome, setOutcome] = useState('')
  const [odd, setOdd] = useState('')
  const [stake, setStake] = useState('')
  const [notes, setNotes] = useState('')
  const [comboDesc, setComboDesc] = useState('')

  const isCombo = market === 'combo'
  const selectedFixture = fixtures.find((f) => String(f.match_id) === matchId)

  // Probabilidade do modelo para o mercado selecionado
  const modelProb = (() => {
    if (!selectedFixture) return null
    if (market === 'result') {
      if (outcome === 'H') return selectedFixture.prob_home
      if (outcome === 'D') return selectedFixture.prob_draw
      if (outcome === 'A') return selectedFixture.prob_away
    }
    if (market === 'over_15') return selectedFixture.over_15_prob ?? null
    if (market === 'over_25') return selectedFixture.over_25_prob ?? null
    return null
  })()

  const oddNum = parseFloat(odd)
  const ev = modelProb && !isNaN(oddNum) && oddNum > 1
    ? (modelProb * oddNum - 1) * 100
    : null

  // Odd justa do modelo
  const fairOdd = modelProb && modelProb > 0 ? (1 / modelProb).toFixed(2) : null

  const betOutcome = (() => {
    if (market === 'result') return outcome
    if (market === 'combo') return 'combo'
    return market // over_15, over_25, btts
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!odd || !stake) return
    if (!isCombo && !matchId) return
    if (market === 'result' && !outcome) return

    setLoading(true)
    await createBet({
      match_id: isCombo ? undefined : parseInt(matchId),
      bet_outcome: betOutcome,
      odd: parseFloat(odd),
      stake: parseFloat(stake),
      notes: notes || undefined,
      market,
      is_combo: isCombo,
      combo_description: isCombo ? comboDesc : undefined,
    } as Parameters<typeof createBet>[0])

    setLoading(false)
    setMatchId(''); setOutcome(''); setOdd(''); setStake('')
    setNotes(''); setComboDesc(''); setMarket('result')
    setOpen(false)
    router.refresh()
  }

  return (
    <div>
      {!open ? (
        <Button onClick={() => setOpen(true)} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Registrar Aposta
        </Button>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nova Aposta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Mercado */}
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Tipo de Aposta</label>
                <div className="flex flex-wrap gap-2">
                  {MARKETS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => { setMarket(m.value); setOutcome(''); setMatchId('') }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
                        market === m.value
                          ? 'bg-primary/10 border-primary/40 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {m.value === 'combo' ? '🔗 ' : ''}{m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Múltipla */}
              {isCombo ? (
                <div className="md:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Descrição da Múltipla</label>
                  <input
                    type="text"
                    placeholder="ex: Flamengo Casa + Over 1.5 Santos x Grêmio + Palmeiras Casa"
                    value={comboDesc}
                    onChange={(e) => setComboDesc(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              ) : (
                <>
                  {/* Jogo */}
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Jogo</label>
                    <Select value={matchId} onValueChange={setMatchId}>
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

                  {/* Resultado (só para mercado resultado) */}
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

                  {/* Info do mercado de gols */}
                  {(market === 'over_15' || market === 'over_25' || market === 'btts') && selectedFixture && (
                    <div className="md:col-span-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs flex gap-4">
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
                </>
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

              {/* Botões */}
              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button
                  type="submit"
                  disabled={loading || !odd || !stake || (!isCombo && !matchId) || (market === 'result' && !outcome)}
                >
                  {loading ? 'Salvando...' : 'Salvar Aposta'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
