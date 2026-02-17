import type { FoodSearchResult } from './types'

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function calculateMacros(food: FoodSearchResult, gramsCooked: number) {
  const ratio = food.cook_ratio || 1
  const rawEquivalent = gramsCooked / ratio
  const multiplier = rawEquivalent / 100
  return {
    protein: round1(food.protein_per_100g * multiplier),
    carbs: round1(food.carbs_per_100g * multiplier),
    fat: round1(food.fat_per_100g * multiplier),
    calories: Math.round(food.calories_per_100g * multiplier),
  }
}
