import { db } from "../lib/mongo.ts";

const COLLECTION_NAME = "FDH_Aggregated_Metrics";

// Basic schema validation
async function createCollection() {
  try {
    await db.createCollection(COLLECTION_NAME, {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["hcode", "year", "month", "timestamp"],
          properties: {
            hcode: {
              bsonType: "string",
              description: "Hospital code - required",
            },
            hname: {
              bsonType: "string",
              description: "Hospital name",
            },
            year: {
              bsonType: "int",
              description: "Year of aggregation - required",
            },
            month: {
              bsonType: "int",
              minimum: 1,
              maximum: 12,
              description: "Month of aggregation (1-12) - required",
            },
            timestamp: {
              bsonType: "date",
              description: "Timestamp of aggregation - required",
            },
          },
        },
      },
    });

    // Create indexes
    await db.collection(COLLECTION_NAME).createIndex(
      { hcode: 1, year: 1, month: 1 },
      { unique: true },
    );

    await db.collection(COLLECTION_NAME).createIndex(
      { year: 1, month: 1 },
    );

    console.log("Collection created successfully with indexes");
  } catch (error: unknown) {
    if ((error as { code: number | undefined }).code === 48) {
      return true;
    } else {
      throw error;
    }
  }
}

export { COLLECTION_NAME, createCollection };
