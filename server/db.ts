import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DevelopmentDB_Secret || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Database connection string must be set. Use DevelopmentDB_Secret or DATABASE_URL.",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });