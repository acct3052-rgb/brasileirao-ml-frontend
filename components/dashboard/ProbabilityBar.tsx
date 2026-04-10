import { formatPct } from '@/lib/utils'

interface Props {
  probHome: number
  probDraw: number
  probAway: number
  predicted: 'H' | 'D' | 'A'
}

export function ProbabilityBar({ probHome, probDraw, probAway, predicted }: Props) {
  return (
    <div className="flex flex-col gap-1 min-w-[160px]">
      <div className="flex h-2 rounded-full overflow-hidden">
        <div
          className="bg-blue-500 transition-all"
          style={{ width: `${probHome * 100}%` }}
        />
        <div
          className="bg-zinc-500 transition-all"
          style={{ width: `${probDraw * 100}%` }}
        />
        <div
          className="bg-orange-500 transition-all"
          style={{ width: `${probAway * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span className={predicted === 'H' ? 'text-blue-400 font-semibold' : ''}>
          {formatPct(probHome)}
        </span>
        <span className={predicted === 'D' ? 'text-zinc-300 font-semibold' : ''}>
          {formatPct(probDraw)}
        </span>
        <span className={predicted === 'A' ? 'text-orange-400 font-semibold' : ''}>
          {formatPct(probAway)}
        </span>
      </div>
    </div>
  )
}
