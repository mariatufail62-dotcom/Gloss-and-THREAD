/**
 * LOCAL DEVELOPMENT ONLY: deletes the embedded PGlite data directory so the
 * next `npm run db:local` + `npm run db:migrate` starts from an empty database.
 * Stop the db:local server before running this.
 */
import "dotenv/config";
import { rm } from "node:fs/promises";
import path from "node:path";

const url = process.env.DATABASE_URL ?? "";
const isLocal = url === "" || /(127\.0\.0\.1|localhost):5433/.test(url);
if (process.env.NODE_ENV === "production" || !isLocal) {
  console.error("Refusing to run: this only resets the local PGlite database (port 5433).");
  process.exit(1);
}
const dir = path.resolve(process.cwd(), ".data/pglite");
await rm(dir, { recursive: true, force: true });
console.log(`Removed ${dir}. Now run: npm run db:local, then npm run db:migrate && npm run media:demo && npm run db:seed`);
