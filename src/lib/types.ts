export interface Profile {
  first_name: string | null
  start_date: string | null
  goal_weight: number | null
  current_weight: number | null
  start_weight: number | null
  weight_unit: string
  checkin_day: string
  checkin_time: string
  timezone: string
  program_week: number | null
  total_weeks: number
}

export interface TodayData {
  date: string
  training: {
    available: boolean
    is_training_day?: boolean
    workout_name?: string
    exercise_count?: number
  }
  nutrition: {
    available: boolean
    day_type?: string
    total_protein?: number
    total_carbs?: number
    total_fat?: number
    total_calories?: number
  }
  checkin: {
    is_checkin_day: boolean
    status: 'completed' | 'pending' | 'upcoming'
    next_checkin: string
  }
}

export interface WeightData {
  start_weight: number | null
  goal_weight: number | null
  current_weight: number | null
  unit: string
  total_change: number | null
  entries: { date: string; weight: number; weekly_change: number | null }[]
  rolling_average: { date: string; avg: number }[]
}

export interface ComplianceData {
  streak: { current: number; longest: number }
  heatmap: { date: string; level: number }[]
  this_week: {
    training: { completed: number; target: number }
    nutrition: { completed: number; target: number }
    checkin: { completed: number; target: number }
  }
  trends: {
    training: number[]
    nutrition: number[]
  }
}

export interface WeeklySummary {
  week_number: number
  week_start: string
  compliance_score: number
  weight_delta: number | null
  training_sessions: number
  training_target: number
  nutrition_adherence: number | null
  highlights: string[]
}

export interface SummaryData {
  summaries: WeeklySummary[]
  program_progress: {
    current_week: number
    total_weeks: number
    percent_complete: number
  }
}
