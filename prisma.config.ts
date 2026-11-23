import "dotenv/config";
import { defineConfig } from "prisma/config";

// DATABASE_URL must point at PostgreSQL. For local development without a
// Postgres install, `npm run db:local` starts an embedded PGlite server on
// port 5433 (see README → Local development).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node node_modules/tsx/dist/cli.mjs prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
