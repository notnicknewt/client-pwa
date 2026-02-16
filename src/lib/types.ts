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
  touchpoint: {
    is_touchpoint_day: boolean
    status: 'completed' | 'pending' | 'upcoming'
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
    official_checkin: { completed: number; target: number }
    touchpoints: { completed: number; target: number }
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

// Training plan types
export interface PlannedExercise {
  name: string
  order: number
  sets: number
  reps_min: number
  reps_max: number | null
  rpe_target: number | null
  rest_seconds: number
  tempo: string
  superset_group: string
  drop_set: boolean
  drop_set_rounds: number | null
  rest_pause: boolean
  rest_pause_rounds: number | null
  notes: string
}

export interface TrainingTodayData {
  available: boolean
  is_training_day: boolean
  workout_name: string | null
  exercise_count: number
  exercises: PlannedExercise[]
}

export interface TrainingDayPlan {
  day_of_week: number
  day_name: string
  is_training_day: boolean
  exercises: PlannedExercise[]
}

export interface TrainingWeekData {
  available: boolean
  week_number: number
  is_deload: boolean
  days: TrainingDayPlan[]
}

// Nutrition plan types
export interface MealFood {
  name: string
  category: string
  grams_raw: number
  grams_cooked: number
  target_macro: string
  prep_notes: string | null
}

export interface MealPlan {
  meal_number: number
  meal_label: string
  protein: number
  carbs: number
  fat: number
  is_intra_workout: boolean
  foods: MealFood[]
}

export interface NutritionTodayData {
  available: boolean
  day_type: string | null
  total_protein: number
  total_carbs: number
  total_fat: number
  total_calories: number
  meals: MealPlan[]
}

export interface NutritionDayPlan {
  day_of_week: string
  day_type: string
  total_protein: number
  total_carbs: number
  total_fat: number
  total_calories: number
  meals: MealPlan[]
}

export interface NutritionWeekData {
  available: boolean
  plan_name: string
  days: NutritionDayPlan[]
}
