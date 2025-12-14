-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "requires_login" BOOLEAN NOT NULL DEFAULT false,
    "is_home" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Page_slug_idx" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Page_is_home_idx" ON "Page"("is_home");

-- CreateIndex
CREATE INDEX "Page_deleted_at_idx" ON "Page"("deleted_at");
