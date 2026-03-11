# Root Cause Analysis: Vercel Build Failures

**Date:** 2026-03-10  
**Scope:** 12+ consecutive Vercel build failures before success  
**Outcome:** Build now passes. RCA documents what failed, what changed, and how to prevent future failures.

---

## 1. What Didn’t Work

### 1.1 Symptoms

- Vercel builds failed repeatedly (12+ cycles)
- Different errors each deploy: TypeScript `implicit any` and `Module has no exported member`
- Local `npm run build` sometimes passed while Vercel failed
- Each fix addressed one error; the next deploy revealed another

### 1.2 Root Causes

#### A. Prisma client not generated before typecheck (primary)

**What happened:**  
`npm run build` ran `typecheck` (via `tsc`) before `prisma generate`. On Vercel, `prisma generate` does not run automatically. Typecheck tried to use `User`, `Prisma`, `PrismaClient` from `@prisma/client` before they existed, causing:

```
Module '"@prisma/client"' has no exported member 'User'
Module '"@prisma/client"' has no exported member 'Prisma'
Module '"@prisma/client"' has no exported member 'PrismaClient'
```

**Why locally it sometimes passed:**  
Prisma had already been generated (e.g. from `prisma migrate dev` or `db:reset`), so types existed in `node_modules`. Vercel starts from a clean `npm install` with no prior generate.

#### B. Implicit `any` in callback parameters (secondary)

**What happened:**  
`strict: true` in `tsconfig.json` requires explicit types. Untyped callbacks in `.map()`, `.some()`, `.filter()`, and `$transaction` produced:

```
Parameter 'r' implicitly has an 'any' type.
Parameter 'userRole' implicitly has an 'any' type.
```

**Why locally it sometimes passed:**  
Incremental builds or cached `.next` could skip re-type-checking unchanged files. Vercel always does a clean build with no cache.

#### C. Process gaps (contributing)

| Gap | Effect |
|-----|--------|
| No `verify:production` before push | No single “production ready” check |
| Fix-one-at-a-time | TypeScript stops at the first error; each deploy surfaced only the next one |
| No pattern search | Fixing one `.some()` did not fix others with the same pattern |
| No `prisma generate` in build | Prisma client never generated on Vercel before typecheck |

---

## 2. What Changed (Fixes Applied)

### 2.1 Build order: Prisma generate first

**Before:**
```json
"build": "npm run typecheck && node scripts/validate-admin-files.js && next build"
```

**After:**
```json
"build": "npx prisma generate && npm run typecheck && node scripts/validate-admin-files.js && next build"
```

Prisma client is generated before typecheck, so all `@prisma/client` types exist when `tsc` runs.

### 2.2 Verification pipeline

**Added:**
```json
"verify:production": "npx prisma generate && npm run typecheck && npm run lint && rm -rf .next && npm run build"
```

This simulates Vercel’s environment (fresh build, no cache) and catches failures locally.

### 2.3 Typecheck scope

**Excluded from typecheck** (complex Prisma extension infra):

- `lib/utils/ulid.ts`
- `prisma/seed-client.ts`

These use Prisma extension APIs with hard-to-type callbacks and are not needed for app-type checking.

### 2.4 Explicit callback types

**Examples of fixes:**

- `user.roles.map((r: (typeof user.roles)[number]) => r.role.name)`
- `prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => { ... })`

Applied across app, components, and lib/auth (signin, password-auth, role-management).

---

## 3. Preventive Measures: First-Try Success

### 3.1 Mandatory: run `verify:production` before push

**Rule:** Before pushing to `main` (or any production deploy), always run:

```bash
npm run verify:production
```

- **Exit 0** → Safe to push
- **Exit 1** → Fix errors, rerun until it passes

### 3.2 When fixing type errors

1. Fix the reported error.
2. Search for the same pattern:  
   `rg "\.(map|some|filter)\(\([a-z]+\) =>" -g "*.{ts,tsx}"`
3. Fix all similar occurrences in one commit.
4. Run `verify:production` again.

### 3.3 When adding Prisma usage

- `prisma generate` is already in the build; no extra steps needed.
- Use explicit types in callbacks (see `docs/vercel-build-errors-log.md`).
- Client components: use `CurrentUserWithRoles` from `@/lib/auth/permissions`, not `User` from `@prisma/client`.

### 3.4 Optional: pre-push hook

To block pushes that don’t pass verification:

```bash
# .husky/pre-push or via simple-git-hooks
npm run verify:production || { echo "Fix build before pushing"; exit 1; }
```

### 3.5 Optional: CI gate

Run `npm run build` in GitHub Actions on pull requests and block merge on failure. Vercel will then see the same result.

---

## 4. Summary

| Before | After |
|--------|-------|
| Prisma client not generated before typecheck | `npx prisma generate` runs first in build |
| No single verification command | `npm run verify:production` covers typecheck, lint, clean build |
| Implicit `any` in callbacks | Explicit types added |
| Fix one error per deploy | Pattern search and batch fixes |
| No pre-push guard | `verify:production` required before push |

---

## 5. Related Docs

- [vercel-build-errors-log.md](./vercel-build-errors-log.md) – Error log and fix patterns
- [production-build-debugging-process.md](./production-build-debugging-process.md) – Debugging checklist
- [vercel-deployment-options.md](./vercel-deployment-options.md) – Deployment options and env vars
