import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Provide a fallback only during Next.js build step (when DATABASE_URL might not be present).
// This prevents Next.js from throwing errors when analyzing routes.
const connectionString = process.env.DATABASE_URL || "postgres://dummy:dummy@dummy/dummy";

if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
  console.warn("⚠️ WARNING: DATABASE_URL is not set in the production environment variables! Database connections will fail.");
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
