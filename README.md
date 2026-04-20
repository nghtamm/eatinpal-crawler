# EatinPal Crawler

Thư viện crawl & chuẩn hoá dữ liệu dinh dưỡng từ [viendinhduong.vn](https://viendinhduong.vn) phục vụ seed database cho backend EatinPal.

## Cài đặt

Thư viện được consume qua GitHub dependency, không publish npm.

```json
// package.json
{
  "dependencies": {
    "eatinpal-crawler": "nghtamm/eatinpal-crawler"
  }
}
```

```bash
pnpm install
```

## Sử dụng

Crawl trực tiếp từ API rồi transform về dạng chuẩn hoá:

```ts
import { CrawlAllData, ProcessAllData } from 'eatinpal-crawler';

const raw = await CrawlAllData();
const data = ProcessAllData(raw.foods, raw.meals);

// data.foods            — Food[]
// data.meals            — Meal[]
// data.foodCategories   — FoodCategory[]
// data.mealCategories   — MealCategory[]
```

Hoặc crawl riêng:

```ts
import { CrawlFoods, CrawlMeals, ProcessFoods, ProcessMeals } from 'eatinpal-crawler';

const foods = ProcessFoods(await CrawlFoods());
const meals = ProcessMeals(await CrawlMeals());
```

## API

### Crawl (gọi HTTP tới API nguồn)

| Hàm | Trả về |
|---|---|
| `CrawlFoods()` | `Promise<RawFood[]>` |
| `CrawlMeals()` | `Promise<RawMeal[]>` |
| `CrawlAllData()` | `Promise<{ foods: RawFood[]; meals: RawMeal[] }>` |

### Transform (in-memory, không I/O)

| Hàm | Trả về |
|---|---|
| `ProcessFoods(raw)` | `Food[]` |
| `ProcessMeals(raw)` | `Meal[]` |
| `ProcessAllData(rawFoods, rawMeals)` | `ProcessedData` |

### Types

- **Raw**: `RawFood`, `RawMeal`, `RawFoodNutrient`, `RawMealNutrient`, `RawMealEquivalence` — ánh xạ 1-1 từ JSON API nguồn.
- **Processed**: `Food`, `Meal`, `FoodCategory`, `MealCategory`, `FoodNutrient`, `MealNutrient`, `Equivalence`, `ProcessedData` — đã chuẩn hoá.

## Scripts

```bash
pnpm build
```

## Lưu ý

- Crawler gọi API với `insecureHTTPParser: true` vì API nguồn có header không chuẩn. Khi chạy script Node trực tiếp cần set `NODE_OPTIONS='--insecure-http-parser'`.
