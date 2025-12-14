import { ulid } from "ulid";
import path from "path";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { logger } from "@/lib/logger";

/**
 * Generate a new ULID
 */
export function generateId(): string {
  return ulid();
}

/**
 * Validate if a string is a valid ULID
 */
export function isValidUlid(id: string): boolean {
  // ULID is exactly 26 characters and uses Crockford's Base32
  const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/;
  return ulidRegex.test(id);
}

/**
 * Prisma Client Extension for automatic ULID generation
 */
export const ulidExtension = Prisma.defineExtension({
  name: "ulid-extension",
  query: {
    user: {
      create({ args, query }) {
        args.data.id = args.data.id || generateId();
        return query(args);
      },
      createMany({ args, query }) {
        if (Array.isArray(args.data)) {
          args.data = args.data.map((item) => ({
            ...item,
            id: item.id || generateId(),
          }));
        }
        return query(args);
      },
      upsert({ args, query }) {
        args.create.id = args.create.id || generateId();
        return query(args);
      },
    },
    userProfile: {
      create({ args, query }) {
        args.data.id = args.data.id || generateId();
        return query(args);
      },
      createMany({ args, query }) {
        if (Array.isArray(args.data)) {
          args.data = args.data.map((item) => ({
            ...item,
            id: item.id || generateId(),
          }));
        }
        return query(args);
      },
      upsert({ args, query }) {
        args.create.id = args.create.id || generateId();
        return query(args);
      },
    },
    role: {
      create({ args, query }) {
        args.data.id = args.data.id || generateId();
        return query(args);
      },
      createMany({ args, query }) {
        if (Array.isArray(args.data)) {
          args.data = args.data.map((item) => ({
            ...item,
            id: item.id || generateId(),
          }));
        }
        return query(args);
      },
      upsert({ args, query }) {
        args.create.id = args.create.id || generateId();
        return query(args);
      },
    },
    userRole: {
      create({ args, query }) {
        args.data.id = args.data.id || generateId();
        return query(args);
      },
      createMany({ args, query }) {
        if (Array.isArray(args.data)) {
          args.data = args.data.map((item) => ({
            ...item,
            id: item.id || generateId(),
          }));
        }
        return query(args);
      },
      upsert({ args, query }) {
        args.create.id = args.create.id || generateId();
        return query(args);
      },
    },
    pageTemplate: {
      create({ args, query }) {
        args.data.id = args.data.id || generateId();
        return query(args);
      },
      createMany({ args, query }) {
        if (Array.isArray(args.data)) {
          args.data = args.data.map((item) => ({
            ...item,
            id: item.id || generateId(),
          }));
        }
        return query(args);
      },
      upsert({ args, query }) {
        args.create.id = args.create.id || generateId();
        return query(args);
      },
    },
    teamMember: {
      create({ args, query }) {
        args.data.id = args.data.id || generateId();
        return query(args);
      },
      createMany({ args, query }) {
        if (Array.isArray(args.data)) {
          args.data = args.data.map((item) => ({
            ...item,
            id: item.id || generateId(),
          }));
        }
        return query(args);
      },
      upsert({ args, query }) {
        args.create.id = args.create.id || generateId();
        return query(args);
      },
    },
    appSettings: {
      create({ args, query }) {
        args.data.id = args.data.id || generateId();
        return query(args);
      },
      createMany({ args, query }) {
        if (Array.isArray(args.data)) {
          args.data = args.data.map((item) => ({
            ...item,
            id: item.id || generateId(),
          }));
        }
        return query(args);
      },
      upsert({ args, query }) {
        args.create.id = args.create.id || generateId();
        return query(args);
      },
    },
    contactMessage: {
      create({ args, query }) {
        args.data.id = args.data.id || generateId();
        return query(args);
      },
      createMany({ args, query }) {
        if (Array.isArray(args.data)) {
          args.data = args.data.map((item) => ({
            ...item,
            id: item.id || generateId(),
          }));
        }
        return query(args);
      },
      upsert({ args, query }) {
        args.create.id = args.create.id || generateId();
        return query(args);
      },
    },
    blogPost: {
      create({ args, query }) {
        args.data.id = args.data.id || generateId();
        return query(args);
      },
      createMany({ args, query }) {
        if (Array.isArray(args.data)) {
          args.data = args.data.map((item) => ({
            ...item,
            id: item.id || generateId(),
          }));
        }
        return query(args);
      },
      upsert({ args, query }) {
        args.create.id = args.create.id || generateId();
        return query(args);
      },
    },
    contactSubmission: {
      create({ args, query }) {
        args.data.id = args.data.id || generateId();
        return query(args);
      },
      createMany({ args, query }) {
        if (Array.isArray(args.data)) {
          args.data = args.data.map((item) => ({
            ...item,
            id: item.id || generateId(),
          }));
        }
        return query(args);
      },
      upsert({ args, query }) {
        args.create.id = args.create.id || generateId();
        return query(args);
      },
    },
  },
});

