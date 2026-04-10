'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Fixture } from '@/types/api'
import { createBet } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { PlusCircle } from 'lucide-react'

interface Props {
  fixtures: Fixture[]
}

const OUTCOMES = [
  { value: 'H', label: 'Casa' },
  { value: 'D', label: 'Empate' },
  { value: 'A', label: 'Visitante' },
]

export function BetForm({ fixtures }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [matchId, setMatchId] = useState('')
  const [outcome, setOutcome] = useState('')
  const [odd, setOdd] = useState('')
  const [stake, setStake] = useState('')
  const [notes, setNotes] = useState('')

  const selectedFixture = fixtures.find((f) => String(f.match_id) === matchId)
  const probForOutcome =
    selectedFixture && outcome
      ? outcome === 'H'
        ? selectedFixture.prob_home
        : outcome === 'D'
        ? selectedFixture.prob_draw
        : selectedFixture.prob_away
      : null
  const oddNum = parseFloat(odd)
  const ev =
    probForOutcome && !isNaN(oddNum) && oddNum > 1
      ? (probForOutcome * oddNum - 1) * 100
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matchId || !outcome || !odd || !stake) return
    setLoading(true)
    await createBet({
      match_id: parseInt(matchId),
      bet_outcome: outcome as 'H' | 'D' | 'A',
      odd: parseFloat(odd),
      stake: parseFloat(stake),
      notes: notes || undefined,
    })
    setLoading(false)
    setMatchId('')
    setOutcome('')
    setOdd('')
    setStake('')
    setNotes('')
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
                        {formatDate(f.match_date)} — {f.home_team} x {f.away_team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resultado apostado */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Resultado Apostado</label>
                <Select value={outcome} onValueChange={setOutcome}>
                  <SelectTrigger>
                    <SelectValue placeholder="Casa / Empate / Visitante" />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTCOMES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                        {selectedFixture && (
                          <span className="text-muted-foreground ml-2 text-xs">
                            {(() => {
                              const p = o.value === 'H' ? selectedFixture.prob_home : o.value === 'D' ? selectedFixture.prob_draw : selectedFixture.prob_away
                              return `(${(p * 100).toFixed(0)}% modelo)`
                            })()}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Odd */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Odd{' '}
                  {ev !== null && (
                    <span className={ev > 0 ? 'text-emerald-400' : 'text-red-400'}>
                      — valor esp.: {ev > 0 ? '+' : ''}{ev.toFixed(1)}%
                      {ev > 0 ? ' ✓ Value bet!' : ''}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="1.01"
                  step="0.01"
                  placeholder="ex: 2.10"
                  value={odd}
                  onChange={(e) => setOdd(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Stake */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valor Apostado (R$)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="ex: 50.00"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Observação (opcional)</label>
                <input
                  type="text"
                  placeholder="ex: aposta de value, rodada 11..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Botões */}
              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading || !matchId || !outcome || !odd || !stake}>
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
