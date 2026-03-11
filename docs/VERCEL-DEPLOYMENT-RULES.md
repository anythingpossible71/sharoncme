# Vercel Deployment Rules

Reference for ensuring optimal Vercel deployments. Use before pushing to production.

## Build Order (Critical)

Prisma client must be generated before typecheck. Build script order:

```
npx prisma generate → npm run typecheck → next build
```

On Vercel, `prisma generate` does NOT run automatically.

## Callback Parameter Types

Avoid implicit `any` in callbacks. Use explicit types:

```typescript
// .map() / .some() / .filter()
arr.map((x: (typeof arr)[number]) => ...)
arr.some((x: (typeof arr)[number]) => ...)

// Prisma $transaction
await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => { ... });
```

## Client Components

Do not import `User`, `Prisma`, or `PrismaClient` from `@prisma/client` in client components. Use `CurrentUserWithRoles` from `@/lib/auth/permissions`.

## Pre-Push Mandate

Before every production push, run:

```bash
npm run verify:production
```

Exit 0 = safe to push. Do not push if it fails.

## When Fixing Type Errors

1. Fix the reported error.
2. Search for the same pattern: `rg "\.(map|some|filter)\(\([a-z]+\) =>" -g "*.{ts,tsx}"`
3. Fix all matches in one commit.
4. Re-run `verify:production`.

## Package Manager

Use npm. Remove pnpm-lock.yaml if present. Vercel auto-detects lockfile.

## Related Docs

- [RCA-vercel-build-failures.md](./RCA-vercel-build-failures.md)
- [vercel-build-errors-log.md](./vercel-build-errors-log.md)
- [production-build-debugging-process.md](./production-build-debugging-process.md)
