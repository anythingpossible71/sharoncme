-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Page" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "requires_login" BOOLEAN NOT NULL DEFAULT false,
    "is_home" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Page" ("created_at", "deleted_at", "id", "is_home", "requires_login", "slug", "title", "updated_at") SELECT "created_at", "deleted_at", "id", "is_home", "requires_login", "slug", "title", "updated_at" FROM "Page";
DROP TABLE "Page";
ALTER TABLE "new_Page" RENAME TO "Page";
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");
CREATE INDEX "Page_slug_idx" ON "Page"("slug");
CREATE INDEX "Page_is_home_idx" ON "Page"("is_home");
CREATE INDEX "Page_deleted_at_idx" ON "Page"("deleted_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
