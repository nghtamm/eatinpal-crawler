import fs from "fs";
import path from "path";
import type {
  RawFood,
  RawMeal,
  Food,
  Meal,
  FoodCategory,
  MealCategory,
  Nutrient,
  MealNutrient,
  Equivalence,
  ProcessedData,
} from "./types.js";

function toNumber(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function mapFood(raw: RawFood): Food {
  const nutrients: Nutrient[] = (raw.nutrition || []).map((n) => ({
    nameVI: n.name,
    nameEN: n.name_en,
    value: toNumber(n.value),
    unit: n.unit,
  }));

  return {
    sourceID: raw._id,
    code: raw.code,
    nameVI: raw.name_vi,
    nameEN: raw.name_en,
    categoryVI: raw.category,
    categoryEN: raw.categoryEn,
    energy: toNumber(raw.energy),
    nutrients,
  };
}

function mapMeal(raw: RawMeal): Meal {
  const nutrients: MealNutrient[] = (raw.nutritional_components || []).map(
    (n) => {
      const equivalences: Equivalence[] = (
        n.equivalenceComponents || []
      ).map((eq) => ({
        nameVI: eq.name,
        nameEN: eq.nameEn,
        key: eq.key,
        value: toNumber(eq.amount),
        unit: eq.unit_name,
      }));

      return {
        nameVI: n.name,
        nameEN: n.nameEn,
        key: n.key,
        value: toNumber(n.amount),
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
    nameAscii: raw.name_vi_ascii || "",
    description: raw.description || "",
    image: raw.image || "",
    gender: raw.gender ?? null,
    energy: toNumber(raw.total_energy),
    categorySourceID: raw.category_id,
    categoryVI: raw.category_name,
    categoryEN: raw.category_name_en,
    categorySlug: raw.category_description || "",
    areaID: raw.food_area_id || null,
    nutrients,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function extractFoodCategories(foods: Food[]): FoodCategory[] {
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

function extractMealCategories(meals: Meal[]): MealCategory[] {
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

export function processFoods(raw: RawFood[]): Food[] {
  return raw.map(mapFood);
}

export function processMeals(raw: RawMeal[]): Meal[] {
  return raw.map(mapMeal);
}

export function processData(
  rawFoods: RawFood[],
  rawMeals: RawMeal[],
): ProcessedData {
  const foods = processFoods(rawFoods);
  const meals = processMeals(rawMeals);
  return {
    foods,
    meals,
    foodCategories: extractFoodCategories(foods),
    mealCategories: extractMealCategories(meals),
  };
}

export function loadRawData(dir?: string): {
  foods: RawFood[];
  meals: RawMeal[];
} {
  const d = dir || path.resolve(__dirname, "../output");
  const foods: RawFood[] = JSON.parse(
    fs.readFileSync(path.join(d, "foods_raw.json"), "utf-8"),
  );
  const meals: RawMeal[] = JSON.parse(
    fs.readFileSync(path.join(d, "meals_raw.json"), "utf-8"),
  );
  return { foods, meals };
}

function save(name: string, data: unknown) {
  const dir = path.resolve(__dirname, "../output");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const dest = path.resolve(dir, name);
  fs.writeFileSync(dest, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Saved: ${dest}`);
}

async function main() {
  const raw = loadRawData();
  const result = processData(raw.foods, raw.meals);

  console.log(
    `Processed: ${result.foods.length} foods, ${result.meals.length} meals`,
  );
  console.log(
    `Categories: ${result.foodCategories.length} food, ${result.mealCategories.length} meal`,
  );

  save("foods.json", result.foods);
  save("meals.json", result.meals);
  save("food_categories.json", result.foodCategories);
  save("meal_categories.json", result.mealCategories);
}

if (require.main === module) {
  main().catch(console.error);
}
