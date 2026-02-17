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

export interface FoodSearchResult {
  id: string
  name: string
  uk_name: string | null
  category: string
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  calories_per_100g: number
  cook_ratio: number
  serving_size: number | null
  serving_unit: string | null
}

export interface NutritionTodayData {
  available: boolean
  day_type: string | null
  total_protein: number
  total_carbs: number
  total_fat: number
  total_calories: number
  meals: MealPlan[]
  meals_per_day?: number
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

// Workout tracking types
export interface WorkoutSessionData {
  available: boolean
  workout_name: string
  day_plan_id: string
  exercises: PlannedExercise[]
  last_session: {
    available: boolean
    date: string
    day_plan_id: string
    exercises: {
      exercise_id: string
      planned_exercise_id: string
      name: string
      sets: { set_number: number; weight: number; reps: number; rpe: number | null }[]
    }[]
  } | null
}

export interface WorkoutLogPayload {
  day_plan_id: string
  date: string
  completed_fully: boolean
  duration_minutes: number
  source: 'pwa'
  exercises: {
    planned_exercise_id: string
    exercise_id: string
    sets: { set_number: number; weight: number; reps: number; rpe: number | null }[]
  }[]
}

// Meal tracking types
export interface MealLogsToday {
  date: string
  logged_meals: {
    id?: string
    meal_number: number
    meal_label?: string
    status: string
    adherence: number | null
    notes?: string | null
    source?: string
    foods?: {
      food_name: string
      grams_actual: number | null
      is_substitution: boolean
      original_food: string | null
      protein: number | null
      carbs: number | null
      fat: number | null
      calories: number | null
    }[]
  }[]
  daily_totals: {
    protein_consumed: number
    carbs_consumed: number
    fat_consumed: number
    calories_consumed: number
  }
  daily_targets: {
    protein_target: number
    carbs_target: number
    fat_target: number
    calories_target: number
  }
}

export interface MealLogPayload {
  date: string
  meal_number: number
  meal_label: string
  status: string
  adherence: number
  notes: string | null
  source: 'pwa'
  foods: {
    food_name: string
    grams_actual: number
    is_substitution: boolean
    original_food?: string
    food_id?: string
    protein?: number
    carbs?: number
    fat?: number
    calories?: number
  }[]
}

// Weight logging
export interface WeightLogPayload {
  date: string
  weight: number
  unit: string
  source: 'pwa'
}

// Exercise history
export interface ExerciseHistorySet {
  set_number: number
  weight: number
  reps: number
  rpe: number | null
}

export interface ExerciseHistoryEntry {
  date: string
  sets: ExerciseHistorySet[]
}

export interface ExerciseHistoryData {
  exercise_name: string
  history: ExerciseHistoryEntry[]
}

// Body measurement types
export interface BodyMeasurement {
  id: string
  date: string
  chest: number | null
  waist: number | null
  hips: number | null
  left_arm: number | null
  right_arm: number | null
  left_thigh: number | null
  right_thigh: number | null
  left_calf: number | null
  right_calf: number | null
  neck: number | null
  shoulders: number | null
  created_at: string
}

export interface MeasurementsData {
  measurements: BodyMeasurement[]
}

export interface MeasurementPayload {
  date: string
  chest?: number
  waist?: number
  hips?: number
  left_arm?: number
  right_arm?: number
  left_thigh?: number
  right_thigh?: number
  left_calf?: number
  right_calf?: number
  neck?: number
  shoulders?: number
}

// Analytics types
export interface TopExercise {
  exercise_id: string
  name: string
  count: number
}

export interface TopExercisesData {
  exercises: TopExercise[]
}

export interface StrengthDataPoint {
  date: string
  e1rm: number
}

export interface StrengthProgressionData {
  exercise_id: string
  exercise_name: string
  data: StrengthDataPoint[]
}

export interface VolumeDataPoint {
  week: string
  volume: number
}

export interface VolumeProgressionData {
  exercise_id: string
  exercise_name: string
  data: VolumeDataPoint[]
}

// Progress photo types
export interface ProgressPhoto {
  id: string
  contact_id: string
  original_url: string
  processed_url: string | null
  photo_type: string
  program_week: number | null
  taken_at: string | null
  source: string | null
  created_at: string | null
}

export interface PhotosData {
  photos: ProgressPhoto[]
}
