/*
  Warnings:

  - You are about to drop the column `disabled` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `disabled_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `disabled_by` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "emailVerified" DATETIME,
    "password" TEXT,
    "last_signed_in" DATETIME,
    "admin_theme" TEXT DEFAULT 'pistachio-almond'
);
INSERT INTO "new_User" ("admin_theme", "created_at", "deleted_at", "email", "emailVerified", "id", "image", "last_signed_in", "name", "password", "updated_at") SELECT "admin_theme", "created_at", "deleted_at", "email", "emailVerified", "id", "image", "last_signed_in", "name", "password", "updated_at" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_deleted_at_idx" ON "User"("deleted_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
