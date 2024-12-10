import {
  createBulkOperations,
  processHospitalResults,
} from "./main.service.ts";
import { bulkWriteAggregations, findTransactions } from "./main.repository.ts";
import { createBasePipeline } from "./pipeline/base.pipelines.ts";
import { HospitalData } from "./utils/types.ts";

export async function aggregateMonthlyData() {
  const startDate = new Date("2024-12-01");
  const endDate = new Date("2024-12-31");

  startDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCHours(23, 59, 59, 999);

  const year = startDate.getFullYear();
  const month = startDate.getMonth() + 1;

  const pipeline = createBasePipeline(startDate, endDate);
  const result = await findTransactions<HospitalData>(pipeline);

  const processedResults = processHospitalResults(result, year, month);

  if (processedResults.length > 0) {
    const bulkOps = createBulkOperations(processedResults);
    await bulkWriteAggregations(bulkOps);
  }

  return {
    success: true,
    count: processedResults.length,
    message: `Successfully aggregated data for ${year}-${month}`,
  };
}
