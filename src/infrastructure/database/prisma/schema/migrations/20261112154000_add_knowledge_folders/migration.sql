-- Folder tree and optional document location. Existing articles stay at the root.
CREATE TABLE "knowledge_folders" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "parentId" TEXT,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "knowledge_folders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "knowledge_folders_parentId_name_key" ON "knowledge_folders" ("parentId", "name");
CREATE INDEX "knowledge_folders_parentId_idx" ON "knowledge_folders" ("parentId");
ALTER TABLE "knowledge_folders" ADD CONSTRAINT "knowledge_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "knowledge_folders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "knowledge_articles" ADD COLUMN "folderId" TEXT;
CREATE INDEX "knowledge_articles_folderId_updatedAt_idx" ON "knowledge_articles" ("folderId", "updatedAt");
ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "knowledge_folders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
