// [RAW TYPES] — direct mapping from API response
export interface RawFoodNutrient {
  name: string;
  name_en: string;
  value: number | string;
  unit: string;
}

export interface RawFood {
  _id: string;
  code: string;
  name_vi: string;
  name_en: string;
  category: string;
  category_en: string;
  nutrition: RawFoodNutrient[];
  energy: number;
}

export interface RawMealEquivalence {
  name: string;
  name_en: string;
  amount: number | string;
  unit_name: string;
  key: string;
}

export interface RawMealNutrient {
  name: string;
  name_en: string;
  amount: number | string;
  unit_id: string;
  unit_name: string;
  key: string;
  equivalence_components?: RawMealEquivalence[];
}

export interface RawMeal {
  _id: string;
  code: string;
  name_vi: string;
  name_en: string;
  name_vi_ascii?: string;
  category_id: string;
  category_name: string;
  category_name_en: string;
  category_name_vi_ascii?: string;
  category_description?: string;
  description: string;
  image: string;
  food_area_id?: string;
  gender?: number;
  total_energy: number | string;
  dish_components: unknown[];
  nutritional_components: RawMealNutrient[];
  created_at: string;
  updated_at: string;
}

// [PROCESSED TYPES] — after transformation and normalization
export interface FoodCategory {
  nameVI: string;
  nameEN: string;
}

export interface FoodNutrient {
  nameVI: string;
  nameEN: string;
  value: number | null;
  unit: string;
}

export interface Food {
  sourceID: string;
  code: string;
  nameVI: string;
  nameEN: string;
  categoryVI: string;
  categoryEN: string;
  energy: number | null;
  nutrients: FoodNutrient[];
}

export interface MealCategory {
  sourceID: string;
  nameVI: string;
  nameEN: string;
  slug: string;
}

export interface Equivalence {
  nameVI: string;
  nameEN: string;
  key: string;
  value: number | null;
  unit: string;
}

export interface MealNutrient {
  nameVI: string;
  nameEN: string;
  key: string;
  value: number | null;
  unit: string;
  equivalences: Equivalence[];
}

export interface Meal {
  sourceID: string;
  code: string;
  nameVI: string;
  nameEN: string;
  nameASCII: string;
  description: string;
  image: string;
  gender: number | null;
  energy: number | null;
  categorySourceID: string;
  categoryVI: string;
  categoryEN: string;
  categorySlug: string;
  areaID: string | null;
  nutrients: MealNutrient[];
  createdAt: string;
  updatedAt: string;
}

export interface ProcessedData {
  foods: Food[];
  meals: Meal[];
  foodCategories: FoodCategory[];
  mealCategories: MealCategory[];
}
