-- Knowledge Base. No existing data is mutated or dropped.
CREATE TABLE "knowledge_articles" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "category" TEXT NOT NULL DEFAULT 'GENERAL',
  "classification" TEXT NOT NULL DEFAULT 'INTERNAL',
  "sourceType" TEXT NOT NULL DEFAULT 'EDITOR',
  "blocks" JSONB,
  "plainText" TEXT,
  "filePath" TEXT,
  "fileName" TEXT,
  "fileSize" INTEGER,
  "version" INTEGER NOT NULL DEFAULT 1,
  "publishedVersion" INTEGER,
  "requiresAcknowledgement" BOOLEAN NOT NULL DEFAULT false,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "knowledge_articles_source_check" CHECK ("sourceType" IN ('EDITOR', 'PDF')),
  CONSTRAINT "knowledge_articles_classification_check" CHECK ("classification" IN ('INTERNAL', 'RESTRICTED')),
  CONSTRAINT "knowledge_articles_version_check" CHECK ("version" > 0 AND ("publishedVersion" IS NULL OR ("publishedVersion" > 0 AND "publishedVersion" <= "version")))
);
CREATE TABLE "knowledge_revisions" (
  "id" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "category" TEXT NOT NULL,
  "classification" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "blocks" JSONB,
  "plainText" TEXT,
  "filePath" TEXT,
  "fileName" TEXT,
  "fileSize" INTEGER,
  "requiresAcknowledgement" BOOLEAN NOT NULL,
  "editedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "knowledge_revisions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "knowledge_revisions_version_check" CHECK ("version" > 0)
);
CREATE TABLE "knowledge_acknowledgements" (
  "id" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "userId" TEXT NOT NULL,
  "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "knowledge_acknowledgements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "knowledge_articles_category_classification_idx" ON "knowledge_articles" ("category", "classification");
CREATE INDEX "knowledge_articles_publishedVersion_isArchived_idx" ON "knowledge_articles" ("publishedVersion", "isArchived");
CREATE INDEX "knowledge_articles_updatedAt_idx" ON "knowledge_articles" ("updatedAt");
CREATE UNIQUE INDEX "knowledge_revisions_articleId_version_key" ON "knowledge_revisions" ("articleId", "version");
CREATE INDEX "knowledge_revisions_articleId_createdAt_idx" ON "knowledge_revisions" ("articleId", "createdAt");
CREATE UNIQUE INDEX "knowledge_acknowledgements_articleId_version_userId_key" ON "knowledge_acknowledgements" ("articleId", "version", "userId");
CREATE INDEX "knowledge_acknowledgements_userId_acknowledgedAt_idx" ON "knowledge_acknowledgements" ("userId", "acknowledgedAt");
ALTER TABLE "knowledge_revisions"
  ADD CONSTRAINT "knowledge_revisions_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "knowledge_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "knowledge_acknowledgements"
  ADD CONSTRAINT "knowledge_acknowledgements_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "knowledge_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
