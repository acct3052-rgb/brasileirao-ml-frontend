/**
 * Calibração de confiança baseada em histórico real.
 * Quando o modelo diz X% de confiança, qual é a acurácia real histórica?
 *
 * Dados reais do modelo (2023-2026):
 *   40% conf → 47.8% real  (638 jogos)
 *   50% conf → 52.9% real  (548 jogos)
 *   60% conf → 73.5% real  (238 jogos)
 *   70% conf → 88.3% real  ( 60 jogos)
 *   80% conf → 80.0% real  ( 10 jogos)
 */

export interface CalibrationTier {
  label: string
  minConfidence: number   // confiança mínima do modelo (0-1)
  actualAccuracy: number  // acurácia real histórica (0-1)
  highlight: 'hot' | 'good' | 'normal' | 'weak'
  pulse: boolean
  color: string
  description: string
}

export const CALIBRATION_TIERS: CalibrationTier[] = [
  {
    label: 'Elite',
    minConfidence: 0.70,
    actualAccuracy: 0.883,
    highlight: 'hot',
    pulse: true,
    color: 'text-emerald-400',
    description: '88% de acerto histórico',
  },
  {
    label: 'Alta',
    minConfidence: 0.60,
    actualAccuracy: 0.735,
    highlight: 'good',
    pulse: false,
    color: 'text-emerald-400',
    description: '73% de acerto histórico',
  },
  {
    label: 'Média',
    minConfidence: 0.50,
    actualAccuracy: 0.529,
    highlight: 'normal',
    pulse: false,
    color: 'text-amber-400',
    description: '53% de acerto histórico',
  },
  {
    label: 'Baixa',
    minConfidence: 0,
    actualAccuracy: 0.478,
    highlight: 'weak',
    pulse: false,
    color: 'text-muted-foreground',
    description: '48% de acerto histórico',
  },
]

export function getCalibrationTier(confidence: number): CalibrationTier {
  for (const tier of CALIBRATION_TIERS) {
    if (confidence >= tier.minConfidence) return tier
  }
  return CALIBRATION_TIERS[CALIBRATION_TIERS.length - 1]
}

/**
 * Over 1.5 calibration — baseado em faixas de probabilidade
 * (sem dados históricos de gols ainda, usa thresholds conservadores)
 */
export function getOverTier(prob: number): CalibrationTier | null {
  if (prob >= 0.80) return {
    label: 'Elite',
    minConfidence: 0.80,
    actualAccuracy: 0.80,
    highlight: 'hot',
    pulse: true,
    color: 'text-emerald-400',
    description: 'Alta chance de gols',
  }
  if (prob >= 0.70) return {
    label: 'Alta',
    minConfidence: 0.70,
    actualAccuracy: 0.70,
    highlight: 'good',
    pulse: false,
    color: 'text-emerald-400',
    description: 'Boa chance de gols',
  }
  return null
}
