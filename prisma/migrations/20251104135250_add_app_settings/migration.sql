-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "app_name" TEXT NOT NULL DEFAULT 'CrunchyCone Vanilla Starter Project',
    "app_description" TEXT DEFAULT 'A production-ready Next.js starter with auth and admin dashboard'
);

-- CreateIndex
CREATE INDEX "AppSettings_deleted_at_idx" ON "AppSettings"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_id_key" ON "AppSettings"("id");
