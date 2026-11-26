import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Neon's HTTP driver suits serverless functions. It has no interactive
// transactions; use db.batch() when several writes must succeed together.
export const db = drizzle({ client: neon(process.env.DATABASE_URL!), schema });