/**
 * Create a Prisma client with ULID extension
 */
export function createPrismaClient() {
  let basePrisma: PrismaClient;

  // Configure logging based on environment variable
  const logConfig = process.env.PRISMA_LOG_LEVEL
    ? (process.env.PRISMA_LOG_LEVEL.split(",").map((level) => level.trim()) as (
        | "query"
        | "info"
        | "warn"
        | "error"
      )[])
    : undefined;

  const clientConfig = logConfig
    ? {
        log: logConfig.map((level) => ({
          level: level as "query" | "info" | "warn" | "error",
          emit: "event" as const,
        })),
      }
    : undefined;

  // Check if we're using Turso (libSQL)
  if (process.env.DATABASE_URL?.startsWith("libsql://") && process.env.TURSO_AUTH_TOKEN) {
    try {
      // Import Turso adapter - webpack is configured to handle these files

      const { PrismaLibSQL } = require("@prisma/adapter-libsql");

      const adapter = new PrismaLibSQL({
        url: process.env.DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });

      basePrisma = clientConfig
        ? new PrismaClient({ ...clientConfig, adapter })
        : new PrismaClient({ adapter });
      logger.info("Turso adapter initialized successfully");
    } catch (error) {
      logger.error(
        "Failed to initialize Turso adapter, falling back to better-sqlite3",
        {},
        error instanceof Error ? error : undefined
      );
      // Fall through to better-sqlite3 adapter
      const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
      const rawUrl = process.env.DATABASE_URL || "file:./db/prod.db";
      let dbPath = rawUrl.startsWith("file:") ? rawUrl.slice(5) : rawUrl;
      if (!path.isAbsolute(dbPath)) {
        dbPath = path.resolve(process.cwd(), dbPath);
      }
      const dbUrl = `file:${dbPath}`;
      const adapter = new PrismaBetterSqlite3({ url: dbUrl });
      basePrisma = clientConfig
        ? new PrismaClient({ ...clientConfig, adapter })
        : new PrismaClient({ adapter });
    }
  } else {
    // Standard SQLite using better-sqlite3 adapter (required for Prisma 7)
    try {
      // Handle relative paths from DATABASE_URL
      const rawUrl = process.env.DATABASE_URL || "file:./db/prod.db";
      let dbPath = rawUrl.startsWith("file:") ? rawUrl.slice(5) : rawUrl;
      // Resolve relative paths from project root
      if (!path.isAbsolute(dbPath)) {
        dbPath = path.resolve(process.cwd(), dbPath);
      }
      // Pass URL in the format expected by the adapter
      const dbUrl = `file:${dbPath}`;
      logger.debug("Initializing better-sqlite3", { rawUrl, dbPath, dbUrl });
      const adapter = new PrismaBetterSqlite3({ url: dbUrl });
      basePrisma = clientConfig
        ? new PrismaClient({ ...clientConfig, adapter })
        : new PrismaClient({ adapter });
      logger.info("better-sqlite3 adapter initialized successfully", { dbPath });
    } catch (error) {
      logger.error(
        "Failed to initialize better-sqlite3 adapter",
        {},
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  // Set up structured logging event listeners
  if (logConfig && basePrisma) {
    // Type assertion for PrismaClient with event emitters enabled
    type PrismaClientWithEvents = PrismaClient & {
      $on(event: "query", callback: (e: Prisma.QueryEvent) => void): void;
      $on(event: "info", callback: (e: Prisma.LogEvent) => void): void;
      $on(event: "warn", callback: (e: Prisma.LogEvent) => void): void;
      $on(event: "error", callback: (e: Prisma.LogEvent) => void): void;
    };

    const eventPrisma = basePrisma as PrismaClientWithEvents;

    logConfig.forEach((level) => {
      switch (level) {
        case "query":
          eventPrisma.$on("query", (e: Prisma.QueryEvent) => {
            logger.debug("Database Query", {
              query: e.query,
              params: e.params,
              duration: `${e.duration}ms`,
              target: e.target,
            });
          });
          break;
        case "info":
          eventPrisma.$on("info", (e: Prisma.LogEvent) => {
            logger.info("Database Info", { message: e.message, target: e.target });
          });
          break;
        case "warn":
          eventPrisma.$on("warn", (e: Prisma.LogEvent) => {
            logger.warn("Database Warning", { message: e.message, target: e.target });
          });
          break;
        case "error":
          eventPrisma.$on("error", (e: Prisma.LogEvent) => {
            logger.error("Database Error", { message: e.message, target: e.target });
          });
          break;
      }
    });
  }

  // Apply ULID extension
  const prisma = basePrisma.$extends(ulidExtension);
  return prisma;
}
