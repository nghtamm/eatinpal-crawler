import fs from "fs";
import path from "path";
import type { RawFood, RawMeal, Food, Meal, FoodCategory, MealCategory, FoodNutrient, MealNutrient, Equivalence, ProcessedData } from "./types.js";

function toNumber(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function mapFood(raw: RawFood): Food {
  const nutrients: FoodNutrient[] = (raw.nutrition || []).map((n) => ({
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
  const nutrients: MealNutrient[] = (raw.nutritional_components || []).map((n) => {
    const equivalences: Equivalence[] = (n.equivalenceComponents || []).map((eq) => ({
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
  });

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

export function processAllData(rawFoods: RawFood[], rawMeals: RawMeal[]): ProcessedData {
  const foods = processFoods(rawFoods);
  const meals = processMeals(rawMeals);
  return {
    foods,
    meals,
    foodCategories: extractFoodCategories(foods),
    mealCategories: extractMealCategories(meals),
  };
}

export function getProcessedData(dir?: string): ProcessedData {
  const raw = readAllRawData(dir);
  return processAllData(raw.foods, raw.meals);
}

export function readAllRawData(dir?: string): {
  foods: RawFood[];
  meals: RawMeal[];
} {
  const d = dir || path.resolve(__dirname, "../output");
  const foods: RawFood[] = JSON.parse(fs.readFileSync(path.join(d, "foods", "raw.json"), "utf-8"));
  const meals: RawMeal[] = JSON.parse(fs.readFileSync(path.join(d, "meals", "raw.json"), "utf-8"));
  return { foods, meals };
}

function save(filePath: string, data: unknown) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`[PROCESS] Saved: ${filePath}`);
}

async function main() {
  const raw = readAllRawData();
  const result = processAllData(raw.foods, raw.meals);

  console.log(`[PROCESS] Processed: ${result.foods.length} foods, ${result.meals.length} meals`);
  console.log(`[PROCESS] Categories: ${result.foodCategories.length} food, ${result.mealCategories.length} meal`);

  const dir = path.resolve(__dirname, "../output");
  save(path.join(dir, "foods", "items.json"), result.foods);
  save(path.join(dir, "foods", "categories.json"), result.foodCategories);
  save(path.join(dir, "meals", "items.json"), result.meals);
  save(path.join(dir, "meals", "categories.json"), result.mealCategories);
}

if (require.main === module) {
  main().catch(console.error);
}
