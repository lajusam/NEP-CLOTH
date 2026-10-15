import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

// Single Prisma instance for the whole app (avoids creating too many connections)
const databaseUrl = new URL(env.DATABASE_URL);
databaseUrl.searchParams.set("connection_limit", "1");
if (databaseUrl.port === "6543") {
  databaseUrl.searchParams.set("pgbouncer", "true");
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl.toString() } },
});

export default prisma;
