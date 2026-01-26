import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DevelopmentDB_Secret || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Database connection string must be set. Use DevelopmentDB_Secret or DATABASE_URL.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
