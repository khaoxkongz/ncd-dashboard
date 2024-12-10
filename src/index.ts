import { createCollection } from "./model/ncd-monthly-aggregation.ts";
import { aggregateMonthlyData } from "./main.ts";

async function main() {
  await createCollection();
  const result = await aggregateMonthlyData();
  console.log(result);
  Deno.exit(0);
}

main();
