// ── /api/fixtures ─────────────────────────────────────────────────────────────

export interface Fixture {
  match_id: number
  match_date: string
  matchday: number
  season: number
  home_team: string
  away_team: string
  prob_home: number
  prob_draw: number
  prob_away: number
  predicted_result: 'H' | 'D' | 'A'
  confidence: number
  expected_total_goals: number
  expected_goals_home?: number
  expected_goals_away?: number
  over_15_prob?: number
  over_25_prob: number
}

export interface FixturesResponse {
  fixtures: Fixture[]
  count: number
}

// ── /api/accuracy ─────────────────────────────────────────────────────────────

export interface AccuracyResponse {
  total_predictions: number
  correct_predictions: number
  accuracy_pct: number | null
  avg_confidence_pct?: number | null
  last_prediction?: string | null
}

// ── /api/predictions/recent ───────────────────────────────────────────────────

export interface MatchTeam {
  name: string
}

export interface PredictionMatch {
  match_date: string
  home_team: MatchTeam
  away_team: MatchTeam
  home_goals: number | null
  away_goals: number | null
}

export interface RecentPrediction {
  match_id: number
  predicted_result: 'H' | 'D' | 'A'
  actual_result: 'H' | 'D' | 'A' | null
  correct: boolean | null
  matches: PredictionMatch
}

export interface RecentPredictionsResponse {
  predictions: RecentPrediction[]
}

// ── /api/retrain ──────────────────────────────────────────────────────────────

export interface TrainingStatus {
  status: 'idle' | 'running' | 'done' | 'error'
  started_at: string | null
  finished_at: string | null
  error: string | null
}

// ── /api/bets ─────────────────────────────────────────────────────────────────

export interface BetMatch {
  match_date: string
  status: string
  result: string | null
  home_team: { name: string }
  away_team: { name: string }
}

export interface Bet {
  id: string
  match_id: number
  bet_outcome: 'H' | 'D' | 'A'
  odd: number
  stake: number
  status: 'pending' | 'won' | 'lost'
  model_prob: number | null
  model_pick: 'H' | 'D' | 'A' | null
  notes: string | null
  created_at: string
  matches: BetMatch
}

export interface BetsResponse {
  bets: Bet[]
}

export interface BetCreate {
  match_id: number
  bet_outcome: 'H' | 'D' | 'A'
  odd: number
  stake: number
  notes?: string
}

export interface BetMetrics {
  total_bets: number
  won: number
  lost: number
  pending: number
  total_stake: number
  profit_loss: number
  roi_pct: number | null
  model_agreement_pct: number | null
}

// ── Tipos derivados ───────────────────────────────────────────────────────────

export type ConfidenceLevel = 'Alta' | 'Média' | 'Baixa'
export type ResultLabel = 'Casa' | 'Empate' | 'Visitante'
