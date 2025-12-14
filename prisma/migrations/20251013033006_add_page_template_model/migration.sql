-- CreateTable
CREATE TABLE "PageTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "title" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "dev_instructions" TEXT NOT NULL,
    "preview_image" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "PageTemplate_path_key" ON "PageTemplate"("path");

-- CreateIndex
CREATE INDEX "PageTemplate_path_idx" ON "PageTemplate"("path");

-- CreateIndex
CREATE INDEX "PageTemplate_deleted_at_idx" ON "PageTemplate"("deleted_at");
