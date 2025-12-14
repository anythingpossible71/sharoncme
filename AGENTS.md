# AI Agent Instructions for CrunchyCone Starter Project

This document provides agent-specific guidance. For implementation patterns, see `.cursor/rules/`.

## Setup - Agent Guidelines

### Automated Setup (Required for Agents)

```bash
npm run setup        # Automated setup (handles all steps)
npm run dev:open     # Start development server
```

**Why use automated setup:**
- ✅ No prompts - fully automated
- ✅ Clear error messages for debugging
- ✅ Structured output with exit codes
- ✅ Cross-platform compatible

**Exit Codes:**
- `0` = Success
- `1` = Critical failure (report to user)
- `2` = Warnings only (can proceed)

**Options:**
```bash
npm run setup                  # Full automated setup
npm run setup:force            # Force reset everything
npm run setup:verbose          # Detailed output for debugging
```

### Agent Setup Rules

- **PREFER** `npm run setup` for new project initialization
- **USE** automated setup when user asks to "set up", "initialize", or "get started"
- **FALLBACK** to manual steps only if automated setup fails
- **ALWAYS** check exit codes and report failures clearly

### Cursor Composer Tips

If rules aren't being applied:
- Reference relevant source files: `@prisma/schema.prisma`, `@lib/utils/ulid.ts`
- Restart the chat if context feels stale
- Keep conversations focused; long threads cause context to drop

## Rule Files Reference

**All implementation patterns are in `.cursor/rules/`:**

| Rule File | Consult For |
|-----------|-------------|
| `DATABASE.mdc` | Schema, migrations, queries, ULID extension |
| `AUTH.mdc` | Authentication, sessions, permissions |
| `SERVER-ACTIONS.mdc` | Form handling, mutations, redirect vs return |
| `ADMIN.mdc` | Admin pages, role checks |
| `DOCKER-BUILD.mdc` | Dynamic rendering, build issues |
| `UI-COMPONENTS.mdc` | shadcn/ui component selection |
| `UI-DESIGN.mdc` | Layout patterns, navigation, spacing, UX |
| `PROJECT.mdc` | Project structure, imports |
| `GIT-WORKFLOW.mdc` | Commits, package sync |

**Consult these files BEFORE making changes in their domains.**

## Agent-Specific Anti-Patterns

### Critical Mistakes to Avoid

| Category | Anti-Pattern | Correct Approach |
|----------|--------------|------------------|
| Setup | Manual setup steps | Use `npm run setup` |
| Logging | `console.log/error` | `logger` from `@/lib/logger` |
| Database | `npx prisma generate` alone | `npx prisma migrate dev` |
| Database | New model without ULID extension | Add to `lib/utils/ulid.ts` |
| Server Actions | `redirect()` in try-catch | Return error response |
| Rendering | Missing `force-dynamic` | Add to pages with auth/DB |
| UI | Custom components | Use shadcn/ui first |
| Data | Hard delete | Soft delete (`deleted_at`) |
| Files | Creating new files | Edit existing files |
| Admin | Creating pages under `/admin` | ASK FIRST - only if user explicitly says "admin" |

## Quality Assurance Checklist

Before completing any task:

- [ ] Consulted relevant `.cursor/rules/` file
- [ ] Used `logger` instead of `console.log`
- [ ] Added `export const dynamic = "force-dynamic"` where needed
- [ ] Used `auth()` for authentication checks
- [ ] Filtered `deleted_at: null` in database queries
- [ ] Used `revalidatePath()` after mutations
- [ ] Used shadcn/ui components (not custom UI)
- [ ] TypeScript errors resolved
- [ ] Package.json and package-lock.json synchronized (if modified)

## Key Patterns Quick Reference

### Auth Check
```typescript
import { auth } from "@/lib/auth"
const session = await auth()
if (!session?.user) redirect("/auth/signin")
```

### Database Query
```typescript
import { prisma } from "@/lib/prisma"
await prisma.user.findMany({ where: { deleted_at: null } })
```

### Logging
```typescript
import { logger } from "@/lib/logger"
logger.info("Action completed", { userId, action })
```

### Dynamic Rendering
```typescript
export const dynamic = "force-dynamic"
```

### Server Action Error Handling
```typescript
// In try-catch blocks, return error instead of redirect()
if (!user) return { success: false, error: "Unauthorized" }
```

## Integration Notes

- **CLAUDE.md**: Quick reference for all users
- **AGENTS.md**: Agent-specific behavior (this file)
- **`.cursor/rules/`**: Detailed implementation patterns

For any implementation question, check the relevant rule file first.
