# Vercel Build Errors Log

Log of TypeScript implicit `any` errors that caused Vercel builds to fail. All errors share the same root cause: **Parameter 'X' implicitly has an 'any' type** when Vercel runs strict TypeScript checking on a clean build.

---

## Error List (11 Total)

| # | File | Line | Parameter | Context | Status |
|---|------|------|-----------|---------|--------|
| 1 | `app/profile/page.tsx` | 92 | `userRole` | `user.roles.some((userRole) => userRole.role.name === "admin")` | ✅ Fixed |
| 2 | `app/root-backup/page.tsx` | ~210 | `r` | `currentUser.roles.some((r) => r.role.name === "admin")` | ✅ Fixed |
| 3 | `app/root-backup/page.tsx` | 236 | `r` | `currentUser.roles.map((r) => r.role.name)` | ✅ Fixed |
| 4 | `components/profile/AccountLinking.tsx` | ~90 | `account` | `user.accounts.some((account) => account.provider === "google")` | ✅ Fixed |
| 5 | `components/profile/AccountLinking.tsx` | ~95 | `account` | `user.accounts.some((account) => account.provider === "github")` | ✅ Fixed |
| 6 | `components/admin/UserManagementPanel.tsx` | ~170 | `r` | `selectedUser.roles.some((r) => r.role.name === "admin")` | ✅ Fixed |
| 7 | `components/admin/UserManagementPanel.tsx` | ~180 | `ur` | `selectedUser.roles.some((ur) => ur.role.name === role.name)` | ✅ Fixed |
| 8 | `app/actions/admin.ts` | — | `tx` | `prisma.$transaction(async (tx) => { ... })` | ✅ Fixed |
| 9 | `app/actions/auth.ts` | — | `tx` | `prisma.$transaction(async (tx) => { ... })` | ✅ Fixed |
| 10 | `app/actions/blog-posts.ts` | — | callback param | `.map((item) => ...)` | ✅ Fixed |
| 11 | `app/actions/team-members.ts` | — | callback param | `.map((item) => ...)` | ✅ Fixed |

---

## Analysis

### Are they unique or repeating?

**Same error type, different locations.** All 11 are instances of the same underlying issue:

- **Error type:** `Parameter 'X' implicitly has an 'any' type`
- **Root cause:** TypeScript strict mode; callback parameters in `.map()`, `.some()`, `.filter()`, or `$transaction` lack explicit types when inference fails
- **Why Vercel catches them:** Fresh install + clean build; no incremental cache

**Pattern breakdown:**
- `.some()` callback: 5 occurrences (profile, root-backup, AccountLinking×2, UserManagementPanel×2)
- `.map()` callback: 4 occurrences (root-backup, blog-posts, team-members, etc.)
- `$transaction` callback: 2 occurrences (admin, auth)

**Conclusion:** Not a loop. Each fix addresses a new file/location. The pattern is consistent—add explicit types using `(typeof arr)[number]` or the Prisma `tx` type.

---

## Fix Pattern Reference

```typescript
// .map() / .some() / .filter()
arr.map((x: (typeof arr)[number]) => ...)
arr.some((x: (typeof arr)[number]) => ...)

// Prisma $transaction
tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
```

---

## Last Updated

- **Date:** 2026-03-10
- **Latest fix:** `app/root-backup/page.tsx` line 236 – `r` in `roles.map()`
