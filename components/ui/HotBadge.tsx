'use client'

import { cn } from '@/lib/utils'
import { getCalibrationTier, getOverTier } from '@/lib/calibration'

interface Props {
  confidence: number
  over15Prob?: number | null
  className?: string
}

export function HotBadge({ confidence, over15Prob, className }: Props) {
  const tier = getCalibrationTier(confidence)
  const overTier = over15Prob != null ? getOverTier(over15Prob) : null

  if (tier.highlight === 'weak' || tier.highlight === 'normal') {
    // Só mostra badge para Alta e Elite
    if (!overTier) return null
  }

  const isHot = tier.highlight === 'hot' || overTier?.highlight === 'hot'
  const isGood = tier.highlight === 'good' || overTier?.highlight === 'good'

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border',
      isHot && 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 animate-pulse',
      isGood && !isHot && 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      className
    )}>
      {isHot ? '🔥' : '✓'} {tier.label}
      <span className="font-normal opacity-75">· {Math.round(tier.actualAccuracy * 100)}% hist.</span>
    </span>
  )
}

interface TooltipProps {
  confidence: number
}

export function CalibrationTooltip({ confidence }: TooltipProps) {
  const tier = getCalibrationTier(confidence)
  return (
    <span className={cn('text-[10px]', tier.color)} title={tier.description}>
      {tier.label} ({Math.round(tier.actualAccuracy * 100)}% hist.)
    </span>
  )
}
