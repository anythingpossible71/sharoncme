-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "app_name" TEXT NOT NULL,
    "app_description" TEXT,
    "app_logo_url" TEXT,
    "app_preview_image_url" TEXT
);
INSERT INTO "new_AppSettings" ("app_description", "app_name", "created_at", "deleted_at", "id", "updated_at") SELECT "app_description", "app_name", "created_at", "deleted_at", "id", "updated_at" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
CREATE INDEX "AppSettings_deleted_at_idx" ON "AppSettings"("deleted_at");
CREATE UNIQUE INDEX "AppSettings_id_key" ON "AppSettings"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
