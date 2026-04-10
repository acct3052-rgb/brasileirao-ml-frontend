'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const SEASONS = ['2024', '2023', '2022']

export function HistoricoFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const season = params.get('season') ?? 'todas'

  function handleSeason(value: string | null) {
    if (!value) return
    const url = value === 'todas' ? '/historico' : `/historico?season=${value}`
    router.push(url)
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Temporada:</span>
      <Select value={season} onValueChange={handleSeason}>
        <SelectTrigger className="w-32 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas</SelectItem>
          {SEASONS.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
