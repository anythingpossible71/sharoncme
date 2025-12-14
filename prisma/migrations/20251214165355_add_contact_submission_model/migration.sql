-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "activityType" TEXT NOT NULL,
    "birthdate" DATETIME,
    "babyBirthdate" DATETIME,
    "message" TEXT,
    "howFound" TEXT,
    "referrerName" TEXT
);

-- CreateIndex
CREATE INDEX "ContactSubmission_created_at_idx" ON "ContactSubmission"("created_at");

-- CreateIndex
CREATE INDEX "ContactSubmission_deleted_at_idx" ON "ContactSubmission"("deleted_at");

-- CreateIndex
CREATE INDEX "ContactSubmission_activityType_idx" ON "ContactSubmission"("activityType");
