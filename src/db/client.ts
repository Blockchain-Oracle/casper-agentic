import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let queryClient: ReturnType<typeof postgres> | null = null;

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for persistent Casper GW records.");
  }

  if (!queryClient) {
    queryClient = postgres(databaseUrl, { max: 5 });
  }
  if (!dbInstance) {
    dbInstance = drizzle(queryClient, { schema });
  }
  return dbInstance;
}
