import { MongoClient } from "mongodb";

const {
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_HOST,
  MONGO_PORT,
  MONGO_DBNAME,
} = Deno.env.toObject();

const MONGO_URI =
  `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DBNAME}?authSource=admin&directConnection=true`;

const client = new MongoClient(MONGO_URI);

const db = client.db();

export { db };
