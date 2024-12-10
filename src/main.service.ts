import {
  calculateCKDCostMetrics,
  calculateCKDServiceMetrics,
  calculateDiabetesCostMetrics,
  calculateDiabetesServiceMetrics,
  calculateHypertensionCostMetrics,
  calculateHypertensionServiceMetrics,
} from "./metrics/diseases.metrics.ts";
import { HospitalData } from "./utils/types.ts";

export function processHospitalResults(
  results: HospitalData[],
  year: number,
  month: number,
) {
  return results
    .map((hospitalData) => {
      try {
        const { _id, transactions } = hospitalData;

        const diabetesMetrics = calculateDiabetesServiceMetrics(transactions);
        const hypertensionMetrics = calculateHypertensionServiceMetrics(
          transactions,
        );
        const ckdMetrics = calculateCKDServiceMetrics(transactions);

        const diabetesCostMetrics = calculateDiabetesCostMetrics(transactions);
        const hypertensionCostMetrics = calculateHypertensionCostMetrics(
          transactions,
        );
        const ckdCostMetrics = calculateCKDCostMetrics(transactions);

        return {
          hcode: _id.hcode,
          hname: _id.hname,
          year,
          month,
          timestamp: new Date(),
          serviceMetrics: {
            diabetes: diabetesMetrics,
            hypertension: hypertensionMetrics,
            ckd: ckdMetrics,
          },
          costMetrics: {
            diabetes: diabetesCostMetrics,
            hypertension: hypertensionCostMetrics,
            ckd: ckdCostMetrics,
          },
        };
      } catch (error) {
        console.error(
          `Error processing hospital ${hospitalData._id.hcode}:`,
          error,
        );
        return null;
      }
    })
    .filter((result) => result !== null);
}

// deno-lint-ignore no-explicit-any
export function createBulkOperations(processedResults: any[]) {
  return processedResults.map((doc) => ({
    updateOne: {
      filter: {
        hcode: doc.hcode,
        year: doc.year,
        month: doc.month,
      },
      update: { $set: doc },
      upsert: true,
    },
  }));
}
