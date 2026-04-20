import type {
  RawFood,
  RawMeal,
  Food,
  Meal,
  FoodCategory,
  MealCategory,
  FoodNutrient,
  MealNutrient,
  Equivalence,
  ProcessedData,
} from './types';

function ToNumber(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function MapFood(raw: RawFood): Food {
  const nutrients: FoodNutrient[] = (raw.nutrition || []).map((n) => ({
    nameVI: n.name,
    nameEN: n.name_en,
    value: ToNumber(n.value),
    unit: n.unit,
  }));

  return {
    sourceID: raw._id,
    code: raw.code,
    nameVI: raw.name_vi,
    nameEN: raw.name_en,
    categoryVI: raw.category,
    categoryEN: raw.category_en,
    energy: ToNumber(raw.energy),
    nutrients,
  };
}

function MapMeal(raw: RawMeal): Meal {
  const nutrients: MealNutrient[] = (raw.nutritional_components || []).map(
    (n) => {
      const equivalences: Equivalence[] = (n.equivalence_components || []).map(
        (eq) => ({
          nameVI: eq.name,
          nameEN: eq.name_en,
          key: eq.key,
          value: ToNumber(eq.amount),
          unit: eq.unit_name,
        }),
      );

      return {
        nameVI: n.name,
        nameEN: n.name_en,
        key: n.key,
        value: ToNumber(n.amount),
        unit: n.unit_name,
        equivalences,
      };
    },
  );

  return {
    sourceID: raw._id,
    code: raw.code,
    nameVI: raw.name_vi,
    nameEN: raw.name_en,
    nameASCII: raw.name_vi_ascii || '',
    description: raw.description || '',
    image: raw.image || '',
    gender: raw.gender ?? null,
    energy: ToNumber(raw.total_energy),
    categorySourceID: raw.category_id,
    categoryVI: raw.category_name,
    categoryEN: raw.category_name_en,
    categorySlug: raw.category_description || '',
    areaID: raw.food_area_id || null,
    nutrients,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function ExtractFoodCategories(foods: Food[]): FoodCategory[] {
  const map = new Map<string, FoodCategory>();
  for (const f of foods) {
    if (!map.has(f.categoryVI)) {
      map.set(f.categoryVI, {
        nameVI: f.categoryVI,
        nameEN: f.categoryEN,
      });
    }
  }
  return [...map.values()];
}

function ExtractMealCategories(meals: Meal[]): MealCategory[] {
  const map = new Map<string, MealCategory>();
  for (const m of meals) {
    if (!map.has(m.categorySourceID)) {
      map.set(m.categorySourceID, {
        sourceID: m.categorySourceID,
        nameVI: m.categoryVI,
        nameEN: m.categoryEN,
        slug: m.categorySlug,
      });
    }
  }
  return [...map.values()];
}

export function ProcessFoods(raw: RawFood[]): Food[] {
  return raw.map(MapFood);
}

export function ProcessMeals(raw: RawMeal[]): Meal[] {
  return raw.map(MapMeal);
}

export function ProcessAllData(
  rawFoods: RawFood[],
  rawMeals: RawMeal[],
): ProcessedData {
  const foods = ProcessFoods(rawFoods);
  const meals = ProcessMeals(rawMeals);
  return {
    foods,
    meals,
    foodCategories: ExtractFoodCategories(foods),
    mealCategories: ExtractMealCategories(meals),
  };
}
