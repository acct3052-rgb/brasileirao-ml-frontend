import type {
  FixturesResponse,
  AccuracyResponse,
  RecentPredictionsResponse,
  TrainingStatus,
  BetsResponse,
  BetMetrics,
  BetCreate,
  Bet,
} from '@/types/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

async function apiPost<T>(path: string, body?: unknown, token?: string): Promise<T | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

async function apiDelete(path: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', cache: 'no-store' })
    return res.ok
  } catch {
    return false
  }
}

// ── Fixtures & Accuracy ───────────────────────────────────────────────────────

export async function getFixtures(limit = 50): Promise<FixturesResponse | null> {
  return apiFetch<FixturesResponse>(`/api/fixtures?limit=${limit}`)
}

export async function getCurrentRoundFixtures(): Promise<FixturesResponse | null> {
  return apiFetch<FixturesResponse>('/api/fixtures/current-round')
}

export async function getAccuracy(): Promise<AccuracyResponse | null> {
  return apiFetch<AccuracyResponse>('/api/accuracy')
}

export async function getRecentPredictions(
  limit = 100,
): Promise<RecentPredictionsResponse | null> {
  return apiFetch<RecentPredictionsResponse>(`/api/predictions/recent?limit=${limit}`)
}

// ── Odds de mercado ───────────────────────────────────────────────────────────

export interface BookmakerOdds {
  bookmaker: string
  odd_home?: number | null
  odd_draw?: number | null
  odd_away?: number | null
  odd_over25?: number | null
  odd_under25?: number | null
}

export interface MarketOdds {
  home_team: string
  away_team: string
  commence_time: string
  // H2H — melhor odd disponível entre todas as casas
  h2h_bookmaker: string | null
  odd_home: number | null
  odd_draw: number | null
  odd_away: number | null
  best_home_bk: string | null
  best_draw_bk: string | null
  best_away_bk: string | null
  // Totals de mercado
  totals_bookmaker: string | null
  odd_over25_market: number | null
  odd_under25_market: number | null
  best_over25_bk: string | null
  best_under25_bk: string | null
  // Todas as casas disponíveis
  all_h2h_odds: BookmakerOdds[]
  all_totals_odds: BookmakerOdds[]
  // Modelo Poisson
  model_over15: number | null
  model_over25: number | null
  model_btts: number | null
  // Fair odds
  fair_over15: number | null
  fair_over25: number | null
  fair_btts: number | null
  fair_under25: number | null
  fair_no_btts: number | null
}

export async function getMarketOdds(): Promise<{ odds: MarketOdds[]; count: number } | null> {
  return apiFetch('/api/odds')
}

// ── Retreinamento ─────────────────────────────────────────────────────────────

export async function startRetrain(token: string): Promise<{ status: string } | null> {
  return apiPost<{ status: string }>('/api/retrain', undefined, token)
}

export async function getRetrainStatus(token: string): Promise<TrainingStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/api/retrain/status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// ── Apostas ───────────────────────────────────────────────────────────────────

export async function getBets(): Promise<BetsResponse | null> {
  return apiFetch<BetsResponse>('/api/bets')
}

export async function getBetMetrics(): Promise<BetMetrics | null> {
  return apiFetch<BetMetrics>('/api/bets/metrics')
}

export async function createBet(data: BetCreate): Promise<Bet | null> {
  return apiPost<Bet>('/api/bets', data)
}

export async function deleteBet(id: string): Promise<boolean> {
  return apiDelete(`/api/bets/${id}`)
}
