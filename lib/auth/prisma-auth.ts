import { Prisma, PrismaClient } from "@prisma/client";
import { ulidExtension } from "@/lib/utils/ulid";
import { logger } from "@/lib/logger";

// Global storage for lazy-initialized Auth Prisma Client
const globalForPrismaAuth = globalThis as unknown as {
  prismaAuth: ReturnType<typeof createAuthPrismaClient> | undefined;
};

// Lazy creator function for Auth Prisma client
function createAuthPrismaClient() {
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

  // Create base Prisma client
  let basePrismaAuth: PrismaClient;

  // Check if we're using Turso (libSQL)
  if (process.env.DATABASE_URL?.startsWith("libsql://") && process.env.TURSO_AUTH_TOKEN) {
    try {
      // Import Turso adapter - webpack is configured to handle these files

      const { PrismaLibSql } = require("@prisma/adapter-libsql");

      const adapter = new PrismaLibSql({
        url: process.env.DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });

      basePrismaAuth = new PrismaClient({ ...(clientConfig || {}), adapter });
      logger.info("✅ Auth Turso adapter initialized successfully");
    } catch (error) {
      logger.error(
        "Failed to initialize Auth Turso adapter, falling back to standard client",
        {},
        error instanceof Error ? error : undefined
      );
      basePrismaAuth = new PrismaClient(clientConfig);
    }
  } else {
    // Standard SQLite/PostgreSQL/MySQL
    basePrismaAuth = new PrismaClient(clientConfig);
  }

  // Set up structured logging event listeners for auth client
  if (logConfig && basePrismaAuth) {
    // Type assertion for PrismaClient with event emitters enabled
    type PrismaClientWithEvents = PrismaClient & {
      $on(event: "query", callback: (e: Prisma.QueryEvent) => void): void;
      $on(event: "info", callback: (e: Prisma.LogEvent) => void): void;
      $on(event: "warn", callback: (e: Prisma.LogEvent) => void): void;
      $on(event: "error", callback: (e: Prisma.LogEvent) => void): void;
    };

    const eventPrisma = basePrismaAuth as PrismaClientWithEvents;

    logConfig.forEach((level) => {
      switch (level) {
        case "query":
          eventPrisma.$on("query", (e: Prisma.QueryEvent) => {
            logger.debug("Auth Database Query", {
              query: e.query,
              params: e.params,
              duration: `${e.duration}ms`,
              target: e.target,
            });
          });
          break;
        case "info":
          eventPrisma.$on("info", (e: Prisma.LogEvent) => {
            logger.info("Auth Database Info", { message: e.message, target: e.target });
          });
          break;
        case "warn":
          eventPrisma.$on("warn", (e: Prisma.LogEvent) => {
            logger.warn("Auth Database Warning", { message: e.message, target: e.target });
          });
          break;
        case "error":
          eventPrisma.$on("error", (e: Prisma.LogEvent) => {
            logger.error("Auth Database Error", {
              message: e.message,
              target: e.target,
            });
          });
          break;
      }
    });
  }

  // Apply ULID extension and return
  return basePrismaAuth.$extends(ulidExtension);
}

// Lazy getter for Auth Prisma client - only creates when first accessed
function getPrismaAuthClient() {
  if (!globalForPrismaAuth.prismaAuth) {
    globalForPrismaAuth.prismaAuth = createAuthPrismaClient();
  }
  return globalForPrismaAuth.prismaAuth;
}

// Export a Proxy that creates the auth client only when accessed
export const prismaAuth = new Proxy({} as ReturnType<typeof createAuthPrismaClient>, {
  get(target, prop) {
    const client = getPrismaAuthClient();
    const value = client[prop as keyof typeof client];
    return typeof value === "function" ? value.bind(client) : value;
  },
  has(target, prop) {
    const client = getPrismaAuthClient();
    return prop in client;
  },
  ownKeys() {
    const client = getPrismaAuthClient();
    return Object.keys(client);
  },
  getOwnPropertyDescriptor(target, prop) {
    const client = getPrismaAuthClient();
    return Object.getOwnPropertyDescriptor(client, prop);
  },
});
