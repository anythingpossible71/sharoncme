-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "bio" TEXT,
    "avatar_url" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "github_url" TEXT,
    "linkedin_url" TEXT,
    "twitter_url" TEXT,
    "email" TEXT
);

-- CreateIndex
CREATE INDEX "TeamMember_deleted_at_idx" ON "TeamMember"("deleted_at");

-- CreateIndex
CREATE INDEX "TeamMember_order_idx" ON "TeamMember"("order");
