import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ConfidenceLevel, ResultLabel } from '@/types/api'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function confidenceLevel(value: number): ConfidenceLevel {
  if (value >= 0.6) return 'Alta'
  if (value >= 0.45) return 'Média'
  return 'Baixa'
}

export function resultLabel(code: 'H' | 'D' | 'A'): ResultLabel {
  return code === 'H' ? 'Casa' : code === 'D' ? 'Empate' : 'Visitante'
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`
}

