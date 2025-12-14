import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import { ulid } from "ulid";

// Simple Prisma client for seeding with ULID extension
// This avoids ESM import issues with tsx and the Prisma namespace
function createSeedClient() {
  const rawUrl = process.env.DATABASE_URL || "file:./db/prod.db";
  let dbPath = rawUrl.startsWith("file:") ? rawUrl.slice(5) : rawUrl;
  if (!path.isAbsolute(dbPath)) {
    // Resolve relative to project root (same as lib/utils/ulid.ts)
    dbPath = path.resolve(process.cwd(), dbPath);
  }
  const dbUrl = `file:${dbPath}`;
  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  const basePrisma = new PrismaClient({ adapter });

  // Add ULID extension for auto-generating IDs
  return basePrisma.$extends({
    name: "seed-ulid-extension",
    query: {
      $allModels: {
        create({ args, query }) {
          const data = args.data as Record<string, unknown>;
          if (!data.id) {
            data.id = ulid();
          }
          return query(args);
        },
        createMany({ args, query }) {
          if (Array.isArray(args.data)) {
            (args.data as Record<string, unknown>[]).forEach((item) => {
              if (!item.id) {
                item.id = ulid();
              }
            });
          }
          return query(args);
        },
        upsert({ args, query }) {
          const createData = args.create as Record<string, unknown>;
          if (!createData.id) {
            createData.id = ulid();
          }
          return query(args);
        },
      },
    },
  });
}

export const seedPrisma = createSeedClient();
export { ulid };
