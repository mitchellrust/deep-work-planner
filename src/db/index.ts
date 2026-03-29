import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";

// Create a Neon serverless connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

// Initialize Drizzle with the pool and schema
export const db = drizzle(pool, { schema });
