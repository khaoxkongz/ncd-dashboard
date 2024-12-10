import { Document } from "mongodb";
import { db } from "./lib/mongo.ts";

export async function findTransactions<T extends Document>(
  pipeline: Document[],
) {
  return await db
    .collection("FDH_Transaction")
    .aggregate<T>(pipeline, { allowDiskUse: true })
    .toArray();
}

// deno-lint-ignore no-explicit-any
export function bulkWriteAggregations(operations: any) {
  if (operations.length === 0) {
    return null;
  }
  return db
    .collection("FDH_Aggregated_Metrics")
    .bulkWrite(operations);
}
