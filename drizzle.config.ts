import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://casper_gw:casper_gw@127.0.0.1:54329/casper_gw",
  },
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  strict: true,
  verbose: true,
});
