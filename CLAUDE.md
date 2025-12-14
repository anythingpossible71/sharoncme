# CrunchyCone Vanilla Starter Project

Production-ready Next.js 16 starter with Auth.js v5, admin dashboard, roles, TypeScript, Tailwind CSS, Prisma ORM, shadcn/ui.

## Quick Start

```bash
npm run setup        # Automated setup (does everything)
npm run dev          # Start dev server
# Open the URL shown in "Local: http://localhost:XXXX"
```

## Detailed Rules

Implementation patterns and anti-patterns are in `.cursor/rules/`:

| Rule File | When to Consult |
|-----------|-----------------|
| `PROJECT.mdc` | Project structure, imports, conventions |
| `SETUP.mdc` | Setup issues, environment configuration |
| `DATABASE.mdc` | Schema changes, queries, migrations, ULID |
| `AUTH.mdc` | Authentication, sessions, protected routes |
| `SERVER-ACTIONS.mdc` | Form handling, mutations, revalidation |
| `ADMIN.mdc` | Admin pages, role checks, self-protection |
| `DOCKER-BUILD.mdc` | Dynamic rendering, build issues |
| `UI-COMPONENTS.mdc` | shadcn/ui usage, component selection |
| `THEMES.mdc` | Theme system, colors, customization |
| `ENVIRONMENT.mdc` | Env vars, secrets management |
| `GIT-WORKFLOW.mdc` | Commits, package sync |
| `CRUNCHYCONE.mdc` | Platform deployment (if applicable) |

## Critical Patterns (Must Know)

### Dynamic Rendering
```typescript
// Required for pages with auth, DB queries, or CLI commands
export const dynamic = "force-dynamic"
```

### Auth Check
```typescript
import { auth } from "@/lib/auth"
const session = await auth()
if (!session?.user) redirect("/auth/signin")
```

### Database Query
```typescript
import { prisma } from "@/lib/prisma"
// Always filter soft deletes
await prisma.user.findMany({ where: { deleted_at: null } })
```

### Schema Changes
```bash
npx prisma migrate dev --name "description"  # Never just generate
```

### Logging
```typescript
import { logger } from "@/lib/logger"
logger.info("Message", { context })  // Never use console.log
```

### Server Action
```typescript
"use server"
// 1. Auth check → 2. Validate → 3. DB op → 4. revalidatePath() → 5. Return
```

## Project Structure

```
app/           → Next.js App Router (pages, actions, API routes)
components/    → React components (ui/, auth/, admin/)
lib/           → Auth, Prisma, utilities
  auth.ts      → Auth.js config, auth() function
  auth/permissions.ts → getCurrentUser(), isAdmin(), hasRole()
  prisma.ts    → Extended Prisma client
  logger.ts    → Structured logging
prisma/        → Schema, migrations, seed
themes/        → TypeScript theme definitions
```

## Key Commands

| Command | Purpose |
|---------|---------|
| `npm run setup` | Full automated setup |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint code |
| `npx prisma migrate dev --name "x"` | Schema migration |
| `npm run db:reset --yes` | Reset database |
| `npm run db:studio` | Database GUI |

## Anti-Patterns to Avoid

- ❌ Using `console.log` instead of `logger`
- ❌ Using `npx prisma generate` alone (use `migrate dev`)
- ❌ Missing `export const dynamic = "force-dynamic"` on dynamic pages
- ❌ Using `redirect()` inside try-catch blocks (see SERVER-ACTIONS.mdc)
- ❌ Creating new Prisma models without adding to ULID extension (see DATABASE.mdc)
- ❌ Creating custom UI when shadcn/ui component exists
- ❌ Hard deleting records (use soft delete: `deleted_at`)
- ❌ Mixing Server Actions with fetch() calls

## Important Reminders

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files
- NEVER proactively create documentation files
