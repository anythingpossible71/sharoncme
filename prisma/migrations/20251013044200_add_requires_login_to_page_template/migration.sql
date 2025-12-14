-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PageTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "title" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "dev_instructions" TEXT NOT NULL,
    "preview_image" TEXT,
    "requires_login" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_PageTemplate" ("created_at", "deleted_at", "dev_instructions", "id", "path", "preview_image", "title", "updated_at") SELECT "created_at", "deleted_at", "dev_instructions", "id", "path", "preview_image", "title", "updated_at" FROM "PageTemplate";
DROP TABLE "PageTemplate";
ALTER TABLE "new_PageTemplate" RENAME TO "PageTemplate";
CREATE UNIQUE INDEX "PageTemplate_path_key" ON "PageTemplate"("path");
CREATE INDEX "PageTemplate_path_idx" ON "PageTemplate"("path");
CREATE INDEX "PageTemplate_deleted_at_idx" ON "PageTemplate"("deleted_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
