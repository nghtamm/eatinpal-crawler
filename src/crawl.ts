import axios from 'axios';
import fs from 'fs';
import path from 'path';
import type { RawFood, RawMeal } from './types.js';

const PAGE_SIZE = 50;
const DELAY = 1000;

const API = {
  foods: 'https://viendinhduong.vn/api/fe/foodNatunal/getPageFoodData',
  meals: 'https://viendinhduong.vn/api/fe/tool/getPageFoodData',
} as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function log(level: string, source: string, msg: string) {
  console.log(`[${new Date().toISOString()}] [${level}] [${source}] ${msg}`);
}

async function crawl<T>(url: string, source: string): Promise<T[]> {
  const rows: T[] = [];
  let page = 1;
  const t0 = Date.now();

  log('INFO', source, `Start with URL: ${url}`);

  while (true) {
    const endpoint = `${url}?page=${page}&pageSize=${PAGE_SIZE}&energy=0`;
    const t1 = Date.now();

    try {
      const { data } = await axios.get(endpoint, { insecureHTTPParser: true });
      const items: T[] = data.data;

      if (!items?.length) {
        log('WARN', source, `Page ${page}: empty`);
        break;
      }
      rows.push(...items);

      const total = data.total || 0;
      const percent =
        total > 0 ? ((rows.length / total) * 100).toFixed(1) : '?';
      log(
        'INFO',
        source,
        `Page ${page}: +${items.length} | ${rows.length}/${total} (${percent}%) | ${Date.now() - t1}ms`,
      );

      if (total > 0 && rows.length >= total) break;
    } catch (err: any) {
      log('ERROR', source, `Page ${page}: ${err.message}`);
      break;
    }

    page++;
    await sleep(DELAY);
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  log('OK', source, `Crawled: ${rows.length} rows in ${elapsed}s`);
  return rows;
}

export async function crawlFoods(): Promise<RawFood[]> {
  return crawl<RawFood>(API.foods, 'FOODS');
}

export async function crawlMeals(): Promise<RawMeal[]> {
  return crawl<RawMeal>(API.meals, 'MEALS');
}

export async function crawlAllData(): Promise<{
  foods: RawFood[];
  meals: RawMeal[];
}> {
  const foods = await crawlFoods();
  const meals = await crawlMeals();
  return { foods, meals };
}

function save(filePath: string, data: unknown) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  log('OK', 'SAVE', filePath);
}

async function main() {
  const dir = path.resolve(__dirname, '../output');
  const { foods, meals } = await crawlAllData();
  save(path.join(dir, 'foods', 'raw.json'), foods);
  save(path.join(dir, 'meals', 'raw.json'), meals);
}

if (require.main === module) {
  main().catch(console.error);
}
