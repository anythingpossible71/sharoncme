/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `AppSettings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN "custom_domain" TEXT;
ALTER TABLE "AppSettings" ADD COLUMN "domain_type" TEXT;
ALTER TABLE "AppSettings" ADD COLUMN "slug" TEXT;
ALTER TABLE "AppSettings" ADD COLUMN "subdomain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_slug_key" ON "AppSettings"("slug");
