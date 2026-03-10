# Vercel Deployment Options

Summary of options for deploying this template to Vercel and avoiding build failures. For future reference.

## The Problem

Vercel runs a fresh `npm install` + `npm run build` on each deploy. TypeScript strict mode catches **implicit `any`** in callback parameters. These errors may not surface locally (incremental builds, cache) but fail in production.

## Option 1: Explicit Types in Callbacks (Required)

Add explicit parameter types wherever TypeScript cannot infer them.

### Prisma `$transaction`

```typescript
// ❌ Fails on Vercel
await prisma.$transaction(async (tx) => { ... });

// ✅ Use inferred type
await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => { ... });
```

### Prisma result `.map()` callbacks

```typescript
// ❌ Fails on Vercel
return posts.map((post) => ({ id: post.id, ... }));

// ✅ Use element type
return posts.map((post: (typeof posts)[number]) => ({ id: post.id, ... }));

// ✅ Or type alias for clarity
type PostWithAuthor = (typeof posts)[number];
return posts.map((post: PostWithAuthor) => ({ id: post.id, ... }));
```

---

## Option 2: Cursor Rule ✓ (Implemented)

`.cursor/rules/VERCEL-DEPLOY.mdc` guides future development:

- Document the patterns above
- Pre-deploy checklist: run `npm run build` before push
- Package manager: prefer npm, remove pnpm-lock.yaml if present
- Next.js 16: `serverActions` under `experimental`

---

## Option 3: Typecheck Script ✓ (Implemented)

In `package.json`:

```json
"typecheck": "tsc -p tsconfig.typecheck.json --noEmit",
"build:clean": "rm -rf .next && npm run build"
```

- `npm run typecheck` – Fast type check, excludes tests.
- `npm run build:clean` – Reproduces Vercel (no cache).

---

## Option 4: Typecheck Before Build

Ensure type errors are caught early:

```json
"build": "npm run typecheck && node scripts/validate-admin-files.js && next build"
```

---

## Option 5: Pre-Push Hook

Add to pre-push hook (e.g. via `hooks:install`):

```bash
npm run build || { echo "Build failed - fix before pushing"; exit 1; }
```

Slower but guarantees what runs locally matches Vercel.

---

## Option 6: Clean Build Before Push

To reproduce Vercel locally:

```bash
rm -rf .next node_modules
npm install
npm run build
```

---

## Option 7: CI Pipeline

Run `npm run build` in GitHub Actions (or similar) before merge. Fails fast without manual checks.

---

## Recommended for Future Projects

| Priority | Option | Effort | Effect |
|----------|--------|--------|--------|
| 1 | Option 1 (explicit types) | Per-file | Prevents implicit any |
| 2 | Option 2 (Cursor rule) | One-time | Guides AI and developers |
| 3 | Option 3 (typecheck script) | One-time | Fast pre-push check |
| 4 | Option 6 (clean build) | Manual | Reproduce Vercel locally |

---

## Prisma Import in Client Components

Vercel may fail with `Module '"@prisma/client"' has no exported member 'Prisma'` in client components.

**Fix:** Use `CurrentUserWithRoles` from `@/lib/auth/permissions` instead of `Prisma.UserGetPayload<...>`:

```typescript
import type { CurrentUserWithRoles } from "@/lib/auth/permissions";
// currentUser: CurrentUserWithRoles
```

---

## Package Manager Note

- **npm**: Keep `package-lock.json`, remove `pnpm-lock.yaml` if present.
- Vercel auto-detects lockfile; mismatched pnpm lockfile causes install failure.

---

## Next.js 16 Config Note

```typescript
// serverActions must be under experimental
experimental: {
  serverActions: { bodySizeLimit: "2mb" },
},
```

---

## Environment Variables for Vercel

See `env.vercel.example` (gitignored if it contains secrets) for required vars. Add to Vercel dashboard under Project → Settings → Environment Variables.
