import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't read Next's env files; load the one `vercel env pull` writes.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No file (e.g. CI): rely on the environment.
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrations use the direct (unpooled) connection.
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL! },
});
