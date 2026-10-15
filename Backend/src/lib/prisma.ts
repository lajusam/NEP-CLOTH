import { PrismaClient } from "@prisma/client";

// Single Prisma instance for the whole app (avoids creating too many connections)
const prisma = new PrismaClient();

export default prisma;
