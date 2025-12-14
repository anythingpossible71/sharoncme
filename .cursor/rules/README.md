# Cursor Rules Index

This directory contains AI-optimized rules for the CrunchyCone starter template.

## Always Active (Core Rules)

| Rule | Description |
|------|-------------|
| [PROJECT.mdc](PROJECT.mdc) | Project architecture and conventions |
| [SETUP.mdc](SETUP.mdc) | Project setup and initialization |
| [DATABASE.mdc](DATABASE.mdc) | Prisma, migrations, query patterns |
| [DOCKER-BUILD.mdc](DOCKER-BUILD.mdc) | Dynamic rendering, Docker builds |
| [GIT-WORKFLOW.mdc](GIT-WORKFLOW.mdc) | Git commits, package management |

## Context-Specific Rules

| Rule | Applies When |
|------|-------------|
| [AUTH.mdc](AUTH.mdc) | Working in `app/auth/**`, `lib/auth/**` |
| [SERVER-ACTIONS.mdc](SERVER-ACTIONS.mdc) | Working in `app/actions/**` |
| [ADMIN.mdc](ADMIN.mdc) | Working in `app/admin/**` |
| [UI-COMPONENTS.mdc](UI-COMPONENTS.mdc) | Creating UI components |
| [THEMES.mdc](THEMES.mdc) | Working with themes |
| [ENVIRONMENT.mdc](ENVIRONMENT.mdc) | Managing env variables |
| [CRUNCHYCONE.mdc](CRUNCHYCONE.mdc) | CrunchyCone platform (only if `crunchycone.toml` exists) |

## Quick Reference

### Most Common Commands

```bash
npm run setup              # Full project setup
npm run dev:open           # Start dev server
npm run build              # Production build
npx prisma migrate dev     # Database migration
```

### Key Patterns

```typescript
// Auth check
const session = await auth()
if (!session?.user) redirect("/auth/signin")

// Database query (always filter soft deletes)
await prisma.user.findMany({ where: { deleted_at: null } })

// Dynamic rendering (required for auth/db pages)
export const dynamic = "force-dynamic"

// Logging (never use console.log)
import { logger } from "@/lib/logger"
logger.info("Message", { context })
```

## Rule Design Principles

These rules are optimized for AI assistants:

1. **Concise** - Each rule is under 150 lines
2. **Focused** - One topic per file
3. **Actionable** - Clear do/don't patterns
4. **Current** - Matches actual code (Auth.js v5, etc.)
5. **Consistent** - Standard frontmatter format

## If Cursor Ignores Rules

If rules aren't being applied in Cursor Composer/Auto-mode:

- Reference relevant source files to pull context: `@prisma/schema.prisma`, `@lib/utils/ulid.ts`, `@app/actions/`
- Restart the chat if context feels stale; long threads cause Composer to drop context
- Ensure the files you're editing match the rule's `globs` pattern

## Frontmatter Format

```yaml
---
description: Brief description (under 100 chars)
globs: ["relevant/patterns/**/*"]
alwaysApply: false  # true only for critical rules
---
```
